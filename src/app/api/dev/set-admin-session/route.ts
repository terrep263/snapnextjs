import { cookies } from 'next/headers';

/**
 * Development-only endpoint to set admin session cookies
 * This allows testing in development without knowing the admin password
 * IMPORTANT: This endpoint should only work in development mode
 */
export async function POST(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new Response(
      JSON.stringify({ error: 'This endpoint only works in development mode' }),
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });
    }

    // Set admin session cookies
    const cookieStore = await cookies();

    cookieStore.set('admin_session', 'dev-session-' + Date.now(), {
      httpOnly: true,
      secure: false, // Allow in dev
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    cookieStore.set('admin_email', email, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
    });

    cookieStore.set('admin_role', role || 'super_admin', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
    });

    console.log(`✅ Dev session created for ${email}`);

    return new Response(
      JSON.stringify({ success: true, email, message: 'Dev session set - redirecting to dashboard' }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Dev session error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to set dev session', details: String(err) }),
      { status: 500 }
    );
  }
}
