'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Gallery, Item } from 'react-photoswipe-gallery';
import 'photoswipe/dist/photoswipe.css';
import type { GalleryItem, LightboxProps } from './types';

/**
 * Lightbox Component using PhotoSwipe v5
 * Clean, native HTML5 video support with no encoding hacks
 */

// Helper function to detect video URLs
function isVideoUrl(url: string): boolean {
  const videoExtensions = ['mp4', 'm4v', 'webm', 'ogv', 'ogg', 'mov', 'avi', 'mkv', '3gp', 'wmv', 'flv'];
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  return videoExtensions.includes(ext);
}

// Helper to get video dimensions (default to 16:9 aspect ratio)
function getMediaDimensions(item: GalleryItem): { width: number; height: number } {
  if (item.width && item.height) {
    return { width: item.width, height: item.height };
  }

  // Default to 1920x1080 for videos, will be auto-adjusted by PhotoSwipe
  const isVideo = item.isVideo || item.type === 'video' || isVideoUrl(item.url);
  return isVideo
    ? { width: 1920, height: 1080 }
    : { width: 1200, height: 800 };
}

const Lightbox = forwardRef<any, LightboxProps>(({
  items,
  open,
  index,
  onClose,
  onIndexChange,
  eventName = ''
}, ref) => {
  const galleryRef = useRef<any>(null);
  const isOpenRef = useRef(false);

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    open: (idx: number) => {
      if (galleryRef.current && !isOpenRef.current) {
        isOpenRef.current = true;
        // PhotoSwipe will open via the click handlers on Item components
      }
    },
    close: () => {
      isOpenRef.current = false;
      onClose();
    }
  }));

  // Handle open/close from props
  useEffect(() => {
    if (open && !isOpenRef.current) {
      isOpenRef.current = true;
      // Trigger click on the specific item to open PhotoSwipe
      const itemButton = document.querySelector(`[data-pswp-index="${index}"]`);
      if (itemButton instanceof HTMLElement) {
        itemButton.click();
      }
    } else if (!open && isOpenRef.current) {
      isOpenRef.current = false;
    }
  }, [open, index]);

  return (
    <Gallery
      ref={galleryRef}
      options={{
        counter: true,
        zoom: true,
        closeOnVerticalDrag: true,
        showHideAnimationType: 'fade',
        bgOpacity: 0.95,
        spacing: 0.1,
        allowPanToNext: true,
        loop: true,
        pinchToClose: true,
        closeOnScroll: false,
        arrowKeys: true,
        preload: [1, 2], // Preload 1 prev and 2 next slides
      }}
      onBeforeOpen={() => {
        isOpenRef.current = true;
      }}
      onClose={() => {
        isOpenRef.current = false;
        onClose();
      }}
    >
      {items.map((item, idx) => {
        const isVideo = item.isVideo || item.type === 'video' || isVideoUrl(item.url);
        const dimensions = getMediaDimensions(item);
        const caption = item.title || item.filename || '';

        if (isVideo) {
          // Video item with HTML5 video element
          return (
            <Item
              key={item.id}
              html={`
                <div class="pswp__video-wrapper" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000;">
                  <video
                    class="pswp__video"
                    controls
                    playsinline
                    preload="metadata"
                    ${item.poster ? `poster="${item.poster}"` : ''}
                    style="width:100%;height:auto;max-height:90vh;object-fit:contain;"
                  >
                    <source src="${item.url}" type="video/mp4" />
                    <source src="${item.url}" type="video/webm" />
                    Your browser doesn't support HTML5 video.
                  </video>
                </div>
              `}
              width={dimensions.width}
              height={dimensions.height}
              caption={caption}
            >
              {({ ref, open }) => (
                <button
                  ref={ref as any}
                  onClick={open}
                  data-pswp-index={idx}
                  style={{ display: 'none' }}
                  aria-label={`Open video ${caption}`}
                />
              )}
            </Item>
          );
        } else {
          // Image item
          return (
            <Item
              key={item.id}
              original={item.url}
              thumbnail={item.thumb || item.url}
              width={dimensions.width}
              height={dimensions.height}
              caption={caption}
            >
              {({ ref, open }) => (
                <button
                  ref={ref as any}
                  onClick={open}
                  data-pswp-index={idx}
                  style={{ display: 'none' }}
                  aria-label={`Open image ${caption}`}
                />
              )}
            </Item>
          );
        }
      })}
    </Gallery>
  );
});

Lightbox.displayName = 'Lightbox';

export default Lightbox;
