/**
 * Upload Utility Functions
 * File validation, magic byte detection, EXIF stripping, etc.
 */

import sharp from 'sharp';
import { GALLERY_MAX_PHOTO_SIZE, GALLERY_MAX_VIDEO_SIZE } from '@/config/constants';

// File type magic bytes (first few bytes of file)
const MAGIC_BYTES: Record<string, number[][]> = {
  // Images
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF...WEBP
  'image/heic': [
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], // ftyp heic
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], // ftyp heic (variant)
    [0x00, 0x00, 0x00, 0x24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], // ftyp heic (variant)
  ],
  // Videos
  'video/mp4': [
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d], // ftyp isom
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d], // ftyp isom (variant)
  ],
  'video/quicktime': [
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74], // ftyp qt
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74], // ftyp qt (variant)
  ],
  'video/hevc': [
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x76, 0x63], // ftyp hevc
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x76, 0x63], // ftyp hevc (variant)
  ],
};

/**
 * Detect file type from magic bytes
 */
export function detectFileTypeFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  for (const [mimeType, patterns] of Object.entries(MAGIC_BYTES)) {
    for (const pattern of patterns) {
      if (pattern.length <= buffer.length) {
        let matches = true;
        for (let i = 0; i < pattern.length; i++) {
          if (buffer[i] !== pattern[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          return mimeType;
        }
      }
    }
  }

  return null;
}

/**
 * Validate file type and size
 */
export function validateFile(
  buffer: Buffer,
  filename: string,
  declaredMimeType?: string
): { valid: boolean; error?: string; detectedType?: string } {
  // Detect from magic bytes
  const detectedType = detectFileTypeFromMagicBytes(buffer);
  
  // If we have a declared type, verify it matches
  if (declaredMimeType && detectedType && declaredMimeType !== detectedType) {
    // Allow some flexibility (e.g., quicktime vs mov)
    const isCompatible =
      (declaredMimeType === 'video/mov' && detectedType === 'video/quicktime') ||
      (declaredMimeType === 'video/quicktime' && detectedType === 'video/mov');
    
    if (!isCompatible) {
      return {
        valid: false,
        error: `File type mismatch. Declared: ${declaredMimeType}, Detected: ${detectedType}`,
        detectedType,
      };
    }
  }

  const fileType = detectedType || declaredMimeType;
  if (!fileType) {
    return {
      valid: false,
      error: 'Unable to detect file type. Please ensure the file is a valid image or video.',
    };
  }

  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'Unsupported file type. Accepted: JPEG, PNG, HEIC, WebP (images) or MP4, MOV, HEVC (videos).',
      detectedType: fileType,
    };
  }

  const fileSize = buffer.length;

  if (isImage && fileSize > GALLERY_MAX_PHOTO_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${GALLERY_MAX_PHOTO_SIZE / 1024 / 1024}MB per photo.`,
      detectedType: fileType,
    };
  }

  if (isVideo && fileSize > GALLERY_MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${GALLERY_MAX_VIDEO_SIZE / 1024 / 1024}MB per video.`,
      detectedType: fileType,
    };
  }

  return {
    valid: true,
    detectedType: fileType,
  };
}

/**
 * Strip EXIF data from image and return clean buffer
 */
export async function stripExifData(buffer: Buffer): Promise<Buffer> {
  try {
    // Use Sharp to strip EXIF and other metadata
    const cleaned = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF, then strip
      .toBuffer();
    return cleaned;
  } catch (error) {
    console.warn('Failed to strip EXIF data, using original:', error);
    return buffer; // Return original if processing fails
  }
}

/**
 * Generate thumbnail for image
 */
export async function generateImageThumbnail(
  buffer: Buffer,
  size: number = 400
): Promise<Buffer> {
  try {
    const thumbnail = await sharp(buffer)
      .resize(size, size, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    return thumbnail;
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate video thumbnail (poster frame)
 * Note: This requires ffmpeg, which may not be available in all environments
 * For now, we'll return null and handle video thumbnails client-side or via a separate service
 */
export async function generateVideoThumbnail(
  buffer: Buffer,
  size: number = 400
): Promise<Buffer | null> {
  // Video thumbnail generation requires ffmpeg
  // For now, return null - can be implemented later with ffmpeg-static
  // or handled via a separate video processing service
  return null;
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    return null;
  }
}

