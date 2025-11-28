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
      .select('id, name, header_image')
      .eq('slug', slug)
      .single();
    
    if (eventBySlug) {
      event = eventBySlug;
    } else {
      // Try by id as fallback
      const { data: eventById, error: idError } = await supabase
        .from('events')
        .select('id, name, header_image')
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

    // Get first 3 photos for this event (ordered by upload time)
    const { data: photos } = await supabase
      .from('photos')
      .select('url, thumbnail_url')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })
      .limit(3);

    // Use 3rd photo as OG image, fallback to 2nd, then 1st, then default
    let previewImage = 'https://snapworxx.com/og-default.jpg';

    if (photos && photos.length > 0) {
      // Prefer 3rd photo, fallback to 2nd, then 1st
      const selectedPhoto = photos[2] || photos[1] || photos[0];
      const rawUrl = selectedPhoto?.url || selectedPhoto?.thumbnail_url || previewImage;
      // Transform to custom domain for proper sharing
      previewImage = transformToCustomDomain(rawUrl);
    } else if (event.header_image) {
      previewImage = transformToCustomDomain(event.header_image);
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
