// Mobile upload guidance and optimization
export class MobileUploadGuide {
  
  // Detect if user is on mobile device
  static isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (!!navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }

  // Get mobile-specific upload tips
  static getMobileUploadTips(): {
    connectionTips: string[];
    batteryTips: string[];
    recordingTips: string[];
    uploadTips: string[];
  } {
    return {
      connectionTips: [
        '📶 Connect to Wi-Fi for faster, unlimited uploads',
        '📡 Avoid cellular uploads for large files to save data',
        '🔄 Stay connected - don\'t switch apps during upload',
        '📍 Find a spot with strong Wi-Fi signal'
      ],
      batteryTips: [
        '🔋 Ensure phone is charged (>30%) before uploading',
        '⚡ Plug in charger for long uploads',
        '🌙 Enable low power mode after starting upload',
        '📱 Keep screen on or adjust auto-lock settings'
      ],
      recordingTips: [
        '📱 Record in 1080p MAXIMUM (Full HD limit enforced)',
        '⏱️ Keep videos under 3 minutes for quick sharing',
        '🎥 Hold phone steady for better compression', 
        '🔆 Record in good lighting to reduce file size',
        '🚫 Do NOT record in 4K - not supported'
      ],
      uploadTips: [
        '🚀 Upload immediately after recording for best results',
        '📂 Use phone\'s built-in video editor for trimming',
        '🔄 Don\'t exit the app during upload',
        '💾 Free up storage space before uploading'
      ]
    };
  }

  // Get connection quality assessment
  static assessConnectionQuality(): Promise<{
    quality: 'excellent' | 'good' | 'poor' | 'unknown';
    estimatedSpeed: string;
    recommendation: string;
  }> {
    return new Promise((resolve) => {
      if (!('connection' in navigator)) {
        resolve({
          quality: 'unknown',
          estimatedSpeed: 'Unknown',
          recommendation: 'Consider using Wi-Fi for large uploads'
        });
        return;
      }

      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;
      const downlink = connection?.downlink;

      let quality: 'excellent' | 'good' | 'poor' | 'unknown' = 'unknown';
      let estimatedSpeed = 'Unknown';
      let recommendation = '';

      if (effectiveType === '4g' && downlink > 10) {
        quality = 'excellent';
        estimatedSpeed = `${downlink.toFixed(1)} Mbps`;
        recommendation = 'Great connection! Upload videos up to 100MB safely.';
      } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 2)) {
        quality = 'good';
        estimatedSpeed = downlink ? `${downlink.toFixed(1)} Mbps` : 'Good';
        recommendation = 'Good connection. Videos up to 50MB should upload well.';
      } else if (effectiveType === '3g' || effectiveType === '2g') {
        quality = 'poor';
        estimatedSpeed = downlink ? `${downlink.toFixed(1)} Mbps` : 'Slow';
        recommendation = 'Slow connection. Consider compressing videos or using Wi-Fi.';
      }

      resolve({ quality, estimatedSpeed, recommendation });
    });
  }

  // Check available storage space (approximate)
  static checkStorageSpace(): Promise<{
    available: number | null;
    warning: string | null;
  }> {
    return new Promise((resolve) => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then((estimate) => {
          const available = estimate.quota && estimate.usage ? 
            (estimate.quota - estimate.usage) / (1024 * 1024 * 1024) : null; // GB
          
          let warning = null;
          if (available && available < 0.5) {
            warning = 'Low storage space. Consider freeing up space before uploading.';
          }

          resolve({ available, warning });
        }).catch(() => {
          resolve({ available: null, warning: null });
        });
      } else {
        resolve({ available: null, warning: null });
      }
    });
  }

  // Get battery level if available
  static getBatteryInfo(): Promise<{
    level: number | null;
    charging: boolean | null;
    warning: string | null;
  }> {
    return new Promise((resolve) => {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          const level = Math.round(battery.level * 100);
          const charging = battery.charging;
          
          let warning = null;
          if (level < 20 && !charging) {
            warning = 'Low battery. Consider charging before uploading large files.';
          } else if (level < 50 && !charging) {
            warning = 'Battery getting low. Plug in charger for large uploads.';
          }

          resolve({ level, charging, warning });
        }).catch(() => {
          resolve({ level: null, charging: null, warning: null });
        });
      } else {
        resolve({ level: null, charging: null, warning: null });
      }
    });
  }

  // Get comprehensive mobile upload readiness
  static async getMobileReadiness(): Promise<{
    isMobile: boolean;
    connection: any;
    storage: any;
    battery: any;
    overallRecommendation: string;
    readinessScore: number; // 0-100
  }> {
    const isMobile = this.isMobileDevice();
    const [connection, storage, battery] = await Promise.all([
      this.assessConnectionQuality(),
      this.checkStorageSpace(),
      this.getBatteryInfo()
    ]);

    // Calculate readiness score
    let score = 50; // Base score

    // Connection score
    if (connection.quality === 'excellent') score += 30;
    else if (connection.quality === 'good') score += 20;
    else if (connection.quality === 'poor') score -= 20;

    // Battery score
    if (battery.level) {
      if (battery.level > 70) score += 15;
      else if (battery.level > 30) score += 5;
      else if (battery.level < 20) score -= 25;
    }
    
    if (battery.charging) score += 10;

    // Storage score
    if (storage.available) {
      if (storage.available > 2) score += 5;
      else if (storage.available < 0.5) score -= 15;
    }

    // Overall recommendation
    let overallRecommendation = '';
    if (score >= 80) {
      overallRecommendation = '🚀 Perfect conditions for uploading! Go ahead with confidence.';
    } else if (score >= 60) {
      overallRecommendation = '✅ Good conditions for uploading. Should work well.';
    } else if (score >= 40) {
      overallRecommendation = '⚠️ Fair conditions. Consider smaller files or Wi-Fi.';
    } else {
      overallRecommendation = '❌ Poor conditions. Recommend improving connection/battery first.';
    }

    return {
      isMobile,
      connection,
      storage,
      battery,
      overallRecommendation,
      readinessScore: Math.max(0, Math.min(100, score))
    };
  }
}