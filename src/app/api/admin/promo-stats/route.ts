import { getServiceRoleClient } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(req: Request) {
  try {
    const denied = await requireAdminAuth();
    if (denied) return denied;

    const supabase = getServiceRoleClient();

    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('id, email, is_free, is_freebie, promo_type, status');
    if (allEventsError) throw allEventsError;

    let totalEvents = 0, freeBasicCount = 0, freebieCount = 0, paidCount = 0;
    (allEvents || []).forEach((event: any) => {
      totalEvents++;
      if (event.is_freebie) freebieCount++;
      else if (event.is_free && event.promo_type === 'FREE_BASIC') freeBasicCount++;
      else if (!event.is_free) paidCount++;
    });

    const uniqueEmails = new Set((allEvents || []).map(e => e.email));

    const { data: blockedData } = await supabase.from('admin_blocked_emails').select('email');
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
