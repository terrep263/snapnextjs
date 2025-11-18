
import { getServiceRoleClient } from '@/lib/supabase';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: Request) {
  try {
    if (process.env.PROMO_FREE_BASIC_ENABLED !== 'true') {
      return new Response(JSON.stringify({ error: 'Promo not active' }), { status: 403 });
    }

    const body = await req.json();
    const { eventName, eventDate, email, ownerName, eventPassword } = body;

    if (!eventName || !eventDate || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const supabase = getServiceRoleClient();

    const { data: existingEvents } = await supabase
      .from('events')
      .select('id')
      .eq('email', email)
      .eq('is_free', true)
      .eq('promo_type', 'FREE_BASIC')
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      return new Response(JSON.stringify({ error: 'Promo already used for this email' }), { status: 409 });
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() +
        Number(process.env.PROMO_FREE_BASIC_EVENT_LIFESPAN_DAYS || 30) * 24 * 60 * 60 * 1000
    );

    const slugBase = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${slugBase}-${Date.now()}`;
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Hash password if provided
    const passwordHash = eventPassword ? hashPassword(eventPassword) : null;

    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert([
        {
          id: eventId,
          name: eventName,
          slug,
          email,
          status: 'active',
          is_free: true,
          promo_type: 'FREE_BASIC',
          expires_at: expiresAt.toISOString(),
          max_photos: 250,
          password_hash: passwordHash,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating promo event', insertError);
      return new Response(JSON.stringify({ error: 'Could not create event' }), { status: 500 });
    }

    // Send confirmation email to user
    const eventDetails = {
      id: newEvent.id,
      name: newEvent.name,
      slug: newEvent.slug,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${newEvent.id}`,
      eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/e/${newEvent.slug}`
    };

    if (email) {
      try {
        console.log('📧 Attempting to send promo event email to:', email);
        
        // Import Resend and send email directly
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const { data, error: emailError } = await resend.emails.send({
          from: 'SnapWorxx <noreply@snapworxx.app>',
          to: email,
          subject: `Your Free SnapWorxx Event: ${eventName}`,
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
                  .badge { display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Your Free Event is Ready! 🎉</h1>
                    <span class="badge">FREE BASIC PLAN</span>
                  </div>
                  <div class="content">
                    <h2>Event: ${eventName}</h2>
                    <p>Congratulations! Your free SnapWorxx Basic event has been created successfully. Here's everything you need to get started:</p>

                    <h3>📱 Event Link</h3>
                    <p>Share this link with your guests to upload and view photos:</p>
                    <p class="link">${eventDetails.eventUrl}</p>

                    <h3>🎛️ Dashboard</h3>
                    <p>Manage your event, upload header/profile images, and download all photos:</p>
                    <a href="${eventDetails.dashboardUrl}" class="button">Go to Dashboard</a>

                    <h3>📷 QR Code</h3>
                    <p>Visit your dashboard to download a QR code that guests can scan to access the event.</p>

                    <h3>⏰ Event Details</h3>
                    <ul>
                      <li><strong>Duration:</strong> 30 days of access</li>
                      <li><strong>Storage:</strong> Up to 250 photos/videos</li>
                      <li><strong>Features:</strong> Guest uploads, QR code sharing, gallery view</li>
                    </ul>

                    ${eventPassword ? '<p><strong>🔒 Password Protection:</strong> Your event is password-protected. Share the password with your guests.</p>' : ''}

                    <p style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 6px;">
                      <strong>💡 Pro Tip:</strong> Upload a header banner and profile image in your dashboard to personalize your event gallery!
                    </p>
                  </div>
                  <div class="footer">
                    <p>Enjoy your free SnapWorxx Basic event!</p>
                    <p>&copy; 2025 SnapWorxx. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        if (emailError) {
          console.error('❌ Failed to send confirmation email:', emailError);
          // Don't fail the whole process if email fails
        } else {
          console.log('✅ Confirmation email sent successfully to:', email);
          console.log('📧 Email message ID:', data?.id);
        }
      } catch (emailError) {
        console.error('❌ Error sending confirmation email:', emailError);
        // Don't fail the whole process if email fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      slug: newEvent.slug,
      name: newEvent.name,
      email: newEvent.email,
      password_hash: newEvent.password_hash
    }), { status: 200 });
  } catch (err) {
    console.error('Unhandled error in promo free basic route', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
