import { getServiceRoleClient } from '@/lib/supabase';

function isAuthenticated(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie');
  console.log('🔍 Promo Events Request - Cookie Header:', cookieHeader ? '✓ Present' : '✗ Missing');
  if (cookieHeader) {
    const cookies_array = cookieHeader.split('; ');
    console.log('  Cookies:', cookies_array.map(c => c.split('=')[0]).join(', '));
    const sessionCookie = cookies_array.find(c => c.startsWith('admin_session='));
    console.log('  Admin Session:', sessionCookie ? '✓ Found' : '✗ Not found');
    return !!sessionCookie;
  }
  if (!cookieHeader) return false;
  const cookies_array = cookieHeader.split('; ');
  const sessionCookie = cookies_array.find(c => c.startsWith('admin_session='));
  return !!sessionCookie;
}

export async function GET(req: Request) {
  try {
    if (!isAuthenticated(req)) {
      console.log('❌ Unauthorized access to promo-events');
      return new Response(JSON.stringify({ error: 'Unauthorized - admin_session cookie not found' }), { status: 401 });
    }

    const supabase = getServiceRoleClient();

    // Get all events (free, freebie, and paid) with all necessary fields
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(
        'id, name, email, owner_email, slug, created_at, is_free, is_freebie, payment_type, stripe_session_id, promo_type'
      )
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    console.log(`Fetched ${(events || []).length} events from database`);

    // Get photo counts for each event
    const eventsWithPhotos = await Promise.all(
      (events || []).map(async (event) => {
        const { count, error: countError } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        if (countError) {
          console.error(`Error counting photos for event ${event.id}:`, countError);
        }

        return {
          ...event,
          photo_count: count || 0,
        };
      })
    );

    console.log(`Returning ${eventsWithPhotos.length} events with photo counts`);
    return new Response(JSON.stringify({ events: eventsWithPhotos }), { status: 200 });
  } catch (err) {
    console.error('Promo events error:', err);
    return new Response(JSON.stringify({ error: 'Server error', details: String(err) }), { status: 500 });
  }
}
