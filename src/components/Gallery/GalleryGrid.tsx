'use client';

import { motion } from 'framer-motion';
import Masonry from 'react-masonry-css';
import { Play, CheckSquare, Square, Download, Share2, Trash2, Eye, ZoomIn } from 'lucide-react';
import UniversalShare from '../UniversalShare';
import type { GalleryItem, LayoutType } from './types';

// Helper function to detect video URLs - supports all Android formats
function isVideoUrl(url: string): boolean {
  const videoExtensions = ['mp4', 'm4v', 'webm', 'ogv', 'ogg', 'mov', 'avi', 'mkv', '3gp', '3g2', 'wmv', 'flv', 'ts', 'mts', 'm2ts', 'vob', 'divx', 'xvid', 'asf', 'f4v'];
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  return videoExtensions.includes(ext);
}

interface GalleryGridProps {
  items: GalleryItem[];
  layout?: LayoutType;
  selectMode?: boolean;
  selectedItems?: Set<string>;
  deleting?: string | null;
  eventName?: string;
  eventCode?: string;

  // Permissions
  canDelete?: boolean;

  // Callbacks
  onItemClick: (index: number) => void;
  onToggleSelection?: (id: string) => void;
  onDownload?: (item: GalleryItem) => void;
  onDelete?: (item: GalleryItem, e: React.MouseEvent) => void;
  onShare?: (item: GalleryItem) => void;
}

// Masonry breakpoints for responsive columns
const breakpointColumnsObj = {
  default: 4,      // 4 columns on desktop (1200px+)
  1199: 3,         // 3 columns on tablet (768px-1199px)
  767: 2,          // 2 columns on mobile (480px-767px)
  479: 1           // 1 column on small mobile (<480px)
};

export default function GalleryGrid({
  items,
  layout = 'masonry',
  selectMode = false,
  selectedItems = new Set(),
  deleting = null,
  eventName = '',
  eventCode = '',
  canDelete = false,
  onItemClick,
  onToggleSelection,
  onDownload,
  onDelete,
  onShare,
}: GalleryGridProps) {

  const renderItem = (item: GalleryItem, index: number) => {
    const isSelected = selectedItems.has(item.id);
    const isVideo = item.isVideo || item.type === 'video' || isVideoUrl(item.url);

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${layout === 'masonry' ? 'break-inside-avoid mb-4' : ''} group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer touch-manipulation ${
          selectMode && isSelected
            ? 'ring-4 ring-blue-500 ring-offset-2'
            : ''
        }`}
        onClick={() => {
          console.log('🖱️ GalleryGrid onClick triggered:', { index, itemId: item.id, selectMode });
          if (selectMode && onToggleSelection) {
            onToggleSelection(item.id);
          } else {
            console.log('📸 Calling onItemClick with index:', index);
            onItemClick(index);
          }
        }}
      >
        {/* Media (Image or Video) */}
        <div className={`relative w-full bg-gray-200 overflow-hidden ${layout === 'grid' ? 'aspect-square' : ''}`}>
          {isVideo ? (
            <video
              src={item.url}
              className={`w-full ${layout === 'grid' ? 'h-full object-cover' : 'h-auto object-cover'} group-hover:scale-110 transition-transform duration-300`}
              preload="metadata"
              muted
              playsInline
              draggable={false}
              style={{
                imageRendering: 'auto',
                WebkitBackfaceVisibility: 'hidden'
              }}
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                video.currentTime = Math.min(1, video.duration / 4);
              }}
            />
          ) : (
            <img
              src={item.url}
              alt={item.alt || item.title || item.filename || 'Gallery item'}
              className={`w-full ${layout === 'grid' ? 'h-full object-cover' : 'h-auto object-cover'} group-hover:scale-110 transition-transform duration-300`}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{
                imageRendering: 'auto',
                WebkitFontSmoothing: 'antialiased',
                WebkitBackfaceVisibility: 'hidden'
              }}
            />
          )}

          {/* Video play indicator overlay */}
          {isVideo && !selectMode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black bg-opacity-50 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Play className="h-8 w-8 text-white fill-current" />
              </div>
            </div>
          )}

          {/* Hover overlay with actions */}
          {!selectMode && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 md:transition-opacity md:duration-300 flex flex-col items-center justify-center gap-2 touch-none pointer-events-none">
              {/* View/Zoom icon */}
              <div className="flex items-center gap-3 pointer-events-auto">
                <div className="text-white">
                  <ZoomIn className="w-8 h-8" />
                </div>
              </div>

              {/* Action buttons row */}
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 w-full px-2 sm:w-auto sm:px-0 pointer-events-auto">
                {/* Share button */}
                <div onClick={(e) => e.stopPropagation()}>
                  <UniversalShare
                    imageUrl={item.url}
                    eventName={eventName}
                    eventCode={eventCode}
                    isVideo={isVideo}
                  />
                </div>

                {/* Download button */}
                {onDownload && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      onDownload(item);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-white/90 hover:bg-white text-gray-900 px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-lg text-sm font-medium transition-colors shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                )}

                {/* Delete button (if permitted) */}
                {canDelete && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item, e);
                    }}
                    disabled={deleting === item.id}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Selection Checkbox (in select mode) */}
          {selectMode && onToggleSelection && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(item.id);
              }}
              className="absolute top-3 left-3 z-10 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}

          {/* Type Badge */}
          {item.type && (
            <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {item.type === 'header' ? '📸' : item.type === 'profile' ? '👤' : isVideo ? '🎬' : '📷'}
            </div>
          )}
        </div>

        {/* Item Info */}
        {(item.title || item.filename) && (
          <div className="p-3 bg-white">
            <p className="font-medium text-gray-900 text-sm truncate">
              {item.title || item.filename}
            </p>
            {(item.uploadedAt || item.created_at) && (
              <p className="text-xs text-gray-500 mt-1">
                {new Date(item.uploadedAt || item.created_at!).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">📷</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">No photos yet</h2>
        <p className="text-gray-600">Be the first to share your memories!</p>
      </div>
    );
  }

  if (layout === 'masonry') {
    return (
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {items.map((item, index) => renderItem(item, index))}
      </Masonry>
    );
  }

  // Grid layout
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
}
