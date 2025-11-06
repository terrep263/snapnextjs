'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoThumbnailProps {
  videoUrl: string;
  alt: string;
  className?: string;
  onError?: (error: Error) => void;
}

/**
 * Component that extracts a thumbnail frame from a video file
 * Uses canvas + video element to get the first frame at 1 second
 */
export default function VideoThumbnail({
  videoUrl,
  alt,
  className = 'w-full h-full object-cover',
  onError
}: VideoThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoUrl) {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setIsLoading(false);
      return;
    }

    const handleLoadedMetadata = () => {
      try {
        // Set video to 1 second mark to get a meaningful frame
        video.currentTime = Math.min(1, video.duration / 2);
      } catch (err) {
        console.error('Error setting video time:', err);
        if (onError && err instanceof Error) onError(err);
        setIsLoading(false);
      }
    };

    const handleSeeked = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0);

        const url = canvas.toDataURL('image/jpeg', 0.8);
        setThumbnailUrl(url);
        setIsLoading(false);

        // Clean up
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('seeked', handleSeeked);
      } catch (err) {
        console.error('Error generating thumbnail:', err);
        if (onError && err instanceof Error) onError(err);
        setIsLoading(false);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);

    try {
      video.src = videoUrl;
    } catch (err) {
      console.error('Error setting video src:', err);
      if (onError && err instanceof Error) onError(err);
      setIsLoading(false);
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [videoUrl, onError]);

  return (
    <>
      {/* Hidden video element for thumbnail extraction */}
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />

      {/* Hidden canvas for frame capture */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Display the thumbnail */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          className={className}
          onError={() => {
            console.warn(`Failed to load generated thumbnail for ${alt}`);
          }}
        />
      ) : (
        <div className={`${className} bg-gray-700 flex items-center justify-center`}>
          {isLoading ? (
            <div className="text-gray-500">
              <span className="text-2xl animate-pulse">🎥</span>
            </div>
          ) : (
            <span className="text-2xl">🎥</span>
          )}
        </div>
      )}
    </>
  );
}
