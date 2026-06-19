import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendGalleryLinkEmail } from '@/lib/email';

/**
 * Gallery Return-Link API
 *
 * Powers the guest-facing "Where should we send your photos?" prompt.
 * Captures the guest's email against the event (best-effort, reusing the
 * existing `leads` table) and emails them the public gallery link so they
 * can return without rescanning the QR.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email: string = (body?.email || '').trim();
    const eventSlug: string = (body?.eventSlug || '').trim();

    if (!email || !eventSlug) {
      return NextResponse.json(
        { error: 'Email and event are required' },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Resolve the event from the slug — only send links for real events
    // (prevents the endpoint being used to relay mail to arbitrary links).
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, slug')
      .eq('slug', eventSlug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventName = event.name || 'your event';

    // Best-effort lead capture — never block the email on a storage hiccup.
    try {
      await supabase.from('leads').insert({
        name: email.split('@')[0],
        email,
        source: 'gallery-return',
        event_type: null,
        event_details: { eventId: event.id, eventSlug: event.slug, eventName },
        created_at: new Date(),
      });
    } catch (leadErr) {
      console.warn('[gallery/send-link] lead insert skipped:', leadErr);
    }

    const result = await sendGalleryLinkEmail({
      to: email,
      eventName,
      eventSlug: event.slug,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Could not send the link' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[gallery/send-link] error:', msg);
    return NextResponse.json(
      { error: 'Could not send the link. Please try again.' },
      { status: 500 }
    );
  }
}
