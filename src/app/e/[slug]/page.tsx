'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MasonryGallery from '@/components/MasonryGallery';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getEventSeoConfig, getShareUrls, getCanonical } from '@/config/seo';
import Head from 'next/head';

export default function EventPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Core state
  const [eventData, setEventData] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
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
        console.log('📊 Event fields:', Object.keys(event));
        
        // Check if password is required
        if (event.password_hash) {
          setPasswordRequired(true);
          setLoading(false);
          setEventData(event);
          return; // Don't load photos yet, wait for password
        }
        
        setEventData(event);
        
        // Load images from database or localStorage as fallback
        console.log('🖼️ Event images field values:', { 
          header: event.header_image, 
          profile: event.profile_image,
          headerExists: !!event.header_image,
          profileExists: !!event.profile_image
        });
        
        // Try database first, then localStorage
        const storedHeader = localStorage.getItem(`headerImage_${event.id}`);
        const storedProfile = localStorage.getItem(`profileImage_${event.id}`);
        
        if (event.header_image) {
          setHeaderImage(event.header_image);
          console.log('✅ Header image set from DB:', event.header_image.substring(0, 100));
        } else if (storedHeader) {
          setHeaderImage(storedHeader);
          console.log('✅ Header image set from localStorage');
        } else {
          console.log('⚠️ No header_image available');
        }
        
        if (event.profile_image) {
          setProfileImage(event.profile_image);
          console.log('✅ Profile image set from DB:', event.profile_image.substring(0, 100));
        } else if (storedProfile) {
          setProfileImage(storedProfile);
          console.log('✅ Profile image set from localStorage');
        } else {
          console.log('⚠️ No profile_image available');
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
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    if (!eventData?.id) return;
    
    try {
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
    }
  };

  const verifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (!eventData) return;

    try {
      // Hash the input password the same way as backend
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(passwordInput).digest('hex');
      
      if (hash === eventData.password_hash) {
        // Password correct - store it in session
        sessionStorage.setItem(`event_${slug}_authenticated`, 'true');
        setPasswordRequired(false);
        // Now load photos
        loadPhotos();
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (err) {
      console.error('Password verification error:', err);
      setPasswordError('Error verifying password');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !eventData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
          <a
            href="/"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  // Show password prompt if needed
  if (passwordRequired && eventData && !sessionStorage.getItem(`event_${slug}_authenticated`)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-orange-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="bg-purple-100 p-3 rounded-full">
              <Lock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">This event is protected</h2>
          <p className="text-gray-600 text-center mb-6">Enter the password to view photos</p>
          
          <form onSubmit={verifyPassword} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Enter event password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
            {passwordError && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Unlock Gallery
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show main gallery
  if (!eventData) {
    return null;
  }

  // Generate SEO config for this event
  const seoConfig = getEventSeoConfig({
    eventId: slug,
    eventName: eventData.name || 'Event Gallery',
    description: eventData.description,
    imageUrl: headerImage || profileImage,
    photos: photos.map(p => ({
      url: p.url || p.file_path || p.storage_path || '',
      title: p.title || p.filename
    })),
    date: eventData.event_date,
    location: eventData.location,
    author: eventData.photographer_name,
  });

  return (
    <ErrorBoundary>
      <Head>
        {/* Title & Description */}
        <title>{seoConfig.title} | Snapworxx</title>
        <meta name="description" content={seoConfig.description} />
        <meta name="canonical" content={seoConfig.canonical} />

        {/* Open Graph / Social Sharing */}
        <meta property="og:type" content={seoConfig.openGraph.type} />
        <meta property="og:url" content={seoConfig.openGraph.url} />
        <meta property="og:title" content={seoConfig.openGraph.title} />
        <meta property="og:description" content={seoConfig.openGraph.description} />
        <meta property="og:site_name" content={seoConfig.openGraph.siteName} />
        <meta property="og:image" content={seoConfig.openGraph.images?.[0]?.url} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card */}
        <meta name="twitter:card" content={seoConfig.twitter.cardType} />
        <meta name="twitter:site" content={seoConfig.twitter.site} />
        <meta name="twitter:creator" content={seoConfig.twitter.handle} />
        <meta name="twitter:title" content={seoConfig.openGraph.title} />
        <meta name="twitter:description" content={seoConfig.openGraph.description} />
        <meta name="twitter:image" content={seoConfig.openGraph.images?.[0]?.url} />

        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
        {/* Header Section */}
        <div className="relative">
          {/* Navigation Bar - Mobile-first responsive */}
          <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200">
            <div className="container mx-auto px-3 py-2.5 sm:px-4 sm:py-3">
              {/* Mobile Layout */}
              <div className="flex flex-col gap-2 sm:hidden">
                <h2 className="text-base font-semibold text-gray-900 truncate">{eventData.name || 'Event Gallery'}</h2>
                <div className="flex gap-2">
                  <Link
                    href={`/e/${slug}/upload`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload
                  </Link>
                  <Link
                    href={`/dashboard/${eventData.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Dashboard
                  </Link>
                </div>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden sm:flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">{eventData.name || 'Event Gallery'}</h2>
                <div className="flex gap-2">
                  <Link
                    href={`/e/${slug}/upload`}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload
                  </Link>
                  <Link
                    href={`/dashboard/${eventData.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Header Banner */}
          {headerImage && (
            <div className="w-full h-48 md:h-64 overflow-hidden">
              <img 
                src={headerImage} 
                alt="Event header"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Profile Section */}
          <div className="container mx-auto px-4">
            <div className={`relative ${headerImage ? '-mt-16' : 'mt-8'} mb-8`}>
              <div className="flex flex-col items-center">
                {/* Profile Image */}
                {profileImage && (
                  <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg mb-4">
                    <img 
                      src={profileImage} 
                      alt="Event profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                )}
                
                {/* Event Name */}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
                  {eventData.name || 'Event Gallery'}
                </h1>
                <p className="text-gray-600 mt-2">Memories that last a lifetime ❤️</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="container mx-auto px-4 pb-12">
          <MasonryGallery
            photos={photos.map(photo => ({
              id: photo.id,
              url: photo.url || photo.file_path || photo.storage_path || '',
              filename: photo.title || photo.filename,
              alt: photo.description,
              created_at: photo.created_at,
              type: photo.is_video || photo.type?.startsWith('video/') || photo.mime_type?.startsWith('video/') ? 'video/mp4' : 'image/jpeg'
            }))}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
