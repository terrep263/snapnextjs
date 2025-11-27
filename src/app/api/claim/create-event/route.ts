import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

    // Check if expired
    if (claimLink.expires_at && new Date(claimLink.expires_at) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Token expired' },
        { status: 410 }
      );
    }

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
          created_at: new Date().toISOString(),
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
