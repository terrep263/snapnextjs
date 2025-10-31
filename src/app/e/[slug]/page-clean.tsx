'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MasonryGallery from '@/components/MasonryGallery';
import PhotoUpload from '@/components/PhotoUpload';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function EventPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Core state
  const [eventData, setEventData] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [layout, setLayout] = useState<'masonry' | 'grid'>('masonry');

  // Initialize event data
  useEffect(() => {
    const eventId = slug || 'default-event';
    const event = {
      id: eventId,
      name: slug === 'test' ? 'Test Event' : 'Sample Event Gallery',
      slug: slug,
      created_at: new Date().toISOString(),
      status: 'active'
    };
    setEventData(event);
    console.log('📝 Event initialized:', event);
  }, [slug]);

  // Load photos when eventData changes
  useEffect(() => {
    if (eventData?.id) {
      loadPhotos();
    }
  }, [eventData]);

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

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600">Loading event gallery...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!eventData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-orange-50">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Event Not Found</h1>
          <p className="text-gray-600">This event link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <div className="relative h-80 w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          
          {/* Header Content */}
          <div className="relative z-10 flex h-full items-center justify-center text-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
                {eventData.name}
              </h1>
              <p className="text-xl text-white/90 font-light mb-2">Memories that last a lifetime</p>
              <div className="flex items-center justify-center gap-2 text-lg text-white/80">
                <span className="text-2xl">✨</span>
                <span>Share your moments</span>
                <span className="text-2xl">📸</span>
              </div>
            </div>
          </div>

          {/* Powered by SnapWorxx */}
          <div className="absolute top-6 right-6 z-20">
            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/20">
              <span className="text-xs text-gray-500 font-medium">Powered by</span> 
              <span className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ml-1">SnapWorxx</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          
          {/* Stats */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
              <div className="text-2xl font-bold text-indigo-600">{photos.length}</div>
              <div className="text-sm text-gray-600 font-medium">Photos</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-sm text-gray-600 font-medium">Memories</div>
            </div>
          </div>

          {/* Layout Toggle & Upload */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            {/* Layout Toggle */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20 flex gap-2">
              <button
                onClick={() => setLayout('masonry')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  layout === 'masonry'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 3h8v5h-8v-5z"/>
                </svg>
                Masonry
              </button>
              <button
                onClick={() => setLayout('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  layout === 'grid'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                </svg>
                Grid
              </button>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Photos
              </span>
            </button>
          </div>

          {/* Upload Component */}
          {showUpload && (
            <div className="mb-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="mb-6 text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Share Your Moments</h3>
                <p className="text-gray-600">Upload your photos and videos to create lasting memories</p>
              </div>
              <PhotoUpload 
                eventData={eventData}
                onUploadComplete={() => {
                  console.log('🔄 Upload complete, refreshing gallery');
                  loadPhotos();
                  setShowUpload(false);
                }}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Photos</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => loadPhotos()}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Gallery */}
          {photos.length > 0 ? (
            <MasonryGallery 
              photos={photos}
              onDownload={handleDownloadPhoto}
              onDownloadAll={handleDownloadAll}
              layout={layout}
            />
          ) : (
            /* Empty State */
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-16 text-center max-w-2xl mx-auto border border-white/20">
              <div className="mb-12">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-16 h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Let's Create Magic Together
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Be the first to share your amazing moments from this event.<br/>
                Your photos will inspire others to join and contribute! 🌟
              </p>

              <button
                onClick={() => setShowUpload(!showUpload)}
                className="group relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold px-12 py-5 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Upload Your First Photo
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-50 blur-xl group-hover:opacity-70 transition-opacity duration-300 animate-pulse"></div>
              </button>
            </div>
          )}

          {/* Back Navigation */}
          <div className="mt-16 text-center">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-all duration-300 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}