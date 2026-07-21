import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { createBulkDownloadJob, processBulkDownloadJob } from '@/lib/bulk-download-job';
import ErrorLogger from '@/lib/errorLogger';
import { getPackageType } from '@/lib/gallery-utils';
import { verifyHostSession } from '@/lib/host-auth';
import { galleryClosed } from '@/lib/event-lifecycle';
import { verifyAdminSession } from '@/lib/admin-auth';

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

    const supabase = getServiceRoleClient();

    // Load event and verify it's Premium
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, slug, is_free, is_freebie, owner_email, feed_enabled, password_hash, payment_type, created_at, expires_at')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Lifecycle: closed once the post-expiry grace has elapsed (grandfathered
    // events and events without an expiry are unaffected).
    if (galleryClosed(event)) {
      return NextResponse.json(
        { success: false, error: 'This event has ended.' },
        { status: 403 }
      );
    }

    // Use centralized package detection
    const packageType = getPackageType(event);

    // Verify event is Premium (only Premium can bulk download)
    if (packageType !== 'premium') {
      return NextResponse.json(
        { success: false, error: 'Bulk download is only available for Premium events' },
        { status: 403 }
      );
    }

    // Authorize via the signed host (owner) session for this event, or an admin.
    const host = await verifyHostSession(eventId);
    const adminSession = await verifyAdminSession();
    const isAdmin = !!adminSession?.authenticated;

    if (!host && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only the event owner or an admin can download all photos' },
        { status: 403 }
      );
    }

    const jobEmail = host?.email || adminSession?.email || event.owner_email || 'owner';

    // Create bulk download job
    const job = createBulkDownloadJob(eventId, jobEmail, jobEmail);

    // Log audit action
    await ErrorLogger.log({
      errorType: 'BULK_DOWNLOAD_INITIATED',
      errorMessage: `Bulk download job created for event ${eventId}`,
      requestData: {
        eventId,
        eventName: event.name,
        userEmail: jobEmail,
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
