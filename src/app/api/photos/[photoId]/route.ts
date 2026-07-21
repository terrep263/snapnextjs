import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/admin-auth';
import { verifyHostSession } from '@/lib/host-auth';
import ErrorLogger from '@/lib/errorLogger';

/**
 * Derive the storage object key inside the `photos` bucket from a stored
 * value. Photos persist `file_path` (the canonical key); older rows may only
 * have a public URL, so fall back to parsing the path after `/photos/`.
 */
function toStorageKey(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('http')) return value; // already a key
  const match = value.match(/\/photos\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * GET /api/photos/[photoId]
 * Get individual photo details with view tracking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const supabase = getServiceRoleClient();

    // Get photo details
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select(
        `
        *,
        events!inner(id, name, slug, created_at)
      `
      )
      .eq('id', photoId)
      .eq('is_approved', true)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Photo not found',
        },
        { status: 404 }
      );
    }

    // Get tags for this photo
    const { data: tags } = await supabase
      .from('photo_tags')
      .select('tag')
      .eq('photo_id', photoId);

    // Get view count
    const { count: viewCount } = await supabase
      .from('photo_views')
      .select('*', { count: 'exact', head: true })
      .eq('photo_id', photoId);

    // Log photo view (async, don't wait)
    (async () => {
      try {
        await supabase
          .from('photo_views')
          .insert({
            photo_id: photoId,
            viewer_ip: clientIp,
            viewed_at: new Date().toISOString(),
          });
        // View logged successfully
      } catch (err) {
        console.error('Failed to log photo view:', err);
      }
    })();

    // Transform photo data
    const photoData = {
      id: photo.id,
      filename: photo.filename || photo.original_filename,
      original_filename: photo.original_filename || photo.filename,
      storage_url: photo.storage_url || photo.url,
      thumbnail_url: photo.thumbnail_url || photo.storage_url || photo.url,
      width: photo.width,
      height: photo.height,
      uploaded_at: photo.uploaded_at || photo.created_at,
      file_size: photo.file_size || photo.size,
      mime_type: photo.mime_type || photo.type,
      is_video: photo.is_video || photo.type === 'video',
      url: photo.storage_url || photo.url,
      event_id: photo.event_id,
      event_name: photo.events?.name,
      event_slug: photo.events?.slug,
      tags: tags?.map((t: any) => t.tag) || [],
      view_count: viewCount || 0,
      uploader_name: null, // Can be added if user table exists
      uploader_email: null, // Can be added if user table exists
    };

    return NextResponse.json({
      success: true,
      data: photoData,
    });
  } catch (err: any) {
    console.error('Photo fetch error:', err);

    await ErrorLogger.log({
      errorType: 'PHOTO_FETCH_ERROR',
      errorMessage: err.message,
      stackTrace: err.stack,
      requestData: {
        photoId: (await params).photoId,
      },
      severity: 'info',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load photo',
      },
      { status: 500 }
    );
  }
}



/**
 * DELETE /api/photos/[photoId]
 *
 * Permanently delete a photo. Owner-or-admin only (enforced server-side via
 * cookie identity). Removes the storage objects (original + thumbnail) and the
 * database row. This is irreversible — the UI gates it behind a confirmation,
 * and hide/unhide remains available for the reversible case.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;

  try {
    const supabase = getServiceRoleClient();

    // Load the photo with the columns needed to locate its storage objects.
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id, event_id, file_path, storage_url, url, thumbnail_url')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Load the owning event to check permissions.
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, owner_email')
      .eq('id', photo.event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Permission check: admin OR the event owner.
    const session = await verifyAdminSession();
    const isAdmin = !!session?.authenticated;
    // Owner authorized only via the signed host session (no unsigned trust).
    const host = await verifyHostSession(event.id);
    const isOwner = !!host;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Owner or admin access required' },
        { status: 403 }
      );
    }

    // Collect storage keys to remove (original + thumbnail), de-duplicated.
    const keys = new Set<string>();
    const original = toStorageKey(photo.file_path) || toStorageKey(photo.storage_url) || toStorageKey(photo.url);
    const thumb = toStorageKey(photo.thumbnail_url);
    if (original) keys.add(original);
    if (thumb && thumb !== original) keys.add(thumb);

    // Remove storage objects first. Storage failures are logged but do not
    // block the row deletion — an orphaned object is preferable to a ghost row
    // the host can't get rid of.
    if (keys.size > 0) {
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove(Array.from(keys));
      if (storageError) {
        console.warn(`Storage remove failed for photo ${photoId}:`, storageError);
      }
    }

    // Delete the database row.
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      throw new Error(`Failed to delete photo row: ${deleteError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: { id: photoId, deleted: true },
    });
  } catch (err: any) {
    console.error('Photo delete error:', err);

    await ErrorLogger.log({
      errorType: 'PHOTO_DELETE_ERROR',
      errorMessage: err.message,
      stackTrace: err.stack,
      requestData: { photoId },
      severity: 'high',
    });

    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
