import { getServiceRoleClient } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const denied = await requireAdminAuth();
    if (denied) return denied;

    const body = await req.json();
    const { email } = body;
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });
    }

    const supabase = getServiceRoleClient();

    const { data: existing } = await supabase
      .from('admin_blocked_emails')
      .select('email')
      .eq('email', email)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Email already blocked' }), { status: 409 });
    }

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
