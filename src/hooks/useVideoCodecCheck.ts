'use client';

import { useState, useCallback } from 'react';

export interface VideoCodecInfo {
  codec: string;
  isH265: boolean;
  canPlay: boolean;
  extension: string;
  recommendation?: string;
}

export function useVideoCodecCheck() {
  const [checkedUrls, setCheckedUrls] = useState<Record<string, VideoCodecInfo>>({});

  const checkCodec = useCallback(async (videoUrl: string): Promise<VideoCodecInfo | null> => {
    // Return cached result if available
    if (checkedUrls[videoUrl]) {
      return checkedUrls[videoUrl];
    }

    try {
      const response = await fetch('/api/check-video-codec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl })
      });

      if (!response.ok) {
        console.warn('Failed to check video codec');
        return null;
      }

      const data = await response.json() as VideoCodecInfo;
      
      // Cache the result
      setCheckedUrls(prev => ({
        ...prev,
        [videoUrl]: data
      }));

      console.log('🎬 Video codec check:', {
        url: videoUrl.substring(0, 80),
        codec: data.codec,
        canPlay: data.canPlay,
        isH265: data.isH265
      });

      return data;
    } catch (error) {
      console.error('Error checking video codec:', error);
      return null;
    }
  }, [checkedUrls]);

  return { checkCodec, checkedUrls };
}
