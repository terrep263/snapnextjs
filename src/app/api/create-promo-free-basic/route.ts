
import { getServiceRoleClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    if (process.env.PROMO_FREE_BASIC_ENABLED !== 'true') {
      return new Response(JSON.stringify({ error: 'Promo not active' }), { status: 403 });
    }

    const body = await req.json();
    const { eventName, eventDate, email, ownerName } = body;

    if (!eventName || !eventDate || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const supabase = getServiceRoleClient();

    const { data: existingEvents } = await supabase
      .from('events')
      .select('id')
      .eq('email', email)
      .eq('is_free', true)
      .eq('promo_type', 'FREE_BASIC')
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      return new Response(JSON.stringify({ error: 'Promo already used for this email' }), { status: 409 });
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() +
        Number(process.env.PROMO_FREE_BASIC_EVENT_LIFESPAN_DAYS || 30) * 24 * 60 * 60 * 1000
    );

    const slugBase = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${slugBase}-${Date.now()}`;

    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert([
        {
          name: eventName,
          slug,
          email,
          stripe_session_id: null,
          status: 'active',
          is_free: true,
          promo_type: 'FREE_BASIC',
          expires_at: expiresAt.toISOString(),
          max_photos: Number(process.env.PROMO_FREE_BASIC_MAX_PHOTOS || 100),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating promo event', insertError);
      return new Response(JSON.stringify({ error: 'Could not create event' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, slug: newEvent.slug }), { status: 200 });
  } catch (err) {
    console.error('Unhandled error in promo free basic route', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
