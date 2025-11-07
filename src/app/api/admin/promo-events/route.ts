import { getServiceRoleClient } from '@/lib/supabase';

function isAuthenticated(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return false;
  const cookies_array = cookieHeader.split('; ');
  const sessionCookie = cookies_array.find(c => c.startsWith('admin_session='));
  return !!sessionCookie;
}

export async function GET(req: Request) {
  try {
    if (!isAuthenticated(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = getServiceRoleClient();

    // Get all promo events with photo counts
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, email, slug, created_at')
      .eq('is_free', true)
      .eq('promo_type', 'FREE_BASIC')
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    // Get photo counts for each event
    const eventsWithPhotos = await Promise.all(
      (events || []).map(async (event) => {
        const { data: photos, error: photoError } = await supabase
          .from('photos')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id);

        return {
          ...event,
          photo_count: photos?.length || 0,
        };
      })
    );

    return new Response(JSON.stringify({ events: eventsWithPhotos }), { status: 200 });
  } catch (err) {
    console.error('Promo events error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
