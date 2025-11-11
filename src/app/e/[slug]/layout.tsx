import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { getEventSeoConfig } from '@/config/seo';

type Props = {
  params: { slug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;

  try {
    // Fetch event data from database
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!event) {
      return {
        title: 'Event Not Found | SnapWorxx',
        description: 'The event you are looking for could not be found.',
      };
    }

    // Get the first photo for the event as OG image if available
    const { data: photos } = await supabase
      .from('photos')
      .select('url, file_path, storage_path')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const eventImageUrl = event.header_image || event.profile_image || photos?.[0]?.url || photos?.[0]?.file_path || photos?.[0]?.storage_path;

    // Generate SEO config
    const seoData = {
      eventId: slug,
      eventName: event.name || 'Event Gallery',
      description: event.description || `Browse beautiful photos from ${event.name || 'this event'}`,
      imageUrl: eventImageUrl,
      date: event.event_date,
      location: event.location,
      author: event.photographer_name,
    };

    const canonicalUrl = `https://snapworxx.com/e/${slug}`;
    const ogImageUrl = eventImageUrl
      ? (eventImageUrl.startsWith('http') ? eventImageUrl : `https://snapworxx.com${eventImageUrl}`)
      : 'https://snapworxx.com/og-image.png';

    return {
      title: `${seoData.eventName} | SnapWorxx`,
      description: seoData.description,
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: canonicalUrl,
        siteName: 'SnapWorxx',
        title: seoData.eventName,
        description: seoData.description,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: seoData.eventName,
            type: 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        site: '@snapworxx',
        creator: '@snapworxx',
        title: seoData.eventName,
        description: seoData.description,
        images: [ogImageUrl],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);

    // Fallback metadata
    return {
      title: 'Event Gallery | SnapWorxx',
      description: 'View and share event photos on SnapWorxx',
      openGraph: {
        images: [
          {
            url: 'https://snapworxx.com/og-image.png',
            width: 1200,
            height: 630,
            alt: 'SnapWorxx Event Gallery',
          },
        ],
      },
    };
  }
}

export default function EventLayout({ children }: Props) {
  return <>{children}</>;
}
