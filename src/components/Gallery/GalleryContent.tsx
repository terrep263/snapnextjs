'use client';

import { useState, useMemo } from 'react';
import { GalleryItem, GalleryPermissions } from './types';
import { GalleryLayout } from './GalleryControls';
import Masonry from 'react-masonry-css';

export interface GalleryContentProps {
  items: GalleryItem[];
  layout: GalleryLayout;
  onItemClick: (index: number) => void;
  onDownload?: (item: GalleryItem) => void;
  onShare?: (item: GalleryItem) => void;
  permissions: GalleryPermissions;
  loading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const ITEMS_PER_PAGE = 50;

/**
 * Format file size to human-readable format
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format date to relative time or readable format
 */
function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}


export default function GalleryContent({
  items,
  layout,
  onItemClick,
  loading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: GalleryContentProps) {
  // Paginate items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage]);

  if (loading) {
    return <GallerySkeleton layout={layout} />;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">No photos yet. Be the first to upload!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Layout-specific rendering */}
      {layout === 'grid' && (
        <GridLayout items={paginatedItems} onItemClick={onItemClick} />
      )}
      {layout === 'masonry' && (
        <MasonryLayout items={paginatedItems} onItemClick={onItemClick} />
      )}
      {layout === 'list' && (
        <ListLayout items={paginatedItems} onItemClick={onItemClick} />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && onPageChange && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

/**
 * Grid Layout Component
 * Responsive grid: 2 cols mobile, 3 tablet, 4 desktop, 5 large desktop
 */
function GridLayout({
  items,
  onItemClick,
}: {
  items: GalleryItem[];
  onItemClick: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
      {items.map((item, index) => (
        <GalleryItemCard
          key={item.id}
          item={item}
          index={index}
          onItemClick={onItemClick}
          aspectRatio="square"
        />
      ))}
    </div>
  );
}

/**
 * Masonry Layout Component
 * Pinterest-style columnar layout preserving aspect ratios
 */
function MasonryLayout({
  items,
  onItemClick,
}: {
  items: GalleryItem[];
  onItemClick: (index: number) => void;
}) {
  const breakpointColumns = {
    default: 5,
    1440: 5,
    1024: 4,
    640: 3,
    0: 2,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="masonry-grid"
      columnClassName="masonry-grid_column"
    >
      {items.map((item, index) => (
        <div key={item.id} className="mb-3 sm:mb-4">
          <GalleryItemCard
            item={item}
            index={index}
            onItemClick={onItemClick}
            aspectRatio="preserve"
          />
        </div>
      ))}
    </Masonry>
  );
}

/**
 * List Layout Component
 * One item per row with thumbnail and metadata
 */
function ListLayout({
  items,
  onItemClick,
}: {
  items: GalleryItem[];
  onItemClick: (index: number) => void;
}) {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onItemClick(index)}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
              {item.isVideo ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 relative">
                  <img
                    src={item.thumbnail_url || item.url}
                    alt={item.alt || item.filename || 'Video thumbnail'}
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-white drop-shadow-lg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <img
                  src={item.thumbnail_url || item.url}
                  alt={item.alt || item.filename || 'Photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </div>

            {/* Metadata */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate mb-1">
                {item.filename || 'Untitled'}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                <span>{formatDate(item.created_at)}</span>
                {item.size && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(item.size)}</span>
                  </>
                )}
                {item.isVideo && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      Video
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Gallery Item Card Component
 * Reusable card for grid and masonry layouts
 */
function GalleryItemCard({
  item,
  index,
  onItemClick,
  aspectRatio,
}: {
  item: GalleryItem;
  index: number;
  onItemClick: (index: number) => void;
  aspectRatio: 'square' | 'preserve';
}) {
  const aspectRatioStyle =
    aspectRatio === 'preserve' && item.width && item.height
      ? { aspectRatio: `${item.width} / ${item.height}` }
      : { aspectRatio: '1 / 1' };

  return (
    <div
      className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
      style={aspectRatioStyle}
      onClick={() => onItemClick(index)}
    >
      {item.isVideo ? (
        <>
          <img
            src={item.thumbnail_url || item.url}
            alt={item.alt || item.filename || 'Video thumbnail'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Video Play Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </>
      ) : (
        <img
          src={item.thumbnail_url || item.url}
          alt={item.alt || item.filename || 'Photo'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
}

/**
 * Pagination Controls Component
 */
function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-8 pb-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 7) {
            pageNum = i + 1;
          } else if (currentPage <= 4) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 3) {
            pageNum = totalPages - 6 + i;
          } else {
            pageNum = currentPage - 3 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === pageNum
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

/**
 * Loading Skeleton Component
 */
function GallerySkeleton({ layout }: { layout: GalleryLayout }) {
  const skeletonItems = Array.from({ length: 12 }, (_, i) => i);

  if (layout === 'list') {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {skeletonItems.map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="flex gap-4">
              <div className="w-32 h-32 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
      {skeletonItems.map((i) => (
        <div
          key={i}
          className="aspect-square bg-gray-200 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}

