import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';

const MAX_FREEBIE_EVENTS_PER_CUSTOMER = 1000;
const UNLIMITED_STORAGE = 999999999;
const resend = new Resend(process.env.RESEND_API_KEY);

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateFreebieEmailTemplate(
  hostName: string,
  eventName: string,
  eventDate: string,
  signupUrl: string,
  galleryUrl: string,
  eventSlug: string
): string {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(galleryUrl)}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free SnapWorxx Event - ${eventName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">🎁 Your Free Event is Ready!</h1>
      <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Complimentary event access from SnapWorxx</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 20px;">
      <h2 style="color: #1f2937; margin-bottom: 15px; font-size: 24px;">Hi ${hostName},</h2>
      
      <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
        Great news! We've created a <strong>completely free event gallery</strong> for you. 
        Start collecting photos and videos from your guests immediately!
      </p>

      <!-- Event Details Box -->
      <div style="background: linear-gradient(135deg, #f3e8ff 0%, #fdf2f8 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #9333ea;">
        <h3 style="color: #6b21a8; margin: 0 0 15px 0; font-size: 18px;">📸 Your Event Details</h3>
        <p style="color: #1f2937; margin: 8px 0; font-size: 15px;"><strong>Event:</strong> ${eventName}</p>
        <p style="color: #1f2937; margin: 8px 0; font-size: 15px;"><strong>Date:</strong> ${eventDate}</p>
        <p style="color: #1f2937; margin: 8px 0; font-size: 15px;"><strong>Type:</strong> Unlimited uploads • Unlimited storage • No expiration</p>
      </div>

      <!-- How to Get Started -->
      <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">🚀 How to Get Started (3 Steps)</h3>
        
        <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; gap: 15px;">
            <div style="min-width: 40px;">
              <div style="width: 40px; height: 40px; background: #9333ea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">1</div>
            </div>
            <div>
              <h4 style="color: #1f2937; margin: 0 0 5px 0; font-weight: bold;">Sign Up</h4>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">Click the button below to create your SnapWorxx account</p>
              <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 13px;"><em>Use email: <strong>${hostName.includes('@') ? hostName : 'your email'}</strong></em></p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; gap: 15px;">
            <div style="min-width: 40px;">
              <div style="width: 40px; height: 40px; background: #9333ea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">2</div>
            </div>
            <div>
              <h4 style="color: #1f2937; margin: 0 0 5px 0; font-weight: bold;">View Your Event</h4>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">Your event will appear in your dashboard automatically after signup</p>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 15px;">
          <div style="min-width: 40px;">
            <div style="width: 40px; height: 40px; background: #9333ea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">3</div>
          </div>
          <div>
            <h4 style="color: #1f2937; margin: 0 0 5px 0; font-weight: bold;">Share with Guests</h4>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Share the gallery link or QR code with your guests. They can start uploading right away!</p>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${signupUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; text-align: center;">
          Claim Your Free Event →
        </a>
      </div>

      <!-- QR Code Section -->
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📱 Share with Guests Using QR Code</h3>
        <img src="${qrCodeUrl}" alt="QR Code" style="width: 150px; height: 150px; margin: 0 auto; display: block;">
        <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 13px;">Guests can scan this code to view and upload photos</p>
      </div>

      <!-- Features -->
      <div style="margin-bottom: 30px; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">✨ What You Get (Free!)</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
          <li>Unlimited photo & video uploads from guests</li>
          <li>Unlimited storage (never runs out)</li>
          <li>Event never expires (yours to keep forever)</li>
          <li>Download all photos as one ZIP file</li>
          <li>Share with unlimited guests</li>
          <li>No credit card required</li>
        </ul>
      </div>

      <!-- Gallery Link Info -->
      <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <p style="color: #0c4a6e; margin: 0; font-size: 14px;">
          <strong>Your Gallery URL (share this with guests):</strong><br>
          <span style="word-break: break-all; font-size: 12px; color: #075985;">${galleryUrl}</span>
        </p>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; text-align: center;">
        <p style="color: #6b7280; margin: 0 0 15px 0; font-size: 14px;">
          Questions or need help? Reply to this email or visit our support page.
        </p>
        <p style="color: #9ca3af; margin: 0; font-size: 12px;">
          This is your personal free event. Start using it right now!
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #1f2937; color: white; padding: 25px 20px; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #d1d5db;">
        <strong style="font-size: 16px;">SnapWorxx</strong><br>
        Capture. Share. Celebrate.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
        © 2024 SnapWorxx. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

function isAdminRequest(request: Request | NextRequest): boolean {
  // Check for admin session cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split('; ');
    const adminSessionCookie = cookies.find(c => c.startsWith('admin_session='));
    if (adminSessionCookie) return true;
  }

  // Check for admin auth header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer admin_')) return true;

  return false;
}

/**
 * Admin endpoint to create freebie events for specific customers
 * This endpoint allows admins to assign freebie events to customer emails
 */
export async function POST(req: Request | NextRequest) {
  try {
    // VERIFY ADMIN ACCESS
    if (!isAdminRequest(req)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      hostName,
      hostEmail,
      eventName,
      eventDate,
      eventType,
      eventSlug,
    } = body;

    // Validate required fields
    if (!hostName || !hostEmail || !eventName || !eventDate) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: hostName, hostEmail, eventName, eventDate',
        }),
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hostEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Count existing freebie events for this customer email
    const { data: existingFreebies, error: countError } = await supabase
      .from('events')
      .select('id', { count: 'exact' })
      .eq('owner_email', hostEmail)
      .eq('is_freebie', true);

    if (countError) {
      console.error('Error counting freebie events for customer', countError);
      return new Response(
        JSON.stringify({ error: 'Database error while checking freebie count' }),
        { status: 500 }
      );
    }

    const customerFreebieCount = existingFreebies?.length || 0;
    // Note: Admin UI should enforce the 100 global limit; this is a per-customer safety check
    if (customerFreebieCount >= MAX_FREEBIE_EVENTS_PER_CUSTOMER) {
      return new Response(
        JSON.stringify({
          error: `Maximum freebie events for this customer reached`,
        }),
        { status: 409 }
      );
    }

    // Generate event details
    const slugBase = eventSlug ||
      eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${slugBase}-${Date.now()}`;
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Determine if this is basic or premium (if specified)
    // For now, freebie events are always "basic" feature set, but stored with package info if provided
    const isBasic = !eventType || eventType.toLowerCase() === 'basic';

    // Create freebie event
    // Important: Do NOT set email to customer email - use empty/system email
    // This allows the event to be claimed by any email later
    // Set owner_email instead to facilitate claiming
    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert([
        {
          id: eventId,
          name: eventName,
          slug,
          email: hostEmail, // Store customer email in event.email for event context
          owner_email: hostEmail, // Store in owner_email for claiming logic
          owner_id: null, // Will be set when customer logs in/signs up
          status: 'active',
          is_free: true,
          is_freebie: true,
          payment_type: 'freebie', // New field to mark as complimentary
          max_photos: 999999, // Unlimited photos
          max_storage_bytes: UNLIMITED_STORAGE,
          owner_name: hostName,
          // Note: Do not set stripe_session_id - freebie events have no payment
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating freebie event', insertError);
      return new Response(
        JSON.stringify({ error: 'Could not create freebie event in database' }),
        { status: 500 }
      );
    }

    // Log freebie event creation
    console.log(
      `✅ Freebie event created for ${hostEmail}: ${newEvent.slug} (${customerFreebieCount + 1} total for customer)`
    );

    // Send email to recipient
    let emailSent = false;
    let emailError = null;

    try {
      const signupUrl = `https://snapworxx.com/signup?email=${encodeURIComponent(hostEmail)}`;
      const galleryUrl = `https://snapworxx.com/e/${newEvent.slug}`;

      const emailTemplate = generateFreebieEmailTemplate(
        hostName,
        eventName,
        eventDate,
        signupUrl,
        galleryUrl,
        newEvent.slug
      );

      await resend.emails.send({
        from: 'events@snapworxx.com',
        to: hostEmail,
        subject: `🎁 Your Free SnapWorxx Event is Ready: ${eventName}`,
        html: emailTemplate,
      });

      emailSent = true;
      console.log(`✅ Freebie email sent to ${hostEmail}`);
    } catch (err) {
      console.error(`⚠️ Failed to send freebie email to ${hostEmail}:`, err);
      emailError = err instanceof Error ? err.message : 'Unknown error';
      // Don't fail the event creation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        event: {
          id: newEvent.id,
          name: newEvent.name,
          slug: newEvent.slug,
          ownerEmail: newEvent.owner_email,
          ownerId: newEvent.owner_id,
          isFreebie: newEvent.is_freebie,
          paymentType: newEvent.payment_type,
        },
        urls: {
          hostDashboard: `https://snapworxx.com/dashboard/${newEvent.id}`,
          guestGallery: `https://snapworxx.com/e/${newEvent.slug}`,
        },
        emailSent: emailSent,
        emailError: emailError,
        message: emailSent
          ? `✅ Freebie event created! Email sent to ${hostEmail} with event details and signup link.`
          : `⚠️ Freebie event created, but email failed to send. You can manually send the guest gallery link: https://snapworxx.com/e/${newEvent.slug}`,
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error('Unhandled error in create-freebie-event-for-customer', err);
    return new Response(
      JSON.stringify({ error: 'Server error', details: String(err) }),
      { status: 500 }
    );
  }
}
