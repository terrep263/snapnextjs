import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const supabase = getServiceRoleClient();

    const { data: admins, error } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch admins:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch admin accounts' }), { status: 500 });
    }

    return new Response(JSON.stringify({ admins }), { status: 200 });
  } catch (err) {
    console.error('List admins error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
