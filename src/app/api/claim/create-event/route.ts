import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendMail } from '@/lib/mailer';
import { setHostCookie } from '@/lib/host-auth';

/**
 * Generates event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Generate URL-safe slug from event name
 */
function generateSlug(eventName: string): string {
  const baseSlug = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Add timestamp to ensure uniqueness
  return `${baseSlug}-${Date.now()}`;
}

/**
 * Public endpoint to create a free event from a claimed token
 * POST /api/claim/create-event
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      eventName,
      eventDate,
      location,
      yourName,
      emailAddress,
    } = body;

    // Validate required fields
    if (!token || !eventName || !eventDate || !yourName || !emailAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Validate token
    const { data: claimLink, error: tokenError } = await supabase
      .from('free_event_claims')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !claimLink) {
      console.error('Token validation error:', tokenError);
      return NextResponse.json(
        {
          success: false,
          error: tokenError?.message || 'Invalid token',
          details: tokenError?.details || 'Token not found',
          hint: tokenError?.hint || 'Make sure the database migration has been run'
        },
        { status: 404 }
      );
    }

    // Check if already claimed
    if (claimLink.claimed) {
      return NextResponse.json(
        { success: false, error: 'Token already claimed' },
        { status: 409 }
      );
    }

    // Enforce link expiry (safety net; admin links default to a 60-day expiry).
    if (claimLink.expires_at && new Date(claimLink.expires_at) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'This claim link has expired' },
        { status: 410 }
      );
    }

    // Unlimited (unrestricted-account) links create full-feature, no-limit
    // events owned by the account. For these we re-verify the account is still
    // an active allowlist member before granting anything.
    const isUnlimited = claimLink.unlimited === true;
    const accountEmail: string | null = claimLink.account_email || null;

    if (isUnlimited) {
      if (!accountEmail) {
        return NextResponse.json(
          { success: false, error: 'Unlimited link is missing its account binding' },
          { status: 400 }
        );
      }
      const { data: account } = await supabase
        .from('unrestricted_accounts')
        .select('id, active')
        .eq('email', accountEmail)
        .maybeSingle();

      if (!account?.active) {
        return NextResponse.json(
          { success: false, error: 'This unrestricted account is no longer active' },
          { status: 403 }
        );
      }
    }

    // Set event expiration to 30 days from creation (restricted links only).
    const eventExpiresAt = new Date();
    eventExpiresAt.setDate(eventExpiresAt.getDate() + 30);

    // Generate event details
    const eventId = generateEventId();
    const eventSlug = generateSlug(eventName);

    // Atomically claim the token BEFORE creating the event. The conditional
    // update (claimed=false guard) guarantees two concurrent requests can never
    // both succeed — the loser gets zero affected rows and a 409.
    const { data: claimedRows, error: claimLockError } = await supabase
      .from('free_event_claims')
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
        event_id: eventId,
      })
      .eq('token', token)
      .eq('claimed', false)
      .select('token');

    if (claimLockError) {
      console.error('Error claiming token:', claimLockError);
      return NextResponse.json(
        { success: false, error: 'Failed to claim token' },
        { status: 500 }
      );
    }

    if (!claimedRows || claimedRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Token already claimed' },
        { status: 409 }
      );
    }

    // Build the event payload. Restricted claim links keep the historical
    // freebie behaviour; unlimited links unlock everything and lift all caps
    // via the existing gating (premium package + null limits + owner_email).
    const eventInsert: Record<string, unknown> = isUnlimited
      ? {
          id: eventId,
          name: eventName,
          slug: eventSlug,
          email: accountEmail,
          owner_email: accountEmail, // real ownership -> owner gates (bulk download) pass
          status: 'active',
          is_free: true,
          promo_type: 'UNLIMITED',
          payment_type: 'magic_link',
          package: 'premium', // full features via getPackageType()
          feed_enabled: true,
          watermark_enabled: true, // keep SnapWorxx logo watermark (dlwatermark.png) on downloads
          max_photos: null, // no photo cap
          max_storage_bytes: null, // no storage cap
          expires_at: null, // never expires
          created_at: new Date().toISOString(),
        }
      : {
          id: eventId,
          name: eventName,
          slug: eventSlug,
          email: emailAddress,
          status: 'active',
          is_free: true, // Mark as free
          payment_type: 'magic_link', // Special payment type for magic link claims
          max_photos: 999999, // Unlimited
          max_storage_bytes: 999999999, // ~1GB (unlimited for practical purposes)
          feed_enabled: true, // Premium feature
          created_at: new Date().toISOString(),
          expires_at: eventExpiresAt.toISOString(), // Set event expiration
        };

    // Create the event
    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert([eventInsert])
      .select()
      .single();

    if (createError) {
      console.error('Error creating free event:', createError);
      // Roll back the claim so a genuine failure doesn't permanently burn the token.
      await supabase
        .from('free_event_claims')
        .update({ claimed: false, claimed_at: null, event_id: null })
        .eq('token', token);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create event',
          details: createError.message,
          code: createError.code
        },
        { status: 500 }
      );
    }

    // Token was already claimed atomically above (before event creation).

    // Mint a signed host session so the creator is a verified owner going forward.
    try {
      await setHostCookie(
        (isUnlimited && accountEmail) ? accountEmail : emailAddress,
        process.env.NODE_ENV === 'production'
      );
    } catch (e) {
      console.error('Failed to set host session:', e);
    }

    console.log(`✅ Free event created from magic link: ${eventId} (${eventSlug}) for ${emailAddress}`);

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com';
    const dashboardUrl = `${baseUrl}/dashboard/${eventId}`;
    const galleryUrl = `${baseUrl}/e/${eventSlug}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(galleryUrl)}`;

    // Send confirmation email with QR code via MailerCloud
    try {
      const expirationDate = isUnlimited
        ? 'No expiration'
        : eventExpiresAt.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

      const emailResult = await sendMail({
        to: (isUnlimited && accountEmail) ? accountEmail : emailAddress,
        subject: `Your SnapWorxx Event: ${eventName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; background: white;">
                <!-- Header with Logo -->
                <div style="padding: 20px; display: flex; align-items: center;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="120" valign="middle">
                        <img src="https://snapworxx.com/purple%20logo/purplelogo.png" alt="SnapWorxx" width="100" height="100" style="display: block;">
                      </td>
                      <td valign="middle">
                        <div style="background: #7C3AED; padding: 20px 30px; border-radius: 8px;">
                          <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: bold;">Your Event is Ready!</h1>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- Main Content -->
                <div style="padding: 30px 20px;">
                  <p style="font-size: 16px; color: #1f2937;">Hi <strong>${yourName}</strong>,</p>
                  <p style="font-size: 16px; color: #4b5563;">Great news! Your SnapWorxx event <strong>"${eventName}"</strong> has been created successfully. Here's everything you need to get started:</p>

                  <!-- Event Details Box -->
                  <div style="background: linear-gradient(135deg, #f3e8ff 0%, #fdf2f8 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #7C3AED;">
                    <h3 style="color: #6b21a8; margin: 0 0 15px 0; font-size: 18px;">📸 Your Event Details</h3>
                    <p style="margin: 8px 0; color: #1f2937;"><strong>Event:</strong> ${eventName}</p>
                    <p style="margin: 8px 0; color: #1f2937;"><strong>Date:</strong> ${eventDate}</p>
                    ${location ? `<p style="margin: 8px 0; color: #1f2937;"><strong>Location:</strong> ${location}</p>` : ''}
                    <p style="margin: 8px 0; color: #1f2937;"><strong>Active Until:</strong> ${expirationDate}</p>
                  </div>

                  <!-- Dashboard Button -->
                  <h3 style="color: #1f2937; margin: 25px 0 10px 0;">🎛️ Your Dashboard</h3>
                  <p style="color: #4b5563; margin: 0 0 15px 0;">Manage your event, view uploads, and download all photos:</p>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background: #7C3AED; border-radius: 8px;">
                        <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">Go to Dashboard →</a>
                      </td>
                    </tr>
                  </table>

                  <!-- Gallery Link -->
                  <h3 style="color: #1f2937; margin: 30px 0 10px 0;">📱 Event Gallery Link</h3>
                  <p style="color: #4b5563; margin: 0 0 10px 0;">Share this link with your guests so they can upload and view photos:</p>
                  <div style="background: #f3f4f6; padding: 12px 15px; border-radius: 8px; word-break: break-all;">
                    <a href="${galleryUrl}" style="color: #7C3AED; font-size: 14px; text-decoration: none;">${galleryUrl}</a>
                  </div>

                  <!-- QR Code Section - SnapWorxx Branded -->
                  <div style="background: white; border: 2px solid #7C3AED; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                    <h3 style="color: #7C3AED; margin: 0 0 5px 0; font-size: 18px;">📱 Share with Guests</h3>
                    <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px;">Scan this QR code to access the event gallery</p>
                    <div style="display: inline-block; padding: 15px; background: white; border: 3px solid #7C3AED; border-radius: 12px;">
                      <img src="${qrCodeUrl}" alt="QR Code" style="width: 150px; height: 150px; display: block;">
                    </div>
                    <p style="color: #7C3AED; margin: 15px 0 0 0; font-size: 12px; font-weight: bold;">SNAPWORXX</p>
                  </div>

                  <!-- Features Box -->
                  <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 25px 0;">
                    <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">✨ What's Included</h3>
                    <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li>Unlimited photo & video uploads</li>
                      <li>Unlimited storage space</li>
                      <li>Beautiful gallery display</li>
                      <li>Download all photos as ZIP</li>
                      <li>QR code sharing</li>
                      <li>${isUnlimited ? 'No expiration — your event stays active' : '30-day event duration'}</li>
                    </ul>
                  </div>

                  <p style="color: #6b7280; font-size: 14px; margin-top: 25px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <strong>⏰ Note:</strong> ${isUnlimited ? 'Your event has no expiration date.' : `Your event will remain active until ${expirationDate}. Make sure to download your photos before then!`}
                  </p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; padding: 25px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <img src="https://snapworxx.com/purple%20logo/purplelogo.png" alt="SnapWorxx" width="40" height="40" style="display: inline-block; margin-bottom: 10px;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">&copy; 2025 SnapWorxx. All rights reserved.</p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">Questions? Reply to this email or visit <a href="https://snapworxx.com" style="color: #7C3AED;">snapworxx.com</a></p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (!emailResult.ok) {
        console.error('❌ Failed to send confirmation email:', emailResult.error);
      } else {
        console.log(`📧 Confirmation email sent to ${emailAddress}`);
      }
    } catch (emailErr) {
      console.error('❌ Email sending error:', emailErr);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      eventId: newEvent.id,
      eventSlug: newEvent.slug,
      dashboardUrl,
      galleryUrl,
    });
  } catch (err) {
    console.error('Unhandled error in create-event:', err);
    return NextResponse.json(
      { success: false, error: 'Server error', details: String(err) },
      { status: 500 }
    );
  }
}
