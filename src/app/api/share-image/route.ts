// src/app/api/share-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Fetch the original image from Supabase
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Get image dimensions to scale watermark appropriately
    const image = sharp(Buffer.from(imageBuffer));
    const metadata = await image.metadata();
    const width = metadata.width || 1000;

    // Scale watermark based on image size (roughly 30% of width)
    const watermarkWidth = Math.floor(width * 0.3);
    const watermarkHeight = Math.floor(watermarkWidth * 0.25);

    // Create watermark SVG with SnapWorxx branding
    const watermarkSvg = `
      <svg width="${watermarkWidth}" height="${watermarkHeight}">
        <!-- Semi-transparent background -->
        <rect 
          width="${watermarkWidth}" 
          height="${watermarkHeight}" 
          fill="black" 
          opacity="0.75" 
          rx="10"
        />
        
        <!-- SnapWorxx.com text -->
        <text 
          x="${watermarkWidth / 2}" 
          y="${watermarkHeight / 2 + 8}" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${Math.floor(watermarkHeight * 0.4)}" 
          fill="white" 
          text-anchor="middle" 
          font-weight="bold"
          letter-spacing="1"
        >
          snapworxx.com
        </text>
      </svg>
    `;

    // Add watermark to image at bottom-right corner
    const watermarkedImage = await sharp(Buffer.from(imageBuffer))
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          gravity: 'southeast', // bottom-right corner
          blend: 'over'
        }
      ])
      .jpeg({ 
        quality: 92, // High quality for social media
        progressive: true 
      })
      .toBuffer();

    return new NextResponse(new Uint8Array(watermarkedImage), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error creating watermarked image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
