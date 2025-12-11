import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/bulk-download-job';

/**
 * GET /api/download/bulk/status/[jobId]
 * 
 * Get status of bulk download job
 * Returns job status, progress, and download URLs when complete
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status: job.status,
        progress: job.progress,
        totalFiles: job.totalFiles,
        processedFiles: job.processedFiles,
        downloadUrls: job.downloadUrls,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        expiresAt: job.expiresAt,
      },
    });
  } catch (err: any) {
    console.error('Job status error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to get job status',
      },
      { status: 500 }
    );
  }
}

