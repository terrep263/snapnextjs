import { getServiceRoleClient } from '@/lib/supabase';

function isAuthenticated(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return false;
  const cookies_array = cookieHeader.split('; ');
  const sessionCookie = cookies_array.find(c => c.startsWith('admin_session='));
  return !!sessionCookie;
}

export async function POST(req: Request) {
  try {
    if (!isAuthenticated(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Remove from blocked emails
    const { error: deleteError } = await supabase
      .from('admin_blocked_emails')
      .delete()
      .eq('email', email);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Unblock email error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
