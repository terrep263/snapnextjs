'use client';

import { useState, useEffect } from 'react';
import { GalleryItem, LayoutType, ViewMode, PackageType, GalleryPermissions } from './types';
import { EventData, getPackageType, getViewMode, getGalleryPermissions } from '@/lib/gallery-utils';
import EventGalleryHeader from './EventGalleryHeader';
import GalleryControls, { GalleryLayout } from './GalleryControls';
import UploadModal from './UploadModal';
import GalleryContent from './GalleryContent';
import FullScreenLightbox from './FullScreenLightbox';

export interface GalleryContainerProps {
  event: EventData;
  photos: GalleryItem[]; // Current page photos
  allPhotos?: GalleryItem[]; // All photos for lightbox navigation
  loading?: boolean;
  error?: string | null;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isAdmin?: boolean;
  isOwner?: boolean;
}

const ITEMS_PER_PAGE = 50;

export default function GalleryContainer({
  event,
  photos,
  allPhotos,
  loading = false,
  error = null,
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onPageChange: externalOnPageChange,
  isAdmin = false,
  isOwner = false,
}: GalleryContainerProps) {
  // Load layout from localStorage on mount, default to 'grid'
  const [layout, setLayout] = useState<GalleryLayout>(() => {
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem('snapworxx_gallery_layout') as GalleryLayout | null;
      if (savedLayout && ['grid', 'masonry', 'list'].includes(savedLayout)) {
        return savedLayout;
      }
    }
    return 'grid';
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Use external pagination if provided, otherwise use internal state
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const currentPage = externalCurrentPage ?? internalCurrentPage;
  const totalPages = externalTotalPages ?? Math.ceil(photos.length / ITEMS_PER_PAGE);
  
  const handlePageChange = (page: number) => {
    if (externalOnPageChange) {
      externalOnPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
    // Scroll to top of gallery content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine package type and view mode
  const packageType = getPackageType(event);
  const viewMode = getViewMode(event, userEmail);
  const permissions = getGalleryPermissions(packageType, viewMode);

  // Get user email from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('userEmail');
      setUserEmail(email);
    }
  }, []);

  // Photos are already GalleryItems, just ensure they have required fields
  const galleryItems: GalleryItem[] = photos.map((photo) => ({
    ...photo,
    url: photo.url || photo.storage_url || '',
    alt: photo.alt || photo.filename || event.name,
  }));

  // Use allPhotos for lightbox, fallback to current page photos
  const lightboxItems: GalleryItem[] = (allPhotos || photos).map((photo) => ({
    ...photo,
    url: photo.url || photo.storage_url || '',
    alt: photo.alt || photo.filename || event.name,
  }));

  // Handle item click - find the item in the full list for lightbox
  const handleItemClick = (pageIndex: number) => {
    // Find the clicked item in the current page
    const clickedItem = galleryItems[pageIndex];
    if (!clickedItem) return;

    // Find the index in the full lightbox items array
    const fullIndex = lightboxItems.findIndex((item) => item.id === clickedItem.id);
    setLightboxIndex(fullIndex >= 0 ? fullIndex : pageIndex);
    setLightboxOpen(true);
  };

  const handleUploadClick = () => {
    // Open upload modal
    setUploadModalOpen(true);
  };

  const handleDownloadClick = async (item: GalleryItem) => {
    if (!item.id || !event.id) {
      console.error('Missing photo ID or event ID');
      return;
    }

    try {
      // Call the download API endpoint
      const response = await fetch('/api/download/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoId: item.id,
          eventId: event.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(errorData.error || `Download failed: ${response.statusText}`);
      }

      // Check if response is JSON (signed URL) or binary (watermarked file)
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        // Premium package or video without watermark - signed URL returned
        const data = await response.json();
        if (data.success && data.data?.url) {
          // For videos, always fetch as blob to force download (browsers try to play videos)
          // For images, we can use the direct URL with download attribute
          const isVideo = data.data.isVideo || item.isVideo;
          const filename = data.data.filename || item.filename || (isVideo ? 'video.mp4' : 'photo.jpg');
          
          if (isVideo) {
            // Fetch the video as a blob to force download
            const videoResponse = await fetch(data.data.url);
            const videoBlob = await videoResponse.blob();
            const url = window.URL.createObjectURL(videoBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else {
            // For images, use direct download
            const link = document.createElement('a');
            link.href = data.data.url;
            link.download = filename;
            // Don't use target='_blank' for downloads - it causes videos to open instead
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      } else {
        // Basic/Freebie - watermarked file returned directly
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Ensure proper filename with extension
        const filename = item.filename || (item.isVideo ? 'video.mp4' : 'photo.jpg');
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(error instanceof Error ? error.message : 'Download failed. Please try again.');
    }
  };

  const handleBulkDownloadClick = () => {
    // Placeholder for bulk download
    // Bulk download - implemented in dashboard
  };

  const handleShareClick = (item: GalleryItem, eventData?: EventData) => {
    // Share functionality - opens share modal via UniversalShare
    // This is handled in FullScreenLightbox component
  };

  const handleModerate = async (item: GalleryItem, action: string) => {
    if (!item.id || !event.id) {
      console.error('Missing photo ID or event ID');
      return;
    }

    try {
      const response = await fetch(`/api/moderation/photo/${item.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason: action === 'flag' ? 'Flagged via gallery moderation' : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Moderation action failed');
      }

      // Refresh gallery to reflect changes
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Moderation error:', error);
      alert(error instanceof Error ? error.message : 'Moderation action failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gallery Header - Mandatory */}
      <EventGalleryHeader event={event} />

      {/* Gallery Controls */}
      <GalleryControls
        layout={layout}
        onLayoutChange={setLayout}
        onUploadClick={handleUploadClick}
        sticky={true}
      />

      {/* Gallery Content Area */}
      <GalleryContent
        items={galleryItems}
        layout={layout}
        onItemClick={handleItemClick}
        onDownload={handleDownloadClick}
        onShare={handleShareClick}
        permissions={permissions}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Full Screen Lightbox */}
      {lightboxOpen && (
        <FullScreenLightbox
          items={lightboxItems}
          index={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setLightboxIndex}
          event={event}
          onDownload={(item, eventData) => {
            handleDownloadClick(item);
          }}
          onShare={(item, eventData) => {
            // Share functionality handled by FullScreenLightbox
          }}
          onFavorite={(item, favorited) => {
            // Favorite functionality - to be implemented
          }}
          isAdmin={isAdmin}
          isOwner={isOwner}
          onModerate={handleModerate}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        eventSlug={event.slug}
        eventId={event.id}
        event={event}
        onUploadComplete={() => {
          // Refresh gallery data
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}

