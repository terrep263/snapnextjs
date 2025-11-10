/**
 * ZIP Download Utility
 * Handles efficient creation and download of ZIP files with progress tracking,
 * error handling, and file size limitations
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Constants
const MAX_ZIP_SIZE = 500 * 1024 * 1024; // 500MB max zip size
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max per file
const FETCH_TIMEOUT = 30000; // 30 second timeout per file
const REQUEST_DELAY = 100; // Delay between requests to prevent rate limiting

interface DownloadItem {
  id: string;
  url: string;
  title?: string;
}

interface DownloadProgress {
  current: number;
  total: number;
  currentFile?: string;
}

interface DownloadOptions {
  filename?: string;
  onProgress?: (progress: DownloadProgress) => void;
  onError?: (error: Error, failedFile?: string) => void;
}

/**
 * Download a single file with timeout support
 * Uses server-side proxy to avoid CORS issues
 */
async function downloadFileWithTimeout(
  url: string,
  timeout: number = FETCH_TIMEOUT
): Promise<Blob> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Use server-side proxy to download
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${error.error || response.statusText}`);
    }

    const blob = await response.blob();

    // Check file size
    if (blob.size > MAX_FILE_SIZE) {
      throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    return blob;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Download timeout (${timeout / 1000}s)`);
    }
    throw error;
  }
}

/**
 * Create a filename safe for ZIP files
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces
    .substring(0, 200); // Limit length
}

/**
 * Create a ZIP file from multiple files
 */
export async function createZipFile(
  items: DownloadItem[],
  options: DownloadOptions = {}
): Promise<{ blob: Blob; size: number }> {
  const {
    filename = 'download',
    onProgress,
    onError,
  } = options;

  if (items.length === 0) {
    throw new Error('No items provided for download');
  }

  const zip = new JSZip();
  let totalSize = 0;
  const failedItems: string[] = [];

  try {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const sanitizedTitle = sanitizeFilename(item.title || `file-${i + 1}`);

      try {
        // Notify progress
        onProgress?.({
          current: i + 1,
          total: items.length,
          currentFile: item.title,
        });

        // Download file with timeout
        const blob = await downloadFileWithTimeout(item.url, FETCH_TIMEOUT);
        
        totalSize += blob.size;

        // Check total size
        if (totalSize > MAX_ZIP_SIZE) {
          throw new Error(
            `Total ZIP size would exceed ${MAX_ZIP_SIZE / 1024 / 1024}MB limit`
          );
        }

        // Add to ZIP
        zip.file(sanitizedTitle, blob);

        // Delay to prevent rate limiting
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to download ${item.title}:`, errorMessage);
        failedItems.push(item.title || `Item ${i + 1}`);
        onError?.(
          new Error(errorMessage),
          item.title
        );
      }
    }

    if (failedItems.length === items.length) {
      throw new Error('All items failed to download');
    }

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    return {
      blob: zipBlob,
      size: zipBlob.size,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create ZIP file');
  }
}

/**
 * Download a ZIP file
 */
export async function downloadZipFile(
  items: DownloadItem[],
  options: DownloadOptions = {}
): Promise<void> {
  const { filename = 'download', ...rest } = options;

  try {
    const { blob } = await createZipFile(items, { filename, ...rest });

    // Trigger download
    saveAs(blob, `${filename}.zip`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('ZIP download failed:', errorMessage);
    rest.onError?.(
      new Error(errorMessage)
    );
    throw error;
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate items before download
 */
export function validateDownloadItems(items: DownloadItem[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('No items selected for download');
  }

  if (items.length > 1000) {
    errors.push('Maximum 1000 files allowed per download');
  }

  items.forEach((item, index) => {
    if (!item.url) {
      errors.push(`Item ${index + 1}: Missing URL`);
    }
    if (!item.id) {
      errors.push(`Item ${index + 1}: Missing ID`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
