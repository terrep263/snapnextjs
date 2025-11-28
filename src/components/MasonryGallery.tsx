'use client';

import { Gallery } from './Gallery';
import type { GalleryItem } from './Gallery';

interface Photo {
  id: string;
  url: string;
  alt?: string;
  filename?: string;
  created_at?: string;
  type?: string; // MIME type to distinguish videos from images
}

type LayoutType = 'masonry' | 'grid';

interface MasonryGalleryProps {
  photos: Photo[];
  onDownload?: (photo: Photo) => void;
  onDownloadAll?: () => void;
  onDelete?: (photoId: string) => void;
  layout?: LayoutType;
}

export default function MasonryGallery({
  photos,
  onDownload,
  onDownloadAll,
  onDelete,
  layout = 'masonry'
}: MasonryGalleryProps) {

  // Transform Photo[] to GalleryItem[]
  const galleryItems: GalleryItem[] = photos.map((photo): GalleryItem => ({
    id: photo.id,
    url: photo.url,
    alt: photo.alt,
    filename: photo.filename,
    title: photo.filename,
    created_at: photo.created_at,
    isVideo: photo.type?.startsWith('video/'),
    mimeType: photo.type,
  }));

  // Wrap onDownload to match signature
  const handleDownload = async (item: GalleryItem) => {
    if (onDownload) {
      const photo: Photo = {
        id: item.id,
        url: item.url,
        alt: item.alt,
        filename: item.filename,
        created_at: item.created_at,
        type: item.mimeType,
      };
      await onDownload(photo);
    }
  };

  // Wrap onDelete to match signature
  const handleDelete = async (itemId: string) => {
    if (onDelete) {
      await onDelete(itemId);
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
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Event Photos ({photos.length})
        </h2>
      </div>

      <Gallery
        items={galleryItems}
        layout={layout}
        showControls={true}
        canDelete={!!onDelete}
        canBulkDownload={!!onDownloadAll}
        onDownload={onDownload ? handleDownload : undefined}
        onDownloadAll={onDownloadAll}
        onDelete={onDelete ? handleDelete : undefined}
      />
    </div>
  );
}
