// Utility for handling large file uploads with retry logic
// NOTE: Renamed from "ChunkedUploader" but now uses direct upload with retries
// for better reliability. Supabase handles large files well without chunking.
export class ChunkedUploader {
  private maxRetries: number;

  constructor(chunkSize = 2 * 1024 * 1024, maxRetries = 5) {
    this.maxRetries = maxRetries;
    // chunkSize parameter kept for backwards compatibility but not used
  }

  async uploadFile(
    file: File,
    uploadPath: string,
    supabaseClient: any,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string; url?: string }> {
    // Determine correct MIME type upfront
    let mimeType = file.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const mimeMap: Record<string, string> = {
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
        'webm': 'video/webm',
        'flv': 'video/x-flv',
        'wmv': 'video/x-ms-wmv',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'wav': 'audio/wav',
        'mp3': 'audio/mpeg',
        'aac': 'audio/aac',
        'ogg': 'audio/ogg',
        'flac': 'audio/flac'
      };
      if (ext && mimeMap[ext]) {
        mimeType = mimeMap[ext];
      } else {
        mimeType = file.name.match(/\.(mp4|mov|avi|quicktime|mkv|flv|wmv|webm)$/i) ? 'video/mp4' : 'application/octet-stream';
      }
    }

    console.log(`📤 Starting reliable upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, MIME: ${mimeType})`);

    try {
      // Upload file directly with retry logic and exponential backoff
      let retries = 0;
      let uploadSuccess = false;
      let lastError: any = null;

      // Create a blob with explicit MIME type
      const blob = new Blob([file], { type: mimeType });

      while (!uploadSuccess && retries < this.maxRetries) {
        try {
          console.log(`🔄 Upload attempt ${retries + 1}/${this.maxRetries} for ${file.name}`);

          // Update progress during attempt
          if (onProgress) {
            onProgress(10 + (retries * 10));
          }

          const { data, error } = await supabaseClient.storage
            .from('photos')
            .upload(uploadPath, blob, {
              cacheControl: '3600',
              upsert: retries > 0, // Allow overwrite on retry attempts
              contentType: mimeType
            });

          if (error) {
            throw error;
          }

          uploadSuccess = true;
          if (onProgress) {
            onProgress(100);
          }

          const { data: { publicUrl } } = supabaseClient.storage
            .from('photos')
            .getPublicUrl(uploadPath);

          console.log(`✅ Upload completed successfully: ${file.name}`);
          return { success: true, url: publicUrl };

        } catch (error) {
          lastError = error;
          retries++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`❌ Upload attempt ${retries}/${this.maxRetries} failed: ${errorMessage}`);

          if (retries < this.maxRetries) {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            const waitTime = 1000 * Math.pow(2, retries - 1);
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      // All retries failed
      const errorMessage = lastError instanceof Error ? lastError.message : 'Upload failed after multiple retries';
      console.error(`❌ Upload failed after ${this.maxRetries} attempts: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
      };

    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Download file (for backwards compatibility)
   */
  async downloadChunkedFile(url: string, supabaseClient: any): Promise<Blob | null> {
    try {
      // Extract path from URL
      const urlParts = url.split('/storage/v1/object/public/photos/');
      if (urlParts.length < 2) {
        console.error('Invalid URL format');
        return null;
      }

      const filePath = urlParts[1];

      const { data, error } = await supabaseClient.storage
        .from('photos')
        .download(filePath);

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Failed to download file:', error);
      return null;
    }
  }

  /**
   * Check if URL represents a chunked file (deprecated, always returns false now)
   */
  static isChunkedFile(url: string): boolean {
    return false; // No longer using chunked uploads
  }
}
