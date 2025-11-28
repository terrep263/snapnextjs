/**
 * Video Compatibility Utilities
 * Detects and handles incompatible video formats (especially from Android devices)
 */

export interface VideoFormatInfo {
  isCompatible: boolean;
  codec?: string;
  container?: string;
  canPlay: boolean;
  needsTranscoding: boolean;
  reason?: string;
}

/**
 * Check if a video format is web-compatible
 */
export async function checkVideoCompatibility(file: File): Promise<VideoFormatInfo> {
  const video = document.createElement('video');
  const url = URL.createObjectURL(file);

  const result: VideoFormatInfo = {
    isCompatible: false,
    canPlay: false,
    needsTranscoding: false,
  };

  try {
    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    result.container = extension;

    // Check MIME type
    const mimeType = file.type || '';

    // Test if browser can play this type
    if (mimeType) {
      const canPlayType = video.canPlayType(mimeType);
      result.canPlay = canPlayType === 'probably' || canPlayType === 'maybe';
    }

    // Load video metadata to check codec
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video metadata'));
      video.src = url;

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Timeout loading video')), 5000);
    });

    // Check for web-compatible codecs
    const webCompatibleFormats = ['mp4', 'webm', 'ogg'];
    const isWebContainer = webCompatibleFormats.includes(extension);

    // Check specific codec compatibility
    const h264Support = video.canPlayType('video/mp4; codecs="avc1.42E01E"');
    const vp8Support = video.canPlayType('video/webm; codecs="vp8"');
    const vp9Support = video.canPlayType('video/webm; codecs="vp9"');

    if (h264Support === 'probably' || h264Support === 'maybe') {
      result.codec = 'H.264';
      result.isCompatible = true;
    } else if (vp8Support === 'probably' || vp9Support === 'probably') {
      result.codec = vp8Support === 'probably' ? 'VP8' : 'VP9';
      result.isCompatible = true;
    } else if (isWebContainer && result.canPlay) {
      result.isCompatible = true;
      result.codec = 'Unknown (but playable)';
    } else {
      result.needsTranscoding = true;
      result.reason = 'Video codec not supported by web browsers';
    }

  } catch (error) {
    result.needsTranscoding = true;
    result.reason = error instanceof Error ? error.message : 'Unknown error';
  } finally {
    URL.revokeObjectURL(url);
  }

  return result;
}

/**
 * Detect if video is from Android (common issues)
 */
export function detectAndroidVideo(file: File): boolean {
  // Common Android video characteristics
  const androidFormats = [
    'video/3gpp',
    'video/3gpp2',
    'video/x-matroska',
  ];

  // Check MIME type
  if (androidFormats.includes(file.type)) {
    return true;
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && ['3gp', '3g2', 'mkv'].includes(extension)) {
    return true;
  }

  return false;
}

/**
 * Get recommended transcoding settings for web compatibility
 */
export function getTranscodingSettings() {
  return {
    video: {
      codec: 'libx264',
      preset: 'medium',
      crf: 23, // Quality (lower = better, 18-28 is good range)
      maxWidth: 1920,
      maxHeight: 1080,
      fps: 30,
      profile: 'high',
      level: '4.0',
    },
    audio: {
      codec: 'aac',
      bitrate: '128k',
      sampleRate: 48000,
    },
    container: 'mp4',
    fastStart: true, // Enable streaming
  };
}

/**
 * Client-side codec detection (browser support check)
 */
export function getBrowserVideoSupport() {
  const video = document.createElement('video');

  return {
    h264: {
      baseline: video.canPlayType('video/mp4; codecs="avc1.42E01E"'),
      main: video.canPlayType('video/mp4; codecs="avc1.4D401E"'),
      high: video.canPlayType('video/mp4; codecs="avc1.64001E"'),
    },
    h265: {
      main: video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"'),
    },
    vp8: video.canPlayType('video/webm; codecs="vp8"'),
    vp9: video.canPlayType('video/webm; codecs="vp9"'),
    av1: video.canPlayType('video/mp4; codecs="av01.0.05M.08"'),
  };
}

/**
 * Estimate if transcoding is needed based on file characteristics
 */
export function estimateTranscodingNeed(file: File): {
  needed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let needed = false;

  // Check file size (very large files might need optimization)
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > 500) {
    reasons.push(`Large file size (${sizeMB.toFixed(0)}MB) - may benefit from compression`);
  }

  // Check for Android formats
  if (detectAndroidVideo(file)) {
    reasons.push('Android video detected - may use incompatible codec (HEVC/H.265)');
    needed = true;
  }

  // Check MIME type
  if (!file.type || file.type === 'application/octet-stream') {
    reasons.push('Unknown video format - MIME type missing');
    needed = true;
  }

  // Check extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  const webSafeExtensions = ['mp4', 'webm', 'ogg'];
  if (ext && !webSafeExtensions.includes(ext)) {
    reasons.push(`Non-web format detected (.${ext})`);
    needed = true;
  }

  return { needed, reasons };
}
