'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLightbox, { LightboxSlide } from './AppLightbox';
import { 
  Heart, 
  Download, 
  Share2, 
  Grid3X3, 
  List, 
  Filter, 
  Search,
  ChevronUp,
  Moon,
  Sun,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  uploadedAt: string;
  isVideo?: boolean;
  duration?: number;
  size?: number;
  likes?: number;
  isFavorite?: boolean;
}

interface SnapworxxGalleryProps {
  photos: Photo[];
  eventId: string;
  userId?: string;
  onUpload?: () => void;
  onDelete?: (photoId: string) => void;
  onToggleFavorite?: (photoId: string) => void;
  className?: string;
}

type ViewMode = 'masonry' | 'grid' | 'list';
type SortMode = 'newest' | 'oldest' | 'favorites' | 'mostLiked';

export default function SnapworxxGallery({
  photos: initialPhotos = [],
  eventId,
  userId,
  onUpload,
  onDelete,
  onToggleFavorite,
  className = ''
}: SnapworxxGalleryProps) {
  // State management
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>(initialPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false); // Disable infinite scroll
  const [page, setPage] = useState(1);

  // Video player state for inline previews
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [videoMuted, setVideoMuted] = useState(false);

  // Refs
  const observerTarget = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Update photos when initialPhotos changes
  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  // Filter and sort photos
  useEffect(() => {
    let filtered = [...photos];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(photo => 
        photo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(photo => photo.isFavorite);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'newest':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'oldest':
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case 'favorites':
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'mostLiked':
          return (b.likes || 0) - (a.likes || 0);
        default:
          return 0;
      }
    });

    setFilteredPhotos(filtered);
  }, [photos, searchTerm, showFavoritesOnly, sortMode]);

  // Infinite scroll - disabled to prevent looping
  useEffect(() => {
    // Disable infinite scroll for now to prevent looping
    // const observer = new IntersectionObserver(
    //   (entries) => {
    //     if (entries[0].isIntersecting && hasMore && !isLoading) {
    //       loadMorePhotos();
    //     }
    //   },
    //   { threshold: 0.1 }
    // );

    // if (observerTarget.current) {
    //   observer.observe(observerTarget.current);
    // }

    // return () => observer.disconnect();
  }, []);

  // Load more photos (disabled to prevent looping)
  const loadMorePhotos = useCallback(async () => {
    // Disabled to prevent animation loops
    return;
  }, []);

  // Toggle favorite
  const handleToggleFavorite = useCallback((photoId: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { ...photo, isFavorite: !photo.isFavorite }
        : photo
    ));
    onToggleFavorite?.(photoId);
  }, [onToggleFavorite]);

  // Download photo
  const handleDownload = useCallback(async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.title || `photo-${photo.id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  }, []);

  // Share photo
  const handleShare = useCallback(async (photo: Photo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.title || 'Photo from Snapworxx',
          text: photo.description || 'Check out this photo!',
          url: photo.url
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(photo.url);
      alert('Photo URL copied to clipboard!');
    }
  }, []);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    galleryRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Lightbox slides (includes both images and videos)
  const slides: LightboxSlide[] = filteredPhotos.map(photo => ({
    id: photo.id,
    src: photo.url,
    alt: photo.title || 'Photo',
    title: photo.title,
    type: photo.isVideo ? 'video' : 'image',
    poster: photo.thumbnail,
  }));

  // Photo card component
  const PhotoCard = React.memo(({ photo, index }: { photo: Photo; index: number }) => (
    <motion.div
      layout={false}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`relative group cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}
      onClick={() => {
        // Open lightbox at the correct index in filtered photos
        const photoIndex = filteredPhotos.findIndex(p => p.id === photo.id);
        setSelectedPhoto(photoIndex);
      }}
    >
      {photo.isVideo ? (
        <div className="relative">
          <video
            src={photo.url}
            className="w-full h-auto object-cover"
            muted={videoMuted}
            preload="metadata"
            onPlay={() => setPlayingVideo(photo.id)}
            onPause={() => setPlayingVideo(null)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute top-2 left-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const video = e.currentTarget.parentElement?.parentElement?.querySelector('video') as HTMLVideoElement;
                  if (video) {
                    if (video.paused) {
                      video.play();
                    } else {
                      video.pause();
                    }
                  }
                }}
                className="p-2 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-all duration-200"
              >
                {playingVideo === photo.id ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
            <div className="absolute top-2 right-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoMuted(!videoMuted);
                }}
                className="p-2 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-all duration-200"
              >
                {videoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </div>
          {photo.duration && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
              {Math.floor(photo.duration / 60)}:{(photo.duration % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      ) : (
        <img
          src={photo.thumbnail || photo.url}
          alt={photo.title || 'Photo'}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {photo.title && (
                <h3 className="text-white font-medium truncate">{photo.title}</h3>
              )}
              <p className="text-white/80 text-sm">
                {new Date(photo.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(photo.id);
                }}
                className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all duration-200"
              >
                <Heart 
                  size={16} 
                  className={photo.isFavorite ? 'fill-red-500 text-red-500' : ''} 
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(photo);
                }}
                className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all duration-200"
              >
                <Download size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(photo);
                }}
                className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all duration-200"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Like count */}
      {photo.likes && photo.likes > 0 && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full flex items-center space-x-1">
          <Heart size={12} className="fill-red-500 text-red-500" />
          <span>{photo.likes}</span>
        </div>
      )}
    </motion.div>
  ));

  const getGridClasses = () => {
    switch (viewMode) {
      case 'grid':
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
      case 'list':
        return 'grid grid-cols-1 gap-4';
      case 'masonry':
      default:
        return 'columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4';
    }
  };

  return (
    <div className={`${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} min-h-screen transition-colors duration-300 ${className}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b backdrop-blur-sm bg-opacity-90`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                <input
                  type="text"
                  placeholder="Search photos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* View Mode */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('masonry')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'masonry' 
                      ? 'bg-blue-500 text-white' 
                      : darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Masonry view"
                >
                  <Grid3X3 size={20} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white' 
                      : darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Grid view"
                >
                  <Grid3X3 size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white' 
                      : darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="List view"
                >
                  <List size={20} />
                </button>
              </div>

              {/* Sort */}
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className={`px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="favorites">Favorites</option>
                <option value="mostLiked">Most Liked</option>
              </select>

              {/* Favorites Toggle */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  showFavoritesOnly 
                    ? 'bg-red-500 text-white' 
                    : darkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Show favorites only"
              >
                <Heart size={20} className={showFavoritesOnly ? 'fill-current' : ''} />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode 
                    ? 'text-yellow-400 hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div ref={galleryRef} className="max-w-7xl mx-auto px-4 py-8">
        {filteredPhotos.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {searchTerm || showFavoritesOnly ? (
              <div>
                <Filter size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No photos match your filters</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div>
                <Grid3X3 size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No photos yet</p>
                <p className="text-sm">Start by uploading some photos to this event</p>
                {onUpload && (
                  <button
                    onClick={onUpload}
                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    Upload Photos
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={getGridClasses()}>
            <AnimatePresence>
              {filteredPhotos.map((photo, index) => (
                <PhotoCard key={photo.id} photo={photo} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Loading indicator - disabled to prevent animation loops */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className={`rounded-full h-8 w-8 border-2 ${
              darkMode 
                ? 'border-gray-600 border-t-white' 
                : 'border-gray-300 border-t-gray-900'
            }`}>Loading...</div>
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={observerTarget} className="h-4" />
      </div>

      {/* Scroll to top button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: filteredPhotos.length > 10 ? 1 : 0 }}
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 z-20"
        title="Scroll to top"
      >
        <ChevronUp size={24} />
      </motion.button>

      {/* Unified Lightbox for Images and Videos */}
      <AppLightbox
        slides={slides}
        open={selectedPhoto >= 0}
        index={selectedPhoto}
        onClose={() => setSelectedPhoto(-1)}
        onIndexChange={setSelectedPhoto}
        showThumbnails={true}
        showDownload={true}
        showShare={true}
        showZoom={true}
        showFullscreen={true}
        showSlideshow={true}
      />
    </div>
  );
}