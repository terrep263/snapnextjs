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

    // Get total promo events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, email')
      .eq('is_free', true)
      .eq('promo_type', 'FREE_BASIC');

    if (eventsError) throw eventsError;

    // Get unique emails
    const uniqueEmails = new Set((events || []).map(e => e.email));

    // Get blocked emails
    const { data: blockedData } = await supabase
      .from('admin_blocked_emails')
      .select('email');

    const blockedEmails = (blockedData || []).map(b => b.email);

    return new Response(JSON.stringify({
      totalEvents: events?.length || 0,
      totalEmails: uniqueEmails.size,
      blockedEmails: blockedEmails.length,
      statusEnabled: process.env.PROMO_FREE_BASIC_ENABLED === 'true',
    }), { status: 200 });
  } catch (err) {
    console.error('Promo stats error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
