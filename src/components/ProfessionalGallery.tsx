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
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

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
}

export default function ProfessionalGallery({
  photos = [],
  eventId,
  onPhotoSelect,
  slideshowActive = false,
  currentPhotoIndex = -1
}: ProfessionalGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showLightbox, setShowLightbox] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [hoveredThumb, setHoveredThumb] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  if (photos.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="text-center">
          <div className="text-6xl mb-4">📷</div>
          <h2 className="text-2xl font-light text-gray-300 mb-2">No Photos Yet</h2>
          <p className="text-gray-500">Upload photos to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-black">
      {/* LEFT SIDEBAR - THUMBNAILS */}
      <motion.div
        ref={sidebarRef}
        initial={{ width: 160 }}
        animate={{ width: sidebarHovered ? 200 : 160 }}
        className="bg-gradient-to-b from-gray-950 to-black border-r border-gray-800 overflow-hidden flex flex-col"
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        {/* Sidebar Header */}
        <div className="px-3 py-4 border-b border-gray-800">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
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
              className={`w-full aspect-square rounded-lg overflow-hidden group relative transition-all duration-300 ${
                selectedIndex === index
                  ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/50'
                  : 'hover:ring-2 hover:ring-gray-600'
              }`}
            >
              {/* Thumbnail Image */}
              <img
                src={photo.thumbnail || photo.url}
                alt={photo.title || 'Photo'}
                className="w-full h-full object-cover"
              />

              {/* Video Badge */}
              {photo.isVideo && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                  <Play className="w-4 h-4 text-white" fill="white" />
                </div>
              )}

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
          <div className="border-t border-gray-800 p-3 bg-gray-950/50 text-xs text-gray-500">
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black relative group cursor-pointer"
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
