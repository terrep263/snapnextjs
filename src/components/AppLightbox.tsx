'use client';

import Lightbox, { SlideImage, SlideVideo } from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Download from 'yet-another-react-lightbox/plugins/download';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Video from 'yet-another-react-lightbox/plugins/video';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Share from 'yet-another-react-lightbox/plugins/share';

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

// Transform our slide format to yet-another-react-lightbox format
function transformSlide(slide: LightboxSlide): SlideImage | SlideVideo {
  if (slide.type === 'video') {
    return {
      type: 'video',
      sources: [
        {
          src: slide.src,
          type: 'video/mp4',
        },
      ],
      poster: slide.poster,
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
  
  // Always include Counter and Video
  plugins.push(Counter, Video);

  // Transform slides
  const transformedSlides = slides.map(transformSlide);

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
        autoPlay: true,
        controls: true,
        playsInline: true,
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
      }}
      render={{
        buttonPrev: slides.length <= 1 ? () => null : undefined,
        buttonNext: slides.length <= 1 ? () => null : undefined,
      }}
    />
  );
}
