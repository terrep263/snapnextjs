import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getServiceRoleClient } from '@/lib/supabase';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, action } = body;

    const sessionSecret = process.env.ADMIN_SESSION_SECRET || 'secret';

    if (action === 'login') {
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
      }

      // Query admin account from database
      const supabase = getServiceRoleClient();
      const { data: adminAccount, error: dbError } = await supabase
        .from('admin_accounts')
        .select('id, email, password_hash, full_name, role, is_active')
        .eq('email', email)
        .single();

      // Handle database errors (including not found)
      if (dbError) {
        // Not found or other error - return generic message for security
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
      }

      if (!adminAccount) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
      }

      // Check if account is active
      if (!adminAccount.is_active) {
        return new Response(JSON.stringify({ error: 'Account is inactive' }), { status: 403 });
      }

      // Verify password
      const passwordHash = hashPassword(password);
      if (passwordHash !== adminAccount.password_hash) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
      }

      // Update last_login timestamp
      await supabase
        .from('admin_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminAccount.id);

      // Log the login action
      await supabase.from('admin_audit_logs').insert([
        {
          admin_id: adminAccount.id,
          action: 'login',
          resource_type: 'admin_session',
          details: { email, role: adminAccount.role },
        },
      ]);

      // Create session token
      const sessionToken = crypto
        .createHash('sha256')
        .update(`${email}:${Date.now()}:${sessionSecret}`)
        .digest('hex');

      // Store in cookie
      const cookieStore = await cookies();
      cookieStore.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
      });

      cookieStore.set('admin_email', email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
      });

      cookieStore.set('admin_role', adminAccount.role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
      });

      return new Response(JSON.stringify({ success: true, email, role: adminAccount.role }), { status: 200 });
    }

    if (action === 'logout') {
      const cookieStore = await cookies();
      const adminEmail = cookieStore.get('admin_email')?.value;

      // Log the logout action if we have the email
      if (adminEmail) {
        const supabase = getServiceRoleClient();
        const { data: adminAccount } = await supabase
          .from('admin_accounts')
          .select('id')
          .eq('email', adminEmail)
          .single();

        if (adminAccount) {
          await supabase.from('admin_audit_logs').insert([
            {
              admin_id: adminAccount.id,
              action: 'logout',
              resource_type: 'admin_session',
            },
          ]);
        }
      }

      cookieStore.delete('admin_session');
      cookieStore.delete('admin_email');
      cookieStore.delete('admin_role');
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'verify') {
      const cookieStore = await cookies();
      const session = cookieStore.get('admin_session')?.value;
      const adminEmail = cookieStore.get('admin_email')?.value;
      const adminRole = cookieStore.get('admin_role')?.value;

      if (!session || !adminEmail) {
        return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
      }

      return new Response(JSON.stringify({ authenticated: true, email: adminEmail, role: adminRole }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (err) {
    console.error('Admin auth error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
