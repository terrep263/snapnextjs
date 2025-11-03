// Utility for handling large file uploads with chunking
export class ChunkedUploader {
  private chunkSize: number;
  private maxRetries: number;
  
  constructor(chunkSize = 2 * 1024 * 1024, maxRetries = 5) { // 2MB chunks for better mobile reliability
    this.chunkSize = chunkSize;
    this.maxRetries = maxRetries;
  }

  async uploadFile(
    file: File, 
    uploadPath: string, 
    supabaseClient: any,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string; url?: string }> {
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    let uploadedBytes = 0;
    
    try {
      // For files smaller than chunk size, use direct upload
      if (file.size <= this.chunkSize) {
        const { data, error } = await supabaseClient.storage
          .from('photos')
          .upload(uploadPath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabaseClient.storage
          .from('photos')
          .getPublicUrl(uploadPath);
          
        return { success: true, url: publicUrl };
      }

      // For larger files, use chunked upload approach
      const chunks: Blob[] = [];
      
      // Split file into chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * this.chunkSize;
        const end = Math.min(start + this.chunkSize, file.size);
        chunks.push(file.slice(start, end));
      }

      // Upload each chunk with retry logic
      const uploadedChunks: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkPath = `${uploadPath}.part${i.toString().padStart(3, '0')}`;
        let success = false;
        let retries = 0;

        while (!success && retries < this.maxRetries) {
          try {
            const { data, error } = await supabaseClient.storage
              .from('photos')
              .upload(chunkPath, chunks[i], {
                cacheControl: '3600',
                upsert: true // Allow overwrite for retries
              });
              
            if (error) throw error;
            
            uploadedChunks.push(chunkPath);
            uploadedBytes += chunks[i].size;
            success = true;
            
            // Report progress
            if (onProgress) {
              onProgress((uploadedBytes / file.size) * 100);
            }
            
          } catch (error) {
            retries++;
            console.warn(`Chunk ${i} upload failed, retry ${retries}/${this.maxRetries}`);
            
            if (retries >= this.maxRetries) {
              // Clean up partial uploads
              await this.cleanupChunks(supabaseClient, uploadedChunks);
              throw new Error(`Failed to upload chunk ${i} after ${this.maxRetries} retries`);
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
      }

      // All chunks uploaded successfully
      // For now, we'll keep chunks separate and create a reference file
      const chunkInfo = {
        originalName: file.name,
        originalSize: file.size,
        mimeType: file.type,
        chunks: uploadedChunks,
        totalChunks: chunks.length,
        uploadedAt: new Date().toISOString()
      };

      // Create metadata file
      const metadataPath = `${uploadPath}.metadata`;
      const metadataBlob = new Blob([JSON.stringify(chunkInfo)], { type: 'application/json' });
      
      const { error: metadataError } = await supabaseClient.storage
        .from('photos')
        .upload(metadataPath, metadataBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (metadataError) {
        await this.cleanupChunks(supabaseClient, uploadedChunks);
        throw metadataError;
      }

      // Return the metadata file URL as the reference
      const { data: { publicUrl } } = supabaseClient.storage
        .from('photos')
        .getPublicUrl(metadataPath);

      return { success: true, url: publicUrl };
      
    } catch (error) {
      console.error('Chunked upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  private async cleanupChunks(supabaseClient: any, chunkPaths: string[]) {
    try {
      if (chunkPaths.length > 0) {
        await supabaseClient.storage
          .from('photos')
          .remove(chunkPaths);
      }
    } catch (error) {
      console.warn('Failed to cleanup chunks:', error);
    }
  }

  // Utility to reconstruct file from chunks (for download)
  async downloadChunkedFile(metadataUrl: string, supabaseClient: any): Promise<Blob | null> {
    try {
      // Extract path from URL and fetch metadata
      const metadataPath = metadataUrl.split('/storage/v1/object/public/photos/')[1];
      
      const { data: metadataBlob, error } = await supabaseClient.storage
        .from('photos')
        .download(metadataPath);

      if (error) throw error;

      const metadataText = await metadataBlob.text();
      const metadata = JSON.parse(metadataText);

      // Download all chunks
      const chunkBlobs: Blob[] = [];
      
      for (const chunkPath of metadata.chunks) {
        const { data: chunkBlob, error: chunkError } = await supabaseClient.storage
          .from('photos')
          .download(chunkPath);
          
        if (chunkError) throw chunkError;
        chunkBlobs.push(chunkBlob);
      }

      // Combine chunks back into original file
      return new Blob(chunkBlobs, { type: metadata.mimeType });
      
    } catch (error) {
      console.error('Failed to download chunked file:', error);
      return null;
    }
  }

  // Check if URL represents a chunked file
  static isChunkedFile(url: string): boolean {
    return url.includes('.metadata');
  }
}