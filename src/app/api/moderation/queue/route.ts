import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/moderation-utils';

/**
 * GET /api/moderation/queue
 * 
 * Get moderation queue (flagged items pending review)
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = getServiceRoleClient();

    // Try to query moderation queue table
    // If it doesn't exist, fall back to querying flagged photos directly
    let queueItems: any[] = [];

    try {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error && data) {
        queueItems = data;
      }
    } catch (err) {
      // Table doesn't exist, query photos directly
      console.warn('Moderation queue table not found, using photos table');
    }

    // If no queue items, get flagged photos directly
    if (queueItems.length === 0) {
      const { data: flaggedPhotos, error: photosError } = await supabase
        .from('photos')
        .select(`
          id,
          filename,
          event_id,
          is_flagged,
          flag_reason,
          created_at,
          events!inner(id, name, slug)
        `)
        .eq('is_flagged', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!photosError && flaggedPhotos) {
        queueItems = flaggedPhotos.map((photo: any) => ({
          photo_id: photo.id,
          event_id: photo.event_id,
          flagged_by: null,
          flag_reason: photo.flag_reason,
          status: 'pending',
          created_at: photo.created_at,
          photo: {
            id: photo.id,
            filename: photo.filename,
            event: photo.events,
          },
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        items: queueItems,
        pagination: {
          limit,
          offset,
          total: queueItems.length,
        },
      },
    });
  } catch (err: any) {
    console.error('Moderation queue error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to load moderation queue',
      },
      { status: 500 }
    );
  }
}

