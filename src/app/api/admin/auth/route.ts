import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getServiceRoleClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Hash password using SHA-256
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generate a secure session token
 */
function generateSessionToken(email: string, secret: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return crypto
    .createHash('sha256')
    .update(`${email}:${timestamp}:${random}:${secret}`)
    .digest('hex');
}

/**
 * Set admin session cookies
 */
async function setAdminCookies(
  email: string,
  role: string,
  sessionToken: string,
  isProduction: boolean
) {
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  };

  cookieStore.set('admin_session', sessionToken, cookieOptions);
  cookieStore.set('admin_email', email, cookieOptions);
  cookieStore.set('admin_role', role, cookieOptions);
}

/**
 * Clear admin session cookies
 */
async function clearAdminCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  cookieStore.delete('admin_email');
  cookieStore.delete('admin_role');
}

/**
 * Admin Authentication API Route
 * Handles: login, logout, verify
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, action } = body;

    if (!action || !['login', 'logout', 'verify'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    const sessionSecret = process.env.ADMIN_SESSION_SECRET || 'default-secret-change-in-production';
    const isProduction = process.env.NODE_ENV === 'production';
    const supabase = getServiceRoleClient();

    // ===== LOGIN ACTION =====
    if (action === 'login') {
      // Validate input
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required' },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Query admin account from database
      const { data: adminAccounts, error: dbError } = await supabase
        .from('admin_accounts')
        .select('id, email, password_hash, full_name, role, is_active')
        .eq('email', email.toLowerCase().trim())
        .limit(1);

      // Handle database errors
      if (dbError) {
        console.error('❌ Admin login - Database error:', dbError);
        return NextResponse.json(
          { success: false, error: 'Database error. Please try again.' },
          { status: 500 }
        );
      }

      // Check if admin account exists
      if (!adminAccounts || adminAccounts.length === 0) {
        // Don't reveal if email exists or not (security best practice)
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const adminAccount = adminAccounts[0];

      // Check if account is active
      if (!adminAccount.is_active) {
        return NextResponse.json(
          { success: false, error: 'Account is inactive. Please contact an administrator.' },
          { status: 403 }
        );
      }

      // Verify password
      const passwordHash = hashPassword(password);
      if (passwordHash !== adminAccount.password_hash) {
        // Log failed login attempt (without revealing which field was wrong)
        console.warn(`⚠️ Failed login attempt for email: ${email}`);
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Update last_login timestamp
      await supabase
        .from('admin_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminAccount.id);

      // Log the successful login action
      try {
        await supabase.from('admin_audit_logs').insert([
          {
            admin_id: adminAccount.id,
            action: 'login',
            resource_type: 'admin_session',
            details: { 
              email: adminAccount.email, 
              role: adminAccount.role,
              timestamp: new Date().toISOString(),
            },
          },
        ]);
      } catch (auditError) {
        // Log audit error but don't fail the login
        console.error('Failed to log audit entry:', auditError);
      }

      // Create session token
      const sessionToken = generateSessionToken(adminAccount.email, sessionSecret);

      // Set cookies
      await setAdminCookies(
        adminAccount.email,
        adminAccount.role,
        sessionToken,
        isProduction
      );

      console.log(`✅ Admin login successful: ${adminAccount.email} (${adminAccount.role})`);

      return NextResponse.json({
        success: true,
        data: {
          email: adminAccount.email,
          role: adminAccount.role,
          fullName: adminAccount.full_name,
        },
      });
    }

    // ===== LOGOUT ACTION =====
    if (action === 'logout') {
      const cookieStore = await cookies();
      const adminEmail = cookieStore.get('admin_email')?.value;

      // Log the logout action if we have the email
      if (adminEmail) {
        try {
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
                details: { 
                  email: adminEmail,
                  timestamp: new Date().toISOString(),
                },
              },
            ]);
          }
        } catch (auditError) {
          console.error('Failed to log logout audit entry:', auditError);
        }
      }

      // Clear cookies
      await clearAdminCookies();

      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    }

    // ===== VERIFY ACTION =====
    if (action === 'verify') {
      const cookieStore = await cookies();
      const session = cookieStore.get('admin_session')?.value;
      const adminEmail = cookieStore.get('admin_email')?.value;
      const adminRole = cookieStore.get('admin_role')?.value;

      if (!session || !adminEmail) {
        return NextResponse.json({ authenticated: false }, { status: 200 });
      }

      // Optionally verify the session token is still valid by checking the admin account
      try {
        const { data: adminAccount } = await supabase
          .from('admin_accounts')
          .select('id, email, role, is_active')
          .eq('email', adminEmail)
          .single();

        if (!adminAccount || !adminAccount.is_active) {
          // Clear invalid session
          await clearAdminCookies();
          return NextResponse.json({ authenticated: false }, { status: 200 });
        }

        return NextResponse.json({
          authenticated: true,
          email: adminEmail,
          role: adminRole || adminAccount.role,
        });
      } catch (verifyError) {
        console.error('Session verification error:', verifyError);
        await clearAdminCookies();
        return NextResponse.json({ authenticated: false }, { status: 200 });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (err) {
    console.error('❌ Admin auth error:', err);
    
    // Handle JSON parse errors
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Server error. Please try again later.' },
      { status: 500 }
    );
  }
}
