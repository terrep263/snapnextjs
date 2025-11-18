import { getServiceRoleClient } from '@/lib/supabase';
import crypto from 'crypto';

const MASTER_EMAIL = 'freebie@snapworxx.com';
const MAX_FREEBIE_EVENTS = 100;
const UNLIMITED_STORAGE = 999999999; // Effectively unlimited (999GB)

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventName, eventDate, email, ownerName, eventPassword, hostEmail } = body;

    if (!eventName || !eventDate || !email || !hostEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Check if email is the master email
    if (email !== MASTER_EMAIL) {
      return new Response(JSON.stringify({ error: 'Invalid email for freebie events' }), { status: 403 });
    }

    const supabase = getServiceRoleClient();

    // Count existing freebie events from master email
    const { data: existingFreebies, error: countError } = await supabase
      .from('events')
      .select('id', { count: 'exact' })
      .eq('email', MASTER_EMAIL)
      .eq('is_freebie', true);

    if (countError) {
      console.error('Error counting freebie events', countError);
      return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
    }

    const freebieCount = existingFreebies?.length || 0;
    if (freebieCount >= MAX_FREEBIE_EVENTS) {
      return new Response(
        JSON.stringify({ 
          error: `Maximum freebie events (${MAX_FREEBIE_EVENTS}) reached for master email` 
        }),
        { status: 409 }
      );
    }

    // Generate event details
    const slugBase = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${slugBase}-${Date.now()}`;
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Hash password if provided
    const passwordHash = eventPassword ? hashPassword(eventPassword) : null;

    // Create freebie event with unlimited storage
    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert([
        {
          id: eventId,
          name: eventName,
          slug,
          email: MASTER_EMAIL,
          status: 'active',
          is_free: true,
          is_freebie: true,
          max_photos: 999999, // Unlimited photos
          max_storage_bytes: UNLIMITED_STORAGE,
          password_hash: passwordHash,
          owner_name: ownerName || 'SnapWorxx Team',
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating freebie event', insertError);
      return new Response(JSON.stringify({ error: 'Could not create event' }), { status: 500 });
    }

    // Log freebie event creation
    console.log(`✅ Freebie event created: ${newEvent.slug} (${freebieCount + 1}/${MAX_FREEBIE_EVENTS})`);

    // Send confirmation email to actual host
    const eventDetails = {
      id: newEvent.id,
      name: newEvent.name,
      slug: newEvent.slug,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${newEvent.id}`,
      eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/e/${newEvent.slug}`,
      uploadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/e/${newEvent.slug}/upload`
    };

    // Send email to the actual host (hostEmail), not master email
    try {
      console.log(`📧 Sending freebie event notification to ${hostEmail}`);
      
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error: emailError } = await resend.emails.send({
        from: 'SnapWorxx <noreply@snapworxx.app>',
        to: hostEmail, // Send to actual host email
        subject: `Your SnapWorxx Event is Ready: ${eventName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(to right, #10b981, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                .link { color: #10b981; word-break: break-all; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                .badge { display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Your SnapWorxx Event is Ready! 🎉</h1>
                  <span class="badge">UNLIMITED STORAGE</span>
                </div>
                <div class="content">
                  <p>Hi ${ownerName || 'there'},</p>
                  
                  <p>Your event <strong>${eventName}</strong> has been created and is ready to collect memories!</p>

                  <h3>📱 Share This Link With Guests</h3>
                  <p>Anyone can upload photos using this link:</p>
                  <a href="${eventDetails.uploadUrl}" class="button">Upload Photos</a>
                  <p class="link">${eventDetails.uploadUrl}</p>

                  <h3>🖼️ View Your Gallery</h3>
                  <a href="${eventDetails.eventUrl}" class="button">View Gallery</a>
                  <p class="link">${eventDetails.eventUrl}</p>

                  <h3>🎛️ Manage Your Event</h3>
                  <a href="${eventDetails.dashboardUrl}" class="button">Go to Dashboard</a>
                  <p>From your dashboard you can:</p>
                  <ul>
                    <li>View all uploaded photos</li>
                    <li>Download photos individually or as a ZIP</li>
                    <li>Delete unwanted photos</li>
                    <li>Share your event QR code</li>
                  </ul>

                  <h3>⭐ Your Event Features</h3>
                  <ul>
                    <li><strong>Unlimited Storage:</strong> No limits on photos or videos</li>
                    <li><strong>No Expiration:</strong> Your event stays active</li>
                    <li><strong>Full Access:</strong> All SnapWorxx features included</li>
                  </ul>

                  ${eventPassword ? '<p><strong>🔒 Your Event is Password Protected</strong><br/>Guests will need the password you set to view photos.</p>' : ''}

                  <p><strong>Event Date:</strong> ${eventDate || 'Not specified'}</p>
                </div>
                <div class="footer">
                  <p>&copy; 2025 SnapWorxx. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) {
        console.error('❌ Failed to send freebie notification:', emailError);
      } else {
        console.log('✅ Freebie notification sent, message ID:', data?.id);
      }
    } catch (emailError) {
      console.error('❌ Error sending freebie notification:', emailError);
      // Don't fail the process if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        slug: newEvent.slug,
        name: newEvent.name,
        email: newEvent.email,
        is_freebie: true,
        freebie_count: freebieCount + 1,
        max_freebies: MAX_FREEBIE_EVENTS,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Unhandled error in freebie event creation route', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
