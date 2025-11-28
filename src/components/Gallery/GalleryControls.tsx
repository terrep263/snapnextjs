'use client';

import { LayoutGrid, Grid3x3, CheckSquare, Square, Download } from 'lucide-react';
import type { LayoutType } from './types';

interface GalleryControlsProps {
  totalItems: number;
  layout: LayoutType;
  selectMode: boolean;
  selectedCount: number;
  downloading: boolean;

  // Callbacks
  onLayoutChange: (layout: LayoutType) => void;
  onToggleSelectMode: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDownloadSelected: () => void;
  onDownloadAll?: () => void;

  // Permissions
  canBulkDownload?: boolean;
}

export default function GalleryControls({
  totalItems,
  layout,
  selectMode,
  selectedCount,
  downloading,
  onLayoutChange,
  onToggleSelectMode,
  onSelectAll,
  onClearSelection,
  onDownloadSelected,
  onDownloadAll,
  canBulkDownload = true,
}: GalleryControlsProps) {

  return (
    <div className="mb-6 space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Gallery ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </h2>

        <div className="flex items-center gap-2">
          {/* Layout Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onLayoutChange('masonry')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'masonry'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Masonry Layout"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => onLayoutChange('grid')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'grid'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Grid Layout"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
          </div>

          {/* Selection Controls */}
          {!selectMode ? (
            <div className="flex gap-2">
              <button
                onClick={onToggleSelectMode}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <CheckSquare className="h-4 w-4" />
                Select
              </button>
              {canBulkDownload && onDownloadAll && (
                <button
                  onClick={onDownloadAll}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Download All
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-200"
              >
                {selectedCount === totalItems ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    All Selected
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    Select All
                  </>
                )}
              </button>
              <button
                onClick={onClearSelection}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selection Bar (shown when in select mode) */}
      {selectMode && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} of {totalItems} selected
            </span>
          </div>
          {selectedCount > 0 && (
            <button
              onClick={onDownloadSelected}
              disabled={downloading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Downloading...' : `Download ${selectedCount}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
