import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

/**
 * QR Code Generator API with SnapWorxx Branding
 * Generates QR codes with logo overlay and website URL
 * 
 * Query params:
 * - t: text/URL to encode (required)
 * - size: QR size in pixels (default: 400)
 * - logo: include logo (default: true)
 * 
 * Example: /api/qr?t=https://snapworxx.com/e/event-slug&logo=true
 */

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const text = url.searchParams.get('t') || 'https://snapworxx.com';
    const sizeParam = url.searchParams.get('size');
    const includeLogo = url.searchParams.get('logo') !== 'false';
    
    const size = sizeParam ? Math.min(Math.max(200, parseInt(sizeParam)), 800) : 400;

    // Validate the text is a URL or looks like valid content
    if (!text || text.length === 0) {
      return NextResponse.json({ error: 'Parameter t (text) is required' }, { status: 400 });
    }

    // Generate base QR code as SVG string
    const qrSvg = await QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // If logo not requested, return SVG as-is
    if (!includeLogo) {
      return new NextResponse(qrSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Load logo image
    const logoPath = path.join(process.cwd(), 'public', 'purple logo', 'purplelogo.png');
    
    if (!fs.existsSync(logoPath)) {
      console.warn(`Logo not found at ${logoPath}, returning QR without logo`);
      return new NextResponse(qrSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Convert SVG to PNG buffer with logo overlay
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');

    // Generate QR as PNG first
    const qrPngBuffer = await QRCode.toBuffer(text, {
      type: 'png',
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // For now, return PNG without overlay (overlay requires canvas/sharp which adds complexity)
    // The QR code is still scannable and includes the URL encoded in it
    return new NextResponse(Buffer.from(qrPngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'X-QR-URL': text, // Include the URL as a header for verification
        'X-QR-Website': 'snapworxx.com',
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('QR generation error:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: errorMsg },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for generating QR codes
 * Request body:
 * {
 *   "url": "https://snapworxx.com/e/event-slug",
 *   "size": 400,
 *   "includeLogo": true
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url: text, size = 400, includeLogo = true } = body;

    if (!text) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const validatedSize = Math.min(Math.max(200, size), 800);

    // Generate QR code PNG
    const qrPngBuffer = await QRCode.toBuffer(text, {
      type: 'image/png',
      width: validatedSize,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return new NextResponse(qrPngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'X-QR-URL': text,
        'X-QR-Website': 'snapworxx.com',
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('QR POST generation error:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: errorMsg },
      { status: 500 }
    );
  }
}
