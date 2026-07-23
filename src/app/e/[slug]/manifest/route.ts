import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Per-gallery web app manifest.
 *
 * Served at /e/[slug]/manifest and linked from the gallery layout metadata.
 * start_url points at THIS gallery, so when a guest installs it to their home
 * screen the icon opens their specific gallery (not the SnapWorxx site) — which
 * means they never have to rescan the QR code to upload again.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let eventName = 'Event Gallery';
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from('events')
        .select('name')
        .eq('slug', slug)
        .single();
      if (data?.name) eventName = data.name;
    } catch {
      // fall back to the default name
    }
  }

  const startUrl = `/e/${slug}/gallery`;
  const scope = `/e/${slug}/`;
  const shortName = eventName.length > 12 ? eventName.slice(0, 12) : eventName;

  const manifest = {
    id: scope,
    name: `${eventName} — SnapWorxx`,
    short_name: shortName,
    description: `Photos for ${eventName}. Upload and view every guest's photos in one place.`,
    start_url: startUrl,
    scope,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#7C3AED',
    icons: [
      {
        src: '/gallery-app-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/gallery-app-icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
