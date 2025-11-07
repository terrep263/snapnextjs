'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SimpleEventGallery from '@/components/SimpleEventGallery';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
        
        // Load images from database
        console.log('🖼️ Event images field values:', { 
          header: event.header_image, 
          profile: event.profile_image,
          headerExists: !!event.header_image,
          profileExists: !!event.profile_image
        });
        if (event.header_image) {
          setHeaderImage(event.header_image);
          console.log('✅ Header image set:', event.header_image.substring(0, 100));
        } else {
          console.log('⚠️ No header_image in event');
        }
        if (event.profile_image) {
          setProfileImage(event.profile_image);
          console.log('✅ Profile image set:', event.profile_image.substring(0, 100));
        } else {
          console.log('⚠️ No profile_image in event');
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

  return (
    <ErrorBoundary>
      <SimpleEventGallery
        eventName={eventData.name || 'Event Gallery'}
        headerImage={headerImage}
        profileImage={profileImage}
        photos={photos.map(photo => ({
          id: photo.id,
          url: photo.url || photo.file_path || photo.storage_path || '',
          title: photo.title || photo.filename,
          description: photo.description,
          uploadedAt: photo.created_at,
          isVideo: photo.is_video || photo.type?.startsWith('video/') || photo.mime_type?.startsWith('video/'),
          duration: photo.duration,
          size: photo.size,
          type: 'photo'
        }))}
      />
    </ErrorBoundary>
  );
}
