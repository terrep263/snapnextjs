'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, transformToCustomDomain } from '@/lib/supabase';
import GalleryContainer from '@/components/Gallery/GalleryContainer';
import { EventData, getPackageType } from '@/lib/gallery-utils';
import { GalleryItem } from '@/components/Gallery/types';
// Feature flags removed - new gallery is now the default and only gallery

export default function GalleryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [allPhotos, setAllPhotos] = useState<GalleryItem[]>([]); // Full list for lightbox
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Load event data
  useEffect(() => {
    if (slug) {
      loadEvent();
    }
  }, [slug]);

  // Load photos when event is loaded or page changes
  useEffect(() => {
    if (event?.id) {
      loadPhotos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, currentPage, isAdmin, isOwner]);

  // Load all photos for lightbox on first page load
  useEffect(() => {
    if (event?.id && currentPage === 1 && totalPhotos > 0 && allPhotos.length === 0) {
      loadAllPhotosForLightbox();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, currentPage, totalPhotos, isAdmin, isOwner]);

  const loadAllPhotosForLightbox = async () => {
    if (!event?.id) return;

    try {
      console.log('📸 Loading all photos for lightbox:', event.id);

      // Fetch all photos (no pagination) for lightbox navigation
      // Include unapproved photos for development/testing
      const response = await fetch(
        `/api/events/${event.id}/gallery?limit=1000&page=1&includeUnapproved=true`
      );
      const result = await response.json();

      if (!result.success) {
        console.warn('Failed to load all photos for lightbox:', result.error);
        return;
      }

      // Transform API response to GalleryItem format
      const transformedPhotos: GalleryItem[] = (result.data.photos || []).map(
        (photo: any) => ({
          id: photo.id,
          url: transformToCustomDomain(photo.storage_url || photo.url || ''),
          filename: photo.filename || photo.original_filename,
          alt: photo.filename || photo.original_filename || event.name,
          isVideo: photo.is_video || false,
          width: photo.width,
          height: photo.height,
          mimeType: photo.mime_type || photo.type,
          created_at: photo.uploaded_at || photo.created_at,
          storage_url: photo.storage_url || photo.url,
          thumbnail_url: photo.thumbnail_url
            ? transformToCustomDomain(photo.thumbnail_url)
            : transformToCustomDomain(photo.storage_url || photo.url || ''),
          size: photo.file_size || photo.size,
        })
      );

      console.log(`✅ Loaded ${transformedPhotos.length} photos for lightbox`);
      setAllPhotos(transformedPhotos);
    } catch (err) {
      console.error('❌ Error loading all photos for lightbox:', err);
    }
  };

  const loadEvent = async () => {
    if (!slug) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading event for gallery:', slug);

      // Load event from database - explicitly select header_image and profile_image
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*, header_image, profile_image')
        .eq('slug', slug)
        .single();

      if (eventError) {
        if (eventError.code === 'PGRST116') {
          // Event not found
          setError('Event not found');
          setEvent(null);
          return;
        }
        throw new Error(`Failed to load event: ${eventError.message}`);
      }

      if (!eventData) {
        setError('Event not found');
        setEvent(null);
        return;
      }

      // Transform header and profile images to use custom domain
      // Note: URLs might already be transformed, but transformToCustomDomain handles that
      let transformedHeaderImage: string | null | undefined = null;
      let transformedProfileImage: string | null | undefined = null;

      if (eventData.header_image) {
        transformedHeaderImage = transformToCustomDomain(eventData.header_image);
        console.log('🔄 Transforming header image:', {
          original: eventData.header_image,
          transformed: transformedHeaderImage,
        });
      } else {
        console.log('⚠️ No header_image found in database for event:', eventData.id);
      }

      if (eventData.profile_image) {
        transformedProfileImage = transformToCustomDomain(eventData.profile_image);
        console.log('🔄 Transforming profile image:', {
          original: eventData.profile_image,
          transformed: transformedProfileImage,
        });
      } else {
        console.log('⚠️ No profile_image found in database for event:', eventData.id);
      }

      const transformedEvent: EventData = {
        ...eventData,
        header_image: transformedHeaderImage || undefined,
        profile_image: transformedProfileImage || undefined,
      };

      // Debug: Log image URLs to help diagnose loading issues
      console.log('🖼️ Event images loaded from database:', {
        eventId: eventData.id,
        eventSlug: eventData.slug,
        eventName: eventData.name,
        raw_header_image: eventData.header_image,
        raw_profile_image: eventData.profile_image,
        transformed_header_image: transformedHeaderImage,
        transformed_profile_image: transformedProfileImage,
        final_header_image: transformedEvent.header_image,
        final_profile_image: transformedEvent.profile_image,
        hasHeaderImage: !!transformedEvent.header_image,
        hasProfileImage: !!transformedEvent.profile_image,
      });

      // If this is the sample event, verify it's configured as freebie
      if (slug === 'sample-event-slug') {
        console.log('📋 Sample event configuration:', {
          is_freebie: eventData.is_freebie,
          is_free: eventData.is_free,
          payment_type: eventData.payment_type,
          packageType: getPackageType(transformedEvent),
        });
      }

      // Log package type for debugging
      const packageType = getPackageType(transformedEvent);
      console.log('✅ Event loaded:', {
        name: transformedEvent.name,
        id: transformedEvent.id,
        slug: transformedEvent.slug,
        packageType,
        is_freebie: transformedEvent.is_freebie,
        is_free: transformedEvent.is_free,
        payment_type: transformedEvent.payment_type,
        hasHeaderImage: !!transformedEvent.header_image,
        hasProfileImage: !!transformedEvent.profile_image,
      });
      
      setEvent(transformedEvent);

      // Check admin status
      let adminStatus = false;
      let ownerStatus = false;
      
      if (typeof window !== 'undefined') {
        const adminSession = localStorage.getItem('adminSession');
        if (adminSession) {
          try {
            const session = JSON.parse(adminSession);
            adminStatus = session.isAuthenticated === true;
          } catch (e) {
            adminStatus = false;
          }
        }

        // Check owner status
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail && eventData.owner_email) {
          ownerStatus = userEmail.toLowerCase() === eventData.owner_email.toLowerCase();
        } else if (userEmail && eventData.owner_id) {
          ownerStatus = userEmail === eventData.owner_id;
        }

        setIsAdmin(adminStatus);
        setIsOwner(ownerStatus);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error loading event:', errorMessage);
      setError(errorMessage);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    if (!event?.id) return;

    try {
      setLoading(true);
      console.log('📸 Loading photos for event:', event.id, 'page:', currentPage);

      // Use the existing gallery API endpoint with pagination
      // Include unapproved photos for development/testing
      const response = await fetch(
        `/api/events/${event.id}/gallery?page=${currentPage}&limit=50&includeUnapproved=true`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load photos');
      }

      // Transform API response to GalleryItem format
      const transformedPhotos: GalleryItem[] = (result.data.photos || []).map(
        (photo: any) => ({
          id: photo.id,
          url: transformToCustomDomain(photo.storage_url || photo.url || ''),
          filename: photo.filename || photo.original_filename,
          alt: photo.filename || photo.original_filename || event.name,
          isVideo: photo.is_video || false,
          width: photo.width,
          height: photo.height,
          mimeType: photo.mime_type || photo.type,
          created_at: photo.uploaded_at || photo.created_at,
          storage_url: photo.storage_url || photo.url,
          thumbnail_url: photo.thumbnail_url
            ? transformToCustomDomain(photo.thumbnail_url)
            : transformToCustomDomain(photo.storage_url || photo.url || ''),
          size: photo.file_size || photo.size,
        })
      );

      console.log(`✅ Loaded ${transformedPhotos.length} photos (page ${currentPage})`);
      setPhotos(transformedPhotos);
      setTotalPages(result.data.pagination?.totalPages || 1);
      setTotalPhotos(result.data.pagination?.totalPhotos || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error loading photos:', errorMessage);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Event not found'}</p>
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Return to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <GalleryContainer
      event={event}
      photos={photos}
      allPhotos={allPhotos.length > 0 ? allPhotos : photos} // Use all photos for lightbox
      loading={loading}
      error={error}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      isAdmin={isAdmin}
      isOwner={isOwner}
    />
  );
}

