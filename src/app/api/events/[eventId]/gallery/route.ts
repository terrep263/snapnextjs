import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import ErrorLogger from '@/lib/errorLogger';

/**
 * GET /api/events/[eventId]/gallery
 * Gallery endpoint with pagination, search, and filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100); // Max 100
    const sortBy = searchParams.get('sortBy') || 'uploaded_at';
    const order = searchParams.get('order') || 'DESC';
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId') || null;

    const offset = (page - 1) * limit;

    const supabase = getServiceRoleClient();

    // Validate sort column
    const validSortColumns = ['uploaded_at', 'created_at', 'filename', 'file_size', 'size'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'uploaded_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build query
    let query = supabase
      .from('photos')
      .select(
        `
        id,
        filename,
        original_filename,
        url,
        storage_url,
        thumbnail_url,
        width,
        height,
        uploaded_at,
        created_at,
        file_size,
        size,
        type,
        mime_type,
        is_video,
        event_id
      `,
        { count: 'exact' }
      )
      .eq('event_id', eventId);

    // Filter approved photos only
    query = query.eq('is_approved', true);

    // Add search filter
    if (search) {
      // Search in filename or original_filename using OR filter
      query = query.or(`filename.ilike.%${search}%,original_filename.ilike.%${search}%`);
    }

    // Add user filter
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply sorting
    if (sortColumn === 'uploaded_at' || sortColumn === 'created_at') {
      query = query.order('created_at', { ascending: sortOrder === 'ASC' });
    } else if (sortColumn === 'filename') {
      query = query.order('filename', { ascending: sortOrder === 'ASC' });
    } else if (sortColumn === 'file_size' || sortColumn === 'size') {
      query = query.order('size', { ascending: sortOrder === 'ASC' });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: photos, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // If search term provided, also search in tags
    let tagMatchedPhotoIds: string[] = [];
    if (search) {
      const { data: tagMatches } = await supabase
        .from('photo_tags')
        .select('photo_id')
        .ilike('tag', `%${search}%`);

      if (tagMatches) {
        tagMatchedPhotoIds = tagMatches.map((t: any) => t.photo_id);
      }
    }

    // Combine results if we have tag matches
    let finalPhotos = photos || [];
    if (tagMatchedPhotoIds.length > 0 && photos) {
      // Get photos that match tags but weren't in the filename search
      const { data: tagPhotos } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_approved', true)
        .in('id', tagMatchedPhotoIds)
        .not('id', 'in', `(${photos.map((p: any) => `"${p.id}"`).join(',')})`);

      if (tagPhotos) {
        finalPhotos = [...photos, ...tagPhotos];
      }
    }

    // Remove duplicates
    const uniquePhotos = Array.from(
      new Map(finalPhotos.map((p: any) => [p.id, p])).values()
    );

    // Get total count (approximate if we have tag matches)
    const totalPhotos = count || uniquePhotos.length;
    const totalPages = Math.ceil(totalPhotos / limit);
    const hasMore = offset + uniquePhotos.length < totalPhotos;

    // Transform photos to include proper URLs
    const transformedPhotos = uniquePhotos.map((photo: any) => ({
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
      url: photo.storage_url || photo.url, // For backward compatibility
    }));

    const response = NextResponse.json({
      success: true,
      data: {
        photos: transformedPhotos,
        pagination: {
          page,
          limit,
          totalPhotos,
          totalPages,
          hasMore,
        },
      },
    });

    // Set caching headers
    // Short cache for gallery responses (5 minutes) since content can change
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (err: any) {
    console.error('Gallery fetch error:', err);

    await ErrorLogger.log({
      errorType: 'GALLERY_FETCH_ERROR',
      errorMessage: err.message,
      stackTrace: err.stack,
      requestData: {
        eventId: (await params).eventId,
        searchParams: Object.fromEntries(new URL(request.url).searchParams),
      },
      severity: 'high',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load gallery',
      },
      { status: 500 }
    );
  }
}

