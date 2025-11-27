import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const imageBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    const image = sharp(buffer);
    const metadata = await image.metadata();

    const width = metadata.width || 1200;
    const height = metadata.height || 1200;

    const fontSize = Math.floor(width * 0.04);
    const padding = Math.floor(width * 0.02);

    const watermarkSvg = `
      <svg width="${width}" height="${height}">
        <style>
          .watermark {
            fill: white;
            font-size: ${fontSize}px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            opacity: 0.9;
          }
        </style>
        <rect x="0" y="${height - fontSize - padding * 2}" width="${width}" height="${fontSize + padding * 2}" fill="rgba(0,0,0,0.5)"/>
        <text x="${padding}" y="${height - padding}" class="watermark">snapworxx.com</text>
      </svg>
    `;

    const watermarkedImage = await image
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          top: 0,
          left: 0,
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    return new NextResponse(watermarkedImage, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="snapworxx-${Date.now()}.jpg"`,
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
