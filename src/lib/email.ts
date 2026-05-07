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
        <h1 style="margin:0;color:white;font-size:26px;font-weight:bold;">🎉 Congratulations — You're Live!</h1>
        <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Your event is set up and ready for guests</p>
      </div>

      <!-- Body -->
      <div style="padding:32px 30px;">
        <p style="font-size:16px;color:#1f2937;margin-top:0;">Hi there! Your SnapWorxx event <strong>${eventName}</strong> is live and ready to go. Here's exactly what to do next:</p>

        <!-- Step 1 -->
        <div style="border-left:4px solid #7C3AED;padding:16px 20px;margin-bottom:24px;background:#faf5ff;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 4px 0;font-weight:bold;color:#7C3AED;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Step 1</p>
          <h3 style="margin:0 0 8px 0;color:#1f2937;font-size:17px;">📱 Share this link with your guests</h3>
          <p style="margin:0 0 10px 0;color:#4b5563;font-size:14px;">Guests scan the QR code or tap this link to upload their photos directly to your event gallery — no app download needed.</p>
          <div style="background:white;padding:12px;border-radius:6px;border:1px solid #e9d5ff;word-break:break-all;">
            <a href="${galleryUrl}" style="color:#7C3AED;font-size:14px;text-decoration:none;font-weight:bold;">${galleryUrl}</a>
          </div>
        </div>

        <!-- Step 2 - QR Code -->
        <div style="border-left:4px solid #ec4899;padding:16px 20px;margin-bottom:24px;background:#fdf2f8;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 4px 0;font-weight:bold;color:#ec4899;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Step 2</p>
          <h3 style="margin:0 0 8px 0;color:#1f2937;font-size:17px;">📷 Print or display your QR code</h3>
          <p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;">Place this at your event — on tables, at the entrance, or on a screen. Guests scan it to instantly access your photo gallery.</p>
          <div style="text-align:center;">
            <div style="display:inline-block;padding:12px;border:3px solid #7C3AED;border-radius:12px;background:white;">
              <img src="${qrCodeUrl}" alt="Event QR Code" width="160" height="160" style="display:block;">
            </div>
            <p style="margin:8px 0 0 0;color:#6b7280;font-size:12px;">Right-click to save and print</p>
          </div>
        </div>

        <!-- Step 3 - Dashboard -->
        <div style="border-left:4px solid #059669;padding:16px 20px;margin-bottom:24px;background:#f0fdf4;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 4px 0;font-weight:bold;color:#059669;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Step 3</p>
          <h3 style="margin:0 0 8px 0;color:#1f2937;font-size:17px;">🎛️ Manage everything from your dashboard</h3>
          <p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;">View all uploaded photos, download them as a ZIP file, and manage your event settings — all in one place.</p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#7C3AED;border-radius:8px;">
                <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;color:white;text-decoration:none;font-weight:bold;font-size:16px;">Go to My Dashboard →</a>
              </td>
            </tr>
          </table>
        </div>

        <!-- Expiry Note -->
        <div style="padding:16px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b;">
          <p style="margin:0;color:#92400e;font-size:14px;">
            <strong>⏰ Important:</strong> Your event gallery is active for <strong>30 days</strong>. Make sure to download all photos from your dashboard before your event expires.
          </p>
        </div>

        <!-- Help -->
        <p style="margin:24px 0 0 0;color:#6b7280;font-size:13px;text-align:center;">Questions? Reply to this email and we'll help you out.</p>
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
