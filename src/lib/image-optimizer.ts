/**
 * Image Optimization Utilities
 * Handles image resizing, WebP conversion, and multiple size generation
 */

import sharp from 'sharp';
import { getServiceRoleClient } from './supabase';

export interface ImageSizes {
  thumbnail: { width: number; height: number }; // 400x400
  small: { width: number; height: number }; // 800x800
  medium: { width: number; height: number }; // 1200x1200
  large: { width: number; height: number }; // 1920x1920
  original: { width: number; height: number };
}

/**
 * Generate optimized image variants
 */
export async function generateImageVariants(
  imageBuffer: Buffer,
  basePath: string,
  eventId: string
): Promise<{
  thumbnail: string;
  small?: string;
  medium?: string;
  large?: string;
  original: string;
  dimensions: { width: number; height: number };
}> {
  const supabase = getServiceRoleClient();
  const metadata = await sharp(imageBuffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // Generate thumbnail (always)
  const thumbnailBuffer = await sharp(imageBuffer)
    .resize(400, 400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();

  const thumbnailPath = `${eventId}/thumbnails/${basePath.replace(/\.[^.]+$/, '.webp')}`;
  await supabase.storage
    .from('photos')
    .upload(thumbnailPath, thumbnailBuffer, {
      cacheControl: '31536000', // 1 year
      contentType: 'image/webp',
      upsert: true,
    });

  // Generate small variant (if original is larger)
  let smallPath: string | undefined;
  if (originalWidth > 800 || originalHeight > 800) {
    const smallBuffer = await sharp(imageBuffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    smallPath = `${eventId}/small/${basePath.replace(/\.[^.]+$/, '.webp')}`;
    await supabase.storage
      .from('photos')
      .upload(smallPath, smallBuffer, {
        cacheControl: '31536000',
        contentType: 'image/webp',
        upsert: true,
      });
  }

  // Generate medium variant (if original is larger)
  let mediumPath: string | undefined;
  if (originalWidth > 1200 || originalHeight > 1200) {
    const mediumBuffer = await sharp(imageBuffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 90 })
      .toBuffer();

    mediumPath = `${eventId}/medium/${basePath.replace(/\.[^.]+$/, '.webp')}`;
    await supabase.storage
      .from('photos')
      .upload(mediumPath, mediumBuffer, {
        cacheControl: '31536000',
        contentType: 'image/webp',
        upsert: true,
      });
  }

  // Generate large variant (if original is larger)
  let largePath: string | undefined;
  if (originalWidth > 1920 || originalHeight > 1920) {
    const largeBuffer = await sharp(imageBuffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 92 })
      .toBuffer();

    largePath = `${eventId}/large/${basePath.replace(/\.[^.]+$/, '.jpg')}`;
    await supabase.storage
      .from('photos')
      .upload(largePath, largeBuffer, {
        cacheControl: '31536000',
        contentType: 'image/jpeg',
        upsert: true,
      });
  }

  return {
    thumbnail: thumbnailPath,
    small: smallPath,
    medium: mediumPath,
    large: largePath,
    original: basePath,
    dimensions: {
      width: originalWidth,
      height: originalHeight,
    },
  };
}

/**
 * Get optimized image URL based on viewport size
 */
export function getOptimizedImageUrl(
  baseUrl: string,
  viewportWidth: number,
  sizes?: { small?: string; medium?: string; large?: string }
): string {
  // Use appropriate size based on viewport
  if (viewportWidth <= 640 && sizes?.small) {
    return sizes.small;
  }
  if (viewportWidth <= 1024 && sizes?.medium) {
    return sizes.medium;
  }
  if (viewportWidth <= 1920 && sizes?.large) {
    return sizes.large;
  }
  return baseUrl;
}

