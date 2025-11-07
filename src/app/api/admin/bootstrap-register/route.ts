import { getServiceRoleClient } from '@/lib/supabase';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, code } = body;

    if (!email || !password || !fullName || !code) {
      return new Response(JSON.stringify({ error: 'All fields required' }), { status: 400 });
    }

    // Verify bootstrap code
    const bootstrapCode = process.env.ADMIN_BOOTSTRAP_CODE;
    if (code !== bootstrapCode) {
      return new Response(JSON.stringify({ error: 'Invalid bootstrap code' }), { status: 401 });
    }

    // Validate password strength
    if (password.length < 12) {
      return new Response(JSON.stringify({ error: 'Password must be at least 12 characters' }), { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Check if any admin already exists
    const { data: existingAdmins, error: checkError } = await supabase
      .from('admin_accounts')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Database check error:', checkError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error. Make sure admin_accounts table exists.',
          details: checkError.message 
        }), 
        { status: 500 }
      );
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(JSON.stringify({ error: 'Admin account already exists. Use login page.' }), { status: 409 });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('admin_accounts')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409 });
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create first admin as super_admin
    const { data: newAdmin, error: createError } = await supabase
      .from('admin_accounts')
      .insert([
        {
          email,
          password_hash: passwordHash,
          full_name: fullName,
          role: 'super_admin',
          is_active: true,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Admin creation error:', createError);
      return new Response(JSON.stringify({ error: 'Failed to create admin account' }), { status: 500 });
    }

    // Log the bootstrap action
    await supabase.from('admin_audit_logs').insert([
      {
        admin_id: newAdmin.id,
        action: 'bootstrap_account_created',
        resource_type: 'admin_account',
        resource_id: newAdmin.id,
        details: { email, full_name: fullName },
      },
    ]);

    return new Response(JSON.stringify({ success: true, message: 'Admin account created' }), { status: 200 });
  } catch (err) {
    console.error('Bootstrap register error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
