'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GalleryItem } from './types';
import { EventData, getPackageType } from '@/lib/gallery-utils';

export interface FullScreenLightboxProps {
  items: GalleryItem[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  event?: EventData;
  onDownload?: (item: GalleryItem, event?: EventData) => void;
  onShare?: (item: GalleryItem, event?: EventData) => void;
  onFavorite?: (item: GalleryItem, favorited: boolean) => void;
  isAdmin?: boolean;
  isOwner?: boolean;
  onModerate?: (item: GalleryItem, action: string) => void;
}

/**
 * FullScreenLightbox Component
 * 
 * Full-screen lightbox with:
 * - Progressive image loading
 * - Video player with controls
 * - Keyboard navigation (arrows, ESC, space)
 * - Swipe gestures on mobile
 * - Metadata display with toggle
 * - Actions bar (Download, Share, Info, Favorite)
 * - Prefetching of adjacent items
 */
export default function FullScreenLightbox({
  items,
  index,
  open,
  onClose,
  onIndexChange,
  event,
  onDownload,
  onShare,
  onFavorite,
  isAdmin = false,
  isOwner = false,
  onModerate,
}: FullScreenLightboxProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const prefetchedUrls = useRef<Set<string>>(new Set());

  const currentItem = items[index];
  const isVideo = currentItem?.isVideo;
  const packageType = event ? getPackageType(event) : 'basic';
  
  // Get download message based on package type
  const getDownloadMessage = () => {
    if (packageType === 'premium' && event?.watermark_enabled !== true) {
      return 'Download original file';
    }
    if (packageType === 'freebie') {
      return 'Download includes SnapWorxx watermark';
    }
    if (packageType === 'basic') {
      return 'Download includes SnapWorxx watermark';
    }
    return 'Download';
  };

  // Prefetch adjacent items (±1) and cleanup beyond ±3
  useEffect(() => {
    if (!open || items.length === 0) return;

    const prefetchRange = 3;
    const prefetchUrls: string[] = [];

    // Prefetch items within ±3 range
    for (let i = Math.max(0, index - prefetchRange); i <= Math.min(items.length - 1, index + prefetchRange); i++) {
      const item = items[i];
      if (item && !prefetchedUrls.current.has(item.url)) {
        prefetchUrls.push(item.url);
        prefetchedUrls.current.add(item.url);
      }
    }

    // Prefetch images
    prefetchUrls.forEach((url) => {
      if (!url.includes('video')) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      }
    });

    // Cleanup items beyond ±3
    const cleanupRange = 5;
    items.forEach((item, i) => {
      if (Math.abs(i - index) > cleanupRange && prefetchedUrls.current.has(item.url)) {
        prefetchedUrls.current.delete(item.url);
      }
    });

    return () => {
      // Cleanup prefetch links
      document.head.querySelectorAll('link[rel="prefetch"]').forEach((link) => {
        if (prefetchUrls.includes(link.getAttribute('href') || '')) {
          link.remove();
        }
      });
    };
  }, [open, index, items]);

  // Reset state when item changes
  useEffect(() => {
    if (open && currentItem) {
      setImageLoaded(false);
      setVideoPlaying(false);
      setFavorited(false); // Favorite state - to be implemented with API/localStorage
    }
  }, [open, currentItem?.id]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (index > 0) {
            onIndexChange(index - 1);
          }
          break;
        case 'ArrowRight':
          if (index < items.length - 1) {
            onIndexChange(index + 1);
          }
          break;
        case ' ':
          if (isVideo && videoRef.current) {
            e.preventDefault();
            if (videoPlaying) {
              videoRef.current.pause();
            } else {
              videoRef.current.play();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, index, items.length, isVideo, videoPlaying, onClose, onIndexChange]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  // Touch/swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartX.current || !touchStartY.current) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartX.current - touchEndX;
      const diffY = touchStartY.current - touchEndY;

      // Only handle horizontal swipes (ignore if vertical swipe is larger)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && index < items.length - 1) {
          // Swipe left - next
          onIndexChange(index + 1);
        } else if (diffX < 0 && index > 0) {
          // Swipe right - previous
          onIndexChange(index - 1);
        }
      }

      touchStartX.current = 0;
      touchStartY.current = 0;
    },
    [index, items.length, onIndexChange]
  );

  const handleDownload = useCallback(() => {
    if (currentItem && onDownload) {
      onDownload(currentItem, event);
    }
  }, [currentItem, event, onDownload]);

  const handleShare = useCallback(() => {
    if (currentItem && onShare) {
      onShare(currentItem, event);
    }
  }, [currentItem, event, onShare]);

  const handleFavorite = useCallback(() => {
    if (currentItem && onFavorite) {
      const newFavorited = !favorited;
      setFavorited(newFavorited);
      onFavorite(currentItem, newFavorited);
    }
  }, [currentItem, favorited, onFavorite]);

  const handleVideoPlay = useCallback(() => {
    setVideoPlaying(true);
  }, []);

  const handleVideoPause = useCallback(() => {
    setVideoPlaying(false);
  }, []);

  if (!open || !currentItem) return null;

  // Accessibility: Focus management
  useEffect(() => {
    if (open) {
      // Focus the lightbox container when opened
      const container = document.getElementById('lightbox-container');
      if (container) {
        container.focus();
      }
    }
  }, [open]);

  return (
    <div
      id="lightbox-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      tabIndex={-1}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white hover:text-gray-300 transition-colors rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Close lightbox"
        tabIndex={0}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Navigation Arrows */}
      {index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(index - 1);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 text-white hover:text-gray-300 transition-colors rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Previous image"
          tabIndex={0}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {index < items.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(index + 1);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 text-white hover:text-gray-300 transition-colors rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Next image"
          tabIndex={0}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Media Content */}
      <div
        className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={currentItem.url}
            controls
            autoPlay
            muted
            playsInline
            className="max-w-full max-h-[95vh] rounded-lg"
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
          />
        ) : (
          <div className="relative">
            {/* Blurred placeholder */}
            {!imageLoaded && currentItem.thumbnail_url && (
              <img
                src={currentItem.thumbnail_url}
                alt={currentItem.alt || currentItem.filename || 'Loading'}
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-110"
              />
            )}
            {/* Main image */}
            <img
              src={currentItem.url}
              alt={currentItem.alt || currentItem.filename || 'Photo'}
              className={`max-w-full max-h-[95vh] object-contain rounded-lg transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              loading="eager"
            />
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="relative group p-2 text-white hover:text-gray-300 transition-colors rounded-lg hover:bg-white/10"
          aria-label={getDownloadMessage()}
          title={getDownloadMessage()}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-black/80 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {getDownloadMessage()}
          </span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          className="p-2 text-white hover:text-gray-300 transition-colors rounded-lg hover:bg-white/10"
          aria-label="Share"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMetadata(!showMetadata);
          }}
          className={`p-2 transition-colors rounded-lg hover:bg-white/10 ${
            showMetadata ? 'text-purple-400' : 'text-white hover:text-gray-300'
          }`}
          aria-label="Toggle info"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {onFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFavorite();
            }}
            className={`p-2 transition-colors rounded-lg hover:bg-white/10 ${
              favorited ? 'text-yellow-400' : 'text-white hover:text-gray-300'
            }`}
            aria-label="Favorite"
          >
            <svg
              className="w-5 h-5"
              fill={favorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        )}

        {/* Moderation Controls - Admin and Owner */}
        {(isAdmin || isOwner) && onModerate && (
          <>
            <div className="w-px h-6 bg-white/30 mx-1" />
            {isAdmin && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Flag this photo as inappropriate?')) {
                      onModerate(currentItem, 'flag');
                    }
                  }}
                  className="relative group p-2 text-white hover:text-red-300 transition-colors rounded-lg hover:bg-white/10"
                  aria-label="Flag inappropriate"
                  title="Flag inappropriate"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                    />
                  </svg>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-black/80 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Flag inappropriate
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Remove this photo? It will be hidden from the gallery.')) {
                      onModerate(currentItem, 'remove');
                    }
                  }}
                  className="relative group p-2 text-white hover:text-red-400 transition-colors rounded-lg hover:bg-white/10"
                  aria-label="Remove photo"
                  title="Remove photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-black/80 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Remove photo
                  </span>
                </button>
              </>
            )}
            {(isAdmin || isOwner) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Hide this photo from public view?')) {
                    onModerate(currentItem, 'hide');
                  }
                }}
                className="relative group p-2 text-white hover:text-orange-300 transition-colors rounded-lg hover:bg-white/10"
                aria-label="Hide photo"
                title="Hide photo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-black/80 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Hide photo
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Metadata Overlay */}
      {showMetadata && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md rounded-lg px-4 py-3 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-white text-sm space-y-1">
            <div className="font-semibold text-base mb-2 truncate">
              {currentItem.filename || 'Untitled'}
            </div>
            {currentItem.created_at && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{formatDate(currentItem.created_at)}</span>
              </div>
            )}
            {currentItem.size && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
                <span>{formatFileSize(currentItem.size)}</span>
              </div>
            )}
            {isVideo && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                <span>Video</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md rounded-full px-4 py-1 text-white text-sm">
        {index + 1} / {items.length}
      </div>
    </div>
  );
}

/**
 * Format file size to human-readable format
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format date to relative time or readable format
 */
function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

