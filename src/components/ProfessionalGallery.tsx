'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { ChevronLeft, ChevronRight, Play, Trash2, Download, CheckSquare, Square } from 'lucide-react';
import VideoThumbnail from './VideoThumbnail';

interface GalleryPhoto {
  id: string;
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  uploadedAt: string;
  isVideo?: boolean;
  duration?: number;
  size?: number;
}

interface ProfessionalGalleryProps {
  photos: GalleryPhoto[];
  eventId: string;
  onPhotoSelect?: (photo: GalleryPhoto, index: number) => void;
  slideshowActive?: boolean;
  currentPhotoIndex?: number;
  bulkMode?: 'select' | 'all' | null;
  selectedPhotos?: Set<string>;
  onSelectionChange?: (photos: Set<string>) => void;
  onBulkDownload?: () => void;
}

export default function ProfessionalGallery({
  photos = [],
  eventId,
  onPhotoSelect,
  slideshowActive = false,
  currentPhotoIndex = -1,
  bulkMode: externalBulkMode,
  selectedPhotos: externalSelectedPhotos,
  onSelectionChange,
  onBulkDownload
}: ProfessionalGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showLightbox, setShowLightbox] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [hoveredThumb, setHoveredThumb] = useState<string | null>(null);
  const [localSelectedPhotos, setLocalSelectedPhotos] = useState<Set<string>>(new Set());
  const [localBulkMode, setLocalBulkMode] = useState<'select' | 'all' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use parent state if provided, otherwise use local state
  const bulkMode = externalBulkMode ?? localBulkMode;
  const setBulkMode = (mode: 'select' | 'all' | null) => {
    setLocalBulkMode(mode);
  };

  const selectedPhotos = externalSelectedPhotos ?? localSelectedPhotos;
  const setSelectedPhotos = (photos: Set<string>) => {
    setLocalSelectedPhotos(photos);
    onSelectionChange?.(photos);
  };

  // Convert photos to lightbox format
  const slides = photos.map(photo => ({
    src: photo.url,
    alt: photo.title || 'Photo'
  }));

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
    // Only open lightbox for photos, not videos (videos play inline)
    if (!photos[index]?.isVideo) {
      setShowLightbox(true);
    }
    onPhotoSelect?.(photos[index], index);
  }, [photos, onPhotoSelect]);

  const handlePrevious = useCallback(() => {
    setSelectedIndex(prev => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex(prev => (prev + 1) % photos.length);
  }, [photos.length]);

  // Sync with slideshow index when active
  useEffect(() => {
    if (slideshowActive && currentPhotoIndex >= 0) {
      setSelectedIndex(currentPhotoIndex);
    }
  }, [slideshowActive, currentPhotoIndex]);

  // Scroll selected thumbnail into view
  useEffect(() => {
    if (selectedIndex >= 0 && scrollContainerRef.current) {
      const thumbnail = scrollContainerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      
      if (thumbnail) {
        thumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  // Delete photo handler
  const handleDeletePhoto = useCallback(async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    setDeleting(photoId);
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      console.log('✅ Photo deleted:', photoId);
      // Refresh page to reload photos
      window.location.reload();
    } catch (err) {
      console.error('❌ Error deleting photo:', err);
      alert('Failed to delete photo');
    } finally {
      setDeleting(null);
    }
  }, []);

  // Toggle photo selection
  const handleToggleSelection = useCallback((photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedPhotos);
    if (newSet.has(photoId)) {
      newSet.delete(photoId);
    } else {
      newSet.add(photoId);
    }
    setSelectedPhotos(newSet);
  }, [selectedPhotos]);

  // Select/Deselect all
  const handleSelectAll = useCallback(() => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  }, [photos, selectedPhotos.size]);

  // Bulk download handler
  const handleBulkDownload = useCallback(async () => {
    const idsToDownload = bulkMode === 'all' 
      ? photos.map(p => p.id)
      : Array.from(selectedPhotos);

    if (idsToDownload.length === 0) {
      alert('No items selected');
      return;
    }

    // Download multiple files
    for (const photoId of idsToDownload) {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) continue;

      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = photo.title || `photo-${photoId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error('Error downloading photo:', err);
      }
    }

    setBulkMode(null);
    setSelectedPhotos(new Set());
  }, [photos, selectedPhotos, bulkMode]);

  if (photos.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📷</div>
          <h2 className="text-2xl font-light text-gray-800 mb-2">No Photos Yet</h2>
          <p className="text-gray-500">Upload photos to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white">
      {/* LEFT SIDEBAR - THUMBNAILS */}
      <motion.div
        ref={sidebarRef}
        initial={{ width: 160 }}
        animate={{ width: sidebarHovered ? 200 : 160 }}
        className="bg-gray-50 border-r border-gray-200 overflow-hidden flex flex-col"
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        {/* Sidebar Header */}
        <div className="px-3 py-4 border-b border-gray-200">
          <h3 className="text-xs uppercase tracking-widest text-gray-600 font-semibold">
            {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
          </h3>
        </div>

        {/* Scrollable Thumbnails */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 p-2 custom-scrollbar"
        >
          {photos.map((photo, index) => (
            <motion.button
              key={photo.id}
              data-index={index}
              onClick={() => handleThumbnailClick(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full aspect-square rounded-lg overflow-hidden group relative transition-all duration-300 bg-gray-200 ${
                selectedIndex === index
                  ? 'ring-2 ring-purple-600 shadow-lg shadow-purple-600/50'
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
              {/* Thumbnail Image - Different handling for videos and photos */}
              {photo.isVideo ? (
                // Videos: Extract thumbnail from video frame
                <VideoThumbnail
                  videoUrl={photo.url}
                  alt={photo.title || 'Video'}
                  className="w-full h-full object-cover"
                  onError={(err) => {
                    console.warn(`Failed to generate video thumbnail for ${photo.title || 'unknown'}:`, err.message);
                  }}
                />
              ) : (
                // Photos: Use regular image
                photo.thumbnail || photo.url ? (
                  <img
                    src={photo.thumbnail || photo.url}
                    alt={photo.title || 'Photo'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.warn(`Failed to load photo thumbnail for ${photo.title || 'unknown'}`);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <span className="text-2xl">📸</span>
                  </div>
                )
              )}

              {/* Video Badge */}
              {photo.isVideo && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                  <Play className="w-4 h-4 text-white" fill="white" />
                </div>
              )}

              {/* Selection Checkbox - Top Left */}
              <button
                onClick={(e) => handleToggleSelection(photo.id, e)}
                className="absolute top-2 left-2 z-10 bg-black/60 hover:bg-blue-600 p-2 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                {selectedPhotos.has(photo.id) ? (
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Delete Button - Top Right */}
              <button
                onClick={(e) => handleDeletePhoto(photo.id, e)}
                disabled={deleting === photo.id}
                className="absolute top-2 right-2 z-10 bg-red-600/80 hover:bg-red-700 disabled:bg-gray-600 p-2 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                {deleting === photo.id ? (
                  <div className="w-4 h-4 animate-spin rounded-full border border-white border-t-transparent" />
                ) : (
                  <Trash2 className="w-4 h-4 text-white" />
                )}
              </button>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                <p className="text-white text-xs font-medium truncate">
                  {photo.title || 'Untitled'}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Sidebar Footer Info */}
        {selectedIndex >= 0 && (
          <div className="border-t border-gray-200 p-3 bg-gray-100 text-xs text-gray-600">
            <p>{selectedIndex + 1} of {photos.length}</p>
            {photos[selectedIndex]?.size && (
              <p>{(photos[selectedIndex].size / 1024 / 1024).toFixed(1)}MB</p>
            )}
          </div>
        )}
      </motion.div>

      {/* RIGHT MAIN VIEW - LIGHTBOX */}
      <div className="flex-1 relative overflow-hidden">
        {selectedIndex >= 0 && !showLightbox && (
          <div className="w-full h-full flex items-center justify-center bg-white relative group cursor-pointer"
            onClick={() => !photos[selectedIndex]?.isVideo && setShowLightbox(true)}
          >
            {/* Main Image Display */}
            <div className="relative w-full h-full overflow-hidden">
              {photos[selectedIndex]?.isVideo ? (
                <video
                  key={`video-${photos[selectedIndex].id}`}
                  src={photos[selectedIndex].url}
                  className="w-full h-full object-contain bg-black"
                  controls
                  autoPlay
                  crossOrigin="anonymous"
                />
              ) : (
                <img
                  key={`image-${photos[selectedIndex].id}`}
                  src={photos[selectedIndex].url}
                  alt={photos[selectedIndex].title || 'Photo'}
                  className="w-full h-full object-contain"
                />
              )}

              {/* Logo Watermark - Lower Right Corner */}
              {!photos[selectedIndex]?.isVideo && (
                <div className="absolute bottom-6 right-6 opacity-15 pointer-events-none">
                  <img 
                    src="/snapworxx logo (1).png" 
                    alt="Snapworxx watermark"
                    width="100"
                    height="100"
                    className="w-24 h-24"
                  />
                </div>
              )}

              {/* Hover Hint - Only for images */}
              {!photos[selectedIndex]?.isVideo && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white">
                    Click for fullscreen
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Info Overlay */}
            {!photos[selectedIndex]?.isVideo && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-light text-white mb-2">
                  {photos[selectedIndex]?.title || 'Untitled'}
                </h3>
                {photos[selectedIndex]?.description && (
                  <p className="text-sm text-gray-300">
                    {photos[selectedIndex].description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(photos[selectedIndex]?.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        {!selectedIndex && selectedIndex !== 0 && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center">
              <div className="text-5xl mb-4">👈</div>
              <p className="text-gray-400">Select a photo from the sidebar</p>
            </div>
          </div>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX */}
      <AnimatePresence>
        {showLightbox && (
          <Lightbox
            slides={slides}
            open={showLightbox}
            index={selectedIndex}
            close={() => setShowLightbox(false)}
            on={{
              view: ({ index }) => setSelectedIndex(index),
            }}
            plugins={[Fullscreen, Slideshow, Zoom]}
            carousel={{
              finite: false,
              preload: 3,
            }}
            animation={{ fade: 300, swipe: 300 }}
            styles={{
              container: {
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
              },
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
