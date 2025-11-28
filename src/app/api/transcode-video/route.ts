import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

/**
 * Video Transcoding API Endpoint
 * Converts incompatible videos (especially from Android) to web-compatible MP4
 *
 * Requires FFmpeg to be installed on the server
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Check FFmpeg availability
    const ffmpegAvailable = await checkFFmpeg();
    if (!ffmpegAvailable) {
      return NextResponse.json(
        {
          error: 'Video transcoding not available',
          message: 'FFmpeg is not installed on the server. Videos must be in web-compatible formats (MP4 with H.264 codec).',
          suggestion: 'Please convert your video to MP4 format before uploading, or contact support.',
        },
        { status: 503 }
      );
    }

    // Generate unique filename
    const fileId = crypto.randomBytes(16).toString('hex');
    const inputExt = path.extname(videoFile.name);
    const inputPath = path.join('/tmp', `input_${fileId}${inputExt}`);
    const outputPath = path.join('/tmp', `output_${fileId}.mp4`);

    // Ensure /tmp directory exists
    if (!existsSync('/tmp')) {
      await mkdir('/tmp', { recursive: true });
    }

    // Save uploaded file to temp location
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(inputPath, buffer);

    console.log('🎬 Transcoding video:', {
      originalName: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
      inputPath,
      outputPath,
    });

    // Transcode video using FFmpeg
    // Settings optimized for web playback compatibility
    const ffmpegCommand = [
      'ffmpeg',
      '-i', inputPath,
      '-c:v', 'libx264',           // H.264 codec (universally supported)
      '-preset', 'medium',          // Encoding speed/quality balance
      '-crf', '23',                 // Constant quality (lower = better, 18-28 is good)
      '-profile:v', 'high',         // H.264 profile
      '-level', '4.0',              // H.264 level
      '-pix_fmt', 'yuv420p',        // Pixel format (required for web)
      '-movflags', '+faststart',    // Enable streaming (moov atom at start)
      '-c:a', 'aac',                // AAC audio codec
      '-b:a', '128k',               // Audio bitrate
      '-ar', '48000',               // Audio sample rate
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
      '-y',                         // Overwrite output file
      outputPath,
    ].join(' ');

    console.log('📹 Running FFmpeg command:', ffmpegCommand);

    const startTime = Date.now();
    const { stdout, stderr } = await execAsync(ffmpegCommand, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large videos
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Transcoding completed in ${(duration / 1000).toFixed(1)}s`);

    // Read transcoded file
    const transcodedBuffer = await Bun.file(outputPath).arrayBuffer();
    const transcodedBlob = new Blob([transcodedBuffer], { type: 'video/mp4' });

    // Clean up temp files
    await Promise.all([
      unlink(inputPath).catch(console.error),
      unlink(outputPath).catch(console.error),
    ]);

    // Return transcoded video
    return new NextResponse(transcodedBlob, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="transcoded_${videoFile.name.replace(/\.[^.]+$/, '.mp4')}"`,
        'X-Transcoding-Duration': duration.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Transcoding error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for common FFmpeg errors
    if (errorMessage.includes('Conversion failed')) {
      return NextResponse.json(
        {
          error: 'Video conversion failed',
          message: 'The video format could not be converted. The file may be corrupted or use an unsupported codec.',
        },
        { status: 422 }
      );
    }

    if (errorMessage.includes('No such file')) {
      return NextResponse.json(
        {
          error: 'File processing error',
          message: 'Failed to process the uploaded file.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Transcoding failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Check if FFmpeg is installed and available
 */
async function checkFFmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    console.warn('⚠️ FFmpeg not found on server');
    return false;
  }
}

/**
 * GET endpoint to check if transcoding is available
 */
export async function GET() {
  const available = await checkFFmpeg();

  return NextResponse.json({
    available,
    message: available
      ? 'Video transcoding is available'
      : 'FFmpeg not installed - transcoding unavailable',
  });
}
