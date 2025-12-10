'use client';

import React, { useState, useCallback } from 'react';
import PhotoAlbum, { RenderPhotoProps } from 'react-photo-album';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Share2, Download, Trash2, Upload, CheckSquare, Square, ZoomIn, Play } from 'lucide-react';
import PhotoSwipeLightbox from './Gallery/PhotoSwipeLightbox';
import UniversalShare from './UniversalShare';
import type { GalleryItem, ViewMode, PackageType } from './Gallery';

interface MobileFirstGalleryProps {
  // Gallery Content
  photos: GalleryItem[];
  eventName?: string;
  eventCode?: string;
  headerImage?: string;
  profileImage?: string;
  
  // Permissions
  viewMode?: ViewMode;
  packageType?: PackageType;
  isFree?: boolean;
  isFreebie?: boolean;
  
  // Explicit permission overrides
  canDelete?: boolean;
  canBulkDownload?: boolean;
  canUpload?: boolean;
  
  // Event context
  eventSlug?: string;
  eventId?: string;
  
  // Callbacks
  onDownload?: (item: GalleryItem) => Promise<void>;
  onDownloadAll?: () => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  onUpload?: () => void;
}

export default function MobileFirstGallery({
  photos,
  eventName = '',
  eventCode = '',
  headerImage,
  profileImage,
  viewMode = 'public',
  packageType = 'premium',
  isFree = false,
  isFreebie = false,
  canDelete: explicitCanDelete,
  canBulkDownload: explicitCanBulkDownload,
  canUpload: explicitCanUpload,
  eventSlug,
  eventId,
  onDownload,
  onDownloadAll,
  onDelete,
  onUpload,
}: MobileFirstGalleryProps) {
  
  // Derive permissions
  const canDelete = explicitCanDelete !== undefined ? explicitCanDelete : (viewMode === 'owner' || viewMode === 'admin');
  const canBulkDownload = explicitCanBulkDownload !== undefined ? explicitCanBulkDownload : (packageType === 'premium');
  const canUpload = explicitCanUpload !== undefined ? explicitCanUpload : (viewMode === 'owner' || viewMode === 'admin');

  // State
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  
  // Layout state - load from localStorage or default to masonry
  // Layout options: grid (rows under the hood), masonry, columns
  const [layout, setLayout] = useState<'grid' | 'masonry' | 'columns'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gallery-layout');
      return (saved === 'grid' || saved === 'columns' || saved === 'masonry') ? (saved as 'grid' | 'masonry' | 'columns') : 'masonry';
    }
    return 'masonry';
  });

  // Save layout preference when it changes
  const handleLayoutChange = (newLayout: 'grid' | 'masonry' | 'columns') => {
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gallery-layout', newLayout);
    }
  };

  // Helper to check if item is video
  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.avi', '.mkv', '.m4v'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  // Build all items
  const allItems: GalleryItem[] = [];
  if (headerImage) {
    allItems.push({
      id: 'header',
      url: headerImage,
      title: 'Event Header',
      type: 'header',
      isVideo: isVideoUrl(headerImage),
      width: 1920,
      height: 400,
    });
  }
  if (profileImage) {
    allItems.push({
      id: 'profile',
      url: profileImage,
      title: 'Event Profile',
      type: 'profile',
      isVideo: isVideoUrl(profileImage),
      width: 400,
      height: 400,
    });
  }
  allItems.push(...photos);

  // Display items (exclude header/profile)
  const displayItems = allItems.filter(item => item.type !== 'header' && item.type !== 'profile');

  // Prepare photos for React Photo Album
  const albumPhotos = displayItems
    .filter(photo => photo != null && photo.url != null)
    .map(photo => ({
      src: photo.url,
      width: photo.width || 800,
      height: photo.height || 600,
      alt: photo.title || '',
      key: photo.id,
      // Store original item for callbacks
      originalItem: photo,
    }));

  // Toggle selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Download single item
  const handleDownload = async (item: GalleryItem) => {
    if (onDownload) {
      await onDownload(item);
    } else {
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.filename || item.title || `media-${item.id}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
      }
    }
  };

  // Download all selected
  const handleDownloadAll = async () => {
    if (selectedItems.size === 0) return;
    setDownloading(true);
    try {
      const itemsToDownload = displayItems.filter(item => selectedItems.has(item.id));
      if (onDownloadAll && selectedItems.size === displayItems.length) {
        await onDownloadAll();
      } else {
        for (const item of itemsToDownload) {
          await handleDownload(item);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      setSelectedItems(new Set());
      setSelectMode(false);
    } catch (error) {
      console.error('Bulk download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Delete item
  const handleDelete = async (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    if (!confirm(`Delete ${item.filename || item.title || 'this item'}?`)) return;

    setDeleting(item.id);
    try {
      await onDelete(item.id);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Custom photo renderer with mobile-optimized overlay
  const renderPhoto = useCallback(({ photo, imageProps, wrapperStyle }: any) => {
    if (!photo?.originalItem) return null;
    const item = photo.originalItem;
    const isSelected = selectedItems.has(item.id);
    const isVideo = item.isVideo || item.type === 'video' || isVideoUrl(item.url);

    // Clamp thumbnail heights so items stay small regardless of layout
    const thumbHeight =
      layout === 'grid' ? 200 :
      layout === 'masonry' ? 180 :
      200; // columns

    const adjustedWrapperStyle = {
      ...wrapperStyle,
      // Force a fixed-height thumb box and prevent oversize items
      height: thumbHeight,
      maxHeight: thumbHeight,
      minHeight: thumbHeight,
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%',
      // Critical: override any PhotoAlbum styling that tries to set height
      // Use !important only if necessary, but these inline styles should take precedence
      flex: 'none',
      flexBasis: 'auto',
    } as React.CSSProperties;

    const mediaStyle = {
      ...imageProps.style,
      // Force the media to stay inside the thumb box
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'cover',
      display: 'block',
    } as React.CSSProperties;

    return (
      <div 
        style={adjustedWrapperStyle} 
        className={`group relative overflow-hidden cursor-pointer flex items-center justify-center ${
          selectMode && isSelected ? 'ring-4 ring-blue-500 ring-offset-2' : ''
        }`}
        onClick={() => {
          if (selectMode) {
            toggleItemSelection(item.id);
          } else {
            const itemIndex = displayItems.findIndex(i => i.id === item.id);
            setSelectedIndex(itemIndex);
          }
        }}
      >
        {/* Image/Video */}
        {isVideo ? (
          <video
            src={item.url}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            preload="metadata"
            muted
            playsInline
            style={mediaStyle}
          />
        ) : (
          <img
            alt={imageProps.alt}
            {...imageProps}
            sizes={`${thumbHeight}px`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            draggable={false}
            style={mediaStyle}
          />
        )}

        {/* Video play indicator */}
        {isVideo && !selectMode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black bg-opacity-60 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-8 w-8 text-white fill-current" />
            </div>
          </div>
        )}

        {/* Mobile-optimized hover overlay */}
        {!selectMode && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between gap-2">
              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(item);
                  }}
                  className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors touch-manipulation"
                  aria-label="Download"
                >
                  <Download className="w-4 h-4 text-gray-900" />
                </button>

                <div onClick={(e) => e.stopPropagation()}>
                  <UniversalShare
                    imageUrl={item.url}
                    eventName={eventName}
                    eventCode={eventCode}
                    isVideo={isVideo}
                  />
                </div>

                {canDelete && onDelete && (
                  <button
                    onClick={(e) => handleDelete(item, e)}
                    disabled={deleting === item.id}
                    className="p-2 bg-red-600/90 hover:bg-red-600 rounded-lg shadow-lg transition-colors disabled:opacity-50 touch-manipulation"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              {/* Zoom indicator */}
              <div className="p-2 bg-black/60 rounded-lg">
                <ZoomIn className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Selection checkbox */}
        {selectMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleItemSelection(item.id);
            }}
            className="absolute top-3 left-3 z-10 p-2 bg-white rounded-lg shadow-lg touch-manipulation"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
      </div>
    );
  }, [selectMode, selectedItems, canDelete, deleting, eventName, eventCode]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section with Hero Image */}
      {headerImage && (
        <div className="relative w-full h-64 md:h-80 overflow-hidden">
          <img
            src={headerImage}
            alt="Event Header"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/30"></div>
        </div>
      )}

      {/* Profile Section */}
      <div className={`relative ${headerImage ? '-mt-20' : 'pt-8'} z-10 flex flex-col items-center px-4 pb-6`}>
        {profileImage && (
          <img
            src={profileImage}
            alt="Event Profile"
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl object-cover"
            loading="eager"
          />
        )}
        <h1 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900 text-center">
          {eventName}
        </h1>
      </div>

      {/* Package Type Banner */}
      <div className="sticky top-0 z-30 w-full">
        {packageType === 'freebie' && (
          <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 px-4 text-center shadow-md">
            <div className="flex items-center justify-center gap-2 text-sm md:text-base">
              <span className="text-xl">🎁</span>
              <span className="font-bold">FREEBIE GALLERY</span>
            </div>
          </div>
        )}
        {packageType === 'premium' && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 text-center shadow-md">
            <div className="flex items-center justify-center gap-2 text-sm md:text-base">
              <span className="text-xl">⭐</span>
              <span className="font-bold">PREMIUM GALLERY</span>
            </div>
          </div>
        )}
        {packageType === 'basic' && (
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 px-4 text-center shadow-md">
            <div className="flex items-center justify-center gap-2 text-sm md:text-base">
              <span className="text-xl">📸</span>
              <span className="font-bold">BASIC GALLERY</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Drawer */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed inset-0 z-40"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setNavOpen(false)} />
            <motion.div className="absolute left-0 top-0 bottom-0 w-72 bg-gray-900 shadow-xl flex flex-col">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">{eventName}</h2>
                  <button onClick={() => setNavOpen(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <p className="text-sm text-gray-400">{displayItems.length} items in gallery</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Layout Options */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Gallery Layout</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleLayoutChange('masonry');
                        setNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-colors ${
                        layout === 'masonry'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h8v8H3V3zm10 0h8v12h-8V3zM3 13h8v8H3v-8z"/>
                      </svg>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Masonry</div>
                        <div className="text-xs opacity-75">Pinterest-style</div>
                      </div>
                      {layout === 'masonry' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        handleLayoutChange('grid');
                        setNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-colors ${
                        layout === 'grid'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h18v5H3V3zm0 7h18v5H3v-5zm0 7h18v4H3v-4z"/>
                      </svg>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Grid</div>
                        <div className="text-xs opacity-75">Uniform rows</div>
                      </div>
                      {layout === 'grid' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        handleLayoutChange('columns');
                        setNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-colors ${
                        layout === 'columns'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h5v18H3V3zm7 0h4v18h-4V3zm6 0h5v18h-5V3z"/>
                      </svg>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Columns</div>
                        <div className="text-xs opacity-75">Classic layout</div>
                      </div>
                      {layout === 'columns' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Share Controls */}
                <div className="space-y-2 border-t border-gray-800 pt-4">
                  <UniversalShare
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                    title={`${eventName} | Snapworxx`}
                    description={`Check out this event gallery: ${eventName}`}
                  >
                    <button className="w-full flex items-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <Share2 className="w-5 h-5" />
                      Share Gallery
                    </button>
                  </UniversalShare>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Action Bar - Mobile Optimized */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          <div className="flex items-center gap-2">
            {/* Layout Switcher */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleLayoutChange('masonry')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors touch-manipulation ${
                  layout === 'masonry'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Masonry Layout (Pinterest-style)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h8v8H3V3zm10 0h8v12h-8V3zM3 13h8v8H3v-8z"/>
                </svg>
              </button>
              <button
                onClick={() => handleLayoutChange('grid')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors touch-manipulation ${
                  layout === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid Layout (Uniform rows)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h18v5H3V3zm0 7h18v5H3v-5zm0 7h18v4H3v-4z"/>
                </svg>
              </button>
              <button
                onClick={() => handleLayoutChange('columns')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors touch-manipulation ${
                  layout === 'columns'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Columns Layout (Classic)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h5v18H3V3zm7 0h4v18h-4V3zm6 0h5v18h-5V3z"/>
                </svg>
              </button>
            </div>

            {/* Select Mode Toggle */}
            {canBulkDownload && displayItems.length > 0 && (
              <button
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedItems(new Set());
                }}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm touch-manipulation ${
                  selectMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectMode ? 'Cancel' : 'Select'}
              </button>
            )}

            {/* Download Selected */}
            {selectMode && selectedItems.size > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={downloading}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm touch-manipulation flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                <span>({selectedItems.size})</span>
              </button>
            )}

            {/* Upload Button */}
            {canUpload && onUpload && (
              <button
                onClick={onUpload}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm touch-manipulation flex items-center gap-1"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Gallery */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-8">
        {displayItems.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No photos yet</h3>
            <p className="text-gray-500">Be the first to upload and share memories from this event!</p>
          </div>
        ) : (
          <PhotoAlbum
            photos={albumPhotos}
            layout={layout === 'grid' ? 'rows' : layout}
            spacing={4}
            padding={0}
            targetRowHeight={
              layout === 'grid' ? 200 :
              layout === 'masonry' ? 180 :
              200  // columns
            }
            render={{ photo: renderPhoto }}
            // Mobile-optimized: smaller columns on mobile
            columns={(containerWidth) => {
              if (containerWidth < 480) return 2;   // phones
              if (containerWidth < 768) return 3;   // small tablets
              if (containerWidth < 1024) return 4;  // laptops
              return 5;                             // desktops
            }}
          />
        )}
      </div>

      {/* PhotoSwipe Lightbox */}
      {displayItems.length > 0 && (
        <PhotoSwipeLightbox
          items={displayItems}
          open={selectedIndex >= 0}
          index={selectedIndex}
          onClose={() => setSelectedIndex(-1)}
          onIndexChange={setSelectedIndex}
          eventName={eventName}
        />
      )}
    </div>
  );
}
