import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendMail } from '@/lib/mailer';
import { setHostCookie } from '@/lib/host-auth';
import { buildFreeEventEmail } from '@/lib/freeEventEmail';
import { FREE_GALLERY_DAYS, FREE_MAX_PHOTOS } from '@/config/free-tier';
import { getEmailDomain, normalizeEmail } from '@/lib/email-normalization';
import { isDisposableEmailDomain } from '@/lib/disposable-email-domains';

/**
 * Self-serve free event creation from the public /free landing page.
 *
 * Differs from /api/claim/create-event, which redeems a pre-issued admin token.
 * Here there is no token yet - the claim row is minted and consumed in the same
 * request. Deliberately a separate route so the working admin magic-link flow is
 * untouched.
 *
 * Guarantees:
 *  - One free self-serve event per normalized email address, enforced by a
 *    unique index on claim_email_normalized so concurrent submits cannot both win.
 *  - Never issues an `unlimited` claim. That lane is reserved for whitelabel /
 *    unrestricted accounts and must not be reachable from a public endpoint.
 *
 * POST /api/free/claim
 */

function generateEventId(): string {
  return `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function freeEventExpiresAt(eventDate: string, createdAt: Date): Date {
  const parsed = Date.parse(`${eventDate}T00:00:00Z`);
  const basis = Number.isNaN(parsed) ? createdAt.getTime() : parsed;
  return new Date(basis + FREE_GALLERY_DAYS * 24 * 60 * 60 * 1000);
}

function generateSlug(eventName: string): string {
  const baseSlug = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${baseSlug || 'event'}-${Date.now()}`;
}

function generateToken(): string {
  return `self_${crypto.randomBytes(16).toString('hex')}`;
}

/** Keep arbitrary ?src= values from becoming unbounded junk in the column. */
function normalizeSource(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return 'direct';
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 60) || 'direct';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      hostName,
      emailAddress,
      eventName,
      eventDate,
      source,
    } = body ?? {};

    if (!hostName || !emailAddress || !eventName || !eventDate) {
      return NextResponse.json(
        { success: false, error: 'Please fill in every field.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      return NextResponse.json(
        { success: false, error: 'That email address does not look right.' },
        { status: 400 }
      );
    }

    const emailForMail = String(emailAddress).trim();
    const normalizedEmail = normalizeEmail(emailForMail);
    const emailDomain = getEmailDomain(emailForMail);
    if (isDisposableEmailDomain(emailDomain)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please use an email address you can receive mail at, so we can send your QR code.',
        },
        { status: 400 }
      );
    }

    const normalizedSource = normalizeSource(source);
    const supabase = getServiceRoleClient();

    // Fast pre-check for a friendly message. The unique index below is the
    // actual guarantee - this is only here so the common case reads well.
    const { data: existingClaim } = await supabase
      .from('free_event_claims')
      .select('token, event_id')
      .eq('claim_email_normalized', normalizedEmail)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json(
        {
          success: false,
          error: 'This email has already used its free event.',
          code: 'ALREADY_CLAIMED',
        },
        { status: 409 }
      );
    }

    const eventId = generateEventId();
    const eventSlug = generateSlug(eventName);
    const token = generateToken();

    const createdAt = new Date();
    const eventExpiresAt = freeEventExpiresAt(eventDate, createdAt);

    // Claim row first, already marked consumed. If the unique index rejects it
    // (23505), another request for this email won the race - report it cleanly
    // and create nothing.
    //
    // event_id is NOT written here: free_event_claims.event_id has a
    // non-deferrable FK to events(id) and the event row does not exist yet.
    // It is stamped after the insert below.
    const { error: claimError } = await supabase
      .from('free_event_claims')
      .insert([
        {
          token,
          claimed: true,
          claimed_at: createdAt.toISOString(),
          claim_email: emailForMail,
          claim_email_normalized: normalizedEmail,
          source: normalizedSource,
          event_date: eventDate,
          unlimited: false, // never grant the whitelabel lane from a public route
        },
      ]);

    if (claimError) {
      if (claimError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'This email has already used its free event.',
            code: 'ALREADY_CLAIMED',
          },
          { status: 409 }
        );
      }
      console.error('Error creating self-serve claim:', claimError);
      return NextResponse.json(
        { success: false, error: 'Could not start your event. Please try again.' },
        { status: 500 }
      );
    }

    // Self-serve free events start inactive until the emailed activation link
    // is clicked. owner_email is set so the owner gates pass for the creator.
    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert([
        {
          id: eventId,
          name: eventName,
          slug: eventSlug,
          email: emailForMail,
          owner_email: emailForMail,
          owner_name: hostName,
          status: 'active',
          is_free: true,
          promo_type: 'FREE_SELF_SERVE',
          payment_type: 'self_serve',
          watermark_enabled: true,
          max_photos: FREE_MAX_PHOTOS,
          max_storage_bytes: 999999999,
          feed_enabled: true,
          event_date: eventDate,
          activated_at: null,
          created_at: createdAt.toISOString(),
          expires_at: eventExpiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating self-serve event:', createError);
      // Release the email so a genuine failure does not permanently burn it.
      await supabase.from('free_event_claims').delete().eq('token', token);
      return NextResponse.json(
        { success: false, error: 'Could not create your event. Please try again.' },
        { status: 500 }
      );
    }

    // Safe now that the event row exists.
    const { error: linkError } = await supabase
      .from('free_event_claims')
      .update({ event_id: eventId })
      .eq('token', token);
    if (linkError) {
      // Non-fatal: only affects the admin-side claim<->event link.
      console.error('Failed to link claim to event (non-fatal):', linkError);
    }

    try {
      await setHostCookie(emailForMail, process.env.NODE_ENV === 'production');
    } catch (e) {
      console.error('Failed to set host session (non-fatal):', e);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com';
    const dashboardUrl = `${baseUrl}/dashboard/${eventId}`;
    const galleryUrl = `${baseUrl}/e/${eventSlug}`;
    const activationUrl = `${baseUrl}/api/free/activate?token=${encodeURIComponent(token)}`;

    try {
      const { subject, html } = buildFreeEventEmail({
        hostName,
        eventName,
        eventDate,
        galleryUrl,
        dashboardUrl,
        activationUrl,
        expiresOn: eventExpiresAt.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });

      const emailResult = await sendMail({ to: emailForMail, subject, html });
      if (!emailResult.ok) {
        console.error('Failed to send free-event confirmation:', emailResult.error);
      }
    } catch (emailErr) {
      // Never fail the request on email - the event exists and the UI shows the links.
      console.error('Email sending error (non-fatal):', emailErr);
    }

    console.log(
      `Free self-serve event created: ${eventId} (${eventSlug}) source=${normalizedSource}`
    );

    return NextResponse.json({
      success: true,
      eventId: newEvent.id,
      eventSlug: newEvent.slug,
      dashboardUrl,
      galleryUrl,
      activationUrl,
    });
  } catch (err) {
    console.error('Unhandled error in /api/free/claim:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
