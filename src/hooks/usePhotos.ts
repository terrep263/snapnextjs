'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, getPhotoPublicUrl, transformToCustomDomain } from '@/lib/supabase';

interface Photo {
  id: string;
  url: string;
  filename: string;
  event_id: string;
  file_path: string;
  size: number;
  type: string;
  created_at: string;
}

interface UsePhotosResult {
  photos: Photo[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  uploadPhoto: (eventId: string, file: File) => Promise<void>;
}

export function usePhotos(eventId: string | null): UsePhotosResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!eventId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📸 Fetching photos for event:', eventId);
      
      const { data, error: fetchError } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch photos: ${fetchError.message}`);
      }

      // Transform URLs to use custom domain
      const transformedPhotos = (data || []).map(photo => ({
        ...photo,
        url: transformToCustomDomain(photo.url)
      }));

      console.log('✅ Fetched photos:', transformedPhotos.length);
      setPhotos(transformedPhotos);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('❌ Error fetching photos:', error);
      setError(error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const uploadPhoto = useCallback(async (eventId: string, file: File) => {
    try {
      // Ensure event exists
      await ensureEventExists(eventId);
      
      // Upload file to storage
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `events/${eventId}/${filename}`;
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL using custom domain
      const publicUrl = getPhotoPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from('photos')
        .insert([{
          event_id: eventId,
          filename: file.name,
          url: publicUrl,
          file_path: filePath,
          size: file.size,
          type: file.type
        }]);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Refresh photos list
      await fetchPhotos();
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      console.error('❌ Upload error:', error);
      throw error;
    }
  }, [fetchPhotos]);

  // Auto-fetch on eventId change
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return {
    photos,
    loading,
    error,
    refetch: fetchPhotos,
    uploadPhoto
  };
}

// Helper function to ensure event exists
async function ensureEventExists(eventId: string) {
  const { data: existingEvent, error: checkError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .single();

  if (checkError && checkError.code === 'PGRST116') {
    // Event doesn't exist, create it
    const { error: createError } = await supabase
      .from('events')
      .upsert([{
        id: eventId,
        name: 'Event Gallery',
        slug: eventId,
        email: 'guest@example.com',
        status: 'active'
      }], {
        onConflict: 'id'
      });

    if (createError) {
      throw new Error(`Failed to create event: ${createError.message}`);
    }
  } else if (checkError) {
    throw new Error(`Failed to check event: ${checkError.message}`);
  }
}