import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, action } = body;

    // Get admin credentials from env
    const adminCredentials = process.env.ADMIN_CREDENTIALS || '';
    const sessionSecret = process.env.ADMIN_SESSION_SECRET || 'secret';

    if (action === 'login') {
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
      }

      // Parse credentials: email1:password1|email2:password2|email3:password3
      const admins = adminCredentials.split('|').map(cred => {
        const [adminEmail, adminPassword] = cred.split(':');
        return { email: adminEmail.trim(), password: adminPassword.trim() };
      });

      // Verify credentials
      const validAdmin = admins.find(admin => admin.email === email && admin.password === password);

      if (!validAdmin) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
      }

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

      return new Response(JSON.stringify({ success: true, email }), { status: 200 });
    }

    if (action === 'logout') {
      const cookieStore = await cookies();
      cookieStore.delete('admin_session');
      cookieStore.delete('admin_email');
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'verify') {
      const cookieStore = await cookies();
      const session = cookieStore.get('admin_session')?.value;
      const adminEmail = cookieStore.get('admin_email')?.value;

      if (!session || !adminEmail) {
        return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
      }

      return new Response(JSON.stringify({ authenticated: true, email: adminEmail }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (err) {
    console.error('Admin auth error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
