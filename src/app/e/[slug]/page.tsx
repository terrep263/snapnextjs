'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Menu, X, Play, Pause, Download, CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProfessionalGallery from '@/components/ProfessionalGallery';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function EventPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Core state
  const [eventData, setEventData] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [layout, setLayout] = useState<'masonry' | 'grid'>('masonry');
  const [headerImage, setHeaderImage] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [bulkMode, setBulkMode] = useState<'select' | 'all' | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  // Load real event from database
  useEffect(() => {
    loadEvent();
  }, [slug]);

  // Load photos when eventData changes
  useEffect(() => {
    if (eventData?.id) {
      loadPhotos();
    }
  }, [eventData]);

  // Slideshow auto-advance effect
  useEffect(() => {
    if (!slideshowActive || photos.length === 0) return;

    const advanceSlideshow = () => {
      setCurrentPhotoIndex((prev) => {
        let nextIndex = (prev + 1) % photos.length;
        // Skip videos in slideshow - advance to next photo
        while (photos[nextIndex]?.isVideo && nextIndex !== prev) {
          nextIndex = (nextIndex + 1) % photos.length;
        }
        return nextIndex;
      });
    };

    // Change photo every 6 seconds (gives more time for photos to be viewed)
    const interval = setInterval(advanceSlideshow, 6000);

    return () => clearInterval(interval);
  }, [slideshowActive, photos.length, photos]);

  const loadEvent = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading event:', slug);
      
      // Try to load real event from database first
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (eventError && eventError.code !== 'PGRST116') {
        throw new Error(`Failed to load event: ${eventError.message}`);
      }

      if (event) {
        // Real event found
        console.log('✅ Real event loaded:', event);
        setEventData(event);
        
        // Load images from database
        if (event.header_image) {
          setHeaderImage(event.header_image);
        }
        if (event.profile_image) {
          setProfileImage(event.profile_image);
        }
      } else {
        // Event not found
        console.log('❌ Event not found:', slug);
        setError('Event not found');
        setEventData(null);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error loading event:', errorMessage);
      setError(errorMessage);
      setEventData(null);
    }
  };

  const loadPhotos = async () => {
    if (!eventData?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📸 Loading photos for event:', eventData.id);
      
      const { data, error: fetchError } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch photos: ${fetchError.message}`);
      }

      console.log('✅ Loaded photos:', data?.length || 0);
      console.log('📸 First photo:', data?.[0]); // Log first photo structure
      setPhotos(data || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error loading photos:', errorMessage);
      setError(errorMessage);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPhoto = async (photo: any) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.filename || `photo-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  const handleDownloadAll = async () => {
    for (const photo of photos) {
      await handleDownloadPhoto(photo);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  // Toggle photo selection
  const handleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  // Bulk download handler
  const handleBulkDownload = async () => {
    const idsToDownload = bulkMode === 'all' 
      ? photos.map(p => p.id)
      : Array.from(selectedPhotos);

    if (idsToDownload.length === 0) {
      alert('No items selected');
      return;
    }

    // Download multiple files
    for (const photoId of idsToDownload) {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) continue;

      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = photo.title || photo.filename || `photo-${photoId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error('Error downloading photo:', err);
      }
    }

    setBulkMode(null);
    setSelectedPhotos(new Set());
  };

  // Load saved images from localStorage (read-only)
  useEffect(() => {
    if (eventData?.id) {
      const savedHeader = localStorage.getItem(`headerImage_${eventData.id}`);
      const savedProfile = localStorage.getItem(`profileImage_${eventData.id}`);
      if (savedHeader) setHeaderImage(savedHeader);
      if (savedProfile) setProfileImage(savedProfile);
    }
  }, [eventData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-orange-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-orange-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">Event Not Found</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            The event "{slug}" doesn't exist or may have expired.
            <br />
            Please check your link or contact the event organizer.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div 
        className="flex h-screen overflow-hidden relative"
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              #0a0a0a 0px,
              #0a0a0a 10px,
              #111111 10px,
              #111111 20px
            ),
            linear-gradient(
              135deg,
              rgba(147, 51, 234, 0.08) 0%,
              rgba(147, 51, 234, 0.04) 100%
            )
          `,
          backgroundColor: '#0a0a0a'
        }}
      >
        {/* SIDEBAR MENU - MOBILE OVERLAY */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR - MOBILE MENU */}
        <div className={`fixed lg:static left-0 top-0 h-screen w-64 bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 z-40 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col relative`}>
          {/* Close Button (Mobile) */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between lg:hidden">
            <h2 className="font-light tracking-widest text-gray-300">MENU</h2>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Event Info */}
            <div className="border-b border-gray-800 pb-6">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">Event</h3>
              <p className="text-white font-light">{eventData?.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(eventData?.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Stats</h3>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-sm text-gray-400">Total Photos</p>
                <p className="text-2xl font-light text-white">{photos.length}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-800 pt-6 space-y-3">
              {/* Slideshow Button */}
              <button
                onClick={() => setSlideshowActive(!slideshowActive)}
                className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-lg transition-all duration-200 ${
                  slideshowActive
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30'
                }`}
              >
                {slideshowActive ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Stop Slideshow
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Slideshow
                  </>
                )}
              </button>

              {/* Upload Button */}
              <Link 
                href={`/e/${slug}/upload`}
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/30"
              >
                + Upload Photos
              </Link>

              {/* Bulk Download Mode Selection */}
              <div className="space-y-2">
                {bulkMode === null ? (
                  <button 
                    onClick={() => setBulkMode('select')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Bulk Download
                  </button>
                ) : (
                  <>
                    {/* Selection Mode Buttons */}
                    <div className="space-y-2">
                      <button 
                        onClick={() => setBulkMode(null)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      
                      {bulkMode === 'select' && (
                        <>
                          <div className="flex gap-2">
                            <button 
                              onClick={handleSelectAll}
                              className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2 rounded-lg transition-colors text-sm ${
                                selectedPhotos.size === photos.length
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                  : 'bg-gray-700 hover:bg-gray-600 text-white'
                              }`}
                            >
                              {selectedPhotos.size === photos.length ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                              All
                            </button>
                            <button 
                              onClick={() => setSelectedPhotos(new Set())}
                              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                            >
                              Clear
                            </button>
                          </div>
                          
                          <button 
                            onClick={handleBulkDownload}
                            disabled={selectedPhotos.size === 0}
                            className={`w-full font-semibold py-2 rounded-lg transition-colors text-sm ${
                              selectedPhotos.size === 0
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            Download {selectedPhotos.size > 0 && `(${selectedPhotos.size})`}
                          </button>
                        </>
                      )}

                      {bulkMode === 'all' && (
                        <button 
                          onClick={handleBulkDownload}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                        >
                          Download All {photos.length} Items
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-800 p-6 bg-gray-950/50">
            <Link 
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {/* TOP BAR */}
          <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 px-6 py-4 flex items-center justify-between z-40">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Title */}
            <h1 className="text-lg font-light tracking-wide text-gray-100 flex-1 text-center lg:text-left">
              {eventData?.name}
            </h1>

            {/* Upload Button (Desktop) */}
            <Link 
              href={`/e/${slug}/upload`}
              className="hidden lg:inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              + Upload
            </Link>
          </div>

          {/* GALLERY CONTENT */}
          {photos.length > 0 ? (
            <div className="flex-1 overflow-hidden">
              <ProfessionalGallery 
                photos={photos.map(photo => {
                  // Try multiple URL field names
                  const photoUrl = photo.url || photo.file_path || photo.storage_path || '';
                  
                  // Detect if video based on multiple factors
                  const isVideoFromDb = photo.is_video === true;
                  const isVideoFromMime = photo.mime_type?.startsWith('video/') || photo.type?.startsWith('video/') || false;
                  const isVideoFromFilename = /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(photo.filename || photoUrl);
                  const isVideo = isVideoFromDb || isVideoFromMime || isVideoFromFilename;
                  
                  console.log(`📸 Photo: ${photo.filename}`, {
                    url: photoUrl,
                    has_url: !!photoUrl,
                    is_video: isVideo,
                    type: photo.type,
                    mime_type: photo.mime_type
                  });
                  
                  return {
                    id: photo.id,
                    url: photoUrl,
                    thumbnail: photoUrl, // Use same URL for thumbnail (fallback)
                    title: photo.title || photo.filename,
                    description: photo.description,
                    uploadedAt: photo.created_at,
                    isVideo,
                    duration: photo.duration,
                    size: photo.size
                  };
                })}
                eventId={eventData.id}
                slideshowActive={slideshowActive}
                currentPhotoIndex={currentPhotoIndex}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <div className="text-center">
                <div className="text-6xl mb-4">📷</div>
                <h2 className="text-2xl font-light text-gray-300 mb-4">No photos yet</h2>
                <p className="text-gray-500 mb-6">Be the first to share your moments</p>
                <Link 
                  href={`/e/${slug}/upload`}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Upload Photos
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
