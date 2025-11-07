import { getServiceRoleClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId } = body;

    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin ID required' }), { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Get admin details before deletion (for logging)
    const { data: adminToDelete } = await supabase
      .from('admin_accounts')
      .select('email, full_name')
      .eq('id', adminId)
      .single();

    // Delete the admin account
    const { error: deleteError } = await supabase
      .from('admin_accounts')
      .delete()
      .eq('id', adminId);

    if (deleteError) {
      console.error('Admin deletion error:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to delete admin account' }), { status: 500 });
    }

    // Log the deletion (we'll get the current user from cookies in the client)
    // For now, just record that a deletion happened
    await supabase.from('admin_audit_logs').insert([
      {
        action: 'admin_account_deleted',
        resource_type: 'admin_account',
        resource_id: adminId,
        details: adminToDelete ? { email: adminToDelete.email, full_name: adminToDelete.full_name } : {},
      },
    ]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Delete admin error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
