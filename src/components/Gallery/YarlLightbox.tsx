'use client';

import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import type { GalleryItem, LightboxProps } from './types';

/**
 * YARL Lightbox Component
 * Uses yet-another-react-lightbox for image viewing
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

  if (!items || items.length === 0) {
    return null;
  }

  // Separate videos and images
  const videoItems = items.filter(isVideoItem);
  const imageItems = items.filter(item => !isVideoItem(item));

  // Handle item click - if it's a video, show custom modal
  const handleItemClick = (itemIndex: number) => {
    if (isVideoItem(items[itemIndex])) {
      setVideoIndex(itemIndex);
      setShowVideoModal(true);
    } else {
      onIndexChange?.(itemIndex);
    }
  };

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
        />
      )}
    </>
  );
}
