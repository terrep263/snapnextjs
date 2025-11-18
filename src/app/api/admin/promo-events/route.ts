import { getServiceRoleClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    const adminEmail = cookieStore.get('admin_email')?.value;
    
    console.log('🔍 Promo Events Auth Check:');
    console.log(`  - session: ${session ? '✅ Present' : '❌ Missing'}`);
    console.log(`  - email: ${adminEmail ? '✅ ' + adminEmail : '❌ Missing'}`);
    
    return !!(session && adminEmail);
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.log('❌ Unauthorized access to promo-events');
      return new Response(JSON.stringify({ error: 'Unauthorized - admin session not found' }), { status: 401 });
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
