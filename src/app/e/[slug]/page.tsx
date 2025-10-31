'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SnapworxxGallery from '@/components/SnapworxxGallery';
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Modern Header with Better Design */}
      <div className="relative overflow-hidden">
        {headerImage ? (
          <div className="relative h-80 w-full">
            <img 
              src={headerImage} 
              alt="Header background"
              className="w-full h-full object-cover"
            />
            {/* Elegant overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </div>
        ) : (
          <div className="relative h-80 w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
            {/* Elegant overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          </div>
        )}

        {/* Powered by SnapWorxx - More elegant */}
        <div className="absolute top-6 right-6 z-10">
          <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/20">
            <span className="text-xs text-gray-500 font-medium">Powered by</span> 
            <span className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ml-1">SnapWorxx</span>
          </div>
        </div>
      </div>

      {/* Enhanced Hero Section */}
      <div className="relative -mt-20 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Event Profile Image - More elegant */}
          <div className="mb-8 relative">
            <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1.5 shadow-2xl relative">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={eventData.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <svg className="w-16 h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Glow effect - static to prevent animation loops */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 opacity-20 blur-xl"></div>
            </div>
          </div>

          {/* Event Title with Real Data */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
              {eventData.name}
            </h1>
            
            {/* Show real event details */}
            <div className="space-y-2">
              {eventData.event_date && (
                <p className="text-xl text-gray-600 font-light">
                  {new Date(eventData.event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
              <p className="text-xl md:text-2xl text-gray-600 font-light mb-2">Memories that last a lifetime</p>
              <div className="flex items-center justify-center gap-2 text-lg">
                <span className="text-2xl">✨</span>
                <span className="text-gray-500">Share your moments</span>
                <span className="text-2xl">📸</span>
              </div>
            </div>
          </div>

          {/* Real Event Stats */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
              <div className="text-2xl font-bold text-indigo-600">{photos.length}</div>
              <div className="text-sm text-gray-600 font-medium">Photos</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
              <div className="text-2xl font-bold text-purple-600">
                {eventData.status === 'active' ? '🟢' : '🔴'}
              </div>
              <div className="text-sm text-gray-600 font-medium capitalize">{eventData.status || 'Active'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Photo Gallery or Empty State */}
        {photos.length > 0 ? (
          <>
            {/* Layout Switch and Upload Button */}
            <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Layout Switch */}
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
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

              {/* Upload Link */}
              <div className="text-center">
                <Link 
                  href={`/e/${slug}/upload`}
                  className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-10 py-4 rounded-2xl shadow-xl transition-colors duration-300 inline-block"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Upload Photos & Videos
                  </span>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-50 blur-xl group-hover:opacity-70 transition-opacity duration-300"></div>
                </Link>
              </div>
            </div>
            

            
            <SnapworxxGallery 
              photos={photos.map(photo => ({
                id: photo.id,
                url: photo.url,
                thumbnail: photo.thumbnail_url || photo.url,
                title: photo.title || photo.filename,
                description: photo.description,
                uploadedAt: photo.created_at,
                isVideo: photo.is_video || false,
                duration: photo.duration,
                size: photo.size,
                likes: photo.likes || 0,
                isFavorite: photo.is_favorite || false
              }))}
              eventId={eventData.id}

              onDelete={(photoId: string) => {
                console.log('Delete photo:', photoId);
                // TODO: Implement delete functionality
              }}
              onToggleFavorite={(photoId: string) => {
                console.log('Toggle favorite:', photoId);
                // TODO: Implement favorite toggle
              }}
            />
          </>
        ) : (
          /* Enhanced Empty State */
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-16 text-center max-w-2xl mx-auto border border-white/20">
            {/* Beautiful Upload Illustration */}
            <div className="mb-12">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-16 h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              {/* Elegant floating elements - static to prevent loops */}
              <div className="flex justify-center items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-2xl flex items-center justify-center shadow-md">
                  <span className="text-lg">📸</span>
                </div>
                <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl flex items-center justify-center shadow-md">
                  <span className="text-lg">✨</span>
                </div>
              </div>
            </div>

            {/* Inspiring Empty State Text for Real Events */}
            <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Let's Create Magic Together
            </h3>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Be the first to share your amazing moments from <strong>{eventData.name}</strong>.<br/>
              Your photos will inspire others to join and contribute! 🌟
            </p>

            {/* Upload Link */}
            <Link 
              href={`/e/${slug}/upload`}
              className="group relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold px-12 py-5 rounded-2xl shadow-xl transition-colors duration-300 inline-block"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Upload Your First Photo
              </span>
              {/* Animated glow - static to prevent loops */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-50 blur-xl"></div>
            </Link>


          </div>
        )}

        {/* Enhanced Back Navigation */}
        <div className="mt-16 text-center">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-colors duration-300 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/20"
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
