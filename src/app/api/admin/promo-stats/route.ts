import { cookies } from 'next/headers';
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

    // Get ALL events with their types
    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('id, email, is_free, is_freebie, promo_type, status');

    if (allEventsError) throw allEventsError;

    // Count event types
    let totalEvents = 0;
    let freeBasicCount = 0;
    let freebieCount = 0;
    let paidCount = 0;

    (allEvents || []).forEach((event: any) => {
      totalEvents++;
      if (event.is_freebie) {
        freebieCount++;
      } else if (event.is_free && event.promo_type === 'FREE_BASIC') {
        freeBasicCount++;
      } else if (!event.is_free) {
        paidCount++;
      }
    });

    // Get unique emails
    const uniqueEmails = new Set((allEvents || []).map(e => e.email));

    // Get blocked emails
    const { data: blockedData } = await supabase
      .from('admin_blocked_emails')
      .select('email');

    const blockedEmails = (blockedData || []).map(b => b.email);

    return new Response(JSON.stringify({
      totalEvents,
      freeBasicEvents: freeBasicCount,
      freebieEvents: freebieCount,
      paidEvents: paidCount,
      totalEmails: uniqueEmails.size,
      blockedEmails: blockedEmails.length,
      statusEnabled: process.env.PROMO_FREE_BASIC_ENABLED === 'true',
    }), { status: 200 });
  } catch (err) {
    console.error('Promo stats error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
