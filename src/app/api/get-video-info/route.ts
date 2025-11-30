/**
 * GET /api/get-video-info?url=[video_url]
 * Returns detailed video codec information and playback compatibility
 * Uses ffprobe-like analysis to detect codec
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return Response.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Fetch video headers
    const headResponse = await fetch(videoUrl, {
      method: 'HEAD',
      redirect: 'follow'
    });

    if (!headResponse.ok) {
      return Response.json(
        { error: `Video not found (${headResponse.status})` },
        { status: 404 }
      );
    }

    const contentType = headResponse.headers.get('content-type') || '';
    const contentLength = headResponse.headers.get('content-length');

    // Fetch first 64KB to analyze codec from file signature
    const rangeResponse = await fetch(videoUrl, {
      headers: { 'Range': 'bytes=0-65535' }
    });

    const buffer = await rangeResponse.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Analyze MP4 structure
    let codec = 'unknown';
    let brand = 'unknown';
    let isCompatible = false;
    let recommendedAction = '';

    // Check for MP4 ftyp box signature
    if (bytes.length > 8 && bytes[4] === 102 && bytes[5] === 116 && bytes[6] === 121 && bytes[7] === 112) {
      // Read brand (bytes 8-11)
      brand = String.fromCharCode(...bytes.slice(8, 12));

      // Search for codec information in the file
      const text = new TextDecoder().decode(bytes);

      if (text.includes('hev1') || text.includes('hvc1')) {
        codec = 'H.265/HEVC';
        isCompatible = false;
        recommendedAction = 'transcode_to_h264';
      } else if (text.includes('avc1')) {
        codec = 'H.264/AVC';
        isCompatible = true;
        recommendedAction = 'use_as_is';
      } else if (text.includes('vp09')) {
        codec = 'VP9';
        isCompatible = false;
        recommendedAction = 'transcode_to_h264';
      } else if (text.includes('av01')) {
        codec = 'AV1';
        isCompatible = false;
        recommendedAction = 'transcode_to_h264';
      } else if (text.includes('mp4v')) {
        codec = 'MPEG-4 Video';
        isCompatible = false;
        recommendedAction = 'transcode_to_h264';
      } else {
        // MP4 container found but codec unknown
        // Check file size heuristic
        const sizeMB = parseInt(contentLength || '0') / (1024 * 1024);
        
        if (sizeMB < 5) {
          // Small file, likely lower quality - guess H.265 or limited codec
          codec = 'Unknown (possibly H.265 or VP9)';
          isCompatible = false;
          recommendedAction = 'transcode_to_h264';
        } else {
          // Larger file, might be H.264 that just doesn't have clear marker
          codec = 'H.264/AVC (assumed)';
          isCompatible = true;
          recommendedAction = 'use_as_is';
        }
      }
    } else {
      codec = 'Not an MP4 file or unrecognized format';
      isCompatible = false;
      recommendedAction = 'convert_format';
    }

    return Response.json({
      url: videoUrl,
      contentType,
      contentLength: parseInt(contentLength || '0'),
      contentLengthMB: (parseInt(contentLength || '0') / (1024 * 1024)).toFixed(2),
      codec,
      brand,
      isCompatible,
      canPlayInBrowser: isCompatible,
      recommendedAction,
      message: isCompatible
        ? '✅ This video should play in all modern browsers'
        : '⚠️ This video needs transcoding to H.264 for browser compatibility'
    });
  } catch (error) {
    console.error('Error analyzing video:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
