// Smartphone video optimization utility
export class SmartphoneVideoOptimizer {
  // Typical smartphone video specifications (limited to 1080p max)
  static readonly SMARTPHONE_SPECS = {
    // Duration limits
    maxDurationMinutes: 3,
    maxDurationSeconds: 180,
    
    // Typical smartphone video bitrates (Mbps) - 1080p maximum
    typicalBitrates: {
      '1080p': 17,   // iPhone 1080p @ 30fps (MAXIMUM SUPPORTED)
      '720p': 8,     // iPhone 720p @ 30fps
      '480p': 4      // Lower quality
    },
    
    // Estimated file sizes for 3-minute videos (MB) - 1080p maximum
    estimatedSizes: {
      '1080p_3min': 38,    // ~17 Mbps * 180 sec / 8 bits/byte (MAXIMUM)
      '720p_3min': 18,     // ~8 Mbps * 180 sec / 8 bits/byte  
      '480p_3min': 9       // ~4 Mbps * 180 sec / 8 bits/byte
    },
    
    // Supported smartphone resolutions (1080p maximum)
    resolutions: [
      { name: '1080p FHD', width: 1920, height: 1080, aspectRatio: '16:9' }, // MAXIMUM SUPPORTED
      { name: '720p HD', width: 1280, height: 720, aspectRatio: '16:9' },
      { name: '480p', width: 854, height: 480, aspectRatio: '16:9' }
    ]
  };

  // Check if file appears to be from a smartphone
  static isLikelySmartphoneVideo(file: File): {
    isLikely: boolean;
    indicators: string[];
    estimatedSpecs: {
      possibleResolution: string;
      estimatedDuration?: number;
      compressionSuggestion?: string;
    };
  } {
    const indicators: string[] = [];
    const sizeMB = file.size / (1024 * 1024);
    
    // Check file type
    if (file.type === 'video/mp4' || file.type === 'video/quicktime') {
      indicators.push('Common smartphone format');
    }
    
    // Estimate specs based on file size for 3-minute assumption
    let possibleResolution = 'Unknown';
    let estimatedDuration: number | undefined;
    let compressionSuggestion: string | undefined;
    
    const specs = this.SMARTPHONE_SPECS.estimatedSizes;
    
    if (sizeMB >= 60) {
      possibleResolution = 'Likely higher than 1080p - NEEDS COMPRESSION';
      indicators.push('Very large file size - exceeds 1080p limits');
      estimatedDuration = (sizeMB / specs['1080p_3min']) * 3; // Use 1080p as reference
      compressionSuggestion = 'REQUIRED: Reduce to 1080p or lower for upload';
    } else if (sizeMB >= 30) {
      possibleResolution = 'Likely 1080p';
      indicators.push('Medium file size suggests 1080p recording');
      estimatedDuration = (sizeMB / specs['1080p_3min']) * 3;
      compressionSuggestion = 'Perfect! 1080p is the maximum supported resolution';
    } else if (sizeMB >= 15) {
      possibleResolution = 'Likely 720p';
      indicators.push('File size suggests 720p recording');
      estimatedDuration = (sizeMB / specs['720p_3min']) * 3;
      compressionSuggestion = 'Optimal for quick upload';
    } else if (sizeMB >= 5) {
      possibleResolution = 'Likely 480p or compressed';
      indicators.push('Small file size suggests lower resolution or compression');
      estimatedDuration = (sizeMB / specs['480p_3min']) * 3;
      compressionSuggestion = 'Already optimized for upload';
    }
    
    // Check if duration seems reasonable for smartphone video
    if (estimatedDuration && estimatedDuration <= 5) {
      indicators.push('Duration typical for smartphone video');
    } else if (estimatedDuration && estimatedDuration > 10) {
      indicators.push('Long video - consider trimming to key moments');
    }
    
    return {
      isLikely: indicators.length >= 1,
      indicators,
      estimatedSpecs: {
        possibleResolution,
        estimatedDuration: estimatedDuration ? Math.round(estimatedDuration * 10) / 10 : undefined,
        compressionSuggestion
      }
    };
  }

  // Get smartphone-optimized upload recommendations
  static getSmartphoneOptimizations(file: File): {
    currentSize: string;
    recommendations: Array<{
      action: string;
      description: string;
      expectedResult: string;
      difficulty: 'Easy' | 'Medium' | 'Advanced';
    }>;
    quickTips: string[];
  } {
    const sizeMB = file.size / (1024 * 1024);
    const analysis = this.isLikelySmartphoneVideo(file);
    
    const recommendations = [];
    const quickTips = [
      '📱 Record in 1080p for best balance of quality and upload speed',
      '⏱️ Keep videos under 3 minutes for optimal sharing',
      '📶 Use Wi-Fi when uploading large videos',
      '🔋 Ensure phone is charged or plugged in during upload'
    ];

    // Add specific recommendations based on file size (1080p max)
    if (sizeMB > 60) {
      recommendations.push({
        action: 'Reduce to 1080p Maximum',
        description: 'Your video exceeds our 1080p limit. Please reduce resolution to 1080p (Full HD) or lower for upload.',
        expectedResult: `Target: ~38MB for 3-minute 1080p video`,
        difficulty: 'Easy' as const
      });
    }

    if (sizeMB > 40) {
      recommendations.push({
        action: 'Optimize 1080p Settings',
        description: 'Your 1080p video is large. Reduce bitrate or frame rate to achieve optimal file size.',
        expectedResult: `Target: 30-40MB for 3-minute video`,
        difficulty: 'Medium' as const
      });
    }

    if (sizeMB > 50) {
      recommendations.push({
        action: 'Trim Video Length',
        description: 'Keep only the most important moments. Most viewers prefer shorter, focused videos.',
        expectedResult: 'Proportional size reduction based on time saved',
        difficulty: 'Easy' as const
      });
    }

    if (analysis.estimatedSpecs.estimatedDuration && analysis.estimatedSpecs.estimatedDuration > 3) {
      recommendations.push({
        action: 'Split into Clips',
        description: 'Break long video into 2-3 minute segments. Each can be uploaded separately.',
        expectedResult: 'Multiple smaller files, easier to upload and view',
        difficulty: 'Easy' as const
      });
    }

    // Always include phone-specific tips
    recommendations.push({
      action: 'Use Phone Built-in Editor',
      description: 'Most smartphones have built-in video editors that can trim and compress videos easily.',
      expectedResult: 'Quick optimization without additional software',
      difficulty: 'Easy' as const
    });

    return {
      currentSize: `${Math.round(sizeMB * 10) / 10}MB`,
      recommendations,
      quickTips
    };
  }

  // Validate if video duration is appropriate
  static validateDuration(estimatedDurationMinutes: number): {
    isValid: boolean;
    message: string;
    suggestion?: string;
  } {
    if (estimatedDurationMinutes <= this.SMARTPHONE_SPECS.maxDurationMinutes) {
      return {
        isValid: true,
        message: `✅ Perfect! ${estimatedDurationMinutes.toFixed(1)} minutes is ideal for sharing.`
      };
    } else {
      return {
        isValid: false,
        message: `⚠️ Video is ${estimatedDurationMinutes.toFixed(1)} minutes (over 3-minute limit).`,
        suggestion: `Consider trimming to ${this.SMARTPHONE_SPECS.maxDurationMinutes} minutes or splitting into ${Math.ceil(estimatedDurationMinutes / 3)} shorter clips.`
      };
    }
  }

  // Get file size limit based on smartphone optimization (1080p max)
  static getOptimizedSizeLimit(): {
    standardLimitMB: number;
    smartphoneLimitMB: number;
    reasoning: string;
  } {
    return {
      standardLimitMB: 80, // Reduced for 1080p maximum
      smartphoneLimitMB: 60, // Optimized for 3-min 1080p videos
      reasoning: 'Optimized for 3-minute 1080p smartphone videos. Maximum supported resolution is Full HD (1080p).'
    };
  }
}