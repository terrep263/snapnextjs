import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

// Custom domain for shared storage URLs
const STORAGE_CUSTOM_DOMAIN = 'https://sharedfrom.snapworxx.com';

// Transform Supabase URLs to custom domain
const transformToCustomDomain = (url: string): string => {
  if (!url) return url;
  if (url.includes('sharedfrom.snapworxx.com')) return url;
  
  const supabaseStoragePattern = /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/photos\/(.*)/;
  const match = url.match(supabaseStoragePattern);
  
  if (match) {
    return `${STORAGE_CUSTOM_DOMAIN}/storage/v1/object/public/photos/${match[1]}`;
  }
  return url;
};

// Transform URL to use Supabase Image Transformations for OG image (1200x630)
// Using 'cover' mode to ensure exact dimensions for Facebook large card
const transformToOgImage = (url: string): string => {
  if (!url) return url;
  
  // Convert to render endpoint with resize params
  // Format: /storage/v1/render/image/public/bucket/path?width=1200&height=630&resize=cover
  const storagePattern = /(.*)\/storage\/v1\/object\/public\/photos\/(.*)/;
  const match = url.match(storagePattern);
  
  if (match) {
    const baseUrl = match[1];
    const path = match[2];
    // Use 'cover' to guarantee 1200x630 output (required for Facebook large card)
    return `${baseUrl}/storage/v1/render/image/public/photos/${path}?width=1200&height=630&resize=cover`;
  }
  return url;
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // Create client directly here to ensure env vars are available
  // Use service role key to bypass RLS for metadata generation
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables for metadata generation');
    return {
      title: 'Event Gallery | Snapworxx',
      description: 'View event photos on Snapworxx',
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Generating metadata for slug:', slug);
    
    // Get event data - try by slug first, then by id
    let event = null;
    let eventError = null;
    
    // Try slug first (note: events table has no description column)
    const { data: eventBySlug, error: slugError } = await supabase
      .from('events')
      .select('id, name, header_image, cover_photo_url')
      .eq('slug', slug)
      .single();
    
    if (eventBySlug) {
      event = eventBySlug;
    } else {
      // Try by id as fallback
      const { data: eventById, error: idError } = await supabase
        .from('events')
        .select('id, name, header_image, cover_photo_url')
        .eq('id', slug)
        .single();
      
      event = eventById;
      eventError = idError;
    }

    console.log('Event query result:', { event, eventError });

    if (!event) {
      console.error('Event not found by slug or id:', slug);
      return {
        title: 'Event Not Found | Snapworxx',
        description: 'This event could not be found.',
      };
    }

    // PRIORITY 1: Use cover_photo_url if set by event creator
    // This is the best option as it's specifically chosen for social sharing
    let previewImage = 'https://snapworxx.com/og-default.jpg';
    
    if (event.cover_photo_url) {
      const customDomainUrl = transformToCustomDomain(event.cover_photo_url);
      previewImage = transformToOgImage(customDomainUrl);
      console.log('Using cover_photo_url for OG image');
    } else {
      // PRIORITY 2: Try to find a LANDSCAPE photo (crops better with cover mode)
      const { data: landscapePhotos } = await supabase
        .from('photos')
        .select('url, thumbnail_url, width, height')
        .eq('event_id', event.id)
        .not('width', 'is', null)
        .not('height', 'is', null)
        .order('created_at', { ascending: true })
        .limit(20);
      
      // Filter for landscape orientation (width > height) and large enough
      const suitablePhotos = landscapePhotos?.filter(p => 
        p.width && p.height && p.width > p.height && p.width >= 800
      ) || [];

      // Fallback: get any photos if no landscape ones found
      const { data: allPhotos } = await supabase
        .from('photos')
        .select('url, thumbnail_url, width, height')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true })
        .limit(5);

      // Prefer landscape photos, then fall back to any photo
      let selectedPhoto = suitablePhotos[0] || allPhotos?.[0];

      if (selectedPhoto) {
        const rawUrl = selectedPhoto.url || selectedPhoto.thumbnail_url || '';
        if (rawUrl) {
          const customDomainUrl = transformToCustomDomain(rawUrl);
          previewImage = transformToOgImage(customDomainUrl);
        }
      } else if (event.header_image) {
        const customDomainUrl = transformToCustomDomain(event.header_image);
        previewImage = transformToOgImage(customDomainUrl);
      }
    }

    const title = `${event.name} | Snapworxx`;
    const description = 'View and share event photos on SnapWorxx';



    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://snapworxx.com/e/${slug}`,
        siteName: 'Snapworxx',
        images: [
          {
            url: previewImage,
            width: 1200,
            height: 630,
            alt: event.name,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [previewImage],
      },
    };
  } catch (error) {
    console.error('Metadata generation error:', error);
    return {
      title: 'Event Gallery | Snapworxx',
      description: 'View event photos on Snapworxx',
    };
  }
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
