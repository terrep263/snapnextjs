import { getServiceRoleClient } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Admin management of unrestricted accounts.
 *
 * An "unrestricted account" is an allowlisted owner email whose events are
 * created free, with all gated features unlocked (premium) and per-event limits
 * lifted. At most 10 accounts may be ACTIVE at once. The cap is enforced here
 * (app level) and backstopped by a DB trigger (see
 * migrations/create_unrestricted_accounts.sql).
 *
 * GET    -> list active accounts + count + remaining slots
 * POST   -> add an account (rejects 11th / duplicate) and mint an unlimited
 *           claim link bound to it
 * DELETE -> revoke an account (frees a slot)
 */

const MAX_ACCOUNTS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** URL-safe random token, identical scheme to generate-claim-link. */
function generateSecureToken(): string {
  return crypto
    .randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function GET() {
  const session = await verifyAdminSession();
  if (!session?.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin access required' },
      { status: 401 }
    );
  }

  const supabase = getServiceRoleClient();
  const { data: accounts, error } = await supabase
    .from('unrestricted_accounts')
    .select('id, email, label, active, created_by_admin_email, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading unrestricted accounts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load accounts' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      accounts: accounts || [],
      count: accounts?.length || 0,
      max: MAX_ACCOUNTS,
      remaining: Math.max(0, MAX_ACCOUNTS - (accounts?.length || 0)),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session?.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin access required' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const label = body.label ? String(body.label).trim() : null;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { success: false, error: 'A valid email is required' },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();

  // Is this email already known (active or revoked)?
  const { data: existing } = await supabase
    .from('unrestricted_accounts')
    .select('id, active')
    .eq('email', email)
    .maybeSingle();

  if (existing?.active) {
    return NextResponse.json(
      { success: false, error: 'This email is already an unrestricted account' },
      { status: 409 }
    );
  }

  // Enforce the hard cap on ACTIVE accounts (app level; trigger backstops).
  const { count: activeCount, error: countError } = await supabase
    .from('unrestricted_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('active', true);

  if (countError) {
    console.error('Error counting unrestricted accounts:', countError);
    return NextResponse.json(
      { success: false, error: 'Failed to verify account cap' },
      { status: 500 }
    );
  }

  if ((activeCount || 0) >= MAX_ACCOUNTS) {
    return NextResponse.json(
      {
        success: false,
        error: `Hard cap reached: at most ${MAX_ACCOUNTS} unrestricted accounts may be active. Revoke one first.`,
      },
      { status: 409 }
    );
  }

  // Insert (or re-activate a previously revoked email).
  let accountRow;
  if (existing) {
    const { data, error } = await supabase
      .from('unrestricted_accounts')
      .update({
        active: true,
        label,
        created_by_admin_email: session.email || 'unknown',
      })
      .eq('id', existing.id)
      .select('id, email, label, active, created_at')
      .single();
    if (error) {
      console.error('Error re-activating unrestricted account:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to add account' },
        { status: 500 }
      );
    }
    accountRow = data;
  } else {
    const { data, error } = await supabase
      .from('unrestricted_accounts')
      .insert([
        {
          email,
          label,
          active: true,
          created_by_admin_email: session.email || 'unknown',
        },
      ])
      .select('id, email, label, active, created_at')
      .single();
    if (error) {
      console.error('Error inserting unrestricted account:', error);
      // The DB trigger raises if the cap is exceeded under a race.
      const isCap = /cap reached/i.test(error.message || '');
      return NextResponse.json(
        {
          success: false,
          error: isCap
            ? `Hard cap reached: at most ${MAX_ACCOUNTS} unrestricted accounts may be active.`
            : error.message || 'Failed to add account',
        },
        { status: isCap ? 409 : 500 }
      );
    }
    accountRow = data;
  }

  // Mint an unlimited claim link bound to this account (reuses free_event_claims).
  const token = generateSecureToken();
  const { error: linkError } = await supabase.from('free_event_claims').insert([
    {
      token,
      claimed: false,
      unlimited: true,
      account_email: email,
      created_by_admin_email: session.email || 'unknown',
      expires_at: null,
    },
  ]);

  if (linkError) {
    console.error('Account added but failed to mint claim link:', linkError);
    // Account exists; admin can still generate a link later.
    return NextResponse.json({
      success: true,
      data: { account: accountRow, claimUrl: null },
      warning: 'Account added but the initial claim link could not be created.',
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com';
  const claimUrl = `${baseUrl}/claim/${token}`;

  return NextResponse.json({
    success: true,
    data: { account: accountRow, claimUrl },
  });
}

export async function DELETE(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session?.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin access required' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'email query parameter is required' },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from('unrestricted_accounts')
    .update({ active: false })
    .eq('email', email);

  if (error) {
    console.error('Error revoking unrestricted account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke account' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: `Revoked ${email}` });
}
