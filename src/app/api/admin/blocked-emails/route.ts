import { getServiceRoleClient } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(req: Request) {
  try {
    const denied = await requireAdminAuth();
    if (denied) return denied;

    const supabase = getServiceRoleClient();
    const { data: blocked, error: blockedError } = await supabase
      .from('admin_blocked_emails')
      .select('email')
      .order('created_at', { ascending: false });
    if (blockedError) throw blockedError;

    return new Response(JSON.stringify({ emails: (blocked || []).map(b => b.email) }), { status: 200 });
  } catch (err) {
    console.error('Blocked emails error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
