import { getServiceRoleClient } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session?.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { adminId } = body;

    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin ID required' }), { status: 400 });
    }
    if (adminId === session.adminId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    const { data: adminToDelete } = await supabase
      .from('admin_accounts')
      .select('email, full_name, role')
      .eq('id', adminId)
      .single();

    if (!adminToDelete) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }

    if (adminToDelete.role === 'super_admin') {
      const { count } = await supabase
        .from('admin_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('is_active', true);
      if ((count || 0) <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last active super admin' }, { status: 400 });
      }
    }

    const { error: deleteError } = await supabase.from('admin_accounts').delete().eq('id', adminId);
    if (deleteError) {
      console.error('Admin deletion error:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to delete admin account' }), { status: 500 });
    }

    await supabase.from('admin_audit_logs').insert([{
      admin_id: session.adminId,
      action: 'admin_account_deleted',
      resource_type: 'admin_account',
      resource_id: adminId,
      details: { email: adminToDelete.email, full_name: adminToDelete.full_name, role: adminToDelete.role },
    }]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Delete admin error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
