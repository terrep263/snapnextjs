import { NextResponse } from 'next/server';
import { getServiceRoleClient, transformToCustomDomain } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl required' }, { status: 400 });
    }

    // Check if URL is from Supabase storage
    const isSupabaseUrl = videoUrl.includes('supabase') || videoUrl.includes('sharedfrom.snapworxx.com');
    
    if (!isSupabaseUrl) {
      return NextResponse.json({ 
        error: 'External video URLs not supported for codec checking',
        canPlay: true,
        codec: 'unknown'
      }, { status: 400 });
    }

    // Get the file extension to infer codec
    const urlPath = new URL(videoUrl).pathname;
    const ext = urlPath.split('.').pop()?.toLowerCase() || '';
    
    let codec = 'unknown';
    let isH265 = false;
    let canPlay = true;

    if (ext === 'mp4' || ext === 'mov') {
      // MP4 could be H.264 or H.265 - need metadata check
      // For now, assume H.264 (most common)
      codec = 'h264';
      canPlay = true;
    } else if (ext === 'webm') {
      codec = 'vp9';
      canPlay = true;
    } else if (ext === 'hevc' || ext === 'h265') {
      codec = 'h265';
      isH265 = true;
      canPlay = false; // Not all browsers support H.265
    } else if (ext === 'mkv' || ext === 'avi' || ext === 'flv') {
      codec = 'unknown';
      canPlay = false; // These containers often have incompatible codecs
    } else {
      codec = 'unknown';
    }

    return NextResponse.json({
      videoUrl,
      codec,
      isH265,
      canPlay,
      extension: ext,
      recommendation: !canPlay ? 'This video format may not play in all browsers. Consider transcoding to H.264 MP4.' : undefined
    });
    
  } catch (error) {
    console.error('❌ Video codec check error:', error);
    return NextResponse.json(
      { error: 'Failed to check video codec' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
