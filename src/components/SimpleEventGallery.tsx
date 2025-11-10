'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronLeft, ChevronRight, Download, CheckSquare, Square, Play, Pause, ZoomIn, Share2, ListChecks } from 'lucide-react';

interface GalleryItem {
  id: string;
  url: string;
  title?: string;
  description?: string;
  type?: 'header' | 'profile' | 'photo' | 'video';
  uploadedAt?: string;
  isVideo?: boolean;
  duration?: number;
  size?: number;
}

interface SimpleEventGalleryProps {
  eventName: string;
  headerImage?: string;
  profileImage?: string;
  photos: GalleryItem[];
}

export default function SimpleEventGallery({
  eventName,
  headerImage,
  profileImage,
  photos
}: SimpleEventGalleryProps) {
  console.log('🎨 SimpleEventGallery mounted with:', { 
    eventName, 
    headerImageExists: !!headerImage,
    headerImagePreview: headerImage ? headerImage.substring(0, 50) : 'null',
    profileImageExists: !!profileImage,
    profileImagePreview: profileImage ? profileImage.substring(0, 50) : 'null',
    photosCount: photos.length 
  });
  
  const [navOpen, setNavOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const slideshowIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Build gallery items including header and profile images
  const allItems: GalleryItem[] = [];
  if (headerImage) {
    console.log('📸 Adding header image to gallery');
    allItems.push({
      id: 'header',
      url: headerImage,
      title: 'Event Header',
      type: 'header'
    });
  } else {
    console.log('⚠️ No header image to add');
  }
  if (profileImage) {
    console.log('👤 Adding profile image to gallery');
    allItems.push({
      id: 'profile',
      url: profileImage,
      title: 'Event Profile',
      type: 'profile'
    });
  } else {
    console.log('⚠️ No profile image to add');
  }
  allItems.push(...photos);
  console.log('📊 Total gallery items:', allItems.length, 'items');

  // Slideshow effect
  useEffect(() => {
    if (!slideshowActive || allItems.length === 0) return;

    const advance = () => {
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    };

    slideshowIntervalRef.current = setInterval(advance, 5000);
    return () => {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current);
      }
    };
  }, [slideshowActive, allItems.length]);

  // Handle item selection
  const toggleItemSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const selectAll = () => {
    if (selectedItems.size === allItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allItems.map(item => item.id)));
    }
  };

  // Download all items in gallery
  const downloadAllItems = async () => {
    try {
      setDownloading(true);
      console.log(`🔄 Download All: Starting bulk download of ${allItems.length} items`);

      if (allItems.length === 0) {
        alert('No items to download');
        setDownloading(false);
        return;
      }

      if (allItems.length > 1000) {
        alert('Maximum 1000 files allowed per download');
        setDownloading(false);
        return;
      }

      // Call server-side bulk download endpoint
      const response = await fetch('/api/bulk-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: eventName || 'event-gallery',
          items: allItems.map(item => ({
            id: item.id,
            url: item.url,
            title: item.title || `media-${item.id}`
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Get the ZIP blob from response
      const zipBlob = await response.blob();

      if (zipBlob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Trigger download
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventName || 'event-gallery'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Download All completed: ${(zipBlob.size / 1024 / 1024).toFixed(2)}MB`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Download All failed:', errorMsg);
      alert(`Download failed: ${errorMsg}`);
    } finally {
      setDownloading(false);
    }
  };

  // Download selected items
  const downloadSelectedItems = async () => {
    try {
      setDownloading(true);
      const itemsForDownload = allItems.filter(item => selectedItems.has(item.id));
      
      console.log(`🔄 Download Selected: Starting bulk download of ${itemsForDownload.length} items`);

      if (itemsForDownload.length === 0) {
        alert('No items selected for download');
        setDownloading(false);
        return;
      }

      if (itemsForDownload.length > 1000) {
        alert('Maximum 1000 files allowed per download');
        setDownloading(false);
        return;
      }

      // Call server-side bulk download endpoint
      const response = await fetch('/api/bulk-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: eventName || 'event-gallery',
          items: itemsForDownload.map(item => ({
            id: item.id,
            url: item.url,
            title: item.title || `media-${item.id}`
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Get the ZIP blob from response
      const zipBlob = await response.blob();

      if (zipBlob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Trigger download
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventName || 'event-gallery'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Download Selected completed: ${(zipBlob.size / 1024 / 1024).toFixed(2)}MB`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Download Selected failed:', errorMsg);
      alert(`Download failed: ${errorMsg}`);
    } finally {
      setDownloading(false);
      setSelectMode(false);
      setSelectedItems(new Set());
    }
  };

  // Navigate slideshow
  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev + 1) % allItems.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION with Header and Profile Images */}
      {(headerImage || profileImage) && (
        <div className="relative w-full">
          {/* Header Banner */}
          {headerImage && (
            <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden bg-gray-200">
              <img
                src={headerImage}
                alt="Event Header"
                className="w-full h-full object-cover"
              />
              {/* Optional overlay gradient */}
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

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
        </div>
      )}

      {/* SLIDE-OUT NAVIGATION */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed inset-0 z-40"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setNavOpen(false)}
            />

            {/* Slide Panel */}
            <motion.div className="absolute left-0 top-0 bottom-0 w-72 bg-gray-900 shadow-xl flex flex-col">
              {/* Header */}
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
                <p className="text-sm text-gray-400">{allItems.length} items in gallery</p>
              </div>

              {/* Navigation Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Slideshow Controls */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSlideshowActive(!slideshowActive);
                      if (!slideshowActive) setSelectedIndex(0);
                    }}
                    className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    {slideshowActive ? (
                      <>
                        <Pause className="w-5 h-5" />
                        Stop Slideshow
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Start Slideshow
                      </>
                    )}
                  </button>
                </div>

                {/* Select Controls */}
                <div className="space-y-2 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => setSelectMode(!selectMode)}
                    className={`w-full flex items-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors ${
                      selectMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <ListChecks className="w-5 h-5" />
                    {selectMode ? 'Selection Mode ON' : 'Enter Selection Mode'}
                  </button>
                </div>

                {/* Share Controls */}
                <div className="space-y-2 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => setShareOpen(!shareOpen)}
                    className={`w-full flex items-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors ${
                      shareOpen
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <Share2 className="w-5 h-5" />
                    Share Gallery
                  </button>
                  
                  {shareOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-gray-800 p-4 rounded-lg space-y-2"
                    >
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Gallery link copied to clipboard!');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-md text-sm text-gray-300 transition-colors"
                      >
                        📋 Copy Link
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: eventName,
                              text: `Check out this gallery: ${eventName}`,
                              url: window.location.href,
                            });
                          } else {
                            alert('Share not supported on this device');
                          }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-md text-sm text-gray-300 transition-colors"
                      >
                        🔗 Share via Device
                      </button>
                      <button
                        onClick={() => {
                          const text = `Check out this gallery: ${eventName} - ${window.location.href}`;
                          window.open(`mailto:?subject=${encodeURIComponent(eventName)}&body=${encodeURIComponent(text)}`);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-md text-sm text-gray-300 transition-colors"
                      >
                        ✉️ Share via Email
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Download Controls - SIMPLE */}
                <div className="space-y-2 pt-4 border-t border-gray-800">
                  {/* GREEN: Download All - No selection needed */}
                  <button
                    onClick={downloadAllItems}
                    disabled={downloading}
                    className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-5 h-5" />
                    Download All ({allItems.length})
                  </button>

                  {/* BLUE: Select & Download */}
                  <button
                    onClick={() => setSelectMode(!selectMode)}
                    className={`w-full flex items-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors ${
                      selectMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <CheckSquare className="w-5 h-5" />
                    {selectMode ? `Download Selected (${selectedItems.size})` : 'Select Items to Download'}
                  </button>

                  {/* Selection Controls - Only show if in select mode */}
                  {selectMode && (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAll}
                          className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2 px-3 rounded-lg transition-colors text-sm ${
                            selectedItems.size === allItems.length
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          {selectedItems.size === allItems.length ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                          Select All ({allItems.length})
                        </button>
                        <button
                          onClick={() => setSelectedItems(new Set())}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                          Clear
                        </button>
                      </div>

                      <button
                        onClick={downloadSelectedItems}
                        disabled={selectedItems.size === 0 || downloading}
                        className={`w-full font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          selectedItems.size === 0 || downloading
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        Download ({selectedItems.size}) Selected
                      </button>

                      <button
                        onClick={() => setSelectMode(false)}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2 rounded-lg transition-colors text-sm"
                      >
                        Cancel Selection
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-800 p-6 bg-gray-950">
                <p className="text-xs text-gray-500 text-center">
                  {selectMode ? `${selectedItems.size} items selected` : 'View and manage your gallery'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{eventName}</h1>
          <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {allItems.length}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* LIGHTBOX / SLIDESHOW VIEW */}
        <AnimatePresence mode="wait">
          {selectedIndex >= 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedIndex(-1);
                  setSlideshowActive(false);
                }}
                className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Main Content */}
              <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex items-center justify-center p-4"
                  >
                    {allItems[selectedIndex]?.isVideo ? (
                      <video
                        src={allItems[selectedIndex].url}
                        controls
                        autoPlay
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    ) : (
                      <img
                        src={allItems[selectedIndex].url}
                        alt={allItems[selectedIndex].title || 'Gallery item'}
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                {allItems.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-20"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-20"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}

                {/* Item Info */}
                {(allItems[selectedIndex]?.title || allItems[selectedIndex]?.description) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    {allItems[selectedIndex]?.title && (
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {allItems[selectedIndex].title}
                      </h3>
                    )}
                    {allItems[selectedIndex]?.description && (
                      <p className="text-gray-300 text-sm">
                        {allItems[selectedIndex].description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Controls */}
              <div className="bg-black/50 border-t border-white/10 px-4 md:px-6 py-4 flex items-center justify-between">
                <span className="text-white text-sm">
                  {selectedIndex + 1} / {allItems.length}
                </span>
                <div className="flex items-center gap-2">
                  {selectMode && (
                    <button
                      onClick={() => toggleItemSelection(allItems[selectedIndex].id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {selectedItems.has(allItems[selectedIndex].id) ? (
                        <CheckSquare className="w-5 h-5 text-white" />
                      ) : (
                        <Square className="w-5 h-5 text-white" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSlideshowActive(!slideshowActive);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {slideshowActive ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MASONRY GRID */}
        <div className="p-4 md:p-6">
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {allItems.filter(item => item.type !== 'header' && item.type !== 'profile').map((item, index) => {
              // Adjust index for filtered items
              const actualIndex = allItems.findIndex(i => i.id === item.id);
              return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`break-inside-avoid group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${
                selectMode && selectedItems.has(item.id)
                  ? 'ring-2 ring-green-500 shadow-green-500/50'
                  : ''
              }`}
              onClick={() => {
                if (selectMode) {
                  toggleItemSelection(item.id);
                } else {
                  setSelectedIndex(index);
                  setSlideshowActive(false);
                }
              }}
            >
              {/* Image */}
              <div className="relative w-full bg-gray-200 overflow-hidden">
                {item.isVideo ? (
                  <video
                    src={item.url}
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.title || 'Gallery item'}
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                )}

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  {item.type === 'video' && (
                    <div className="text-white">
                      <Play className="w-8 h-8 fill-current" />
                    </div>
                  )}
                  <div className="text-white">
                    <ZoomIn className="w-8 h-8" />
                  </div>
                </div>

                {/* Selection Checkbox (in select mode) */}
                {selectMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItemSelection(item.id);
                    }}
                    className="absolute top-3 left-3 z-10 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {selectedItems.has(item.id) ? (
                      <CheckSquare className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                )}

                {/* Type Badge */}
                {item.type && (
                  <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {item.type === 'header' ? '📸' : item.type === 'profile' ? '👤' : item.isVideo ? '🎬' : '📷'}
                  </div>
                )}
              </div>

              {/* Info */}
              {item.title && (
                <div className="p-3 bg-white">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.title}</p>
                  {item.uploadedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {allItems.filter(item => item.type !== 'header' && item.type !== 'profile').length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">No photos yet</h2>
            <p className="text-gray-600">Be the first to share your memories!</p>
          </div>
        )}
      </div>
    </div>
  );
}
