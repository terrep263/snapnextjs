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
 * Rules:
 * - Freebie: Always watermark (watermark_enabled is always true for freebie)
 * - Basic: No watermark (watermark_enabled is false)
 * - Premium: Watermark only if watermark_enabled is explicitly true
 */
export function shouldApplyWatermark(event: EventData, packageType: PackageType): boolean {
  if (packageType === 'freebie') {
    return true; // Freebie always has watermark_enabled
  }
  if (packageType === 'basic') {
    return false; // Basic never has watermark
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
    console.log(`🖼️ Starting image watermarking - package: ${packageType}, input size: ${imageBuffer.length} bytes`);
    
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;
    
    console.log(`📐 Image dimensions: ${width}x${height}`);

    // Always use dlwatermark.png from public folder
    let watermarkPath = path.join(process.cwd(), 'public', 'dlwatermark.png');
    
    console.log(`🔍 Checking watermark at: ${watermarkPath}`);
    console.log(`🔍 CWD: ${process.cwd()}`);
    console.log(`🔍 Public dir exists: ${fs.existsSync(path.join(process.cwd(), 'public'))}`);
    
    if (!fs.existsSync(watermarkPath)) {
      // Try alternative paths
      const altPaths = [
        path.join(process.cwd(), 'public', 'dlwatermark.png'),
        path.join(__dirname, '..', '..', 'public', 'dlwatermark.png'),
        path.join(process.cwd(), 'dlwatermark.png'),
      ];
      
      let found = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log(`✅ Found watermark at alternative path: ${altPath}`);
          watermarkPath = altPath;
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.error(`❌ Watermark file not found in any location`);
        throw new Error(`Watermark file not found at ${watermarkPath}`);
      }
    } else {
      console.log(`✅ Watermark file found at: ${watermarkPath}`);
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
    console.log(`🎨 Applying watermark overlay (${watermarkWidth}x${watermarkHeight}) at bottom center`);
    
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

    console.log(`✅ Successfully applied dlwatermark.png to image (${width}x${height}) - package: ${packageType}`);
    console.log(`📊 Output size: ${watermarked.length} bytes (input: ${imageBuffer.length} bytes)`);

    return watermarked;
  } catch (error) {
    console.error('Error applying watermark:', error);
    throw new Error(`Failed to apply watermark: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Apply watermark to video using FFmpeg
 * Always uses dlwatermark.png from public folder for all package types
 */
export async function applyWatermarkToVideo(
  videoBuffer: Buffer,
  packageType: PackageType
): Promise<Buffer | null> {
  try {
    // Try to load ffmpeg-static
    let ffmpegPath: string | null = null;
    try {
      const ffmpegStatic = require('ffmpeg-static');
      ffmpegPath = typeof ffmpegStatic === 'string' 
        ? ffmpegStatic 
        : ffmpegStatic?.default || ffmpegStatic || null;
    } catch (requireError) {
      console.warn('ffmpeg-static module not found:', requireError);
    }
    
    if (!ffmpegPath) {
      console.error('❌ FFmpeg not available - cannot watermark video');
      return null;
    }

    // Verify FFmpeg exists and is executable
    try {
      await fs.promises.access(ffmpegPath, fs.constants.F_OK);
      console.log(`✅ FFmpeg found at: ${ffmpegPath}`);
    } catch (accessError) {
      console.error(`❌ FFmpeg binary not found at: ${ffmpegPath}`);
      console.error(`❌ Access error:`, accessError);
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
      console.log(`📝 Wrote video to temp file: ${inputPath} (${videoBuffer.length} bytes)`);

      // Always use dlwatermark.png from public folder for all package types
      watermarkPath = path.join(process.cwd(), 'public', 'dlwatermark.png');
      
      console.log(`🔍 Checking watermark file at: ${watermarkPath}`);
      console.log(`🔍 Current working directory: ${process.cwd()}`);
      console.log(`🔍 Public directory exists: ${fs.existsSync(path.join(process.cwd(), 'public'))}`);
      
      if (!fs.existsSync(watermarkPath)) {
        console.error(`❌ Watermark file not found at: ${watermarkPath}`);
        // Try alternative paths
        const altPaths = [
          path.join(process.cwd(), 'public', 'dlwatermark.png'),
          path.join(__dirname, '..', '..', 'public', 'dlwatermark.png'),
          path.join(process.cwd(), 'dlwatermark.png'),
        ];
        for (const altPath of altPaths) {
          if (fs.existsSync(altPath)) {
            console.log(`✅ Found watermark at alternative path: ${altPath}`);
            watermarkPath = altPath;
            break;
          }
        }
        if (!fs.existsSync(watermarkPath)) {
          console.error(`❌ Watermark file not found in any location`);
          return null;
        }
      }

      console.log(`✅ Using watermark: ${watermarkPath} (exists: ${fs.existsSync(watermarkPath)})`);

      // FFmpeg command to overlay watermark at bottom center
      // Scale watermark to 60% of video width, positioned at bottom with 10px margin
      const ffmpegArgs = [
        '-y', // Overwrite output file
        '-i', inputPath, // Input video
        '-i', watermarkPath, // Watermark image
        '-filter_complex',
        `[1:v]scale=iw*0.6:-1[wm];[0:v][wm]overlay=(W-w)/2:H-h-10:format=auto`, // Overlay at bottom center
        '-c:v', 'libx264', // Video codec
        '-preset', 'veryfast', // Encoding preset
        '-crf', '23', // Quality
        '-c:a', 'copy', // Copy audio (preserve original audio)
        '-movflags', '+faststart', // Enable fast start for web playback
        outputPath, // Output file
      ];

      console.log(`🎬 Running FFmpeg with args:`, ffmpegArgs.join(' '));

      // Run FFmpeg with timeout (5 minutes max)
      const watermarkedBuffer = await new Promise<Buffer>((resolve, reject) => {
        const proc = spawn(ffmpegPath!, ffmpegArgs, { stdio: 'pipe' });
        
        let stderr = '';
        let stdout = '';
        
        proc.stdout?.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
        
        proc.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
        
        proc.on('error', (err: Error) => {
          console.error('❌ FFmpeg spawn error:', err);
          reject(new Error(`FFmpeg spawn error: ${err.message}`));
        });
        
        // Set timeout (5 minutes)
        const timeout = setTimeout(() => {
          proc.kill('SIGKILL');
          reject(new Error('FFmpeg timeout after 5 minutes'));
        }, 5 * 60 * 1000);
        
        proc.on('exit', (code: number) => {
          clearTimeout(timeout);
          if (code === 0) {
            resolve(fs.readFileSync(outputPath));
          } else {
            console.error(`❌ FFmpeg exited with code ${code}`);
            console.error('FFmpeg stderr:', stderr);
            reject(new Error(`FFmpeg exited with code ${code}. Last error: ${stderr.split('\n').slice(-5).join('\n')}`));
          }
        });
      });

      console.log(`✅ Successfully watermarked video - output size: ${watermarkedBuffer.length} bytes`);

      // Cleanup temp files
      try {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp directory:', cleanupError);
      }

      return watermarkedBuffer;
    } catch (error) {
      // Cleanup on error
      try {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp directory after error:', cleanupError);
      }
      
      console.error('❌ Error during video watermarking:', error);
      throw error;
    }
  } catch (error) {
    console.error('❌ Error applying video watermark:', error);
    // Return null to indicate video watermarking failed
    // The download endpoint will handle this based on package type
    return null;
  }
}

