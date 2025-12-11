/**
 * Download Utility Functions
 * Package type detection and watermark generation
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
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
 * Always uses dlwatermark.png from public folder for all package types
 */
export async function applyWatermarkToImage(
  imageBuffer: Buffer,
  packageType: PackageType
): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    // Always use dlwatermark.png from public folder
    const watermarkPath = path.join(process.cwd(), 'public', 'dlwatermark.png');
    
    if (!fs.existsSync(watermarkPath)) {
      throw new Error(`Watermark file not found at ${watermarkPath}`);
    }

    // Load the watermark image
    const watermarkBuffer = fs.readFileSync(watermarkPath);
    const watermarkImage = sharp(watermarkBuffer);
    const watermarkMetadata = await watermarkImage.metadata();
    
    // Scale watermark to cover lower half of image (50-60% of image width)
    // This matches the example where watermark spans across the lower portion
    const watermarkWidth = Math.floor(width * 0.6);
    const watermarkHeight = watermarkMetadata.height && watermarkMetadata.width
      ? Math.floor((watermarkWidth / watermarkMetadata.width) * watermarkMetadata.height)
      : Math.floor(watermarkWidth * 0.15);
    
    // Resize watermark and apply transparency if needed
    const watermarkInput = await watermarkImage
      .resize(watermarkWidth, watermarkHeight, {
        fit: 'inside',
        withoutEnlargement: false, // Allow enlargement to match example
      })
      .png({ 
        quality: 100,
        compressionLevel: 9 
      })
      .toBuffer();

    // Apply watermark overlay across lower half
    // Position it in the lower center, covering more of the lower portion
    const watermarked = await image
      .composite([
        {
          input: watermarkInput,
          gravity: 'south', // Bottom center
          blend: 'over', // Overlay blend mode for transparency
          tile: false, // Single watermark, not tiled
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    console.log(`✅ Applied dlwatermark.png to image (${width}x${height}) - package: ${packageType}`);

    return watermarked;
  } catch (error) {
    console.error('Error applying watermark:', error);
    throw new Error(`Failed to apply watermark: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Apply watermark to video using FFmpeg
 * Uses dlwatermark.png for freebie events, SVG for basic/premium
 */
export async function applyWatermarkToVideo(
  videoBuffer: Buffer,
  packageType: PackageType
): Promise<Buffer | null> {
  try {
    const ffmpegStatic = require('ffmpeg-static');
    const ffmpegPath = typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.default || ffmpegStatic;
    
    if (!ffmpegPath) {
      console.warn('FFmpeg not available, video watermarking skipped');
      return null;
    }

    // Create temporary directory
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'video-watermark-'));
    const inputPath = path.join(tmpDir, `input-${uuidv4()}.mp4`);
    const outputPath = path.join(tmpDir, `output-${uuidv4()}.mp4`);
    let watermarkPath: string;

    try {
      // Write video buffer to temp file
      await fs.promises.writeFile(inputPath, videoBuffer);

      // Always use dlwatermark.png from public folder for all package types
      watermarkPath = path.join(process.cwd(), 'public', 'dlwatermark.png');
      
      if (!fs.existsSync(watermarkPath)) {
        console.warn(`Watermark file not found at ${watermarkPath}, video watermarking skipped`);
        return null;
      }

      // FFmpeg command to overlay watermark across lower half
      // Scale watermark to 60% of video width to match example (covers lower portion)
      const ffmpegArgs = [
        '-y', // Overwrite output file
        '-i', inputPath, // Input video
        '-i', watermarkPath, // Watermark image
        '-filter_complex',
        `[1:v]scale=iw*0.6:-1[wm];[0:v][wm]overlay=(W-w)/2:H-h-10:format=auto`, // Overlay at bottom center, larger size to cover lower half
        '-c:v', 'libx264', // Video codec
        '-preset', 'veryfast', // Encoding preset
        '-crf', '23', // Quality
        '-c:a', 'copy', // Copy audio
        outputPath, // Output file
      ];

      // Run FFmpeg
      await new Promise<void>((resolve, reject) => {
        const proc = spawn(ffmpegPath, ffmpegArgs, { stdio: 'pipe' });
        
        let stderr = '';
        proc.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
        
        proc.on('error', (err: Error) => {
          reject(new Error(`FFmpeg spawn error: ${err.message}`));
        });
        
        proc.on('exit', (code: number) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
          }
        });
      });

      // Read watermarked video
      const watermarkedBuffer = await fs.promises.readFile(outputPath);

      console.log(`✅ Applied dlwatermark.png to video - package: ${packageType}`);

      // Cleanup
      await fs.promises.rm(tmpDir, { recursive: true, force: true });

      return watermarkedBuffer;
    } catch (error) {
      // Cleanup on error
      try {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  } catch (error) {
    console.error('Error applying video watermark:', error);
    // Return null to indicate video watermarking failed, but don't throw
    // This allows the download endpoint to handle it gracefully
    return null;
  }
}

