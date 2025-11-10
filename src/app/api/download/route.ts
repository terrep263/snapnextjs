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

    // Validate URL is from Supabase storage
    if (!url.includes('supabase') && !url.includes('snapworxx')) {
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
