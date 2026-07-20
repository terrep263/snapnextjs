import { getServiceRoleClient } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: Request) {
  try {
    // Only an authenticated super_admin may create admin accounts.
    const session = await verifyAdminSession();
    if (!session?.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName || !role) {
      return new Response(JSON.stringify({ error: 'All fields required' }), { status: 400 });
    }
    if (password.length < 12) {
      return new Response(JSON.stringify({ error: 'Password must be at least 12 characters' }), { status: 400 });
    }
    if (!['admin', 'super_admin'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400 });
    }

    const supabase = getServiceRoleClient();

    const { data: existingEmail } = await supabase
      .from('admin_accounts')
      .select('id')
      .eq('email', email);

    if (existingEmail && existingEmail.length > 0) {
      return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409 });
    }

    const passwordHash = hashPassword(password);

    const { data: newAdmin, error: createError } = await supabase
      .from('admin_accounts')
      .insert([{ email, password_hash: passwordHash, full_name: fullName, role, is_active: true }])
      .select()
      .single();

    if (createError) {
      console.error('Admin creation error:', createError);
      return new Response(JSON.stringify({ error: 'Failed to create admin account' }), { status: 500 });
    }

    await supabase.from('admin_audit_logs').insert([{
      admin_id: session.adminId,
      action: 'admin_account_created',
      resource_type: 'admin_account',
      resource_id: newAdmin.id,
      details: { email, full_name: fullName, role },
    }]);

    return new Response(JSON.stringify({ success: true, admin: newAdmin }), { status: 200 });
  } catch (err) {
    console.error('Create admin error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
