import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') || 'test-terre-wcrx66';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing env vars' });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get event
  const { data: event } = await supabase
    .from('events')
    .select('id, name')
    .eq('slug', slug)
    .single();
  
  if (!event) {
    return NextResponse.json({ error: 'Event not found', slug });
  }
  
  // Get first photo URL
  const { data: photos } = await supabase
    .from('photos')
    .select('url')
    .eq('event_id', event.id)
    .limit(1);
  
  return NextResponse.json({
    event: event.name,
    photoCount: photos?.length || 0,
    ogImage: photos?.[0]?.url || 'none'
  });
}
