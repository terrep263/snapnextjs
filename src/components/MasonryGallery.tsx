'use client';

import { useState, useCallback, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Download, ExternalLink, X, CheckSquare, Square, Download as DownloadIcon, Eye, Trash2, Share2, Play } from 'lucide-react';

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

export default function MasonryGallery({ photos, onDownload, onDownloadAll, onDelete, layout = 'masonry' }: MasonryGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({});
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Masonry breakpoints for responsive columns
  const breakpointColumnsObj = {
    default: 4,      // 4 columns on desktop (1200px+)
    1199: 3,         // 3 columns on tablet (768px-1199px)
    767: 2,          // 2 columns on mobile (480px-767px)
    479: 1           // 1 column on small mobile (<480px)
  };

  const handleImageLoad = (photoId: string) => {
    setImageLoadStates(prev => ({ ...prev, [photoId]: true }));
  };

  const openLightbox = (photo: Photo) => {
    if (selectionMode) return;
    setSelectedPhoto(photo);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const toggleSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)));
  };

  const clearSelection = () => {
    setSelectedPhotos(new Set());
    setSelectionMode(false);
  };

  const downloadSelected = useCallback(async () => {
    if (!onDownload || selectedPhotos.size === 0) return;
    
    setDownloading(true);
    setDownloadProgress(0);
    
    const selectedPhotosList = photos.filter(p => selectedPhotos.has(p.id));
    
    for (let i = 0; i < selectedPhotosList.length; i++) {
      await onDownload(selectedPhotosList[i]);
      setDownloadProgress(((i + 1) / selectedPhotosList.length) * 100);
      // Small delay between downloads to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setTimeout(() => {
      setDownloading(false);
      setDownloadProgress(0);
      clearSelection();
    }, 1000);
  }, [selectedPhotos, photos, onDownload]);

  const sharePhoto = async (photo: Photo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Photo from Event`,
          text: `Check out this photo: ${photo.filename}`,
          url: photo.url,
        });
      } catch (error) {
        // User cancelled or share failed
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Share failed:', error);
          navigator.clipboard.writeText(photo.url);
          alert('Share failed. Photo link copied to clipboard instead!');
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(photo.url);
      alert('Photo link copied to clipboard!');
    }
  };

  const handleDeletePhoto = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    
    if (!confirm(`Delete ${photo.filename || 'this photo'}?`)) return;
    
    setDeleting(photo.id);
    try {
      await onDelete(photo.id);
    } finally {
      setDeleting(null);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
      
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedPhoto(photos[currentIndex - 1]);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex < photos.length - 1) {
            setSelectedPhoto(photos[currentIndex + 1]);
          }
          break;
        case 'd':
        case 'D':
          if (onDownload) {
            e.preventDefault();
            onDownload(selectedPhoto);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, photos, onDownload]);

  // Helper function to render individual photo items
  const renderPhotoItem = (photo: Photo) => {
    const isSelected = selectedPhotos.has(photo.id);
    
    return (
      <div
        key={photo.id}
        className={`${layout === 'masonry' ? 'mb-4 break-inside-avoid' : ''} cursor-pointer transition-all duration-200 group ${
          selectionMode ? 'hover:scale-[1.01]' : 'hover:scale-[1.02]'
        } ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2' : ''}`}
        onClick={() => selectionMode ? toggleSelection(photo.id) : openLightbox(photo)}
      >
        <div className="relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          {/* Selection Checkbox */}
          {selectionMode && (
            <div className="absolute top-2 left-2 z-20">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                isSelected 
                  ? 'bg-blue-600 border-blue-600' 
                  : 'bg-white border-gray-300'
              }`}>
                {isSelected && <CheckSquare className="h-4 w-4 text-white" />}
              </div>
            </div>
          )}

          <div className="relative">
            {photo.type?.startsWith('video/') ? (
              <video
                src={photo.url}
                className={`w-full object-cover rounded-xl ${
                  layout === 'grid' ? 'h-64 sm:h-48 md:h-56 lg:h-64' : 'h-auto'
                }`}
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={() => {
                  console.log('✅ Video loaded:', photo.filename, photo.url);
                  handleImageLoad(photo.id);
                }}
                onError={(e) => {
                  console.error('❌ Video load error:', photo.filename, photo.url);
                  console.error('Error event:', e);
                }}
                onMouseEnter={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.currentTime = 1; // Show frame at 1 second for thumbnail
                }}
              />
            ) : (
              <img
                src={photo.url}
                alt={photo.alt || photo.filename || `Photo ${photo.id}`}
                className={`w-full object-cover rounded-xl ${
                  layout === 'grid' ? 'h-64 sm:h-48 md:h-56 lg:h-64' : 'h-auto'
                }`}
                onLoad={() => {
                  console.log('✅ Image loaded:', photo.filename, photo.url);
                  handleImageLoad(photo.id);
                }}
                onError={(e) => {
                  console.error('❌ Image load error:', photo.filename, photo.url);
                  console.error('Error event:', e);
                }}
              />
            )}
            
            {/* Video play indicator overlay */}
            {photo.type?.startsWith('video/') && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black bg-opacity-50 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Play className="h-8 w-8 text-white" fill="white" />
                </div>
              </div>
            )}
            
            {/* Working hover overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-200 opacity-0 group-hover:opacity-100"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              }}
            />
            
            {/* Action buttons - only show when not in selection mode */}
            {!selectionMode && (
              <>
                {/* Top right action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sharePhoto(photo);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md hover:bg-white transition-colors"
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(photo.url, '_blank');
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md hover:bg-white transition-colors"
                    title="View full size"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {onDelete && (
                    <button
                      onClick={(e) => handleDeletePhoto(photo, e)}
                      disabled={deleting === photo.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white shadow-md hover:bg-red-600 transition-colors disabled:opacity-50"
                      title="Delete photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Photo info panel - slides up from bottom */}
                <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 z-10">
                  <div 
                    className="p-3 rounded-b-xl"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)'
                    }}
                  >
                    <div className="flex items-end justify-between">
                      <div className="text-white flex-1 min-w-0 pr-3">
                        {photo.filename && (
                          <p className="truncate text-sm font-medium">{photo.filename}</p>
                        )}
                        {photo.created_at && (
                          <p className="text-xs text-gray-300">
                            {new Date(photo.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {/* Download button integrated into info panel */}
                      {onDownload && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(photo);
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
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
    <>
      {/* Gallery Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Event Photos ({photos.length})
          </h2>
          
          {!selectionMode ? (
            <div className="flex gap-2">
              <button
                onClick={() => setSelectionMode(true)}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <CheckSquare className="h-4 w-4" />
                Select
              </button>
              {onDownloadAll && (
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
                onClick={selectAll}
                className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-200"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Selection Bar */}
        {selectionMode && (
          <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedPhotos.size} of {photos.length} selected
              </span>
              {downloading && (
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-blue-700">{Math.round(downloadProgress)}%</span>
                </div>
              )}
            </div>
            {selectedPhotos.size > 0 && (
              <button
                onClick={downloadSelected}
                disabled={downloading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon className="h-4 w-4" />
                {downloading ? 'Downloading...' : `Download ${selectedPhotos.size}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conditional Layout Rendering */}
      {layout === 'masonry' ? (
        // Masonry Layout
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-clip-padding"
        >
          {photos.map(renderPhotoItem)}
        </Masonry>
      ) : (
        // Grid Layout
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map(renderPhotoItem)}
        </div>
      )}

      {/* Enhanced Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div className="relative max-h-full max-w-full p-4" onClick={e => e.stopPropagation()}>
            {/* Navigation & Controls Bar */}
            <div className="absolute -top-16 left-0 right-0 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-medium">
                  {selectedPhoto.filename || 'Photo'}
                </h3>
                <span className="text-sm text-gray-300">
                  {photos.findIndex(p => p.id === selectedPhoto.id) + 1} of {photos.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Navigation buttons */}
                <button
                  onClick={() => {
                    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
                    const prevPhoto = photos[currentIndex - 1];
                    if (prevPhoto) setSelectedPhoto(prevPhoto);
                  }}
                  disabled={photos.findIndex(p => p.id === selectedPhoto.id) === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous photo"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => {
                    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
                    const nextPhoto = photos[currentIndex + 1];
                    if (nextPhoto) setSelectedPhoto(nextPhoto);
                  }}
                  disabled={photos.findIndex(p => p.id === selectedPhoto.id) === photos.length - 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next photo"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-2" />
                
                {/* Action buttons */}
                <button
                  onClick={() => sharePhoto(selectedPhoto)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                  title="Share photo"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => window.open(selectedPhoto.url, '_blank')}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                  title="Open original"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                
                {onDownload && (
                  <button
                    onClick={() => onDownload(selectedPhoto)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 backdrop-blur-sm transition-colors hover:bg-blue-700"
                    title="Download photo"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
                
                <button
                  onClick={closeLightbox}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20 ml-2"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* High-quality image or video */}
            <div className="relative max-h-[90vh] max-w-[90vw]">
              {selectedPhoto.type?.startsWith('video/') ? (
                <video
                  src={selectedPhoto.url}
                  controls
                  autoPlay
                  className="max-h-[90vh] max-w-[90vw] w-auto h-auto object-contain rounded-lg shadow-2xl"
                  onLoadedMetadata={() => console.log('✅ Lightbox video loaded:', selectedPhoto.filename)}
                  onError={() => console.error('❌ Lightbox video error:', selectedPhoto.filename)}
                />
              ) : (
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.alt || selectedPhoto.filename || `Photo ${selectedPhoto.id}`}
                  className="max-h-[90vh] max-w-[90vw] w-auto h-auto object-contain rounded-lg shadow-2xl"
                  onLoad={() => console.log('✅ Lightbox image loaded:', selectedPhoto.filename)}
                  onError={() => console.error('❌ Lightbox image error:', selectedPhoto.filename)}
                />
              )}
            </div>
            
            {/* Photo metadata */}
            <div className="absolute -bottom-16 left-0 right-0 text-center">
              {selectedPhoto.created_at && (
                <p className="text-sm text-gray-400">
                  {new Date(selectedPhoto.created_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}