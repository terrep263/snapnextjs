'use client';

import { useEffect } from 'react';

export type GalleryLayout = 'grid' | 'masonry' | 'list';

export interface GalleryControlsProps {
  onUploadClick: () => void;
  layout: GalleryLayout;
  onLayoutChange: (layout: GalleryLayout) => void;
  sticky?: boolean;
}

const LAYOUT_STORAGE_KEY = 'snapworxx_gallery_layout';

/**
 * GalleryControls Component
 * 
 * Control bar for the gallery with:
 * - Upload button (left side)
 * - Layout toggle buttons (right side)
 * - Layout state persisted to localStorage
 * - Responsive design with optional sticky positioning
 */
export default function GalleryControls({
  onUploadClick,
  layout,
  onLayoutChange,
  sticky = true,
}: GalleryControlsProps) {
  // Save layout to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
    }
  }, [layout]);

  const handleLayoutChange = (newLayout: GalleryLayout) => {
    onLayoutChange(newLayout);
  };

  return (
    <div
      className={`bg-white border-b border-gray-200 shadow-sm ${
        sticky ? 'sticky top-0 z-20' : ''
      }`}
    >
      <div className="container mx-auto px-4 sm:px-5 lg:px-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 py-4">
          {/* Left Side: Upload Button */}
          <div className="flex-shrink-0">
            <button
              onClick={onUploadClick}
              className="w-full sm:w-auto px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span>Upload Photos & Videos</span>
            </button>
          </div>

          {/* Right Side: Layout Toggle Buttons */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {/* Grid Layout Button */}
            <button
              onClick={() => handleLayoutChange('grid')}
              className={`px-3 py-2 rounded-md transition-all duration-200 ${
                layout === 'grid'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              title="Grid Layout"
              aria-label="Grid Layout"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            {/* Masonry Layout Button */}
            <button
              onClick={() => handleLayoutChange('masonry')}
              className={`px-3 py-2 rounded-md transition-all duration-200 ${
                layout === 'masonry'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              title="Masonry Layout"
              aria-label="Masonry Layout"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
              </svg>
            </button>

            {/* List Layout Button */}
            <button
              onClick={() => handleLayoutChange('list')}
              className={`px-3 py-2 rounded-md transition-all duration-200 ${
                layout === 'list'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              title="List Layout"
              aria-label="List Layout"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

