'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ArrowUp, ArrowDown, Download, X, Loader2 } from 'lucide-react';
import PhotoSwipeLightbox from './Gallery/PhotoSwipeLightbox';
import './EnhancedGallery.css';

interface GalleryPhoto {
  id: string;
  filename?: string;
  original_filename?: string;
  storage_url?: string;
  thumbnail_url?: string;
  url: string;
  width?: number;
  height?: number;
  uploaded_at?: string;
  file_size?: number;
  mime_type?: string;
  is_video?: boolean;
  tags?: string[];
  uploader_name?: string;
  uploader_email?: string;
}

interface EnhancedGalleryProps {
  eventId: string;
  eventName?: string;
  onDownload?: (photo: GalleryPhoto) => void;
  onDelete?: (photo: GalleryPhoto) => void;
  canDelete?: boolean;
}

export default function EnhancedGallery({
  eventId,
  eventName = 'Event',
  onDownload,
  onDelete,
  canDelete = false,
}: EnhancedGalleryProps) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('uploaded_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [photosWithDimensions, setPhotosWithDimensions] = useState<GalleryPhoto[]>([]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  /**
   * Fetch photos from API with pagination
   */
  const fetchPhotos = useCallback(
    async (pageNum = 1, reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '50',
          sortBy,
          order: sortOrder,
          ...(searchTerm && { search: searchTerm }),
        });

        const response = await fetch(`/api/events/${eventId}/gallery?${params}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch photos');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load photos');
        }

        const newPhotos = result.data.photos || [];

        if (reset) {
          setPhotos(newPhotos);
        } else {
          setPhotos((prev) => [...prev, ...newPhotos]);
        }

        setHasMore(result.data.pagination.hasMore);
        setPage(pageNum);
      } catch (err: any) {
        console.error('Gallery fetch error:', err);
        setError(err.message || 'Failed to load photos. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    },
    [eventId, sortBy, sortOrder, searchTerm]
  );

  /**
   * Initial load and reload on sort/search change
   */
  useEffect(() => {
    setPhotos([]);
    setPage(1);
    setHasMore(true);
    fetchPhotos(1, true);
  }, [sortBy, sortOrder]);

  /**
   * Search with debounce
   */
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPhotos([]);
      setPage(1);
      setHasMore(true);
      fetchPhotos(1, true);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  /**
   * Detect image dimensions for lightbox
   */
  useEffect(() => {
    const detectDimensions = async () => {
      const updated = await Promise.all(
        photos.map(async (photo) => {
          if (photo.width && photo.height) {
            return photo;
          }

          if (photo.is_video || photo.mime_type?.startsWith('video/')) {
            return {
              ...photo,
              width: photo.width || 1920,
              height: photo.height || 1080,
            };
          }

          try {
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = photo.thumbnail_url || photo.storage_url || photo.url;
            });

            return {
              ...photo,
              width: img.naturalWidth || photo.width || 1920,
              height: img.naturalHeight || photo.height || 1080,
            };
          } catch (err) {
            return {
              ...photo,
              width: photo.width || 1920,
              height: photo.height || 1080,
            };
          }
        })
      );

      setPhotosWithDimensions(updated);
    };

    if (photos.length > 0) {
      detectDimensions();
    }
  }, [photos]);

  /**
   * Infinite scroll with Intersection Observer
   */
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!hasMore || loading) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPhotos(page + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, page, fetchPhotos]);

  /**
   * Load more photos manually
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPhotos(page + 1, false);
    }
  }, [loading, hasMore, page, fetchPhotos]);

  /**
   * Handle photo click to open modal
   */
  const handlePhotoClick = useCallback(
    (photo: GalleryPhoto, index: number) => {
      setSelectedPhoto(photo);
      setSelectedIndex(index);
    },
    []
  );

  /**
   * Handle download
   */
  const handleDownload = useCallback(
    async (photo: GalleryPhoto) => {
      if (onDownload) {
        onDownload(photo);
        return;
      }

      try {
        const url = photo.storage_url || photo.url;
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = photo.original_filename || photo.filename || `photo-${photo.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (err) {
        console.error('Download failed:', err);
        alert('Failed to download photo');
      }
    },
    [onDownload]
  );

  if (error && photos.length === 0) {
    return (
      <div className="gallery-error">
        <p>{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchPhotos(1, true);
          }}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="enhanced-gallery-container">
      {/* Gallery Controls */}
      <div className="gallery-controls">
        <div className="search-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search photos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-search"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="uploaded_at">Upload Date</option>
          <option value="filename">Filename</option>
          <option value="file_size">File Size</option>
        </select>

        <button
          onClick={() => setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
          className="sort-order-btn"
          aria-label="Toggle sort order"
        >
          {sortOrder === 'ASC' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
        </button>
      </div>

      {/* Gallery Grid */}
      {loading && photos.length === 0 ? (
        <div className="loading-container">
          <Loader2 className="spinner" size={32} />
          <p>Loading photos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="empty-gallery">
          <p>{searchTerm ? 'No photos found matching your search' : 'No photos yet'}</p>
          <p className="empty-subtitle">
            {searchTerm ? 'Try a different search term' : 'Be the first to upload and share memories!'}
          </p>
        </div>
      ) : (
        <>
          <div className="masonry-grid">
            {photos.map((photo, index) => {
              const isVideo = photo.is_video || photo.mime_type?.startsWith('video/');
              const photoUrl = photo.thumbnail_url || photo.storage_url || photo.url;

              return (
                <div
                  key={photo.id}
                  className="photo-card"
                  onClick={() => handlePhotoClick(photo, index)}
                >
                  {isVideo ? (
                    <video
                      src={photoUrl}
                      className="photo-image"
                      preload="metadata"
                      playsInline
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <img
                      src={photoUrl}
                      alt={photo.original_filename || photo.filename || 'Photo'}
                      className="photo-image"
                      loading="lazy"
                    />
                  )}
                  <div className="photo-overlay">
                    <span className="photo-uploader">
                      {photo.uploader_name || 'Anonymous'}
                    </span>
                    <span className="photo-date">
                      {photo.uploaded_at
                        ? new Date(photo.uploaded_at).toLocaleDateString()
                        : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="load-more-trigger">
              {loading ? (
                <div className="loading-more">
                  <Loader2 className="spinner" size={24} />
                  <span>Loading more photos...</span>
                </div>
              ) : (
                <button onClick={loadMore} className="load-more-button">
                  Load More
                </button>
              )}
            </div>
          )}

          {!hasMore && photos.length > 0 && (
            <div className="end-message">
              <p>All photos loaded ({photos.length} total)</p>
            </div>
          )}
        </>
      )}

      {/* Photo Modal/Lightbox */}
      {selectedPhoto && photosWithDimensions.length > 0 && (
        <PhotoSwipeLightbox
          items={photosWithDimensions.map((p) => ({
            id: p.id,
            url: p.storage_url || p.url,
            title: p.original_filename || p.filename,
            width: p.width || 1920,
            height: p.height || 1080,
            isVideo: p.is_video || p.mime_type?.startsWith('video/'),
          }))}
          open={selectedIndex >= 0}
          index={selectedIndex}
          onClose={() => {
            setSelectedPhoto(null);
            setSelectedIndex(-1);
          }}
          onIndexChange={(newIndex) => {
            if (newIndex >= 0 && newIndex < photos.length) {
              setSelectedPhoto(photos[newIndex]);
              setSelectedIndex(newIndex);
            }
          }}
          eventName={eventName}
        />
      )}
    </div>
  );
}

