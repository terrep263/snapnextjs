import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * GET /api/img/[...path]
 * Proxies Supabase storage images through snapworxx.com domain.
 * Social shares and OG images will show snapworxx.com instead of supabase.co.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join('/');
    if (!filePath) return new NextResponse('Not found', { status: 404 });

    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const hasTransform = searchParams.has('width') || searchParams.has('height');

    // Use render endpoint for image transforms, object endpoint for raw files
    const base = hasTransform
      ? `${SUPABASE_BASE}/storage/v1/render/image/public/photos`
      : `${SUPABASE_BASE}/storage/v1/object/public/photos`;

    const upstream = qs ? `${base}/${filePath}?${qs}` : `${base}/${filePath}`;

    const res = await fetch(upstream, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
    });

    if (!res.ok) return new NextResponse('Not found', { status: res.status });

    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return new NextResponse('Proxy error', { status: 500 });
  }
}
