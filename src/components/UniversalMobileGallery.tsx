'use client';

/**
 * UNIVERSAL MOBILE GALLERY SYSTEM
 * Built for SnapWorxx - Handles all mobile uploads (Android HEVC + iPhone)
 * with proper codec support, social sharing, and bulk downloads
 * 
 * Features:
 * - Android HEVC/H.265 support with browser detection
 * - iPhone HEVC support (Safari native)
 * - Automatic codec detection and fallback
 * - Social sharing to top 8 platforms
 * - Individual and bulk ZIP downloads
 * - Product-based download permissions
 * - Mobile-first responsive design
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Share2, CheckSquare, X, Play, Image as ImageIcon, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  filename?: string;
  title?: string;
  created_at?: string;
  thumbnail?: string;
  
  // Video-specific
  codec?: 'h264' | 'hevc' | 'vp9' | 'av1' | 'unknown';
  container?: 'mp4' | 'mov' | 'webm' | '3gp' | 'mkv' | 'unknown';
  mimeType?: string;
  
  // Metadata
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
}

export interface GalleryProps {
  items: MediaItem[];
  eventId?: string;
  eventName?: string;
  
  // Product/Tier based permissions
  canBulkDownload?: boolean;
  maxBulkDownload?: number; // null = unlimited
  
  // Callbacks
  onDownload?: (items: MediaItem[]) => Promise<void>;
  onShare?: (item: MediaItem, platform: string) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  
  // UI Options
  layout?: 'grid' | 'masonry';
  showControls?: boolean;
  enableSelection?: boolean;
}

// Top 8 Social Media Platforms 2025
const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', color: '#000000' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', color: '#FFFC00' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#E60023' },
] as const;

// ============================================================================
// CODEC DETECTION & BROWSER COMPATIBILITY
// ============================================================================

class VideoCodecDetector {
  private static supportCache: Map<string, boolean> = new Map();
  
  /**
   * Detect if browser supports HEVC/H.265
   */
  static supportsHEVC(): boolean {
    if (this.supportCache.has('hevc')) {
      return this.supportCache.get('hevc')!;
    }

    const video = document.createElement('video');
    
    // Check both hvc1 (in-band params) and hev1 (out-of-band params)
    const hvc1Support = video.canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"') !== '';
    const hev1Support = video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') !== '';
    
    const supported = hvc1Support || hev1Support;
    this.supportCache.set('hevc', supported);
    
    return supported;
  }

  /**
   * Detect codec from file extension and MIME type
   */
  static detectCodec(item: MediaItem): 'h264' | 'hevc' | 'vp9' | 'av1' | 'unknown' {
    const url = item.url.toLowerCase();
    const mime = item.mimeType?.toLowerCase() || '';
    
    // HEVC indicators
    if (mime.includes('hevc') || mime.includes('h265') || 
        url.includes('hevc') || url.includes('h265')) {
      return 'hevc';
    }
    
    // Check container format - iPhone MOV often contains HEVC
    if (url.endsWith('.mov') || mime.includes('quicktime')) {
      // MOV from iPhone is likely HEVC
      return 'hevc';
    }
    
    // VP9 (WebM)
    if (mime.includes('webm') || url.endsWith('.webm')) {
      return 'vp9';
    }
    
    // AV1
    if (mime.includes('av1') || mime.includes('av01')) {
      return 'av1';
    }
    
    // Default to H.264 for MP4
    if (mime.includes('mp4') || url.endsWith('.mp4')) {
      return 'h264';
    }
    
    return 'unknown';
  }

  /**
   * Check if specific item can play in current browser
   */
  static canPlayItem(item: MediaItem): { canPlay: boolean; reason?: string } {
    if (item.type !== 'video') {
      return { canPlay: true };
    }

    const codec = item.codec || this.detectCodec(item);
    
    switch (codec) {
      case 'hevc':
        if (this.supportsHEVC()) {
          return { canPlay: true };
        }
        return { 
          canPlay: false, 
          reason: 'HEVC/H.265 codec not supported in this browser. Try Safari or download the video.' 
        };
        
      case 'h264':
        return { canPlay: true };
        
      case 'vp9':
      case 'av1':
        // Modern browsers support these
        return { canPlay: true };
        
      default:
        return { 
          canPlay: false, 
          reason: 'Unknown video codec. Download to view.' 
        };
    }
  }

  /**
   * Get optimal video sources with fallbacks
   */
  static getVideoSources(item: MediaItem): Array<{ src: string; type: string }> {
    const sources = [];
    const codec = item.codec || this.detectCodec(item);
    
    // Add primary source
    sources.push({
      src: item.url,
      type: item.mimeType || this.getMimeType(item.url, codec)
    });
    
    // TODO: Add transcoded H.264 fallback URL if available
    // if (item.transcodedUrl) {
    //   sources.push({ src: item.transcodedUrl, type: 'video/mp4; codecs="avc1.42E01E"' });
    // }
    
    return sources;
  }

  private static getMimeType(url: string, codec: string): string {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    
    const mimeMap: Record<string, string> = {
      'mp4': codec === 'hevc' ? 'video/mp4; codecs="hvc1.1.6.L93.B0"' : 'video/mp4',
      'mov': 'video/quicktime',
      'webm': 'video/webm',
      '3gp': 'video/3gpp',
      'mkv': 'video/x-matroska',
    };
    
    return mimeMap[ext] || 'video/mp4';
  }
}

// ============================================================================
// DOWNLOAD MANAGER
// ============================================================================

class DownloadManager {
  /**
   * Download single file
   */
  static async downloadSingle(item: MediaItem): Promise<void> {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.filename || `media-${item.id}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Create ZIP and download multiple files
   */
  static async downloadBulk(items: MediaItem[], zipName: string = 'photos.zip'): Promise<void> {
    // Dynamic import to avoid loading JSZip unless needed
    const JSZip = (await import('jszip')).default;
    const { saveAs } = await import('file-saver');
    
    const zip = new JSZip();
    const folder = zip.folder('media');
    
    if (!folder) throw new Error('Failed to create ZIP folder');

    // Download all files and add to ZIP
    const downloadPromises = items.map(async (item, index) => {
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const ext = item.url.split('.').pop()?.split('?')[0] || 'jpg';
        const filename = item.filename || `${item.type}-${index + 1}.${ext}`;
        folder.file(filename, blob);
      } catch (error) {
        console.error(`Failed to download ${item.filename}:`, error);
      }
    });

    await Promise.all(downloadPromises);

    // Generate and download ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, zipName);
  }
}

// ============================================================================
// SOCIAL SHARE MANAGER
// ============================================================================

class SocialShareManager {
  /**
   * Share to social media platform
   */
  static async share(item: MediaItem, platform: string, eventName?: string): Promise<void> {
    const text = eventName ? `Check out this from ${eventName}!` : 'Check this out!';
    const url = item.url;

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`,
    };

    // Use native share API if available (mobile)
    if (navigator.share && (platform === 'instagram' || platform === 'snapchat' || platform === 'tiktok')) {
      try {
        await navigator.share({
          title: text,
          url: url,
        });
        return;
      } catch (error) {
        console.log('Native share failed, falling back to URL');
      }
    }

    // Open share URL in new window
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  }
}

// ============================================================================
// VIDEO PLAYER COMPONENT
// ============================================================================

interface VideoPlayerProps {
  item: MediaItem;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ item, autoPlay = false }) => {
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playability = VideoCodecDetector.canPlayItem(item);
  
  if (!playability.canPlay) {
    return (
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Video Format Not Supported</h3>
          <p className="text-gray-300 text-sm mb-4">{playability.reason}</p>
          <button
            onClick={() => DownloadManager.downloadSingle(item)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download Video
          </button>
        </div>
      </div>
    );
  }

  const sources = VideoCodecDetector.getVideoSources(item);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        preload="metadata"
        autoPlay={autoPlay}
        poster={item.thumbnail}
        onError={() => setError(true)}
      >
        {sources.map((source, idx) => (
          <source key={idx} src={source.src} type={source.type} />
        ))}
        Your browser doesn't support video playback.
      </video>
      
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
            <p>Unable to play this video</p>
            <button
              onClick={() => DownloadManager.downloadSingle(item)}
              className="mt-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-200"
            >
              Download Instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// GALLERY GRID ITEM
// ============================================================================

interface GridItemProps {
  item: MediaItem;
  selected: boolean;
  selectionMode: boolean;
  onSelect: () => void;
  onClick: () => void;
}

const GridItem: React.FC<GridItemProps> = ({ 
  item, 
  selected, 
  selectionMode, 
  onSelect, 
  onClick 
}) => {
  const isVideo = item.type === 'video';
  const playability = VideoCodecDetector.canPlayItem(item);

  return (
    <div 
      className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg bg-gray-100"
      onClick={selectionMode ? onSelect : onClick}
    >
      {/* Thumbnail */}
      {isVideo ? (
        <div className="relative w-full h-full">
          <video
            src={item.url}
            className="w-full h-full object-cover"
            preload="metadata"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-opacity">
            <Play className="w-12 h-12 text-white" fill="white" />
          </div>
          
          {/* Codec warning badge */}
          {!playability.canPlay && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
              Download Only
            </div>
          )}
        </div>
      ) : (
        <img
          src={item.url}
          alt={item.title || item.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Selection checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2">
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            selected 
              ? 'bg-purple-600 border-purple-600' 
              : 'bg-white bg-opacity-50 border-white'
          }`}>
            {selected && <CheckSquare className="w-4 h-4 text-white" />}
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-sm truncate">{item.filename}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN GALLERY COMPONENT
// ============================================================================

export default function UniversalMobileGallery({
  items,
  eventId,
  eventName,
  canBulkDownload = true,
  maxBulkDownload = 9999,
  onDownload,
  onShare,
  onDelete,
  layout = 'grid',
  showControls = true,
  enableSelection = true,
}: GalleryProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Check HEVC support on mount
  useEffect(() => {
    const hevcSupported = VideoCodecDetector.supportsHEVC();
    console.log('🎥 Browser HEVC Support:', hevcSupported);
  }, []);

  // Selection handlers
  const toggleSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      // Check bulk download limit
      if (maxBulkDownload && newSelection.size >= maxBulkDownload) {
        alert(`Maximum ${maxBulkDownload} items can be selected`);
        return;
      }
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    if (maxBulkDownload) {
      setSelectedItems(new Set(items.slice(0, maxBulkDownload).map(i => i.id)));
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  // Download handlers
  const handleDownloadSelected = async () => {
    const selectedItemsList = items.filter(item => selectedItems.has(item.id));
    
    if (selectedItemsList.length === 0) return;

    setDownloading(true);
    try {
      if (onDownload) {
        await onDownload(selectedItemsList);
      } else {
        const zipName = eventName 
          ? `${eventName.replace(/\s+/g, '-')}-photos.zip`
          : 'photos.zip';
        await DownloadManager.downloadBulk(selectedItemsList, zipName);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
      deselectAll();
    }
  };

  // Lightbox handlers
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextItem = () => {
    setLightboxIndex((prev) => (prev + 1) % items.length);
  };

  const prevItem = () => {
    setLightboxIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextItem();
      if (e.key === 'ArrowLeft') prevItem();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lightboxOpen]);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
          <ImageIcon className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No media yet</h3>
        <p className="text-gray-500">Be the first to upload and share memories!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Controls Bar */}
      {showControls && (
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-gray-900">
            {eventName || 'Gallery'} ({items.length})
          </h2>

          <div className="flex items-center gap-2">
            {enableSelection && (
              <>
                {!selectionMode ? (
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Select Items
                  </button>
                ) : (
                  <>
                    <button
                      onClick={selectAll}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </>
            )}

            {selectedItems.size > 0 && canBulkDownload && (
              <button
                onClick={handleDownloadSelected}
                disabled={downloading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Downloading...' : `Download (${selectedItems.size})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <div className={`grid gap-4 ${
        layout === 'masonry' 
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
          : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }`}>
        {items.map((item, index) => (
          <GridItem
            key={item.id}
            item={item}
            selected={selectedItems.has(item.id)}
            selectionMode={selectionMode}
            onSelect={() => toggleSelection(item.id)}
            onClick={() => openLightbox(index)}
          />
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation */}
          <button
            onClick={prevItem}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
          >
            <span className="text-white text-2xl">‹</span>
          </button>

          <button
            onClick={nextItem}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white bg-opacity-30 hover:bg-opacity-30 rounded-full transition-colors"
          >
            <span className="text-white text-2xl">›</span>
          </button>

          {/* Media Content */}
          <div className="w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center p-4">
            {items[lightboxIndex].type === 'video' ? (
              <VideoPlayer item={items[lightboxIndex]} autoPlay />
            ) : (
              <img
                src={items[lightboxIndex].url}
                alt={items[lightboxIndex].title || ''}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="text-white">
                <p className="font-semibold">{items[lightboxIndex].filename}</p>
                <p className="text-sm text-gray-300">
                  {lightboxIndex + 1} / {items.length}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Download */}
                <button
                  onClick={() => DownloadManager.downloadSingle(items[lightboxIndex])}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>

                {/* Share */}
                <div className="relative">
                  <button
                    onClick={() => setShareMenuOpen(shareMenuOpen ? null : items[lightboxIndex].id)}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>

                  {shareMenuOpen === items[lightboxIndex].id && (
                    <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-xl p-4 w-64">
                      <h4 className="font-semibold mb-3 text-gray-900">Share to</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {SOCIAL_PLATFORMS.map((platform) => (
                          <button
                            key={platform.id}
                            onClick={async () => {
                              if (onShare) {
                                await onShare(items[lightboxIndex], platform.id);
                              } else {
                                await SocialShareManager.share(items[lightboxIndex], platform.id, eventName);
                              }
                              setShareMenuOpen(null);
                            }}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title={platform.name}
                          >
                            <span className="text-2xl">{platform.icon}</span>
                            <span className="text-xs text-gray-600">{platform.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export utilities for external use
export { VideoCodecDetector, DownloadManager, SocialShareManager };
