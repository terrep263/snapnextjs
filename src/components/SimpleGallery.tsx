'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Download, Trash2, Share2, Play, CheckSquare, Square, ZoomIn, Grid3x3, Columns3 } from 'lucide-react';
import PhotoSwipeLightbox from './Gallery/PhotoSwipeLightbox';
import UniversalShare from './UniversalShare';

interface GalleryPhoto {
  id: string;
  url: string;
  title?: string;
  filename?: string;
  description?: string;
  uploadedAt?: string;
  isVideo?: boolean;
  type?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

interface SimpleGalleryProps {
  photos: GalleryPhoto[];
  onDownload?: (photo: GalleryPhoto) => void;
  onDelete?: (photo: GalleryPhoto) => void;
  layout?: 'grid' | 'masonry' | 'columns';
  columns?: number;
  eventName?: string;
  eventCode?: string;
  userEmail?: string;
  canDelete?: boolean;
  deleting?: string | null;
}

const THUMBNAIL_HEIGHT = 200; // Fixed height in pixels

export default function SimpleGallery({
  photos,
  onDownload,
  onDelete,
  layout = 'grid',
  columns = 3,
  eventName = 'Event',
  eventCode = '',
  userEmail = '',
  canDelete = false,
  deleting = null,
}: SimpleGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [photosWithDimensions, setPhotosWithDimensions] = useState<GalleryPhoto[]>(photos);
  const [currentLayout, setCurrentLayout] = useState<'grid' | 'masonry' | 'columns'>(layout);

  // Detect image dimensions for lightbox
  useEffect(() => {
    const detectDimensions = async () => {
      const updated = await Promise.all(
        photos.map(async (photo) => {
          // Skip if already has dimensions or is video
          if (photo.width || photo.height || photo.isVideo || photo.type === 'video') {
            return photo;
          }

          try {
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = photo.url;
            });

            return {
              ...photo,
              width: img.naturalWidth || 1920,
              height: img.naturalHeight || 1080,
            };
          } catch (err) {
            // Fallback to default dimensions
            console.warn('Failed to detect dimensions for:', photo.url);
            return {
              ...photo,
              width: 1920,
              height: 1080,
            };
          }
        })
      );

      setPhotosWithDimensions(updated);
    };

    detectDimensions();
  }, [photos]);

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleDownload = useCallback((photo: GalleryPhoto) => {
    onDownload?.(photo);
  }, [onDownload]);

  const handleDelete = useCallback(async (photo: GalleryPhoto) => {
    if (window.confirm(`Delete ${photo.filename}?`)) {
      onDelete?.(photo);
    }
  }, [onDelete]);

  // Grid styles - fixed height for all items
  const gridContainerStyle: React.CSSProperties = currentLayout === 'masonry' ? {
    columnCount: columns,
    columnGap: '16px',
    width: '100%',
  } : {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '16px',
    width: '100%',
  };

  const masonryItemStyle: React.CSSProperties = currentLayout === 'masonry' ? {
    breakInside: 'avoid',
    marginBottom: '16px',
    width: '100%',
  } : {};

  const thumbnailStyle: React.CSSProperties = {
    width: '100%',
    height: currentLayout === 'masonry' ? 'auto' : `${THUMBNAIL_HEIGHT}px`,
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    aspectRatio: currentLayout === 'masonry' ? '3/4' : undefined,
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    backgroundColor: '#f3f4f6',
  };

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <ZoomIn className="w-16 h-16 mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos yet</h3>
        <p>Be the first to upload and share memories from this event!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Layout Toggle Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setCurrentLayout('grid')}
          title="Grid Layout"
          className={`p-2 rounded-lg transition-colors ${
            currentLayout === 'grid'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <Grid3x3 size={24} />
        </button>
        <button
          onClick={() => setCurrentLayout('masonry')}
          title="Masonry Layout"
          className={`p-2 rounded-lg transition-colors ${
            currentLayout === 'masonry'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <Columns3 size={24} />
        </button>
      </div>

      {/* Gallery Grid/Masonry */}
      <div style={gridContainerStyle}>
        {photos.map((photo, index) => {
          const isSelected = selectedItems.has(photo.id);
          const isVideo = photo.isVideo || photo.type === 'video';

          return (
            <div key={photo.id} style={masonryItemStyle}>
              <div
                style={thumbnailStyle}
                onClick={() => {
                  console.log('🖼️ Opening lightbox for photo:', photo.id, 'at index:', index);
                  setSelectedIndex(index);
                }}
              >
                {/* Image/Video - SIMPLE AND VISIBLE */}
                {isVideo ? (
                  <video
                    src={photo.url}
                    style={imageStyle}
                    preload="metadata"
                    controls
                    playsInline
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    src={photo.url}
                    alt={photo.title || photo.filename || 'Photo'}
                    style={imageStyle}
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox - Click to expand */}
      {photos.length > 0 && (
        <PhotoSwipeLightbox
          items={photosWithDimensions.map(photo => ({
            ...photo,
            type: (photo.isVideo || photo.type === 'video' ? 'video' : 'photo') as 'photo' | 'video',
          }))}
          open={selectedIndex >= 0}
          index={selectedIndex}
          onClose={() => {
            console.log('🔒 Lightbox closed');
            setSelectedIndex(-1);
          }}
          onIndexChange={(newIndex) => {
            console.log('📍 Lightbox index changed to:', newIndex);
            setSelectedIndex(newIndex);
          }}
          eventName={eventName}
        />
      )}
    </div>
  );
}
