import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Generate a properly sized OG image (1200x630) for social sharing
export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url');
  
  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    // Resize to 1200x630 (Facebook large card size) with cover fit
    const resizedImage = await sharp(imageBuffer)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    return new NextResponse(new Uint8Array(resizedImage), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('OG image generation error:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
