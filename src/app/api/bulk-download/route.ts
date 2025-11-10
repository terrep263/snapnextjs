import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { Readable } from 'stream';

/**
 * Server-side bulk ZIP download endpoint
 * Uses archiver for efficient streaming ZIP creation
 * Handles multiple file downloads and creates ZIP on-the-fly
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
const REQUEST_DELAY = 100; // Delay between requests
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB per file
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB total

async function downloadFileWithTimeout(url: string): Promise<Blob> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': '*/*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();

    if (blob.size > MAX_FILE_SIZE) {
      throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    return blob;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout downloading file (${FETCH_TIMEOUT / 1000}s)`);
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

    console.log(`🔄 Starting bulk ZIP creation for ${items.length} items`);

    // Create a TransformStream to handle the archive
    const { readable, writable } = new TransformStream();
    let totalSize = 0;
    let processedCount = 0;
    const failedItems: string[] = [];

    // Process archive in background
    (async () => {
      const archive = archiver('zip', {
        zlib: { level: 6 }, // Compression level 6 (good balance)
      });

      // Pipe archive to the writable side of our transform
      archive.pipe(writable as any);

      try {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const sanitizedTitle = sanitizeFilename(item.title || `file-${i + 1}`);

          try {
            console.log(`📦 Downloading: ${i + 1}/${items.length} - ${item.title}`);

            // Download file
            const blob = await downloadFileWithTimeout(item.url);

            totalSize += blob.size;

            if (totalSize > MAX_TOTAL_SIZE) {
              throw new Error(
                `Total ZIP size would exceed ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit`
              );
            }

            // Convert blob to buffer and add to archive
            const buffer = await blob.arrayBuffer();
            archive.append(Buffer.from(buffer), { name: sanitizedTitle });

            processedCount++;

            // Delay between requests to prevent rate limiting
            if (i < items.length - 1) {
              await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Failed to download ${item.title}:`, errorMsg);
            failedItems.push(item.title || `Item ${i + 1}`);
            // Continue with next item
          }
        }

        if (processedCount === 0) {
          throw new Error('No items were successfully downloaded');
        }

        console.log(`✅ Archive created: ${processedCount}/${items.length} items (${totalSize / 1024 / 1024}MB)`);
        if (failedItems.length > 0) {
          console.warn(`⚠️ Failed items: ${failedItems.join(', ')}`);
        }

        // Finalize the archive
        await archive.finalize();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Archive creation failed:', errorMsg);
        archive.abort();
        writable.abort();
      }
    })();

    // Return the readable stream as response
    return new NextResponse(readable as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(filename)}.zip"`,
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
