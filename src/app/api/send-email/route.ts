import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321
}

// HTML sanitization helper (basic XSS prevention)
function sanitizeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Retry helper with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const { to, eventName, dashboardUrl, eventUrl } = await request.json();

    // Validate required fields
    if (!to || !eventName || !dashboardUrl || !eventUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email address
    if (!isValidEmail(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate URLs (basic check)
    if (!dashboardUrl.startsWith('http') || !eventUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid URLs provided' },
        { status: 400 }
      );
    }

    // Sanitize inputs to prevent XSS in email
    const sanitizedEventName = sanitizeHTML(eventName);
    const sanitizedDashboardUrl = sanitizeHTML(dashboardUrl);
    const sanitizedEventUrl = sanitizeHTML(eventUrl);

    console.log('📧 Sending email to:', to);
    console.log('📧 Event name:', sanitizedEventName);

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email with retry logic
    const { data, error } = await retryOperation(
      async () => {
        return await resend.emails.send({
          from: 'SnapWorxx <noreply@snapworxx.app>',
          to,
          subject: `Your SnapWorxx Event: ${sanitizedEventName}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(to right, #9333ea, #ec4899); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                  .button { display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                  .link { color: #9333ea; word-break: break-all; }
                  .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Your Event is Ready! 🎉</h1>
                  </div>
                  <div class="content">
                    <h2>Event: ${sanitizedEventName}</h2>
                    <p>Your SnapWorxx event has been created successfully! Here's everything you need to get started:</p>

                    <h3>📱 Event Link</h3>
                    <p>Share this link with your guests to upload and view photos:</p>
                    <p class="link"><a href="${sanitizedEventUrl}">${sanitizedEventUrl}</a></p>

                    <h3>🎛️ Dashboard</h3>
                    <p>Manage your event and download all photos:</p>
                    <a href="${sanitizedDashboardUrl}" class="button">Go to Dashboard</a>

                    <h3>📷 QR Code</h3>
                    <p>Visit your dashboard to download a QR code that guests can scan to access the event.</p>

                    <p><strong>Event Duration:</strong> Your event will remain active for 30 days.</p>
                  </div>
                  <div class="footer">
                    <p>&copy; 2025 SnapWorxx. All rights reserved.</p>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                      If you didn't create this event, please ignore this email.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      },
      3, // Max 3 retries
      1000 // 1 second base delay
    );

    if (error) {
      console.error('❌ Resend error:', error.message || error);
      return NextResponse.json({
        error: 'Failed to send email',
        details: error.message || 'Unknown Resend error'
      }, { status: 500 });
    }

    console.log('✅ Email sent successfully, message ID:', data?.id);
    return NextResponse.json({ success: true, messageId: data?.id });

  } catch (error) {
    console.error('❌ Error sending email:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
