'use client';

import { useEffect, useRef, useState } from 'react';
import PhotoSwipeLightboxCore from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import type { GalleryItem, LightboxProps } from './types';

/**
 * PhotoSwipe v5 Lightbox Component
 * Drop-in replacement for YarlLightbox with better performance and mobile support
 */

function isVideoItem(item: GalleryItem): boolean {
  return !!(item.isVideo || item.type === 'video' || item.mimeType?.startsWith('video/'));
}

export default function PhotoSwipeLightbox({ items, open, index, onClose, onIndexChange }: LightboxProps) {
  const [videoIndex, setVideoIndex] = useState(-1);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoCodecInfo, setVideoCodecInfo] = useState<Record<string, any>>({});
  const lightboxRef = useRef<PhotoSwipeLightboxCore | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(index);

  // Separate images and videos
  const imageItems = items.filter(item => !isVideoItem(item));
  const videoItems = items.filter(isVideoItem);

  // Create index mapping
  const imageIndexMap: Record<number, number> = {};
  const imageReverseMap: Record<number, number> = {};
  let imageCounter = 0;
  items.forEach((item, itemIndex) => {
    if (!isVideoItem(item)) {
      imageIndexMap[itemIndex] = imageCounter;
      imageReverseMap[imageCounter] = itemIndex;
      imageCounter += 1;
    }
  });

  const photoswipeIndex = imageIndexMap[index] ?? 0;

  // Handle video modal
  useEffect(() => {
    if (open && index >= 0 && items && items.length > 0 && items[index] && isVideoItem(items[index])) {
      console.log('🎬 Opening video modal for index:', index);
      setVideoIndex(index);
      setShowVideoModal(true);

      const videoUrl = items[index].url;
      if (videoUrl && !videoCodecInfo[videoUrl]) {
        fetch(`/api/get-video-info?url=${encodeURIComponent(videoUrl)}`)
          .then(res => res.json())
          .then(data => {
            setVideoCodecInfo(prev => ({ ...prev, [videoUrl]: data }));
          })
          .catch(err => console.error('Video codec check failed:', err));
      }
    } else if (open && index >= 0) {
      console.log('📸 Opening lightbox for image at index:', index);
      setShowVideoModal(false);
      setVideoIndex(-1);
    } else {
      setShowVideoModal(false);
      setVideoIndex(-1);
    }
  }, [open, index, items]);

  // Initialize PhotoSwipe when needed
  useEffect(() => {
    if (!galleryRef.current || imageItems.length === 0) return;

    // Prepare slides for PhotoSwipe
    const dataSource = imageItems.map(item => ({
      src: item.url || '',
      width: item.width || 1920,
      height: item.height || 1080,
      alt: item.title || item.filename || '',
    }));

    // Initialize PhotoSwipe
    const lightbox = new PhotoSwipeLightboxCore({
      dataSource,
      pswpModule: PhotoSwipe,
      // Options
      bgOpacity: 0.95,
      spacing: 0.1,
      allowPanToNext: true,
      zoom: true,
      pinchToClose: true,
      closeOnVerticalDrag: true,
      // UI
      showHideAnimationType: 'fade',
      // Callbacks
      index: photoswipeIndex,
    });

    // Handle slide change
    lightbox.on('change', () => {
      const pswp = lightbox.pswp;
      if (pswp) {
        const currentSlideIndex = pswp.currIndex;
        const mappedBack = imageReverseMap[currentSlideIndex];
        if (mappedBack !== undefined && onIndexChange) {
          currentIndexRef.current = mappedBack;
          onIndexChange(mappedBack);
        }
      }
    });

    // Handle close
    lightbox.on('close', () => {
      onClose();
    });

    lightbox.init();
    lightboxRef.current = lightbox;

    // Open if needed
    if (open && !showVideoModal) {
      lightbox.loadAndOpen(photoswipeIndex);
    }

    return () => {
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
        lightboxRef.current = null;
      }
    };
  }, [imageItems.length]); // Only re-init if items change

  // Control opening/closing
  useEffect(() => {
    if (!lightboxRef.current) return;

    if (open && !showVideoModal && imageItems.length > 0) {
      // Open or change slide
      if (!lightboxRef.current.pswp) {
        lightboxRef.current.loadAndOpen(photoswipeIndex);
      } else if (lightboxRef.current.pswp.currIndex !== photoswipeIndex) {
        lightboxRef.current.pswp.goTo(photoswipeIndex);
      }
    } else if (lightboxRef.current.pswp) {
      // Close
      lightboxRef.current.pswp.close();
    }
  }, [open, showVideoModal, photoswipeIndex]);

  if (!items || items.length === 0) {
    console.warn('⚠️ PhotoSwipeLightbox: No items provided');
    return null;
  }

  return (
    <>
      {/* Hidden gallery container for PhotoSwipe */}
      <div ref={galleryRef} style={{ display: 'none' }} />

      {/* Video Modal (same as YARL implementation) */}
      {showVideoModal && videoIndex >= 0 && isVideoItem(items[videoIndex]) && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => {
                setShowVideoModal(false);
                setVideoIndex(-1);
                onClose();
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 z-10"
              aria-label="Close video"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="bg-black rounded-lg overflow-hidden">
              {videoCodecInfo[items[videoIndex]?.url] && !videoCodecInfo[items[videoIndex]?.url].isCompatible && (
                <div className="bg-yellow-900/80 text-yellow-100 p-3 text-sm">
                  <strong>⚠️ Codec Warning:</strong> {videoCodecInfo[items[videoIndex]?.url].message}
                  <br />
                  <span className="text-xs">
                    Detected: {videoCodecInfo[items[videoIndex]?.url].codec} | File size: {videoCodecInfo[items[videoIndex]?.url].contentLengthMB} MB
                  </span>
                </div>
              )}

              <video
                key={items[videoIndex].url}
                muted
                controls
                autoPlay
                className="w-full h-auto max-h-[70vh] object-contain bg-black"
                playsInline
                controlsList="nodownload"
                crossOrigin="anonymous"
                onError={(e) => {
                  const video = e.target as HTMLVideoElement;
                  const errorMessages: Record<number, string> = {
                    0: 'UNKNOWN_ERROR or not set',
                    1: 'MEDIA_ERR_ABORTED',
                    2: 'MEDIA_ERR_NETWORK',
                    3: 'MEDIA_ERR_DECODE - cannot decode codec/format',
                    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - unsupported format/source'
                  };
                  const errorCode = video.error?.code || 0;
                  const errorName = errorMessages[errorCode] || 'UNKNOWN_ERROR';
                  console.error(
                    `❌ VIDEO ERROR: ${errorName} (Code ${errorCode}) | readyState=${video.readyState} networkState=${video.networkState} | src=${video.currentSrc}`,
                    video.error
                  );
                }}
              >
                <source src={items[videoIndex].url} type="video/mp4; codecs='avc1.42E01E'" />
                <source src={items[videoIndex].url} type="video/mp4" />
                <source src={items[videoIndex].url} type="video/webm" />
                <p className="text-white text-center p-4">⚠️ Your browser cannot play this video. Try downloading it instead.</p>
              </video>
            </div>

            {items[videoIndex].title && (
              <div className="mt-4 text-white text-center">
                <h3 className="text-lg font-semibold">{items[videoIndex].title}</h3>
              </div>
            )}

            {/* Video Navigation */}
            {videoItems.length > 1 && (
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => {
                    const currentVideoPos = videoItems.findIndex(v => v.id === items[videoIndex].id);
                    if (currentVideoPos > 0) {
                      const prevVideoIndex = items.indexOf(videoItems[currentVideoPos - 1]);
                      setVideoIndex(prevVideoIndex);
                    }
                  }}
                  disabled={videoItems.findIndex(v => v.id === items[videoIndex].id) === 0}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-white text-sm">
                  {videoItems.findIndex(v => v.id === items[videoIndex].id) + 1} of {videoItems.length}
                </span>
                <button
                  onClick={() => {
                    const currentVideoPos = videoItems.findIndex(v => v.id === items[videoIndex].id);
                    if (currentVideoPos < videoItems.length - 1) {
                      const nextVideoIndex = items.indexOf(videoItems[currentVideoPos + 1]);
                      setVideoIndex(nextVideoIndex);
                    }
                  }}
                  disabled={videoItems.findIndex(v => v.id === items[videoIndex].id) === videoItems.length - 1}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
