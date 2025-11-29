'use client';

import { useState, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
// Import all YARL plugins
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Download from 'yet-another-react-lightbox/plugins/download';
import Share from 'yet-another-react-lightbox/plugins/share';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Inline from 'yet-another-react-lightbox/plugins/inline';
// Import plugin CSS styles
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import type { GalleryItem, LightboxProps } from './types';

/**
 * YARL Lightbox Component with Full Plugin Suite
 * Uses yet-another-react-lightbox with all available plugins:
 * - Thumbnails: Bottom thumbnail strip for quick navigation
 * - Zoom: Mouse wheel zoom on images
 * - Captions: Display image titles/descriptions
 * - Fullscreen: Toggle fullscreen viewing
 * - Counter: Image counter (X of Y)
 * - Download: Download individual images
 * - Share: Share via social media and copy link
 * - Slideshow: Auto-advance through images
 * - Inline: Display images inline without modal
 * Videos are rendered in a custom HTML5 player
 */

function isVideoItem(item: GalleryItem): boolean {
  return !!(item.isVideo || item.type === 'video' || item.mimeType?.startsWith('video/'));
}

function getPlaybackUrl(item: GalleryItem): string {
  return item.url || '';
}

function getThumbnailUrl(item: GalleryItem): string {
  return item.thumb || item.poster || item.url || '';
}

export default function YarlLightbox({
  items,
  open,
  index,
  onClose,
  onIndexChange,
  eventName,
}: LightboxProps) {
  const [videoIndex, setVideoIndex] = useState(-1);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Use effect to handle video modal when opening a video
  useEffect(() => {
    if (open && index >= 0 && items && items.length > 0 && items[index] && isVideoItem(items[index])) {
      setVideoIndex(index);
      setShowVideoModal(true);
    } else if (!open) {
      setShowVideoModal(false);
      setVideoIndex(-1);
    }
  }, [open, index]);

  // Early return AFTER all hooks
  if (!items || items.length === 0) {
    return null;
  }

  // Separate videos and images
  const videoItems = items.filter(isVideoItem);
  const imageItems = items.filter(item => !isVideoItem(item));

  // Map items to YARL format (images only)
  const yarlSlides = imageItems.map(item => ({
    src: item.url || '',
    alt: item.title || item.filename || '',
    width: item.width || 1920,
    height: item.height || 1080,
  }));

  return (
    <>
      {/* Video Modal */}
      {showVideoModal && videoIndex >= 0 && isVideoItem(items[videoIndex]) && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowVideoModal(false);
                setVideoIndex(-1);
                onClose();
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Container */}
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                key={items[videoIndex].url}
                controls
                autoPlay
                className="w-full h-auto max-h-[70vh] object-contain"
              >
                <source src={getPlaybackUrl(items[videoIndex])} type={items[videoIndex].mimeType || 'video/mp4'} />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Title */}
            {items[videoIndex].title && (
              <div className="mt-4 text-white text-center">
                <h3 className="text-lg font-semibold">{items[videoIndex].title}</h3>
              </div>
            )}

            {/* Navigation */}
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Lightbox (only for images) */}
      {imageItems.length > 0 && (
        <Lightbox
          open={open && !showVideoModal}
          close={onClose}
          slides={yarlSlides}
          index={index}
          plugins={[
            Thumbnails,
            Zoom,
            Captions,
            Fullscreen,
            Counter,
            Download,
            Share,
            Slideshow,
            Inline,
          ]}
          on={{
            view: ({ index: currentIndex }) => {
              onIndexChange?.(currentIndex);
            },
          }}
          styles={{
            container: {
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
            },
          }}
          thumbnails={{
            position: 'bottom',
            width: 120,
            height: 100,
            border: 1,
            borderColor: '#666',
            borderRadius: 4,
            padding: 4,
            gap: 16,
          }}
          zoom={{
            maxZoomPixelRatio: 10,
            wheelZoomDistanceFactor: 100,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            doubleClickMaxStops: 2,
            scrollToZoom: true,
          }}
          counter={{}}
          captions={{}}
          slideshow={{}}
        />
      )}
    </>
  );
}
