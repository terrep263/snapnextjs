'use client';

import Lightbox, { SlideImage, SlideVideo } from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Download from 'yet-another-react-lightbox/plugins/download';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Share from 'yet-another-react-lightbox/plugins/share';
// Note: Video plugin removed - using custom native video render instead

// CSS imports
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/counter.css';

export interface LightboxSlide {
  id: string;
  src: string;
  alt?: string;
  title?: string;
  type?: 'image' | 'video';
  width?: number;
  height?: number;
  poster?: string;
}

interface AppLightboxProps {
  slides: LightboxSlide[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  showThumbnails?: boolean;
  showDownload?: boolean;
  showShare?: boolean;
  showZoom?: boolean;
  showFullscreen?: boolean;
  showSlideshow?: boolean;
  eventName?: string;
  eventCode?: string;
}

// Check if URL is a video based on extension
function isVideoUrl(url: string): boolean {
  const videoExtensions = ['mp4', 'm4v', 'webm', 'ogv', 'ogg', 'mov', 'avi', 'mkv', '3gp', 'wmv', 'flv'];
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  return videoExtensions.includes(ext);
}

// Detect video MIME type from URL
function getVideoMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  const mimeTypes: Record<string, string> = {
    'mp4': 'video/mp4',
    'm4v': 'video/mp4',
    'webm': 'video/webm',
    'ogv': 'video/ogg',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
  };
  return mimeTypes[ext] || 'video/mp4';
}

// Transform our slide format to yet-another-react-lightbox format
function transformSlide(slide: LightboxSlide): SlideImage | SlideVideo {
  // Check if video either by explicit type or URL extension
  const isVideo = slide.type === 'video' || isVideoUrl(slide.src);
  
  if (isVideo) {
    const mimeType = getVideoMimeType(slide.src);
    
    // Provide multiple source formats for better compatibility
    const sources = [
      { src: slide.src, type: mimeType },
    ];
    
    // If not mp4, also add mp4 as fallback (browser will try in order)
    if (mimeType !== 'video/mp4') {
      sources.push({ src: slide.src, type: 'video/mp4' });
    }
    
    return {
      type: 'video',
      sources,
      poster: slide.poster || undefined,
      // Use larger default dimensions for better display
      width: slide.width || 1920,
      height: slide.height || 1080,
    } as SlideVideo;
  }
  
  return {
    src: slide.src,
    alt: slide.alt || slide.title || 'Image',
    title: slide.title,
    width: slide.width,
    height: slide.height,
  } as SlideImage;
}

export default function AppLightbox({
  slides,
  open,
  index,
  onClose,
  onIndexChange,
  showThumbnails = true,
  showDownload = true,
  showShare = true,
  showZoom = true,
  showFullscreen = true,
  showSlideshow = true,
  eventName = '',
  eventCode = '',
}: AppLightboxProps) {
  // Build plugins array based on props
  const plugins = [];
  
  if (showZoom) plugins.push(Zoom);
  if (showDownload) plugins.push(Download);
  if (showThumbnails) plugins.push(Thumbnails);
  if (showFullscreen) plugins.push(Fullscreen);
  if (showSlideshow) plugins.push(Slideshow);
  if (showShare) plugins.push(Share);
  
  // Always include Counter (NOT Video - we use custom render for videos)
  plugins.push(Counter);

  // Transform slides and log for debugging
  const transformedSlides = slides.map((slide, i) => {
    const transformed = transformSlide(slide);
    if (slide.type === 'video' || isVideoUrl(slide.src)) {
      console.log(`🎬 Video slide ${i}:`, { 
        originalType: slide.type,
        src: slide.src,
        transformed 
      });
    }
    return transformed;
  });

  // Log video count
  const videoCount = transformedSlides.filter(s => s.type === 'video').length;
  if (videoCount > 0) {
    console.log(`📹 AppLightbox: ${videoCount} videos out of ${transformedSlides.length} total slides`);
  }

  // Handle download with custom filename
  const handleDownload = async ({ slide, saveAs }: { slide: SlideImage | SlideVideo; saveAs: (source: string, name: string) => void }) => {
    const slideIndex = transformedSlides.indexOf(slide);
    const originalSlide = slides[slideIndex];
    const filename = originalSlide?.title || originalSlide?.alt || `${eventName}-${slideIndex + 1}`;
    const src = 'src' in slide ? slide.src : slide.sources?.[0]?.src || '';
    
    // Trigger download
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to saveAs
      saveAs(src, filename);
    }
  };

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={transformedSlides}
      on={{
        view: ({ index: currentIndex }) => onIndexChange?.(currentIndex),
      }}
      plugins={plugins}
      download={{ download: handleDownload }}
      share={{
        share: async ({ slide }) => {
          const slideIndex = transformedSlides.indexOf(slide);
          const originalSlide = slides[slideIndex];
          const src = 'src' in slide ? slide.src : slide.sources?.[0]?.src || '';
          const title = `${eventName}${eventCode ? ` | Code: ${eventCode}` : ''}`;
          
          if (navigator.share) {
            try {
              await navigator.share({
                title,
                text: `Check out this ${originalSlide?.type === 'video' ? 'video' : 'photo'} from ${eventName}!`,
                url: src,
              });
            } catch (error) {
              if (error instanceof Error && error.name !== 'AbortError') {
                // Fallback to clipboard
                navigator.clipboard.writeText(src);
                alert('Link copied to clipboard!');
              }
            }
          } else {
            navigator.clipboard.writeText(src);
            alert('Link copied to clipboard!');
          }
        },
      }}
      thumbnails={{
        position: 'bottom',
        width: 120,
        height: 80,
        border: 2,
        borderRadius: 4,
        padding: 4,
        gap: 8,
        showToggle: true,
      }}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      slideshow={{
        autoplay: false,
        delay: 5000,
      }}
      video={{
        autoPlay: false,
        controls: true,
        playsInline: true,
        preload: 'auto',
        muted: false,
        crossOrigin: undefined,
      }}
      carousel={{
        finite: false,
        preload: 2,
        padding: '16px',
      }}
      animation={{
        fade: 300,
        swipe: 300,
      }}
      controller={{
        closeOnBackdropClick: true,
        closeOnPullDown: true,
        closeOnPullUp: true,
      }}
      styles={{
        container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
        slide: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
      render={{
        buttonPrev: slides.length <= 1 ? () => null : undefined,
        buttonNext: slides.length <= 1 ? () => null : undefined,
        // Custom video render - bypasses Video plugin entirely
        slide: ({ slide, rect }) => {
          // Check if this is a video slide
          const isVideoSlide = slide.type === 'video' || ('sources' in slide && Array.isArray(slide.sources));
          
          if (isVideoSlide && 'sources' in slide) {
            const videoSrc = slide.sources?.[0]?.src || '';
            console.log('🎥 Rendering video with native element:', videoSrc);
            return (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                padding: '16px'
              }}>
                <video
                  src={videoSrc}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              </div>
            );
          }
          // Return undefined to use default rendering for images
          return undefined;
        },
      }}
    />
  );
}
