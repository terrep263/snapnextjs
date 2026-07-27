/**
 * Confirmation email for self-serve free events created from /free.
 *
 * Kept separate from the inline template in /api/claim/create-event so that the
 * working admin magic-link flow is not modified. Same brand treatment, shorter
 * copy, and the QR is the load-bearing element - it is what the host prints and
 * puts on the table.
 */

export interface FreeEventEmailParams {
  hostName: string;
  eventName: string;
  eventDate: string;
  galleryUrl: string;
  dashboardUrl: string;
  expiresOn: string;
}

export function buildFreeEventEmail({
  hostName,
  eventName,
  eventDate,
  galleryUrl,
  dashboardUrl,
  expiresOn,
}: FreeEventEmailParams): { subject: string; html: string } {
  // Rendered server-side by a third party so it survives email clients that
  // block scripts. Encodes the GALLERY url - never the dashboard, and never a
  // claim/registration link.
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    galleryUrl
  )}`;

  const subject = `Your SnapWorxx gallery is ready: ${eventName}`;

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#333;background-color:#f8fafc;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;">

      <div style="background:#7C3AED;padding:28px 24px;text-align:center;">
        <img src="https://snapworxx.com/purple%20logo/whitelogo.png" alt="SnapWorxx" width="120" style="display:inline-block;margin-bottom:8px;">
        <div style="color:#ffffff;font-size:12px;letter-spacing:3px;">NEVER MISS THE MOMENTS</div>
      </div>

      <div style="padding:30px 24px;">
        <p style="font-size:16px;color:#1f2937;margin-top:0;">Hi <strong>${hostName}</strong>,</p>
        <p style="font-size:16px;color:#4b5563;">
          Your gallery for <strong>${eventName}</strong> is live. Everything below is ready to use right now.
        </p>

        <div style="background:#f3e8ff;border-left:4px solid #7C3AED;border-radius:10px;padding:18px 20px;margin:24px 0;">
          <p style="margin:6px 0;color:#1f2937;"><strong>Event:</strong> ${eventName}</p>
          <p style="margin:6px 0;color:#1f2937;"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin:6px 0;color:#1f2937;"><strong>Gallery active until:</strong> ${expiresOn}</p>
        </div>

        <div style="background:#ffffff;border:2px solid #7C3AED;border-radius:12px;padding:24px;text-align:center;margin:28px 0;">
          <h3 style="color:#7C3AED;margin:0 0 4px 0;font-size:18px;">Print this for your guests</h3>
          <p style="color:#6b7280;margin:0 0 18px 0;font-size:14px;">
            They point their phone at it and their photos land in your gallery. No app, no signup.
          </p>
          <img src="${qrCodeUrl}" alt="Scan to add photos" style="width:180px;height:180px;display:block;margin:0 auto;">
          <p style="color:#7C3AED;margin:14px 0 0 0;font-size:13px;font-weight:bold;">SCAN TO ADD PHOTOS</p>
        </div>

        <p style="color:#4b5563;margin:0 0 10px 0;">Or share the link directly:</p>
        <div style="background:#f3f4f6;padding:12px 15px;border-radius:8px;word-break:break-all;margin-bottom:28px;">
          <a href="${galleryUrl}" style="color:#7C3AED;font-size:14px;text-decoration:none;">${galleryUrl}</a>
        </div>

        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
          <tr>
            <td style="background:#7C3AED;border-radius:8px;">
              <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;">Open your dashboard</a>
            </td>
          </tr>
        </table>
        <p style="color:#6b7280;font-size:13px;margin-top:10px;">
          Watch photos come in, and download everything in one click when it's over.
        </p>

        <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 16px;margin-top:26px;">
          <p style="margin:0;color:#92400e;font-size:14px;">
            One thing that makes a real difference: say it out loud at the end of the event.
            Most guests take photos and forget to add them.
          </p>
        </div>
      </div>

      <div style="text-align:center;padding:24px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;">
        <p style="color:#6b7280;font-size:13px;margin:0;">SnapWorxx &mdash; Never Miss The Moments</p>
        <p style="color:#9ca3af;font-size:12px;margin:8px 0 0 0;">
          Questions? Just reply to this email, or visit
          <a href="https://snapworxx.com" style="color:#7C3AED;">snapworxx.com</a>
        </p>
      </div>

    </div>
  </body>
</html>`;

  return { subject, html };
}
