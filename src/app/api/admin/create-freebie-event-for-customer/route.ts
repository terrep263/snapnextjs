import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const MAX_FREEBIE_EVENTS_PER_CUSTOMER = 1000;
const UNLIMITED_STORAGE = 999999999;

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
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
        message: `Freebie event created for ${hostName} (${hostEmail}). Share the guest gallery URL with attendees.`,
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
