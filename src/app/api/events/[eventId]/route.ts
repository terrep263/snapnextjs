import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { verifyHostSession } from '@/lib/host-auth';
import { verifyAdminSession } from '@/lib/admin-auth';

/**
 * PATCH /api/events/[eventId]
 *
 * Owner (or admin) event settings update. Replaces the previous client-side
 * anonymous `supabase.from('events').update(...)` calls, which stopped working
 * once table RLS was locked to read-only for the anon key. Identity is proven
 * server-side via the signed host session (owner) or admin session, and only a
 * whitelist of host-editable columns may be changed.
 *
 * Body: any subset of { name, header_image, profile_image, cover_photo_url,
 *                        sharing_enabled }
 */
const EDITABLE_FIELDS = [
  'name',
  'header_image',
  'profile_image',
  'cover_photo_url',
  'sharing_enabled',
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();

    // Authorize: the signed host session for THIS event, or an admin session.
    const host = await verifyHostSession(eventId);
    const admin = await verifyAdminSession();
    const isOwner = !!host;
    const isAdmin = !!admin?.authenticated;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only the event owner or an admin can change event settings' },
        { status: 403 }
      );
    }

    // Whitelist the fields that may be updated.
    const updateData: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
      if (key in body) updateData[key] = body[key];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No editable fields provided' },
        { status: 400 }
      );
    }

    if ('name' in updateData) {
      const name = String(updateData.name ?? '').trim();
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Event name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    if ('sharing_enabled' in updateData) {
      updateData.sharing_enabled = updateData.sharing_enabled === true;
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select('id')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: data.id, updated: Object.keys(updateData) });
  } catch (err: any) {
    console.error('Event update error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}
