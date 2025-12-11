/**
 * Security Utilities
 * Centralized security checks and validations
 */

import { getServiceRoleClient } from './supabase';
import { GALLERY_MAX_PHOTO_SIZE, GALLERY_MAX_VIDEO_SIZE } from '@/config/constants';

/**
 * Verify that Basic/Freebie packages never expose original file URLs
 */
export function shouldUseSignedUrl(
  packageType: 'freebie' | 'basic' | 'premium',
  watermarkEnabled?: boolean
): boolean {
  // Basic and Freebie always need signed URLs (watermarked versions)
  if (packageType === 'basic' || packageType === 'freebie') {
    return true;
  }

  // Premium with watermark enabled also needs signed URLs
  if (packageType === 'premium' && watermarkEnabled) {
    return true;
  }

  // Premium without watermark can use public URLs (but still signed for security)
  return true; // Always use signed URLs for security
}

/**
 * Validate file type server-side (additional check)
 */
export function validateFileTypeServerSide(
  mimeType: string,
  filename: string
): { valid: boolean; error?: string } {
  const allowedImages = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
  const allowedVideos = ['video/mp4', 'video/quicktime', 'video/mov', 'video/hevc'];

  const isImage = allowedImages.includes(mimeType.toLowerCase());
  const isVideo = allowedVideos.includes(mimeType.toLowerCase());

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: `Unsupported file type: ${mimeType}. Allowed: ${allowedImages.join(', ')}, ${allowedVideos.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size server-side
 */
export function validateFileSizeServerSide(
  size: number,
  mimeType: string
): { valid: boolean; error?: string } {
  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');

  if (isImage && size > GALLERY_MAX_PHOTO_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${GALLERY_MAX_PHOTO_SIZE / 1024 / 1024}MB per photo.`,
    };
  }

  if (isVideo && size > GALLERY_MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${GALLERY_MAX_VIDEO_SIZE / 1024 / 1024}MB per video.`,
    };
  }

  return { valid: true };
}

/**
 * Generate secure signed URL with expiration
 */
export async function generateSecureSignedUrl(
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.storage
      .from('photos')
      .createSignedUrl(filePath, expiresIn);

    if (error || !data) {
      console.error('Failed to generate signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

