import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { to, eventName, dashboardUrl, eventUrl } = await request.json();

    if (!to || !eventName || !dashboardUrl || !eventUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Attempting to send email with API key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'SnapWorxx <noreply@snapworxx.app>',
      to,
      subject: `Your SnapWorxx Event: ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
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
                <h2>Event: ${eventName}</h2>
                <p>Your SnapWorxx event has been created successfully! Here's everything you need to get started:</p>

                <h3>📱 Event Link</h3>
                <p>Share this link with your guests to upload and view photos:</p>
                <p class="link">${eventUrl}</p>

                <h3>🎛️ Dashboard</h3>
                <p>Manage your event and download all photos:</p>
                <a href="${dashboardUrl}" class="button">Go to Dashboard</a>

                <h3>📷 QR Code</h3>
                <p>Visit your dashboard to download a QR code that guests can scan to access the event.</p>

                <p><strong>Event Duration:</strong> Your event will remain active for 30 days.</p>
              </div>
              <div class="footer">
                <p>&copy; 2025 SnapWorxx. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error details:', error);
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: error.message || 'Unknown Resend error' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
