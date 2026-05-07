import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

// Use direct Supabase URL for storage
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ofmzpgbuawtwtzgrtiwr.supabase.co';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com';

// Transform any storage URL to direct Supabase URL
const transformToDirectUrl = (url: string): string => {
  if (!url) return url;
  // Already direct Supabase URL
  if (url.includes('supabase.co')) return url;
  // Convert legacy custom domain
  if (url.includes('sharedfrom.snapworxx.com')) {
    const match = url.match(/sharedfrom\.snapworxx\.com\/storage\/v1\/object\/public\/photos\/(.*)/);
    if (match) return `${SUPABASE_URL}/storage/v1/object/public/photos/${match[1]}`;
  }
  return url;
};

// Transform URL to use Supabase Image Transformations for OG image (1200x630)
const transformToOgImage = (url: string): string => {
  if (!url) return url;
  const directUrl = transformToDirectUrl(url);
  const storagePattern = /(.*)(\/storage\/v1\/object\/public\/photos\/)(.*)$/;
  const match = directUrl.match(storagePattern);
  if (match) {
    return `${match[1]}/storage/v1/render/image/public/photos/${match[3]}?width=1200&height=630&resize=cover`;
  }
  return directUrl;
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

    // Find a photo for OG image - use direct Supabase URL (Facebook crawler needs this)
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
          // Use direct Supabase URL for OG images — Facebook crawler needs direct access
          const directUrl = transformToDirectUrl(rawUrl);
          previewImage = transformToOgImage(directUrl);
        }
      }
    } else if (event.header_image) {
      // Use direct Supabase URL for header image OG
      const directUrl = transformToDirectUrl(event.header_image);
      previewImage = transformToOgImage(directUrl);
    }

    const title = `${event.name} | Snapworxx`;
    const description = 'View and share event photos on SnapWorxx';



    return {
      title,
      description,
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
