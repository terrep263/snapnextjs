/**
 * Download Utility Functions
 * Package type detection and watermark generation
 */

import sharp from 'sharp';
import { EventData, getPackageType } from './gallery-utils';
import { PackageType } from '@/components/Gallery/types';

// Re-export PackageType for backward compatibility
export type { PackageType };

/**
 * Detect package type from event data
 * Uses centralized getPackageType from gallery-utils
 * @deprecated Use getPackageType from gallery-utils instead
 */
export function detectPackageType(event: EventData): PackageType {
  return getPackageType(event);
}

/**
 * Determine if watermark should be applied
 */
export function shouldApplyWatermark(event: EventData, packageType: PackageType): boolean {
  if (packageType === 'freebie' || packageType === 'basic') {
    return true; // Always watermark for freebie and basic
  }
  if (packageType === 'premium') {
    return event.watermark_enabled === true; // Only if explicitly enabled
  }
  return false;
}

/**
 * Generate watermark SVG for Basic package
 * "shared by snapworxx.com" - 20-30px height, 70% opacity
 */
export function generateBasicWatermark(width: number): string {
  const bandHeight = Math.max(20, Math.min(30, Math.floor(width * 0.03)));
  const fontSize = Math.floor(bandHeight * 0.6);
  const padding = Math.floor(bandHeight * 0.3);

  return `
    <svg width="${width}" height="${bandHeight}">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.5"/>
        </filter>
      </defs>
      <rect 
        width="${width}" 
        height="${bandHeight}" 
        fill="black" 
        opacity="0.7"
      />
      <text 
        x="${width / 2}" 
        y="${bandHeight / 2 + fontSize / 3}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${fontSize}" 
        fill="white" 
        text-anchor="middle" 
        font-weight="500"
        filter="url(#shadow)"
      >
        shared by snapworxx.com
      </text>
    </svg>
  `;
}

/**
 * Generate watermark SVG for Freebie package
 * "snapworxx.com" - 40-50px height, 90% opacity
 */
export function generateFreebieWatermark(width: number): string {
  const bandHeight = Math.max(40, Math.min(50, Math.floor(width * 0.05)));
  const fontSize = Math.floor(bandHeight * 0.5);
  const padding = Math.floor(bandHeight * 0.2);

  return `
    <svg width="${width}" height="${bandHeight}">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.6"/>
        </filter>
      </defs>
      <rect 
        width="${width}" 
        height="${bandHeight}" 
        fill="black" 
        opacity="0.9"
      />
      <text 
        x="${width / 2}" 
        y="${bandHeight / 2 + fontSize / 3}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${fontSize}" 
        fill="white" 
        text-anchor="middle" 
        font-weight="bold"
        letter-spacing="1"
        filter="url(#shadow)"
      >
        snapworxx.com
      </text>
    </svg>
  `;
}

/**
 * Apply watermark to image buffer
 */
export async function applyWatermarkToImage(
  imageBuffer: Buffer,
  packageType: PackageType
): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1000;

    let watermarkSvg: string;
    if (packageType === 'freebie') {
      watermarkSvg = generateFreebieWatermark(width);
    } else {
      // Basic or Premium with watermark enabled
      watermarkSvg = generateBasicWatermark(width);
    }

    const watermarked = await image
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          gravity: 'south', // Bottom center
          blend: 'over',
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    return watermarked;
  } catch (error) {
    console.error('Error applying watermark:', error);
    throw new Error(`Failed to apply watermark: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Apply watermark to video (placeholder for future FFmpeg implementation)
 * For now, returns null - can be implemented with ffmpeg-static
 */
export async function applyWatermarkToVideo(
  videoBuffer: Buffer,
  packageType: PackageType
): Promise<Buffer | null> {
  // TODO: Implement FFmpeg-based video watermarking
  // This would use ffmpeg to burn in the watermark overlay
  // For now, return null to indicate video watermarking is not yet supported
  return null;
}

