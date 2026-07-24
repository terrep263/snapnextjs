import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com';

// Extract the storage-relative path from any URL form we might have stored:
// image proxy (/api/img/<path>), direct Supabase (/object/public/photos/<path>),
// or legacy custom-domain URLs.
const extractStoragePath = (url: string): string | null => {
  if (!url) return null;
  const proxyMatch = url.match(/\/api\/img\/(.*)$/);
  if (proxyMatch) return proxyMatch[1].split('?')[0];
  const supabaseMatch = url.match(/\/storage\/v1\/(?:object|render\/image)\/public\/photos\/(.*)$/);
  if (supabaseMatch) return supabaseMatch[1].split('?')[0];
  const legacyMatch = url.match(/sharedfrom\.snapworxx\.com\/storage\/v1\/object\/public\/photos\/(.*)$/);
  if (legacyMatch) return legacyMatch[1].split('?')[0];
  return null;
};

// Build a 1200x630 OG image URL routed through the snapworxx.com image proxy.
// The proxy serves bytes via the service role, so it keeps working after the
// photos bucket is flipped to private (a direct /public/ URL would 403).
const transformToOgImage = (url: string): string => {
  if (!url) return url;
  const storagePath = extractStoragePath(url);
  if (storagePath) {
    return `${APP_URL}/api/img/${storagePath}?width=1200&height=630&resize=cover`;
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
    let event: any = null;
    let eventError = null;
    
    // Try slug first
    const { data: eventBySlug, error: slugError } = await supabase
      .from('events')
      .select('id, name, header_image')
      .eq('slug', slug)
      .single();
    
    if (eventBySlug) {
      event = { ...eventBySlug };
    } else {
      // Try by id as fallback
      const { data: eventById, error: idError } = await supabase
        .from('events')
        .select('id, name, header_image')
        .eq('id', slug)
        .single();
      
      if (eventById) {
        event = { ...eventById };
      }
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

    // Find a photo for OG image (routed through the image proxy below)
    let previewImage = `${APP_URL}/og-default.png`;
    
    // Try to find a LANDSCAPE photo (crops better with cover mode)
    const { data: photos } = await supabase
      .from('photos')
      .select('url, thumbnail_url, width, height')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })
      .limit(20);
    
    if (photos && photos.length > 0) {
      // Filter for landscape orientation (width > height) and large enough
      const landscapePhotos = photos.filter(p => 
        p.width && p.height && p.width > p.height && p.width >= 800
      );

      // Prefer landscape photos, then fall back to first photo
      const selectedPhoto = landscapePhotos[0] || photos[0];

      if (selectedPhoto) {
        const rawUrl = selectedPhoto.url || selectedPhoto.thumbnail_url || '';
        if (rawUrl) {
          // Route OG image through the snapworxx.com proxy (private-bucket safe).
          previewImage = transformToOgImage(rawUrl);
        }
      }
    } else if (event.header_image) {
      // Route header-image OG through the snapworxx.com proxy (private-bucket safe).
      previewImage = transformToOgImage(event.header_image);
    }

    const title = `${event.name} | Snapworxx`;
    const description = 'View and share event photos on SnapWorxx';



    return {
      title,
      description,
      manifest: `/e/${slug}/manifest`,
      appleWebApp: {
        capable: true,
        title: 'snapworxx.com',
        statusBarStyle: 'default',
      },
      icons: {
        apple: '/snapworxx%20logo%20(1).png',
      },
      openGraph: {
        title,
        description,
        url: `${APP_URL}/e/${slug}`,
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
