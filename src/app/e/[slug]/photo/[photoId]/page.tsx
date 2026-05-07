import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

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

  const [{ data: event }, { data: photo }] = await Promise.all([
    supabase.from('events').select('id, name, slug').eq('slug', slug).single(),
    supabase.from('photos').select('id, url, storage_url').eq('id', photoId).single(),
  ]);

  const eventName = event?.name || 'Event Gallery';
  const galleryUrl = `${APP_URL}/e/${slug}/gallery`;
  const photoUrl = `${APP_URL}/e/${slug}/photo/${photoId}`;

  let ogImage = `${APP_URL}/og-default.svg`;
  if (photo?.storage_url || photo?.url) {
    const rawUrl = photo.storage_url || photo.url;
    // Use direct Supabase URL — Facebook crawler needs direct access, no proxy
    const supabaseMatch = rawUrl.match(/supabase\.co\/storage\/v1\/object\/public\/photos\/(.*)/);
    if (supabaseMatch) {
      ogImage = `${SUPABASE_URL}/storage/v1/render/image/public/photos/${supabaseMatch[1]}?width=1200&height=630&resize=cover`;
    } else {
      ogImage = rawUrl;
    }
  }

  const title = `Photo from ${eventName} | SnapWorxx`;
  const description = `Check out this photo from ${eventName} on SnapWorxx — tap to view the full gallery.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: photoUrl,
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

// Renders a minimal page with a client-side redirect — does NOT use next/navigation redirect
// so Facebook crawler can read OG tags before the JS redirect fires
export default async function PhotoSharePage({ params }: Props) {
  const { slug } = await params;
  const galleryUrl = `/e/${slug}/gallery`;

  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${galleryUrl}`} />
      <html>
        <head>
          <title>Redirecting...</title>
        </head>
        <body style={{ margin: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: 'white', fontFamily: 'Arial, sans-serif' }}>
            <p style={{ fontSize: '18px' }}>Taking you to the gallery...</p>
            <a href={galleryUrl} style={{ color: '#7C3AED', fontSize: '14px' }}>Click here if not redirected</a>
          </div>
          <script dangerouslySetInnerHTML={{ __html: `window.location.href = '${galleryUrl}';` }} />
        </body>
      </html>
    </>
  );
}
