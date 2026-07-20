import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getServiceRoleClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface AdminSession {
  authenticated: boolean;
  email?: string;
  role?: string;
  adminId?: string;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * Create a tamper-proof admin session token of the form
 *   base64url(payload).HMAC-SHA256(payload)
 * The payload carries the admin email, role and expiry. Without
 * ADMIN_SESSION_SECRET the signature cannot be forged, so a client can no
 * longer fabricate a valid session by simply setting cookies.
 */
export function signAdminSession(
  email: string,
  role: string,
  secret: string,
  ttlMs: number = SESSION_TTL_MS
): string {
  const payload = JSON.stringify({
    email: email.toLowerCase().trim(),
    role,
    exp: Date.now() + ttlMs,
  });
  const p = base64url(payload);
  const sig = crypto.createHmac('sha256', secret).update(p).digest('base64url');
  return `${p}.${sig}`;
}

/**
 * Verify a signed admin session token. Returns the decoded payload if the
 * signature is valid and it has not expired, otherwise null.
 */
export function verifyAdminSessionToken(
  token: string | undefined,
  secret: string
): { email: string; role: string; exp: number } | null {
  if (!token || !token.includes('.')) return null;
  const [p, sig] = token.split('.');
  if (!p || !sig) return null;

  const expected = crypto.createHmac('sha256', secret).update(p).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(json);
    if (!payload?.email || !payload?.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function getLocalDevAdmin(email?: string) {
  if (process.env.NODE_ENV === 'production') return null;

  const devEmails = (process.env.DEV_ADMIN_EMAILS || process.env.DEV_ADMIN_EMAIL || '')
    .split(',')
    .map((value) => value.toLowerCase().trim())
    .filter(Boolean);

  if (devEmails.length === 0) return null;
  const devEmail = email
    ? devEmails.find((value) => value === email.toLowerCase().trim())
    : devEmails[0];

  if (!devEmail) return null;

  return {
    id: 'local-dev-admin',
    email: devEmail,
    role: 'super_admin',
  };
}

/**
 * Verify admin session from the signed cookie.
 * Identity and role are derived from the cryptographically-signed token — NOT
 * from separate trust-me cookies — then cross-checked against an active
 * admin_accounts row (role is taken from the DB, which is authoritative).
 */
export async function verifyAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (!token) return null;

    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
      console.error('CRITICAL: ADMIN_SESSION_SECRET is not set; rejecting admin session.');
      return null;
    }

    const payload = verifyAdminSessionToken(token, secret);
    if (!payload) return null;

    const email = payload.email.toLowerCase().trim();

    // Local dev bypass (never in production).
    const localDevAdmin = getLocalDevAdmin(email);
    if (localDevAdmin) {
      return {
        authenticated: true,
        email: localDevAdmin.email,
        role: localDevAdmin.role,
        adminId: localDevAdmin.id,
      };
    }

    // Cross-check the account still exists and is active; role from DB.
    const supabase = getServiceRoleClient();
    const { data: adminAccount, error } = await supabase
      .from('admin_accounts')
      .select('id, email, role, is_active')
      .eq('email', email)
      .single();

    if (error || !adminAccount || !adminAccount.is_active) {
      return null;
    }

    return {
      authenticated: true,
      email: adminAccount.email,
      role: adminAccount.role,
      adminId: adminAccount.id,
    };
  } catch (error) {
    console.error('Admin session verification error:', error);
    return null;
  }
}

/**
 * Middleware helper to protect admin API routes.
 * Returns a 401 NextResponse if not authenticated, or null if authenticated.
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
  const session = await verifyAdminSession();

  if (!session || !session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  return null; // Authenticated, continue
}

/**
 * Lightweight signed-cookie presence + validity check (no DB round-trip).
 */
export async function hasAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!token || !secret) return false;
    return verifyAdminSessionToken(token, secret) !== null;
  } catch {
    return false;
  }
}
