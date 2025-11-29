'use client';

/**
 * MASONRYGALLERY WRAPPER
 * Maintains compatibility with existing SnapWorxx codebase
 * while using the new UniversalMobileGallery system
 */

import UniversalMobileGallery, { MediaItem } from './UniversalMobileGallery';

interface Photo {
  id: string;
  url: string;
  alt?: string;
  filename?: string;
  created_at?: string;
  type?: string; // MIME type
  
  // Optional video metadata
  codec?: string;
  width?: number;
  height?: number;
}

type LayoutType = 'masonry' | 'grid';

interface MasonryGalleryProps {
  photos: Photo[];
  onDownload?: (photo: Photo) => void | Promise<void>;
  onDownloadAll?: () => void | Promise<void>;
  onDelete?: (photoId: string) => void | Promise<void>;
  layout?: LayoutType;
  eventId?: string;
  eventName?: string;
  
  // Product tier settings
  canBulkDownload?: boolean;
  maxBulkDownload?: number;
}

export default function MasonryGallery({
  photos,
  onDownload,
  onDownloadAll,
  onDelete,
  layout = 'masonry',
  eventId,
  eventName,
  canBulkDownload = true,
  maxBulkDownload,
}: MasonryGalleryProps) {

  // Transform photos to MediaItem format
  const galleryItems: MediaItem[] = photos.map((photo): MediaItem => {
    const isVideo = photo.type?.startsWith('video/') || false;
    
    return {
      id: photo.id,
      url: photo.url,
      type: isVideo ? 'video' : 'image',
      filename: photo.filename,
      title: photo.alt || photo.filename,
      created_at: photo.created_at,
      mimeType: photo.type,
      codec: photo.codec as any,
      width: photo.width,
      height: photo.height,
    };
  });

  // Handle bulk download
  const handleBulkDownload = async (items: MediaItem[]) => {
    if (onDownloadAll) {
      await Promise.resolve(onDownloadAll());
    }
    // UniversalMobileGallery handles actual ZIP creation if no custom handler
  };

  // Handle single download
  const handleSingleDownload = async (items: MediaItem[]) => {
    if (items.length === 1 && onDownload) {
      const photo: Photo = {
        id: items[0].id,
        url: items[0].url,
        alt: items[0].title,
        filename: items[0].filename,
        created_at: items[0].created_at,
        type: items[0].mimeType,
      };
      await Promise.resolve(onDownload(photo));
    }
  };

  // Handle delete
  const handleDelete = async (itemId: string) => {
    if (onDelete) {
      await Promise.resolve(onDelete(itemId));
    }
  };

  if (photos.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No photos yet</h3>
        <p className="text-gray-500">Be the first to upload and share memories from this event!</p>
      </div>
    );
  }

  return (
    <UniversalMobileGallery
      items={galleryItems}
      eventId={eventId}
      eventName={eventName}
      layout={layout}
      canBulkDownload={canBulkDownload}
      maxBulkDownload={maxBulkDownload}
      onDownload={onDownloadAll ? handleBulkDownload : handleSingleDownload}
      onDelete={onDelete ? async (id) => handleDelete(id) : undefined}
      showControls={true}
      enableSelection={canBulkDownload}
    />
  );
}
