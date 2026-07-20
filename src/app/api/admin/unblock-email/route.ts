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
