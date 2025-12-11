/**
 * Bulk Download Job Manager
 * Handles background ZIP generation for Premium events
 */

import { getServiceRoleClient, getPhotoPublicUrl } from '@/lib/supabase';
import archiver from 'archiver';
import { Writable } from 'stream';

export interface BulkDownloadJob {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress: number;
  totalFiles: number;
  processedFiles: number;
  downloadUrls: string[];
  zipPaths: string[];
  error?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
}

const MAX_ZIP_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB per ZIP
const JOB_EXPIRY_HOURS = 48;
const DOWNLOAD_URL_EXPIRY_HOURS = 24;

// In-memory job store (in production, use Redis or database)
const jobStore = new Map<string, BulkDownloadJob>();

/**
 * Create a new bulk download job
 */
export function createBulkDownloadJob(
  eventId: string,
  userId: string,
  userEmail: string
): BulkDownloadJob {
  const jobId = `bulk-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + JOB_EXPIRY_HOURS * 60 * 60 * 1000);

  const job: BulkDownloadJob = {
    id: jobId,
    eventId,
    userId,
    userEmail,
    status: 'pending',
    progress: 0,
    totalFiles: 0,
    processedFiles: 0,
    downloadUrls: [],
    zipPaths: [],
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  jobStore.set(jobId, job);
  return job;
}

/**
 * Get job by ID
 */
export function getJob(jobId: string): BulkDownloadJob | null {
  return jobStore.get(jobId) || null;
}

/**
 * Update job status
 */
export function updateJob(
  jobId: string,
  updates: Partial<BulkDownloadJob>
): BulkDownloadJob | null {
  const job = jobStore.get(jobId);
  if (!job) return null;

  const updated = { ...job, ...updates };
  jobStore.set(jobId, updated);
  return updated;
}

/**
 * Process bulk download job (background task)
 */
export async function processBulkDownloadJob(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status !== 'pending') {
    throw new Error(`Job is not in pending state: ${job.status}`);
  }

  updateJob(jobId, { status: 'processing', progress: 0 });

  try {
    const supabase = getServiceRoleClient();

    // Load all photos for the event
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, filename, file_path, storage_url, url, size, is_video')
      .eq('event_id', job.eventId)
      .order('created_at', { ascending: true });

    if (photosError) {
      throw new Error(`Failed to load photos: ${photosError.message}`);
    }

    if (!photos || photos.length === 0) {
      updateJob(jobId, {
        status: 'complete',
        progress: 100,
        totalFiles: 0,
        processedFiles: 0,
        downloadUrls: [],
        zipPaths: [],
        completedAt: new Date().toISOString(),
      });
      return;
    }

    updateJob(jobId, { totalFiles: photos.length });

    // Group photos into ZIP files (max 2GB each)
    type PhotoType = typeof photos[0];
    const zipGroups: PhotoType[][] = [];
    let currentGroup: PhotoType[] = [];
    let currentGroupSize = 0;

    for (const photo of photos) {
      const fileSize = photo.size || 0;
      
      if (currentGroupSize + fileSize > MAX_ZIP_SIZE && currentGroup.length > 0) {
        zipGroups.push(currentGroup);
        currentGroup = [photo];
        currentGroupSize = fileSize;
      } else {
        currentGroup.push(photo);
        currentGroupSize += fileSize;
      }
    }

    if (currentGroup.length > 0) {
      zipGroups.push(currentGroup);
    }

    // Process each ZIP group
    const zipPaths: string[] = [];
    let processedFiles = 0;

    for (let zipIndex = 0; zipIndex < zipGroups.length; zipIndex++) {
      const group = zipGroups[zipIndex];
      const zipFilename = `bulk-${job.eventId}-${zipIndex + 1}-of-${zipGroups.length}.zip`;
      const zipPath = `bulk-downloads/${job.eventId}/${zipFilename}`;

      updateJob(jobId, {
        progress: Math.floor((zipIndex / zipGroups.length) * 90),
        processedFiles,
      });

      // Create ZIP archive
      const zipBuffer = await createZipArchive(group, supabase, (progress) => {
        const fileProgress = Math.floor((progress / group.length) * 100);
        const overallProgress = Math.floor(
          ((zipIndex / zipGroups.length) * 90) + (fileProgress / zipGroups.length * 0.9)
        );
        updateJob(jobId, {
          progress: overallProgress,
          processedFiles: processedFiles + Math.floor(progress),
        });
      });

      // Upload ZIP to storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(zipPath, zipBuffer, {
          cacheControl: '3600',
          contentType: 'application/zip',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload ZIP: ${uploadError.message}`);
      }

      zipPaths.push(zipPath);
      processedFiles += group.length;
    }

    // Generate signed URLs for all ZIPs
    const downloadUrls: string[] = [];
    const expiresIn = DOWNLOAD_URL_EXPIRY_HOURS * 60 * 60; // 24 hours in seconds

    for (const zipPath of zipPaths) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('photos')
        .createSignedUrl(zipPath, expiresIn);

      if (signedUrlError || !signedUrlData) {
        console.warn(`Failed to create signed URL for ${zipPath}:`, signedUrlError);
        continue;
      }

      downloadUrls.push(signedUrlData.signedUrl);
    }

    // Mark job as complete
    updateJob(jobId, {
      status: 'complete',
      progress: 100,
      processedFiles,
      downloadUrls,
      zipPaths,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateJob(jobId, {
      status: 'failed',
      error: errorMessage,
      completedAt: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Create ZIP archive from photos
 */
async function createZipArchive(
  photos: Array<{
    id: string;
    filename: string;
    file_path?: string | null;
    storage_url?: string | null;
    url?: string | null;
    size?: number | null;
    is_video?: boolean | null;
  }>,
  supabase: any,
  onProgress?: (processed: number) => void
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const archive = archiver('zip', {
    zlib: { level: 6 },
  });

  const bufferStream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });

  archive.pipe(bufferStream);

  let processed = 0;

  // Download and add files to archive
  for (const photo of photos) {
    try {
      const filePath = photo.file_path || photo.storage_url || photo.url;
      if (!filePath) {
        console.warn(`Skipping photo ${photo.id}: no file path`);
        continue;
      }

      // Extract path from URL if needed
      let storagePath = filePath;
      if (filePath.startsWith('http')) {
        const match = filePath.match(/\/photos\/(.+)$/);
        if (match) {
          storagePath = match[1];
        }
      }

      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('photos')
        .download(storagePath);

      if (downloadError || !fileData) {
        console.warn(`Failed to download ${photo.filename}:`, downloadError);
        continue;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Sanitize filename
      const sanitizedFilename = sanitizeFilename(photo.filename || `file-${photo.id}`);

      // Add to archive
      archive.append(buffer, { name: sanitizedFilename });
      processed++;

      if (onProgress) {
        onProgress(processed);
      }
    } catch (error) {
      console.error(`Error processing photo ${photo.id}:`, error);
      // Continue with next photo
    }
  }

  // Finalize archive
  await archive.finalize();

  // Wait for all data to be written
  await new Promise<void>((resolve, reject) => {
    bufferStream.on('finish', () => resolve());
    bufferStream.on('error', reject);
  });

  return Buffer.concat(chunks);
}

/**
 * Sanitize filename for ZIP
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .substring(0, 200);
}

/**
 * Clean up expired jobs and ZIP files
 */
export async function cleanupExpiredJobs(): Promise<void> {
  const now = new Date();
  const supabase = getServiceRoleClient();

  for (const [jobId, job] of jobStore.entries()) {
    const expiresAt = new Date(job.expiresAt);
    
    if (now > expiresAt) {
      // Delete ZIP files from storage
      if (job.zipPaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('photos')
          .remove(job.zipPaths);

        if (deleteError) {
          console.error(`Failed to delete ZIP files for job ${jobId}:`, deleteError);
        }
      }

      // Remove job from store
      jobStore.delete(jobId);
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredJobs().catch(console.error);
  }, 60 * 60 * 1000);
}

