import { getServiceRoleClient } from '@/lib/supabase';
import crypto from 'crypto';

const MASTER_EMAIL = 'freebie@snapworxx.com';
const MAX_FREEBIE_EVENTS = 100;
const UNLIMITED_STORAGE = 999999999; // Effectively unlimited (999GB)

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventName, eventDate, email, ownerName, eventPassword } = body;

    if (!eventName || !eventDate || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Check if email is the master email
    if (email !== MASTER_EMAIL) {
      return new Response(JSON.stringify({ error: 'Invalid email for freebie events' }), { status: 403 });
    }

    const supabase = getServiceRoleClient();

    // Count existing freebie events from master email
    const { data: existingFreebies, error: countError } = await supabase
      .from('events')
      .select('id', { count: 'exact' })
      .eq('email', MASTER_EMAIL)
      .eq('is_freebie', true);

    if (countError) {
      console.error('Error counting freebie events', countError);
      return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
    }

    const freebieCount = existingFreebies?.length || 0;
    if (freebieCount >= MAX_FREEBIE_EVENTS) {
      return new Response(
        JSON.stringify({ 
          error: `Maximum freebie events (${MAX_FREEBIE_EVENTS}) reached for master email` 
        }),
        { status: 409 }
      );
    }

    // Generate event details
    const slugBase = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${slugBase}-${Date.now()}`;
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Hash password if provided
    const passwordHash = eventPassword ? hashPassword(eventPassword) : null;

    // Create freebie event with unlimited storage
    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert([
        {
          id: eventId,
          name: eventName,
          slug,
          email: MASTER_EMAIL,
          status: 'active',
          is_free: true,
          is_freebie: true,
          max_photos: 999999, // Unlimited photos
          max_storage_bytes: UNLIMITED_STORAGE,
          password_hash: passwordHash,
          owner_name: ownerName || 'SnapWorxx Team',
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating freebie event', insertError);
      return new Response(JSON.stringify({ error: 'Could not create event' }), { status: 500 });
    }

    // Log freebie event creation
    console.log(`✅ Freebie event created: ${newEvent.slug} (${freebieCount + 1}/${MAX_FREEBIE_EVENTS})`);

    return new Response(
      JSON.stringify({
        success: true,
        slug: newEvent.slug,
        name: newEvent.name,
        email: newEvent.email,
        is_freebie: true,
        freebie_count: freebieCount + 1,
        max_freebies: MAX_FREEBIE_EVENTS,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Unhandled error in freebie event creation route', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
