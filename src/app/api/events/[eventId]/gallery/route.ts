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
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const order = searchParams.get('order') || 'DESC';
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId') || null;
    const includeUnapproved = searchParams.get('includeUnapproved') === 'true';

    const offset = (page - 1) * limit;

    const supabase = getServiceRoleClient();

    // Validate sort column - use created_at as default since uploaded_at may not exist
    const validSortColumns = ['uploaded_at', 'created_at', 'filename', 'size'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build query - select only base columns that definitely exist
    // Additional columns (original_filename, storage_url, etc.) are optional and handled in transformation
    let query = supabase
      .from('photos')
      .select(
        `
        id,
        filename,
        url,
        file_path,
        size,
        type,
        created_at,
        event_id
      `,
        { count: 'exact' }
      )
      .eq('event_id', eventId);

    // Filter approved photos only (unless includeUnapproved is true)
    // Note: If is_approved column doesn't exist, the error will be caught and query retried without filter
    // For now, we'll skip the filter if includeUnapproved is true to avoid errors
    if (!includeUnapproved) {
      // Try to filter by is_approved, but this may fail if column doesn't exist
      // The error handler will retry without this filter
      query = query.eq('is_approved', true);
    }
    // If includeUnapproved is true, don't filter by is_approved (show all)

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
    } else if (sortColumn === 'size') {
      query = query.order('size', { ascending: sortOrder === 'ASC' });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: photos, error, count } = await query;

    if (error) {
      console.error('Database query error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        eventId,
        includeUnapproved,
      });
      
      // If error is about missing column (like is_approved), retry without that filter
      if (error.message && (error.message.includes('column') && error.message.includes('does not exist') || error.message.includes('is_approved'))) {
        console.warn('Column error detected, retrying query without is_approved filter:', error.message);
        
        // Retry query without is_approved filter - use base columns only
        let retryQuery = supabase
          .from('photos')
          .select(
            `
            id,
            filename,
            url,
            file_path,
            size,
            type,
            created_at,
            event_id
          `,
            { count: 'exact' }
          )
          .eq('event_id', eventId);
        
        // Re-apply other filters (search, user, sorting, pagination)
        if (search) {
          retryQuery = retryQuery.or(`filename.ilike.%${search}%,original_filename.ilike.%${search}%`);
        }
        if (userId) {
          retryQuery = retryQuery.eq('user_id', userId);
        }
        if (sortColumn === 'uploaded_at' || sortColumn === 'created_at') {
          retryQuery = retryQuery.order('created_at', { ascending: sortOrder === 'ASC' });
        } else if (sortColumn === 'filename') {
          retryQuery = retryQuery.order('filename', { ascending: sortOrder === 'ASC' });
        } else if (sortColumn === 'size') {
          retryQuery = retryQuery.order('size', { ascending: sortOrder === 'ASC' });
        }
        retryQuery = retryQuery.range(offset, offset + limit - 1);
        
        const { data: retryPhotos, error: retryError, count: retryCount } = await retryQuery;
        
        if (retryError) {
          throw new Error(`Database error: ${retryError.message}`);
        }
        
        // Use retry results
        const finalRetryPhotos = retryPhotos || [];
        const finalRetryCount = retryCount || finalRetryPhotos.length;
        
        // Transform and return - handle optional columns gracefully
        const transformedRetryPhotos = finalRetryPhotos.map((photo: any) => ({
          id: photo.id,
          filename: photo.filename || photo.original_filename || 'photo',
          original_filename: photo.original_filename || photo.filename || 'photo',
          storage_url: photo.storage_url || photo.url || '',
          thumbnail_url: photo.thumbnail_url || photo.storage_url || photo.url || '',
          width: photo.width || null,
          height: photo.height || null,
          uploaded_at: photo.uploaded_at || photo.created_at || null,
          file_size: photo.file_size || photo.size || null,
          mime_type: photo.mime_type || photo.type || 'image/jpeg',
          is_video: photo.is_video || (photo.type && photo.type.startsWith('video/')) || false,
          url: photo.storage_url || photo.url || '',
        }));
        
        const totalRetryPages = Math.ceil(finalRetryCount / limit);
        const hasRetryMore = offset + finalRetryPhotos.length < finalRetryCount;
        
        return NextResponse.json({
          success: true,
          data: {
            photos: transformedRetryPhotos,
            pagination: {
              page,
              limit,
              totalPhotos: finalRetryCount,
              totalPages: totalRetryPages,
              hasMore: hasRetryMore,
            },
          },
        });
      }
      
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
      const existingPhotoIds = photos.map((p: any) => p.id);
      const newTagPhotoIds = tagMatchedPhotoIds.filter(id => !existingPhotoIds.includes(id));
      
      if (newTagPhotoIds.length > 0) {
        let tagQuery = supabase
          .from('photos')
          .select('*')
          .eq('event_id', eventId)
          .in('id', newTagPhotoIds);
        
        // Apply approval filter if needed
        if (!includeUnapproved) {
          tagQuery = tagQuery.eq('is_approved', true);
        }
        // If includeUnapproved is true, don't filter by is_approved (show all)
        
        const { data: tagPhotos } = await tagQuery;

        if (tagPhotos) {
          finalPhotos = [...photos, ...tagPhotos];
        }
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
    // Handle optional columns gracefully (they may not exist if migration hasn't been run)
    const transformedPhotos = uniquePhotos.map((photo: any) => ({
      id: photo.id,
      filename: photo.filename || photo.original_filename || 'photo',
      original_filename: photo.original_filename || photo.filename || 'photo',
      storage_url: photo.storage_url || photo.url || '',
      thumbnail_url: photo.thumbnail_url || photo.storage_url || photo.url || '',
      width: photo.width || null,
      height: photo.height || null,
      uploaded_at: photo.uploaded_at || photo.created_at || null,
      file_size: photo.file_size || photo.size || null,
      mime_type: photo.mime_type || photo.type || 'image/jpeg',
      is_video: photo.is_video || (photo.type && photo.type.startsWith('video/')) || false,
      url: photo.storage_url || photo.url || '', // For backward compatibility
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
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      eventId: (await params).eventId,
    });

    // Try to log error, but don't let it fail the response
    try {
      await ErrorLogger.log({
        errorType: 'GALLERY_FETCH_ERROR',
        errorMessage: err.message || 'Unknown error',
        stackTrace: err.stack,
        requestData: {
          eventId: (await params).eventId,
          searchParams: Object.fromEntries(new URL(request.url).searchParams),
        },
        severity: 'high',
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to load gallery',
      },
      { status: 500 }
    );
  }
}

