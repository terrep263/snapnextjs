import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { createBulkDownloadJob, processBulkDownloadJob } from '@/lib/bulk-download-job';
import ErrorLogger from '@/lib/errorLogger';

// Force Node.js runtime for archiver compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/download/bulk
 * 
 * Initiate bulk download for Premium events
 * Verifies event is Premium and user is owner
 * Creates background job and returns job ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Get user email from request body or header
    const userEmail = body.userEmail || request.headers.get('x-user-email');
    
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Load event and verify it's Premium
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, is_free, is_freebie, owner_email, owner_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify event is Premium (is_free = false and not is_freebie)
    if (event.is_free === true || event.is_freebie === true) {
      return NextResponse.json(
        { success: false, error: 'Bulk download is only available for Premium events' },
        { status: 403 }
      );
    }

    // Verify user is the owner
    const isOwner = 
      event.owner_email?.toLowerCase() === userEmail.toLowerCase() ||
      event.owner_id === userEmail;

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Only the event owner can download all photos' },
        { status: 403 }
      );
    }

    // Create bulk download job
    const job = createBulkDownloadJob(eventId, userEmail, userEmail);

    // Log audit action
    await ErrorLogger.log({
      errorType: 'BULK_DOWNLOAD_INITIATED',
      errorMessage: `Bulk download job created for event ${eventId}`,
      requestData: {
        eventId,
        eventName: event.name,
        userEmail,
        jobId: job.id,
      },
      severity: 'info',
    });

    // Start processing in background (don't await)
    processBulkDownloadJob(job.id).catch((error) => {
      console.error(`Bulk download job ${job.id} failed:`, error);
      ErrorLogger.log({
        errorType: 'BULK_DOWNLOAD_JOB_FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        requestData: {
          jobId: job.id,
          eventId,
        },
        severity: 'high',
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        message: 'Bulk download job started. Check status endpoint for progress.',
      },
    });
  } catch (err: any) {
    console.error('Bulk download initiation error:', err);

    await ErrorLogger.log({
      errorType: 'BULK_DOWNLOAD_ERROR',
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
        error: err.message || 'Failed to initiate bulk download',
      },
      { status: 500 }
    );
  }
}

