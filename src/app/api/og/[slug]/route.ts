import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get event data
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, header_image')
      .eq('slug', slug)
      .single();

    if (eventError || !event) {
      // Return default OG image
      return NextResponse.redirect(new URL('/og-default.png', request.url));
    }

    // Get photos for this event
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('url, file_path, storage_path')
      .eq('event_id', event.id)
      .limit(20);

    // Determine which image to use
    let imageUrl: string | null = null;

    // Priority: 1. Random photo from gallery, 2. Header image, 3. Default
    if (photos && photos.length > 0) {
      // Pick a random photo
      const randomIndex = Math.floor(Math.random() * photos.length);
      const randomPhoto = photos[randomIndex];
      imageUrl = randomPhoto.url || randomPhoto.file_path || randomPhoto.storage_path;
    } else if (event.header_image) {
      imageUrl = event.header_image;
    }

    if (imageUrl) {
      // Redirect to the actual image
      return NextResponse.redirect(imageUrl);
    }

    // Fallback to default
    return NextResponse.redirect(new URL('/og-default.png', request.url));

  } catch (error) {
    console.error('OG image error:', error);
    return NextResponse.redirect(new URL('/og-default.png', request.url));
  }
}
