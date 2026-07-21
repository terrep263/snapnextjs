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

  let ogImage = `${APP_URL}/og-image.png`;
  if (photo?.storage_url || photo?.url) {
    const rawUrl: string = photo.storage_url || photo.url;
    // Route the OG image through the snapworxx.com image proxy. The proxy serves
    // bytes via the service role, so it keeps working after the photos bucket is
    // flipped to private (a direct /public/ URL would 403 for the crawler).
    const proxyMatch = rawUrl.match(/\/api\/img\/(.*)$/);
    const supabaseMatch = rawUrl.match(/\/storage\/v1\/(?:object|render\/image)\/public\/photos\/(.*)$/);
    const storagePath = proxyMatch
      ? proxyMatch[1].split('?')[0]
      : supabaseMatch
      ? supabaseMatch[1].split('?')[0]
      : null;
    ogImage = storagePath
      ? `${APP_URL}/api/img/${storagePath}?width=1200&height=630&resize=cover`
      : rawUrl;
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
