import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side download proxy
 * Fetches files from Supabase storage and returns them as blobs
 * Handles CORS and signed URL issues
 */

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // SECURITY: Strict URL validation to prevent SSRF attacks
    // Only allow URLs from our Supabase storage domain
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // URL must start with the exact Supabase URL (prevents bypasses like http://evil.com?supabase=true)
    if (!url.startsWith(supabaseUrl)) {
      console.warn('⚠️ Blocked download attempt from unauthorized domain:', url);
      return NextResponse.json(
        { error: 'Invalid URL - must be from Supabase storage' },
        { status: 403 }
      );
    }

    // Fetch from Supabase with server-side request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to download: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    // Get the blob
    const blob = await response.blob();

    // Return with appropriate headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
        'Content-Length': blob.size.toString(),
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Download proxy error:', errorMsg);
    return NextResponse.json(
      { error: `Download failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
