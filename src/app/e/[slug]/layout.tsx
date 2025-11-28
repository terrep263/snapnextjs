import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Get event data
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, description, header_image')
      .eq('slug', slug)
      .single();

    if (eventError || !event) {
      return {
        title: 'Event Not Found | Snapworxx',
        description: 'This event could not be found.',
      };
    }

    // Get photos for this event
    const { data: photos } = await supabase
      .from('photos')
      .select('url, file_path, storage_path')
      .eq('event_id', event.id)
      .limit(20);

    // Pick a random image for the preview
    let previewImage = 'https://snapworxx.com/og-default.png';

    if (photos && photos.length > 0) {
      // Pick a random photo from the gallery
      const randomIndex = Math.floor(Math.random() * photos.length);
      const randomPhoto = photos[randomIndex];
      previewImage = randomPhoto.url || randomPhoto.file_path || randomPhoto.storage_path || previewImage;
    } else if (event.header_image) {
      previewImage = event.header_image;
    }

    const title = `${event.name} | Snapworxx`;
    const description = event.description || `View photos from ${event.name} on Snapworxx`;

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
