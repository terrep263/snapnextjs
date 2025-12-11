import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Debug endpoint to check watermark and FFmpeg status
 * GET /api/debug/watermark-status
 */
export async function GET() {
  try {
    const checks: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      cwd: process.cwd(),
    };

    // Check watermark file
    const watermarkPath = path.join(process.cwd(), 'public', 'dlwatermark.png');
    checks.watermark = {
      expectedPath: watermarkPath,
      exists: fs.existsSync(watermarkPath),
      publicDirExists: fs.existsSync(path.join(process.cwd(), 'public')),
    };

    if (checks.watermark.exists) {
      const stats = fs.statSync(watermarkPath);
      checks.watermark.size = stats.size;
      checks.watermark.isFile = stats.isFile();
    }

    // Check FFmpeg
    let ffmpegPath: string | null = null;
    try {
      const ffmpegStatic = require('ffmpeg-static');
      ffmpegPath = typeof ffmpegStatic === 'string' 
        ? ffmpegStatic 
        : ffmpegStatic?.default || ffmpegStatic || null;
    } catch (requireError) {
      checks.ffmpeg = {
        available: false,
        error: 'ffmpeg-static module not found',
        details: requireError instanceof Error ? requireError.message : String(requireError),
      };
    }

    if (ffmpegPath) {
      checks.ffmpeg = {
        available: true,
        path: ffmpegPath,
        exists: fs.existsSync(ffmpegPath),
      };

      if (checks.ffmpeg.exists) {
        const stats = fs.statSync(ffmpegPath);
        checks.ffmpeg.size = stats.size;
        checks.ffmpeg.isFile = stats.isFile();
        checks.ffmpeg.isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
      }
    }

    // Check alternative paths
    const altPaths = [
      path.join(process.cwd(), 'public', 'dlwatermark.png'),
      path.join(__dirname, '..', '..', '..', 'public', 'dlwatermark.png'),
      path.join(process.cwd(), 'dlwatermark.png'),
    ];

    checks.alternativePaths = altPaths.map(altPath => ({
      path: altPath,
      exists: fs.existsSync(altPath),
    }));

    return NextResponse.json({
      success: true,
      checks,
      summary: {
        watermarkAvailable: checks.watermark.exists,
        ffmpegAvailable: checks.ffmpeg?.exists === true,
        ready: checks.watermark.exists && checks.ffmpeg?.exists === true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

