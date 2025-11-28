'use client';

import { useState, useRef } from 'react';
import Lightbox from './Lightbox';
import GalleryGrid from './GalleryGrid';
import GalleryControls from './GalleryControls';
import type { GalleryItem, LayoutType } from './types';

interface GalleryProps {
  items: GalleryItem[];
  eventName?: string;
  eventCode?: string;
  layout?: LayoutType;
  showControls?: boolean;

  // Permissions
  canDelete?: boolean;
  canBulkDownload?: boolean;

  // Callbacks
  onDownload?: (item: GalleryItem) => Promise<void>;
  onDownloadAll?: () => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
}

export default function Gallery({
  items,
  eventName = '',
  eventCode = '',
  layout: initialLayout = 'masonry',
  showControls = true,
  canDelete = false,
  canBulkDownload = true,
  onDownload,
  onDownloadAll,
  onDelete,
}: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [layout, setLayout] = useState<LayoutType>(initialLayout);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const lightboxRef = useRef<any>(null);

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
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  // Clear selection and exit select mode
  const clearSelection = () => {
    setSelectedItems(new Set());
    setSelectMode(false);
  };

  // Download a single item
  const handleDownload = async (item: GalleryItem) => {
    if (!onDownload) {
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
    } else {
      await onDownload(item);
    }
  };

  // Download selected items
  const handleDownloadSelected = async () => {
    if (selectedItems.size === 0) return;

    setDownloading(true);
    try {
      const itemsToDownload = items.filter(item => selectedItems.has(item.id));

      // If onDownloadAll is provided and we're downloading all items, use that
      if (onDownloadAll && selectedItems.size === items.length) {
        await onDownloadAll();
      } else {
        // Download each selected item individually
        for (const item of itemsToDownload) {
          await handleDownload(item);
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Clear selection after successful download
      clearSelection();
    } catch (error) {
      console.error('Bulk download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Delete an item
  const handleDelete = async (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!onDelete) return;
    if (!confirm(`Delete ${item.filename || item.title || 'this item'}?`)) return;

    setDeleting(item.id);
    try {
      await onDelete(item.id);
      // Item will be removed from the list by parent component
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Open lightbox at specific index
  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  // Close lightbox
  const closeLightbox = () => {
    setSelectedIndex(-1);
  };

  return (
    <div className="w-full">
      {/* Controls */}
      {showControls && (
        <GalleryControls
          totalItems={items.length}
          layout={layout}
          selectMode={selectMode}
          selectedCount={selectedItems.size}
          downloading={downloading}
          onLayoutChange={setLayout}
          onToggleSelectMode={() => setSelectMode(!selectMode)}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onDownloadSelected={handleDownloadSelected}
          onDownloadAll={canBulkDownload ? onDownloadAll : undefined}
          canBulkDownload={canBulkDownload}
        />
      )}

      {/* Gallery Grid */}
      <GalleryGrid
        items={items}
        layout={layout}
        selectMode={selectMode}
        selectedItems={selectedItems}
        deleting={deleting}
        eventName={eventName}
        eventCode={eventCode}
        canDelete={canDelete}
        onItemClick={openLightbox}
        onToggleSelection={toggleItemSelection}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />

      {/* Lightbox */}
      <Lightbox
        ref={lightboxRef}
        items={items}
        open={selectedIndex >= 0}
        index={selectedIndex}
        onClose={closeLightbox}
        onIndexChange={setSelectedIndex}
        eventName={eventName}
      />
    </div>
  );
}
