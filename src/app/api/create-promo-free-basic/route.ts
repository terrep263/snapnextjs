
import { getServiceRoleClient } from '@/lib/supabase';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: Request) {
  try {
    if (process.env.PROMO_FREE_BASIC_ENABLED !== 'true') {
      return new Response(JSON.stringify({ error: 'Promo not active' }), { status: 403 });
    }

    const body = await req.json();
    const { eventName, eventDate, email, ownerName, eventPassword } = body;

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
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Hash password if provided
    const passwordHash = eventPassword ? hashPassword(eventPassword) : null;

    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert([
        {
          id: eventId,
          name: eventName,
          slug,
          email,
          status: 'active',
          is_free: true,
          promo_type: 'FREE_BASIC',
          expires_at: expiresAt.toISOString(),
          max_photos: 250,
          password_hash: passwordHash,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating promo event', insertError);
      return new Response(JSON.stringify({ error: 'Could not create event' }), { status: 500 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      slug: newEvent.slug,
      name: newEvent.name,
      email: newEvent.email,
      password_hash: newEvent.password_hash
    }), { status: 200 });
  } catch (err) {
    console.error('Unhandled error in promo free basic route', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
