import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;

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
    const base = hasTransform
      ? `${SUPABASE_BASE}/storage/v1/render/image/public/photos`
      : `${SUPABASE_BASE}/storage/v1/object/public/photos`;

    const upstream = qs ? `${base}/${filePath}?${qs}` : `${base}/${filePath}`;
    const res = await fetch(upstream, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
      next: { revalidate: 86400 },
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
  } catch {
    return new NextResponse('Error', { status: 500 });
  }
}
