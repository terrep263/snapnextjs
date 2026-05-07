import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

type Props = {
  params: Promise<{ slug: string; photoId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, photoId } = await params;

  const supabase = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Get event
  const { data: event } = await supabase
    .from('events')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  // Get specific photo
  const { data: photo } = await supabase
    .from('photos')
    .select('id, url, storage_url, width, height, filename')
    .eq('id', photoId)
    .single();

  const eventName = event?.name || 'Event Gallery';
  const galleryUrl = `${APP_URL}/e/${slug}/gallery`;

  // Use direct Supabase URL for OG image — Facebook crawler needs direct access
  let ogImage = `${APP_URL}/og-default.png`;
  if (photo?.storage_url || photo?.url) {
    const rawUrl = photo.storage_url || photo.url;
    const match = rawUrl.match(/supabase\.co\/storage\/v1\/object\/public\/photos\/(.*)/);
    if (match) {
      ogImage = `${SUPABASE_URL}/storage/v1/render/image/public/photos/${match[1]}?width=1200&height=630&resize=cover`;
    } else {
      ogImage = rawUrl;
    }
  }

  const title = `Photo from ${eventName} | SnapWorxx`;
  const description = `Check out this photo from ${eventName} on SnapWorxx`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: galleryUrl,
      siteName: 'SnapWorxx',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

// Redirects to the gallery — exists only to serve server-rendered OG meta tags
export default async function PhotoSharePage({ params }: Props) {
  const { slug } = await params;
  redirect(`/e/${slug}/gallery`);
}
