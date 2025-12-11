import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { isAdminRequest, getAdminEmail, getUserEmail, ModerationAction } from '@/lib/moderation-utils';
import ErrorLogger from '@/lib/errorLogger';

/**
 * POST /api/moderation/photo/[photoId]
 * 
 * Moderation actions for photos:
 * - remove: Soft-delete (set is_approved = false)
 * - flag: Mark as flagged (set is_flagged = true)
 * - restore: Restore soft-deleted photo (set is_approved = true)
 * - hide: Hide from public view (set is_approved = false, owner action)
 * - unhide: Show hidden photo (set is_approved = true, owner action)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    const validActions: ModerationAction[] = ['remove', 'flag', 'restore', 'hide', 'unhide'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Load photo and event
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id, event_id, filename, is_approved, is_flagged')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, owner_email, owner_id')
      .eq('id', photo.event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = isAdminRequest(request);
    const adminEmail = isAdmin ? getAdminEmail(request) : null;
    const userEmail = getUserEmail(request);
    const isOwner = userEmail && (
      event.owner_email?.toLowerCase() === userEmail.toLowerCase() ||
      event.owner_id === userEmail
    );

    // Verify permissions based on action
    if (action === 'remove' || action === 'flag' || action === 'restore' || action === 'download_original') {
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    if (action === 'hide' || action === 'unhide') {
      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { success: false, error: 'Owner or admin access required' },
          { status: 403 }
        );
      }
    }

    // Perform action
    let updateData: Record<string, any> = {};
    let auditAction = action;

    switch (action) {
      case 'remove':
        updateData = { is_approved: false };
        auditAction = 'removed';
        break;
      case 'flag':
        updateData = { 
          is_flagged: true,
          flag_reason: reason || 'Flagged by admin',
        };
        auditAction = 'flagged';
        break;
      case 'restore':
        updateData = { 
          is_approved: true,
          is_flagged: false,
          flag_reason: null,
        };
        auditAction = 'restored';
        break;
      case 'hide':
        updateData = { is_approved: false };
        auditAction = 'hidden';
        break;
      case 'unhide':
        updateData = { is_approved: true };
        auditAction = 'unhidden';
        break;
    }

    // Update photo
    const { error: updateError } = await supabase
      .from('photos')
      .update(updateData)
      .eq('id', photoId);

    if (updateError) {
      throw new Error(`Failed to update photo: ${updateError.message}`);
    }

    // Log moderation action
    const actorEmail = isAdmin ? adminEmail : userEmail;
    const actorType = isAdmin ? 'admin' : 'owner';

    await ErrorLogger.log({
      errorType: 'MODERATION_ACTION',
      errorMessage: `Photo ${auditAction}: ${photoId}`,
      requestData: {
        photoId,
        eventId: photo.event_id,
        action: auditAction,
        reason: reason || null,
        actorType,
        actorEmail,
        photoFilename: photo.filename,
      },
      severity: 'info',
    });

    // If flagged, also create moderation queue entry
    if (action === 'flag') {
      try {
        await supabase
          .from('moderation_queue')
          .insert({
            photo_id: photoId,
            event_id: photo.event_id,
            flagged_by: actorEmail,
            flag_reason: reason || 'Flagged by admin',
            status: 'pending',
            created_at: new Date().toISOString(),
          });
      } catch (err) {
        // If table doesn't exist, just log warning
        console.warn('Moderation queue table may not exist:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        photoId,
        action: auditAction,
        message: `Photo ${auditAction} successfully`,
      },
    });
  } catch (err: any) {
    console.error('Moderation error:', err);

    await ErrorLogger.log({
      errorType: 'MODERATION_ERROR',
      errorMessage: err.message,
      stackTrace: err.stack,
      requestData: {
        url: request.url,
        method: request.method,
      },
      severity: 'high',
    });

    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Moderation action failed',
      },
      { status: 500 }
    );
  }
}

