import { getServiceRoleClient } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const denied = await requireAdminAuth();
    if (denied) return denied;

    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), { status: 400 });
    }

    const supabase = getServiceRoleClient();

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

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

    await supabase.from('photos').delete().eq('event_id', eventId);

    const { error: deleteError } = await supabase.from('events').delete().eq('id', eventId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Delete event error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
