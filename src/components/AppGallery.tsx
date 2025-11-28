'use client';

import { useEffect, useRef, useCallback } from 'react';
import LightGallery from 'lightgallery/react';
import type { LightGallery as LightGalleryType } from 'lightgallery/lightgallery';

// Import plugins
import lgVideo from 'lightgallery/plugins/video';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgZoom from 'lightgallery/plugins/zoom';
import lgShare from 'lightgallery/plugins/share';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

// Import styles
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-video.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-share.css';
import 'lightgallery/css/lg-fullscreen.css';

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
  const lightGalleryRef = useRef<LightGalleryType | null>(null);

  // Open gallery when `open` becomes true
  useEffect(() => {
    if (open && lightGalleryRef.current) {
      lightGalleryRef.current.openGallery(index);
    }
  }, [open, index]);

  const onInit = useCallback((detail: { instance: LightGalleryType }) => {
    lightGalleryRef.current = detail.instance;
    // If already open, open the gallery
    if (open) {
      detail.instance.openGallery(index);
    }
  }, [open, index]);

  const onAfterClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const onSlideChange = useCallback((detail: { index: number }) => {
    onIndexChange?.(detail.index);
  }, [onIndexChange]);

  // Transform items to LightGallery format
  const galleryItems = items.map((item) => {
    const isVideo = item.type === 'video' || isVideoUrl(item.src);
    
    if (isVideo) {
      return {
        video: JSON.stringify({
          source: [{ src: item.src, type: 'video/mp4' }],
          attributes: { 
            preload: 'auto', 
            controls: true,
            playsinline: true,
          },
        }),
        thumb: item.thumb || item.poster || item.src,
        poster: item.poster || item.thumb,
        subHtml: item.title ? `<h4>${item.title}</h4>` : '',
      };
    }
    
    return {
      src: item.src,
      thumb: item.thumb || item.src,
      subHtml: item.title ? `<h4>${item.title}</h4>` : '',
    };
  });

  return (
    <LightGallery
      onInit={onInit}
      onAfterClose={onAfterClose}
      onAfterSlide={onSlideChange}
      speed={300}
      plugins={[lgVideo, lgThumbnail, lgZoom, lgShare, lgFullscreen]}
      dynamic={true}
      dynamicEl={galleryItems as any}
      download={true}
      counter={true}
      closable={true}
      swipeToClose={true}
      closeOnTap={true}
      videojs={false}
      videoMaxSize="1920-1080"
      loadYouTubePoster={false}
      mobileSettings={{
        controls: true,
        showCloseIcon: true,
        download: true,
      }}
    >
      {/* Hidden trigger - we control opening programmatically */}
    </LightGallery>
  );
}
