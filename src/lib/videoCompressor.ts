// Client-side video compression utility
export class VideoCompressor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async compressVideo(
    file: File, 
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      maxSizeMB?: number;
    } = {}
  ): Promise<{ success: boolean; file?: File; error?: string; compressionRatio?: number }> {
    const { 
      maxWidth = 1920, 
      maxHeight = 1080, 
      quality = 0.8,
      maxSizeMB = 50 
    } = options;

    try {
      // For very basic compression, we'll focus on images first
      // Full video compression requires more complex libraries
      if (file.type.startsWith('image/')) {
        return await this.compressImage(file, { maxWidth, maxHeight, quality, maxSizeMB });
      }

      // For videos, we'll provide size estimation and recommendations
      const sizeMB = file.size / (1024 * 1024);
      
      if (sizeMB <= maxSizeMB) {
        return { success: true, file, compressionRatio: 1 };
      }

      // Estimate what compression ratio would be needed
      const targetRatio = maxSizeMB / sizeMB;
      
      return {
        success: false,
        error: `Video is ${sizeMB.toFixed(1)}MB. Consider using video compression software to reduce to ${maxSizeMB}MB or less. Target compression: ${(targetRatio * 100).toFixed(0)}%`
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Compression failed'
      };
    }
  }

  private async compressImage(
    file: File,
    options: { maxWidth: number; maxHeight: number; quality: number; maxSizeMB: number }
  ): Promise<{ success: boolean; file?: File; error?: string; compressionRatio?: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            options.maxWidth, 
            options.maxHeight
          );

          this.canvas.width = width;
          this.canvas.height = height;

          // Draw and compress
          this.ctx.drawImage(img, 0, 0, width, height);
          
          this.canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ success: false, error: 'Failed to create compressed blob' });
                return;
              }

              const originalSize = file.size;
              const compressedSize = blob.size;
              const compressionRatio = compressedSize / originalSize;

              // Check if we achieved target size
              const sizeMB = compressedSize / (1024 * 1024);
              
              if (sizeMB <= options.maxSizeMB) {
                const compressedFile = new File([blob], file.name, {
                  type: blob.type,
                  lastModified: Date.now()
                });

                resolve({
                  success: true,
                  file: compressedFile,
                  compressionRatio
                });
              } else {
                resolve({
                  success: false,
                  error: `Compressed size (${sizeMB.toFixed(1)}MB) still exceeds limit (${options.maxSizeMB}MB)`
                });
              }
            },
            file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            options.quality
          );
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Image processing failed'
          });
        }
      };

      img.onerror = () => {
        resolve({ success: false, error: 'Failed to load image' });
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Scale down if needed
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // Estimate video compression possibilities
  static getVideoCompressionRecommendations(file: File): {
    currentSizeMB: number;
    recommendations: Array<{
      method: string;
      description: string;
      expectedSizeMB: string;
      tools: string[];
    }>;
  } {
    const currentSizeMB = file.size / (1024 * 1024);
    
    return {
      currentSizeMB: Math.round(currentSizeMB * 10) / 10,
      recommendations: [
        {
          method: 'Resolution Reduction',
          description: 'Reduce video resolution (1080p → 720p → 480p)',
          expectedSizeMB: `${Math.round(currentSizeMB * 0.5 * 10) / 10} - ${Math.round(currentSizeMB * 0.7 * 10) / 10}`,
          tools: ['HandBrake', 'VLC Media Player', 'Online video compressors']
        },
        {
          method: 'Bitrate Compression',
          description: 'Lower video quality/bitrate while keeping resolution',
          expectedSizeMB: `${Math.round(currentSizeMB * 0.3 * 10) / 10} - ${Math.round(currentSizeMB * 0.6 * 10) / 10}`,
          tools: ['FFmpeg', 'HandBrake', 'Adobe Media Encoder']
        },
        {
          method: 'Length Trimming',
          description: 'Cut video to essential moments only',
          expectedSizeMB: 'Proportional to length reduction',
          tools: ['Built-in phone editors', 'iMovie', 'Windows Video Editor']
        },
        {
          method: 'Format Change',
          description: 'Convert to more efficient codec (H.264, H.265)',
          expectedSizeMB: `${Math.round(currentSizeMB * 0.4 * 10) / 10} - ${Math.round(currentSizeMB * 0.8 * 10) / 10}`,
          tools: ['HandBrake', 'FFmpeg', 'VLC Media Player']
        }
      ]
    };
  }
}