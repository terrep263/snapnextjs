'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Share2 } from 'lucide-react';
import UniversalShare from './UniversalShare';
import { Gallery } from './Gallery';
import type { GalleryItem, ViewMode, PackageType } from './Gallery';

interface SimpleEventGalleryProps {
  eventName: string;
  headerImage?: string;
  profileImage?: string;
  photos: GalleryItem[];
  packageType?: PackageType;
  isFree?: boolean;
  isFreebie?: boolean;
  eventSlug?: string;
  eventId?: string;
  isSharedView?: boolean;
  eventCode?: string;
  viewMode?: ViewMode;
}

export default function SimpleEventGallery({
  eventName,
  headerImage,
  profileImage,
  photos,
  packageType = 'premium',
  isFree = false,
  isFreebie = false,
  eventSlug,
  eventId,
  isSharedView = false,
  eventCode = '',
  viewMode = 'public',
}: SimpleEventGalleryProps) {
  // Determine permissions based on viewMode
  const canUpload = viewMode === 'owner' || viewMode === 'admin';
  const canDelete = viewMode === 'owner' || viewMode === 'admin';
  const canBulkDownload = packageType === 'premium' || isFreebie || packageType === 'freebie';

  const [navOpen, setNavOpen] = useState(false);

  // Helper function to detect if URL is a video - supports all Android formats
  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.avi', '.mkv', '.m4v', '.3gp', '.3g2', '.wmv', '.flv', '.ts', '.mts', '.m2ts', '.vob', '.divx', '.xvid', '.asf', '.f4v'];
    const lowercaseUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowercaseUrl.includes(ext));
  };

  // Build gallery items including header and profile images
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

  // Filter out header/profile for main gallery display
  const displayItems = allItems.filter(item => item.type !== 'header' && item.type !== 'profile');

  // Download all items
  const handleDownloadAll = async () => {
    try {
      if (allItems.length === 0) {
        alert('No items to download');
        return;
      }

      if (allItems.length > 1000) {
        alert('Maximum 1000 files allowed per download');
        return;
      }

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
            title: item.title || `media-${item.id}`,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const zipBlob = await response.blob();

      if (zipBlob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventName || 'event-gallery'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Download All failed:', errorMsg);
      alert(`Download failed: ${errorMsg}`);
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      // Refresh page to update gallery
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
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
          {canUpload && !isSharedView && (
            <a
              href={`${window.location.pathname}/upload`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden sm:inline">Upload</span>
            </a>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Gallery
          items={displayItems}
          eventName={eventName}
          eventCode={eventCode}
          canDelete={canDelete}
          canBulkDownload={canBulkDownload}
          onDownloadAll={canBulkDownload ? handleDownloadAll : undefined}
          onDelete={canDelete ? handleDeletePhoto : undefined}
        />
      </div>
    </div>
  );
}
