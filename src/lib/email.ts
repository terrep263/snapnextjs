import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'SnapWorxx <noreply@snapworxx.com>';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com';

export interface EventEmailParams {
  to: string;
  eventName: string;
  eventId: string;
  eventSlug: string;
}

function buildEventEmail(params: EventEmailParams): string {
  const { eventName, eventId, eventSlug } = params;
  const galleryUrl = `${BASE_URL}/e/${eventSlug}`;
  const dashboardUrl = `${BASE_URL}/dashboard/${eventId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(galleryUrl)}`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc;color:#333;">
    <div style="max-width:600px;margin:0 auto;background:white;">

      <!-- Header -->
      <div style="background:linear-gradient(to right,#7C3AED,#ec4899);padding:30px;text-align:center;">
        <img src="${BASE_URL}/purple%20logo/purplelogo.png" alt="SnapWorxx" width="80" style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;">
        <h1 style="margin:0;color:white;font-size:26px;font-weight:bold;">🎉 Your Event is Ready!</h1>
      </div>

      <!-- Body -->
      <div style="padding:32px 30px;">
        <p style="font-size:16px;color:#1f2937;margin-top:0;">Your SnapWorxx event <strong>${eventName}</strong> has been created successfully!</p>

        <!-- Gallery Link -->
        <h3 style="color:#1f2937;margin-bottom:8px;">📱 Event Gallery Link</h3>
        <p style="color:#4b5563;margin-top:0;font-size:14px;">Share this with your guests so they can upload and view photos:</p>
        <div style="background:#f3f4f6;padding:14px;border-radius:8px;margin-bottom:24px;word-break:break-all;">
          <a href="${galleryUrl}" style="color:#7C3AED;font-size:14px;text-decoration:none;">${galleryUrl}</a>
        </div>

        <!-- QR Code -->
        <h3 style="color:#1f2937;margin-bottom:8px;">📷 QR Code</h3>
        <p style="color:#4b5563;margin-top:0;font-size:14px;">Print or display this QR code at your event for instant guest access:</p>
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;padding:12px;border:3px solid #7C3AED;border-radius:12px;">
            <img src="${qrCodeUrl}" alt="Event QR Code" width="160" height="160" style="display:block;">
          </div>
        </div>

        <!-- Dashboard Button -->
        <h3 style="color:#1f2937;margin-bottom:8px;">🎛️ Your Dashboard</h3>
        <p style="color:#4b5563;margin-top:0;font-size:14px;">Manage your event, view uploads, and download all photos:</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td style="background:#7C3AED;border-radius:8px;">
              <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;color:white;text-decoration:none;font-weight:bold;font-size:16px;">Go to Dashboard →</a>
            </td>
          </tr>
        </table>

        <!-- Note -->
        <div style="padding:16px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b;">
          <p style="margin:0;color:#92400e;font-size:14px;">
            <strong>⏰ Note:</strong> Your event will remain active for 30 days. Download your photos before then!
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align:center;padding:20px;background:#f9fafb;border-top:1px solid #e5e7eb;">
        <p style="color:#6b7280;font-size:14px;margin:0;">© 2025 SnapWorxx. All rights reserved.</p>
        <p style="color:#9ca3af;font-size:12px;margin:8px 0 0 0;">
          If you didn't create this event, please ignore this email.
        </p>
      </div>

    </div>
  </body>
</html>`;
}

/**
 * Send event confirmation email.
 * Call this ONCE after payment is confirmed — from the webhook handler only.
 */
export async function sendEventConfirmationEmail(params: EventEmailParams): Promise<void> {
  const { to, eventName } = params;

  if (!to) {
    console.error('[Email] No recipient address — skipping send');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Your SnapWorxx Event is Ready: ${eventName}`,
      html: buildEventEmail(params),
    });

    if (error) {
      console.error('[Email] Resend error:', error);
    } else {
      console.log(`[Email] Sent successfully to ${to} — ID: ${data?.id}`);
    }
  } catch (err) {
    console.error('[Email] Failed to send:', err);
  }
}
