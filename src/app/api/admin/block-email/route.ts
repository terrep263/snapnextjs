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

    // Check if already blocked
    const { data: existing } = await supabase
      .from('admin_blocked_emails')
      .select('email')
      .eq('email', email)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Email already blocked' }), { status: 409 });
    }

    // Add to blocked emails
    const { error: insertError } = await supabase
      .from('admin_blocked_emails')
      .insert([{ email, created_at: new Date().toISOString() }]);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Block email error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
