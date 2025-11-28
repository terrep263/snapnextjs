'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

export interface GalleryItem {
  id: string;
  src: string;
  thumb?: string;
  alt?: string;
  title?: string;
  type?: 'image' | 'video';
  poster?: string;
}

interface AppGalleryProps {
  items: GalleryItem[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  eventName?: string;
}

// Check if URL is a video based on extension
function isVideoUrl(url: string): boolean {
  const videoExtensions = ['mp4', 'm4v', 'webm', 'ogv', 'ogg', 'mov', 'avi', 'mkv', '3gp', 'wmv', 'flv'];
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  return videoExtensions.includes(ext);
}

export default function AppGallery({
  items,
  open,
  index,
  onClose,
  onIndexChange,
  eventName = '',
}: AppGalleryProps) {
  const fancyboxInstance = useRef<any>(null);
  const isOpenRef = useRef(false);

  // Transform items to Fancybox format
  const getGalleryItems = useCallback(() => {
    return items.map((item) => {
      const isVideo = item.type === 'video' || isVideoUrl(item.src);
      
      if (isVideo) {
        // Prevent Fancybox from trying to load video URL as image thumbnail
        // Use poster if available, otherwise use a data URL placeholder
        const videoThumb = item.poster || item.thumb || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23000" width="100" height="100"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="40"%3E▶%3C/text%3E%3C/svg%3E';

        return {
          src: item.src,
          type: 'html5video' as const,
          thumb: videoThumb,
          caption: item.title || '',
          poster: item.poster,
          html5video: {
            controls: true,
            playsinline: true,
            preload: 'metadata',
            style: 'width: 100%; height: auto; max-height: 90vh; object-fit: contain; background: #000;',
          },
        };
      }
      
      return {
        src: item.src,
        type: 'image' as const,
        thumb: item.thumb || item.src,
        caption: item.title || '',
      };
    });
  }, [items]);

  // Open Fancybox when `open` becomes true
  useEffect(() => {
    if (open && !isOpenRef.current && items.length > 0) {
      isOpenRef.current = true;
      
      const galleryItems = getGalleryItems();
      
      Fancybox.show(galleryItems, {
        startIndex: index,
        // Disable thumbnail generation to prevent video URL decoding errors
        Thumbs: false,
        // Ensure HTML5 video works properly
        Html: {
          videoAutoplay: false,
          videoTpl: '<video class="fancybox__html5video" playsinline controls controlsList="nodownload" poster="{{poster}}" width="1280" height="720" style="width:100%;height:auto;min-height:240px;max-height:90vh;object-fit:contain;background:#000;display:block;"><source src="{{src}}" type="video/mp4" /><source src="{{src}}" type="video/webm" /><source src="{{src}}" />Sorry, your browser doesn\'t support HTML5 video.</video>',
        },
        // Make sure video is visible
        animated: false,
        dragToClose: false,
        on: {
          close: () => {
            isOpenRef.current = false;
            onClose();
          },
          reveal: (fancybox: any, slide: any) => {
            // Force video to be visible after reveal
            if (slide.type === 'html5video') {
              const videoEl = slide.$el?.querySelector('video');
              if (videoEl) {
                videoEl.style.display = 'block';
                videoEl.style.visibility = 'visible';
                videoEl.style.opacity = '1';
                videoEl.style.zIndex = '9999';
                videoEl.style.minHeight = '240px';
                videoEl.style.minWidth = '320px';

                // Force video to load
                videoEl.load();

                console.log('🎬 Video element revealed:', {
                  src: videoEl.src,
                  videoWidth: videoEl.videoWidth,
                  videoHeight: videoEl.videoHeight,
                  clientWidth: videoEl.clientWidth,
                  clientHeight: videoEl.clientHeight,
                  readyState: videoEl.readyState,
                  networkState: videoEl.networkState,
                });
              }
            }
          },
          done: (fancybox: any, slide: any) => {
            // Additional check after everything is done
            if (slide.type === 'html5video') {
              const videoEl = slide.$el?.querySelector('video');
              if (videoEl) {
                const computed = window.getComputedStyle(videoEl);
                console.log('🎬 Video final state:', {
                  display: computed.display,
                  width: computed.width,
                  height: computed.height,
                  opacity: computed.opacity,
                  visibility: computed.visibility,
                });
              }
            }
          },
        },
      } as any);
    } else if (!open && isOpenRef.current) {
      // Close if open becomes false
      Fancybox.close();
      isOpenRef.current = false;
    }
  }, [open, index, items, getGalleryItems, onClose, onIndexChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Fancybox.close();
    };
  }, []);

  // This component doesn't render anything visible - Fancybox handles the UI
  return null;
}
