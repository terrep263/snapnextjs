import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { Writable } from 'stream';

// Force Node.js runtime for archiver compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-side bulk ZIP download endpoint
 * Uses archiver for efficient streaming ZIP creation
 * Handles multiple file downloads with parallel fetching and creates ZIP on-the-fly
 */

interface DownloadRequest {
  filename: string;
  items: Array<{
    id: string;
    url: string;
    title?: string;
  }>;
}

const FETCH_TIMEOUT = 30000; // 30 seconds per file
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB per file
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB total
const MAX_PARALLEL_DOWNLOADS = 5; // Download 5 files at a time

async function downloadFileWithTimeout(url: string, timeout: number = FETCH_TIMEOUT): Promise<Buffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Validate URL is from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !url.startsWith(supabaseUrl)) {
      throw new Error('Invalid URL - must be from Supabase storage');
    }

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    return buffer;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout downloading file (${timeout / 1000}s)`);
    }
    throw error;
  }
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .substring(0, 200);
}

// Helper to download files in parallel with concurrency limit
async function downloadFilesInParallel<T>(
  items: T[],
  concurrency: number,
  downloadFn: (item: T, index: number) => Promise<{ buffer: Buffer; item: T }>
): Promise<Array<{ buffer: Buffer; item: T; index: number } | { error: string; item: T; index: number }>> {
  const results: Array<{ buffer: Buffer; item: T; index: number } | { error: string; item: T; index: number }> = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const index = i;

    const promise = downloadFn(item, index)
      .then((result) => {
        results[index] = { ...result, index };
      })
      .catch((error) => {
        results[index] = {
          error: error instanceof Error ? error.message : 'Unknown error',
          item,
          index
        };
      });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body: DownloadRequest = await request.json();
    const { filename = 'download', items = [] } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided for download' },
        { status: 400 }
      );
    }

    if (items.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 files allowed per download' },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting bulk ZIP creation for ${items.length} items with parallel downloads`);

    // Download all files in parallel with concurrency limit
    const downloadResults = await downloadFilesInParallel(
      items,
      MAX_PARALLEL_DOWNLOADS,
      async (item, index) => {
        console.log(`📦 Downloading: ${index + 1}/${items.length} - ${item.title}`);
        const buffer = await downloadFileWithTimeout(item.url);
        return { buffer, item };
      }
    );

    // Separate successful and failed downloads
    const successfulDownloads = downloadResults.filter(r => 'buffer' in r) as Array<{ buffer: Buffer; item: typeof items[0]; index: number }>;
    const failedDownloads = downloadResults.filter(r => 'error' in r) as Array<{ error: string; item: typeof items[0]; index: number }>;

    if (successfulDownloads.length === 0) {
      throw new Error('No items were successfully downloaded');
    }

    console.log(`✅ Downloaded ${successfulDownloads.length}/${items.length} items successfully`);
    if (failedDownloads.length > 0) {
      console.warn(`⚠️ Failed downloads:`, failedDownloads.map(f => `${f.item.title}: ${f.error}`));
    }

    // Check total size
    const totalSize = successfulDownloads.reduce((sum, d) => sum + d.buffer.length, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new Error(
        `Total ZIP size would exceed ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit (got ${Math.round(totalSize / 1024 / 1024)}MB)`
      );
    }

    // Create archive
    const chunks: Buffer[] = [];
    const archive = archiver('zip', {
      zlib: { level: 6 }, // Compression level 6 (good balance)
    });

    // Collect archive data
    const bufferStream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      }
    });

    archive.pipe(bufferStream);

    // Track archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });

    // Add all successfully downloaded files to archive
    for (const download of successfulDownloads) {
      const sanitizedTitle = sanitizeFilename(download.item.title || `file-${download.index + 1}`);
      archive.append(download.buffer, { name: sanitizedTitle });
    }

    // Add a manifest file listing failed downloads (if any)
    if (failedDownloads.length > 0) {
      const manifest = `Failed Downloads (${failedDownloads.length} files):\n\n` +
        failedDownloads.map(f => `- ${f.item.title || `file-${f.index + 1}`}: ${f.error}`).join('\n');
      archive.append(Buffer.from(manifest), { name: '_FAILED_DOWNLOADS.txt' });
    }

    // Finalize the archive and wait for completion
    await archive.finalize();

    // Wait for all data to be written
    await new Promise<void>((resolve, reject) => {
      bufferStream.on('finish', () => resolve());
      bufferStream.on('error', reject);
    });

    // Combine all chunks into single buffer
    const zipBuffer = Buffer.concat(chunks);

    console.log(`📦 ZIP file created: ${(zipBuffer.length / 1024 / 1024).toFixed(2)}MB`);

    // Return the ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(filename)}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
        'X-Downloaded-Files': successfulDownloads.length.toString(),
        'X-Failed-Files': failedDownloads.length.toString(),
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ ZIP endpoint error:', errorMsg);
    return NextResponse.json(
      { error: `Failed to create ZIP: ${errorMsg}` },
      { status: 500 }
    );
  }
}
