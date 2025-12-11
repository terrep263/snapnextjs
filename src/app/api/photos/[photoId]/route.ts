import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import ErrorLogger from '@/lib/errorLogger';

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



