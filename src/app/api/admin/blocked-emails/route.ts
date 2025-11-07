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

    // Get blocked emails
    const { data: blocked, error: blockedError } = await supabase
      .from('admin_blocked_emails')
      .select('email')
      .order('created_at', { ascending: false });

    if (blockedError) throw blockedError;

    return new Response(JSON.stringify({ 
      emails: (blocked || []).map(b => b.email) 
    }), { status: 200 });
  } catch (err) {
    console.error('Blocked emails error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
