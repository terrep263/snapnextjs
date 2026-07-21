import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * GET /api/img/[...path]
 * Proxies Supabase storage images through snapworxx.com domain.
 * Social shares and OG images will show snapworxx.com instead of supabase.co.
 *
 * The proxy fetches upstream with the service-role key against the storage
 * `authenticated` endpoints. Because the service role bypasses bucket privacy
 * and RLS, this works whether the `photos` bucket is public OR private — so it
 * is safe to deploy while the bucket is still public and continues to work
 * unchanged after the bucket is flipped to private. Only the resulting image
 * bytes are returned to the client; the key is never exposed.
 *
 * If the service-role key is not configured, it falls back to the legacy
 * public + anon-key path so a mis-provisioned environment degrades gracefully
 * rather than serving nothing.
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

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Prefer the authenticated endpoint with the service-role key (works for
    // public AND private buckets). Fall back to the public endpoint + anon key.
    const useServiceRole = !!serviceKey;
    const access = useServiceRole ? 'authenticated' : 'public';

    // Use render endpoint for image transforms, object endpoint for raw files
    const base = hasTransform
      ? `${SUPABASE_BASE}/storage/v1/render/image/${access}/photos`
      : `${SUPABASE_BASE}/storage/v1/object/${access}/photos`;

    const upstream = qs ? `${base}/${filePath}?${qs}` : `${base}/${filePath}`;

    const headers: Record<string, string> = useServiceRole
      ? { apikey: serviceKey as string, Authorization: `Bearer ${serviceKey}` }
      : { apikey: anonKey };

    const res = await fetch(upstream, { headers });

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
