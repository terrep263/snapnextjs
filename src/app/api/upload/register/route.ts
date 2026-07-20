import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

/**
 * POST /api/upload/register
 *
 * Server-side photo registration. The public uploader streams the file bytes
 * straight to Supabase Storage (unchanged), then calls this route to record the
 * row. Moving the `events`/`photos` writes here (service role) removes the app's
 * dependency on anonymous INSERT policies — the prerequisite for locking down
 * table RLS. The storage upload path is unchanged by this route.
 *
 * Body: { eventId, filename, url, filePath, size, type, isVideo }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, filename, url, filePath, size, type, isVideo } = body || {};

    if (!eventId || !url) {
      return NextResponse.json(
        { success: false, error: 'eventId and url are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Load the event to (a) confirm it exists and (b) enforce the free-event
    // photo cap server-side (previously only checked in the browser, which is
    // bypassable). Missing event is tolerated with a minimal safety-net insert
    // to preserve the historical client behavior for freshly-claimed events.
    const { data: event } = await supabase
      .from('events')
      .select('id, name, slug, is_free, max_photos')
      .eq('id', eventId)
      .single();

    if (!event) {
      // Safety-net: create a minimal event row so the photo has a parent.
      await supabase.from('events').insert([
        {
          id: eventId,
          name: body.eventName || 'Event Gallery',
          slug: body.eventSlug || eventId,
          status: 'active',
        },
      ]);
    } else if (event.is_free && event.max_photos) {
      // Enforce the per-event photo cap for free events.
      const { count } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);
      if ((count || 0) >= event.max_photos) {
        return NextResponse.json(
          {
            success: false,
            error: `Photo limit reached. This event allows a maximum of ${event.max_photos} photos.`,
          },
          { status: 409 }
        );
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from('photos')
      .insert([
        {
          event_id: eventId,
          filename: filename || 'photo',
          url,
          file_path: filePath || null,
          size: typeof size === 'number' ? size : null,
          type: type || null,
          is_video: !!isVideo,
          created_at: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: inserted?.id || null });
  } catch (err: any) {
    console.error('Photo register error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to register photo' },
      { status: 500 }
    );
  }
}
