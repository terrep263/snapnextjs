import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';

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
 *
 * Request body:
 * {
 *   token: string,
 *   eventName: string,
 *   eventDate: string,
 *   location?: string,
 *   yourName: string,
 *   emailAddress: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   eventId: string,
 *   eventSlug: string,
 *   dashboardUrl: string,
 *   galleryUrl: string
 * }
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

    // Set event expiration to 30 days from creation
    const eventExpiresAt = new Date();
    eventExpiresAt.setDate(eventExpiresAt.getDate() + 30);

    // Generate event details
    const eventId = generateEventId();
    const eventSlug = generateSlug(eventName);

    // Create free event with premium features
    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert([
        {
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
          // Store event details in metadata if you have such columns
          // Otherwise they'll be in the event name/slug
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating free event:', createError);
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

    // Mark token as claimed
    const { error: claimError } = await supabase
      .from('free_event_claims')
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
        event_id: eventId,
      })
      .eq('token', token);

    if (claimError) {
      console.error('Error marking token as claimed:', claimError);
      // Don't fail - event is created, just log the error
    }

    console.log(`✅ Free event created from magic link: ${eventId} (${eventSlug}) for ${emailAddress}`);

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com';
    const dashboardUrl = `${baseUrl}/dashboard/${eventId}`;
    const galleryUrl = `${baseUrl}/e/${eventSlug}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(galleryUrl)}`;

    // Send confirmation email with QR code
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const expirationDate = eventExpiresAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const { error: emailError } = await resend.emails.send({
        from: 'SnapWorxx <noreply@snapworxx.app>',
        to: emailAddress,
        subject: `Your SnapWorxx Event: ${eventName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
                .container { max-width: 600px; margin: 0 auto; background: white; }
                .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 40px 20px; }
                .button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0; }
                .link { color: #9333ea; word-break: break-all; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; }
                .info-box { background: linear-gradient(135deg, #f3e8ff 0%, #fdf2f8 100%); border-radius: 12px; padding: 25px; margin: 20px 0; border-left: 4px solid #9333ea; }
                .qr-section { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 25px; text-align: center; margin: 20px 0; }
                .features-box { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">🎉 Your Event is Ready!</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Your free SnapWorxx event has been created</p>
                </div>
                <div class="content">
                  <h2 style="color: #1f2937;">Hi ${yourName},</h2>
                  <p>Great news! Your SnapWorxx event <strong>"${eventName}"</strong> has been created successfully. Here's everything you need to get started:</p>

                  <!-- Event Details -->
                  <div class="info-box">
                    <h3 style="color: #6b21a8; margin: 0 0 15px 0;">📸 Your Event Details</h3>
                    <p style="margin: 8px 0;"><strong>Event:</strong> ${eventName}</p>
                    <p style="margin: 8px 0;"><strong>Date:</strong> ${eventDate}</p>
                    ${location ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${location}</p>` : ''}
                    <p style="margin: 8px 0;"><strong>Active Until:</strong> ${expirationDate}</p>
                  </div>

                  <!-- Dashboard Link -->
                  <h3>🎛️ Your Dashboard</h3>
                  <p>Manage your event, view uploads, and download all photos:</p>
                  <p><a href="${dashboardUrl}" class="button">Go to Dashboard →</a></p>

                  <!-- Gallery Link -->
                  <h3>📱 Event Gallery Link</h3>
                  <p>Share this link with your guests so they can upload and view photos:</p>
                  <p class="link" style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 14px;">${galleryUrl}</p>

                  <!-- QR Code -->
                  <div class="qr-section">
                    <h3 style="color: #1f2937; margin: 0 0 15px 0;">📱 Share with Guests Using QR Code</h3>
                    <img src="${qrCodeUrl}" alt="QR Code" style="width: 150px; height: 150px; margin: 0 auto; display: block;">
                    <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 13px;">Print or share this QR code - guests can scan to access your event</p>
                  </div>

                  <!-- Features -->
                  <div class="features-box">
                    <h3 style="color: #1f2937; margin: 0 0 15px 0;">✨ What's Included</h3>
                    <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li>Unlimited photo & video uploads</li>
                      <li>Unlimited storage space</li>
                      <li>Beautiful gallery display</li>
                      <li>Download all photos as ZIP</li>
                      <li>QR code sharing</li>
                      <li>30-day event duration</li>
                    </ul>
                  </div>

                  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    <strong>Note:</strong> Your event will remain active until ${expirationDate}. Make sure to download your photos before then!
                  </p>
                </div>
                <div class="footer">
                  <p>&copy; 2025 SnapWorxx. All rights reserved.</p>
                  <p style="font-size: 12px;">Questions? Reply to this email or visit <a href="https://snapworxx.com" style="color: #9333ea;">snapworxx.com</a></p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
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
