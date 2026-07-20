import { getServiceRoleClient } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(req: Request) {
  try {
    const denied = await requireAdminAuth();
    if (denied) return denied;

    const supabase = getServiceRoleClient();

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch events', details: eventsError.message }),
        { status: 500 }
      );
    }

    const eventsWithPhotos = await Promise.all(
      (events || []).map(async (event) => {
        const { count } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);
        return { ...event, photo_count: count || 0 };
      })
    );

    return new Response(JSON.stringify({ events: eventsWithPhotos }), { status: 200 });
  } catch (err) {
    console.error('Promo events error:', err);
    return new Response(JSON.stringify({ error: 'Server error', details: String(err) }), { status: 500 });
  }
}
