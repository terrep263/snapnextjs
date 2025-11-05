/**
 * Adaptive Upload Limits
 * 
 * Provides flexible upload size recommendations based on:
 * - File type (video, image, audio)
 * - Source (smartphone, camera, desktop, web)
 * - Quality indicators (resolution, bitrate)
 * - User preference (not a hard limit, but guidance)
 * 
 * Philosophy: Recommend appropriate sizes but allow users to attempt larger files
 */

export interface UploadLimitConfig {
  recommendedMaxMB: number;      // What we recommend as ideal
  warningThresholdMB: number;    // Warn user above this
  allowedMaxMB: number;          // Hard limit - reject if over this
  estimatedDurationMinutes: number;
  reason: string;
}

export class AdaptiveUploadLimits {
  /**
   * Common bitrate constants (in Mbps)
   */
  static readonly BITRATES = {
    // Video bitrates by quality
    video: {
      '4K': 50,      // 4K/UHD (uncommon)
      '1080p': 17,   // 1080p FHD (common)
      '720p': 8,     // 720p HD
      '480p': 4,     // 480p (compressed)
      'low': 2       // Very low quality
    },
    // Audio bitrates
    audio: {
      'high': 320,   // 320 kbps
      'medium': 128, // 128 kbps
      'low': 64      // 64 kbps
    }
  };

  /**
   * Get adaptive limits based on file type and estimated specs
   */
  static getAdaptiveLimits(file: File): UploadLimitConfig {
    const fileSizeMB = file.size / (1024 * 1024);
    const fileType = file.type.toLowerCase();

    if (fileType.startsWith('video/')) {
      return this.getVideoLimits(file, fileSizeMB);
    } else if (fileType.startsWith('audio/')) {
      return this.getAudioLimits(file, fileSizeMB);
    } else if (fileType.startsWith('image/')) {
      return this.getImageLimits(file, fileSizeMB);
    }

    // Default for unknown types
    return {
      recommendedMaxMB: 500,
      warningThresholdMB: 300,
      allowedMaxMB: 1000,
      estimatedDurationMinutes: 0,
      reason: 'Unknown file type - generic limits applied'
    };
  }

  /**
   * Intelligent video limits based on estimated quality and duration
   */
  private static getVideoLimits(file: File, fileSizeMB: number): UploadLimitConfig {
    // Estimate bitrate from file size
    // Typical video: size (bytes) = bitrate (bps) * duration (seconds) / 8
    
    const estimatedBitrateMbps = this.estimateVideoBitrate(fileSizeMB);
    const durationMinutes = this.estimateVideoDuration(fileSizeMB, estimatedBitrateMbps);

    let quality = 'Unknown';
    if (estimatedBitrateMbps >= 40) quality = '4K/Ultra HD';
    else if (estimatedBitrateMbps >= 12) quality = '1080p FHD';
    else if (estimatedBitrateMbps >= 6) quality = '720p HD';
    else if (estimatedBitrateMbps >= 2) quality = '480p';
    else quality = 'Low Quality';

    // Set adaptive limits based on detected quality
    let recommendedMaxMB: number;
    let warningThresholdMB: number;
    let allowedMaxMB: number;

    if (estimatedBitrateMbps >= 40) {
      // 4K - large files expected
      recommendedMaxMB = 1000;   // ~60 min 4K or ~120 min 1080p equivalent
      warningThresholdMB = 1500;
      allowedMaxMB = 2000;       // Hard limit for 4K
    } else if (estimatedBitrateMbps >= 12) {
      // 1080p - moderate files
      recommendedMaxMB = 300;    // ~30 min 1080p
      warningThresholdMB = 500;
      allowedMaxMB = 750;        // ~75 min 1080p
    } else if (estimatedBitrateMbps >= 6) {
      // 720p - smaller files
      recommendedMaxMB = 200;    // ~25 min 720p
      warningThresholdMB = 400;
      allowedMaxMB = 600;        // ~75 min 720p
    } else {
      // Low quality - very small files
      recommendedMaxMB = 100;
      warningThresholdMB = 200;
      allowedMaxMB = 300;
    }

    return {
      recommendedMaxMB,
      warningThresholdMB,
      allowedMaxMB,
      estimatedDurationMinutes: Math.round(durationMinutes),
      reason: `Video detected (${quality}, ~${estimatedBitrateMbps.toFixed(1)} Mbps, estimated ${Math.round(durationMinutes)} min)`
    };
  }

  /**
   * Audio limits - much smaller than video
   */
  private static getAudioLimits(file: File, fileSizeMB: number): UploadLimitConfig {
    const estimatedBitrateMbps = this.estimateAudioBitrate(fileSizeMB);
    const durationMinutes = this.estimateAudioDuration(fileSizeMB, estimatedBitrateMbps);

    let quality = 'Unknown';
    if (estimatedBitrateMbps >= 256) quality = 'Lossless/High Quality';
    else if (estimatedBitrateMbps >= 128) quality = 'High Quality';
    else if (estimatedBitrateMbps >= 96) quality = 'Medium Quality';
    else quality = 'Low Quality';

    return {
      recommendedMaxMB: 500,   // ~90 min audio
      warningThresholdMB: 800,
      allowedMaxMB: 1000,      // ~180 min audio
      estimatedDurationMinutes: Math.round(durationMinutes),
      reason: `Audio detected (${quality}, ~${estimatedBitrateMbps.toFixed(1)} kbps, estimated ${Math.round(durationMinutes)} min)`
    };
  }

  /**
   * Image limits - typically much smaller
   */
  private static getImageLimits(file: File, fileSizeMB: number): UploadLimitConfig {
    let quality = 'Unknown';
    if (fileSizeMB >= 20) quality = 'Very High Resolution';
    else if (fileSizeMB >= 10) quality = 'High Resolution';
    else if (fileSizeMB >= 5) quality = 'Medium Resolution';
    else quality = 'Normal Resolution';

    return {
      recommendedMaxMB: 50,
      warningThresholdMB: 100,
      allowedMaxMB: 200,
      estimatedDurationMinutes: 0,
      reason: `Image detected (${quality})`
    };
  }

  /**
   * Estimate video bitrate from file size (used to infer quality)
   * Assumes typical duration of 5-30 minutes
   */
  private static estimateVideoBitrate(fileSizeMB: number): number {
    // For a rough estimate, assume average 10-minute video
    // bitrate (Mbps) = size (MB) * 8 / duration (seconds)
    // = size (MB) * 8 / (10 * 60)
    // = size (MB) * 0.0133

    const estimatedBitrate = fileSizeMB * 0.0133;
    
    // Clamp to known ranges
    if (estimatedBitrate >= 40) return 50;    // 4K
    if (estimatedBitrate >= 12) return 17;    // 1080p
    if (estimatedBitrate >= 6) return 8;      // 720p
    if (estimatedBitrate >= 2) return 4;      // 480p
    return 2;                                  // Low quality
  }

  /**
   * Estimate video duration in minutes
   * duration (minutes) = size (bytes) / bitrate (bps) / 60
   *                    = size (MB) * 1024 * 1024 / bitrate (bps) / 60
   *                    = size (MB) * (1024 * 1024) / (bitrate (Mbps) * 1000000 * 60)
   *                    = size (MB) / (bitrate (Mbps) * 0.488)
   */
  private static estimateVideoDuration(fileSizeMB: number, bitrateMbps: number): number {
    if (bitrateMbps <= 0) return 0;
    return fileSizeMB / (bitrateMbps * 0.488);
  }

  /**
   * Estimate audio bitrate from file size
   */
  private static estimateAudioBitrate(fileSizeMB: number): number {
    // Assume 10-minute audio for estimation
    // bitrate (kbps) = size (MB) * 8192 / duration (seconds)
    const estimatedBitrate = (fileSizeMB * 8192) / (10 * 60);
    
    if (estimatedBitrate >= 256) return 320;
    if (estimatedBitrate >= 128) return 128;
    if (estimatedBitrate >= 96) return 96;
    return 64;
  }

  /**
   * Estimate audio duration in minutes
   */
  private static estimateAudioDuration(fileSizeMB: number, bitrateMbps: number): number {
    if (bitrateMbps <= 0) return 0;
    // duration (minutes) = size (bytes) / bitrate (bps) / 60
    // = size (MB) * 1024 * 1024 / (bitrate (kbps) * 1000) / 60
    const bitrateBps = bitrateMbps * 1000;
    return (fileSizeMB * 1024 * 1024) / bitrateBps / 60;
  }

  /**
   * Get user-friendly message about the limit
   */
  static getWarningMessage(config: UploadLimitConfig, fileSizeMB: number): string {
    if (fileSizeMB > config.allowedMaxMB) {
      return `File exceeds maximum allowed size (${config.allowedMaxMB}MB). Please reduce file size or compress video.`;
    }
    if (fileSizeMB > config.warningThresholdMB) {
      return `File is larger than recommended (${config.warningThresholdMB}MB). Upload may be slow. Consider compressing.`;
    }
    if (fileSizeMB > config.recommendedMaxMB) {
      return `File is larger than our recommendations (${config.recommendedMaxMB}MB), but we'll try to upload it.`;
    }
    return '';
  }

  /**
   * Determine if file should be blocked, warned, or accepted
   */
  static getUploadStatus(config: UploadLimitConfig, fileSizeMB: number): 'accepted' | 'warning' | 'rejected' {
    if (fileSizeMB > config.allowedMaxMB) return 'rejected';
    if (fileSizeMB > config.warningThresholdMB) return 'warning';
    return 'accepted';
  }

  /**
   * Get a global default hard limit (user can override with settings)
   * This is NOT a strict per-file limit, but a reasonable maximum
   */
  static getGlobalHardLimit(): number {
    return 2000; // 2GB - very permissive, actual limits based on file type
  }

  /**
   * Get default recommended limit (what we suggest to users)
   */
  static getGlobalRecommendedLimit(): number {
    return 500; // 500MB - reasonable for most videos
  }
}
