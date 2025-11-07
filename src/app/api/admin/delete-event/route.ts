import { getServiceRoleClient } from '@/lib/supabase';

function isAuthenticated(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return false;
  const cookies_array = cookieHeader.split('; ');
  const sessionCookie = cookies_array.find(c => c.startsWith('admin_session='));
  return !!sessionCookie;
}

export async function POST(req: Request) {
  try {
    if (!isAuthenticated(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Get the event to find storage paths
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    // Delete photos from storage
    const { data: photos } = await supabase
      .from('photos')
      .select('storage_path')
      .eq('event_id', eventId);

    if (photos && photos.length > 0) {
      const paths = photos.map(p => p.storage_path).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from('event-photos').remove(paths);
      }
    }

    // Delete photos from database
    await supabase.from('photos').delete().eq('event_id', eventId);

    // Delete event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Delete event error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
