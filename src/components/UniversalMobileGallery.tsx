'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Share2, Loader2, Trash2, Download, Check } from 'lucide-react';
import UniversalShare from './UniversalShare';
import YarlLightbox from './Gallery/YarlLightbox';
import GalleryGrid from './Gallery/GalleryGrid';
import GalleryControls from './Gallery/GalleryControls';
import type { GalleryItem, LayoutType, ViewMode, PackageType } from './Gallery';

interface UniversalMobileGalleryProps {
  // Gallery Content
  photos: GalleryItem[];
  eventName?: string;
  eventCode?: string;
  headerImage?: string;
  profileImage?: string;
  
  // UI Configuration
  layout?: LayoutType;
  showControls?: boolean;
  showHeader?: boolean;
  showNavigation?: boolean;
  
  // Permissions (derived from viewMode or explicit)
  viewMode?: ViewMode;
  packageType?: PackageType;
  isFree?: boolean;
  isFreebie?: boolean;
  isSharedView?: boolean;
  maxBulkDownload?: number | null;
  
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

export default function UniversalMobileGallery({
  // Content
  photos,
  eventName = '',
  eventCode = '',
  headerImage,
  profileImage,
  
  // UI Config
  layout: initialLayout = 'masonry',
  showControls = true,
  showHeader = true,
  showNavigation = true,
  
  // Permissions
  viewMode = 'public',
  packageType = 'premium',
  isFree = false,
  isFreebie = false,
  isSharedView = false,
  maxBulkDownload = null,
  canDelete: explicitCanDelete,
  canBulkDownload: explicitCanBulkDownload,
  canUpload: explicitCanUpload,
  
  // Context
  eventSlug,
  eventId,
  
  // Callbacks
  onDownload,
  onDownloadAll,
  onDelete,
  onUpload,
}: UniversalMobileGalleryProps) {
  // Derive permissions from viewMode if not explicitly overridden
  const canDelete = explicitCanDelete !== undefined ? explicitCanDelete : (viewMode === 'owner' || viewMode === 'admin');
  const canBulkDownload = explicitCanBulkDownload !== undefined ? explicitCanBulkDownload : (packageType === 'premium' || isFreebie || packageType === 'freebie');
  const canUpload = explicitCanUpload !== undefined ? explicitCanUpload : (viewMode === 'owner' || viewMode === 'admin');

  // Gallery state
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [layoutMode, setLayout] = useState<LayoutType>(initialLayout);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  // Helper function to detect if URL is a video
  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.avi', '.mkv', '.m4v', '.3gp', '.3g2', '.wmv', '.flv', '.ts', '.mts', '.m2ts', '.vob', '.divx', '.xvid', '.asf', '.f4v'];
    const lowercaseUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowercaseUrl.includes(ext));
  };

  // Build all items (header, profile, photos)
  const allItems: GalleryItem[] = [];
  if (headerImage) {
    allItems.push({
      id: 'header',
      url: headerImage,
      title: 'Event Header',
      type: 'header',
      isVideo: isVideoUrl(headerImage),
    });
  }
  if (profileImage) {
    allItems.push({
      id: 'profile',
      url: profileImage,
      title: 'Event Profile',
      type: 'profile',
      isVideo: isVideoUrl(profileImage),
    });
  }
  allItems.push(...photos);

  // Display items exclude header/profile
  const displayItems = allItems.filter(item => item.type !== 'header' && item.type !== 'profile');

  // Toggle item selection
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

  // Select all items
  const selectAll = () => {
    if (selectedItems.size === displayItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(displayItems.map(item => item.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
    setSelectMode(false);
  };

  // Download single item
  const handleDownload = async (item: GalleryItem) => {
    if (onDownload) {
      await onDownload(item);
    } else {
      // Default download behavior
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

  // Download all items
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

      clearSelection();
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

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION with Header and Profile Images */}
      {showHeader && (headerImage || profileImage) && (
        <div className="relative w-full">
          {/* Header Banner */}
          {headerImage && (
            <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden bg-gray-200">
              <img
                src={headerImage}
                alt="Event Header"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/30"></div>
            </div>
          )}

          {/* Profile Section */}
          <div className="relative -mt-20 z-10 flex flex-col items-center px-4 pb-8">
            {profileImage && (
              <img
                src={profileImage}
                alt="Event Profile"
                className="w-40 h-40 rounded-full border-4 border-white shadow-lg object-cover"
              />
            )}
            <h1 className="mt-6 text-4xl md:text-5xl font-bold text-gray-900 text-center">
              {eventName}
            </h1>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
        </div>
      )}

      {/* SLIDE-OUT NAVIGATION */}
      {showNavigation && (
        <AnimatePresence>
          {navOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-0 z-40"
            >
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setNavOpen(false)}
              />

              <motion.div className="absolute left-0 top-0 bottom-0 w-72 bg-gray-900 shadow-xl flex flex-col">
                <div className="p-6 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">{eventName}</h2>
                    <button
                      onClick={() => setNavOpen(false)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">{displayItems.length} items in gallery</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Share Controls */}
                  <div className="space-y-2 border-t border-gray-800 pt-4">
                    <UniversalShare
                      url={typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}
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

                <div className="border-t border-gray-800 p-6 bg-gray-950">
                  <p className="text-xs text-gray-500 text-center">
                    View and manage your gallery
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* TOP BAR */}
      {showNavigation && (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{eventName}</h1>
            {canUpload && !isSharedView && onUpload && (
              <button
                onClick={onUpload}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="hidden sm:inline">Upload</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className={showNavigation ? 'max-w-7xl mx-auto px-4 md:px-6 py-8' : ''}>
        {/* Controls */}
        {showControls && (
          <GalleryControls
            totalItems={displayItems.length}
            layout={layoutMode}
            selectMode={selectMode}
            selectedCount={selectedItems.size}
            downloading={downloading}
            onLayoutChange={setLayout}
            onToggleSelectMode={() => setSelectMode(!selectMode)}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onDownloadSelected={handleDownloadAll}
            onDownloadAll={canBulkDownload ? onDownloadAll : undefined}
            canBulkDownload={canBulkDownload}
          />
        )}

        {/* Gallery Grid */}
        <GalleryGrid
          items={displayItems}
          layout={layoutMode}
          selectMode={selectMode}
          selectedItems={selectedItems}
          deleting={deleting}
          eventName={eventName}
          eventCode={eventCode}
          canDelete={canDelete}
          onItemClick={(index) => setSelectedIndex(index)}
          onToggleSelection={toggleItemSelection}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />

        {/* Empty State */}
        {displayItems.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No photos yet</h3>
            <p className="text-gray-500">Be the first to upload and share memories from this event!</p>
          </div>
        )}

        {/* Lightbox */}
        <YarlLightbox
          items={displayItems}
          open={selectedIndex >= 0}
          index={selectedIndex}
          onClose={() => setSelectedIndex(-1)}
          onIndexChange={setSelectedIndex}
          eventName={eventName}
        />
      </div>
    </div>
  );
}
