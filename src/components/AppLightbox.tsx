'use client';

import Lightbox, { Slide, SlideImage } from 'yet-another-react-lightbox';
// Not using Video plugin - using custom render.slide for better cross-browser compatibility
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Download from 'yet-another-react-lightbox/plugins/download';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Share from 'yet-another-react-lightbox/plugins/share';

// CSS imports
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/counter.css';

// Define video slide type (not exported from the library)
interface SlideVideo {
  type: 'video';
  sources: Array<{ src: string; type: string }>;
  poster?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  controls?: boolean;
}

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
// Videos are treated as images with special src that we detect in render
function transformSlide(slide: LightboxSlide): Slide {
  // All slides are images - we handle video rendering in the custom render.slide
  return {
    src: slide.src,
    alt: slide.alt || slide.title || 'Image',
    width: slide.width || 1920,
    height: slide.height || 1080,
  };
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
  
  // Always include Counter plugin
  // NOTE: Not using Video plugin - using custom render.slide instead for better compatibility
  plugins.push(Counter);

  // Transform slides for lightbox
  const transformedSlides = slides.map(slide => transformSlide(slide));

  // Handle download with custom filename
  const handleDownload = async ({ slide, saveAs }: { slide: Slide; saveAs: (source: string, name: string) => void }) => {
    const slideIndex = transformedSlides.indexOf(slide);
    const originalSlide = slides[slideIndex];
    const filename = originalSlide?.title || originalSlide?.alt || `${eventName}-${slideIndex + 1}`;
    const src = 'src' in slide ? slide.src : '';
    
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
          const src = 'src' in slide ? slide.src : '';
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
      // Not using video plugin config - using custom render.slide instead
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
        // Custom render for video slides - detect by URL extension or original slide type
        slide: ({ slide, rect }) => {
          // Get the src from the slide
          const src = 'src' in slide ? slide.src : '';
          
          // Find the original slide to check if it was marked as video
          const slideIndex = transformedSlides.findIndex(s => 'src' in s && s.src === src);
          const originalSlide = slideIndex >= 0 ? slides[slideIndex] : null;
          const isVideo = originalSlide?.type === 'video' || isVideoUrl(src);
          
          console.log('🎬 Rendering slide:', { src, isVideo, originalType: originalSlide?.type });
          
          if (isVideo) {
            const mimeType = getVideoMimeType(src);
            console.log('🎥 Rendering video with custom element:', src, mimeType);
            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  padding: '20px',
                }}
              >
                <video
                  key={src}
                  controls
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    width: 'auto',
                    height: 'auto',
                    backgroundColor: '#000',
                  }}
                  onLoadStart={() => console.log('🎬 Video loadstart')}
                  onLoadedMetadata={(e) => {
                    console.log('🎬 Video metadata loaded:', (e.target as HTMLVideoElement).videoWidth, 'x', (e.target as HTMLVideoElement).videoHeight);
                    // Unmute after a short delay once video is ready
                    setTimeout(() => {
                      const video = e.target as HTMLVideoElement;
                      video.muted = false;
                    }, 100);
                  }}
                  onError={(e) => console.error('🎬 Video error:', e)}
                  onPlay={() => console.log('🎬 Video playing')}
                >
                  <source src={src} type={mimeType} />
                  Your browser does not support the video tag.
                </video>
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
