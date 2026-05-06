import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getServiceRoleClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { checkRateLimit, incrementRateLimit, getClientIdentifier } from '@/lib/rate-limiter';

function generateSessionToken(email: string, secret: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return crypto
    .createHash('sha256')
    .update(`${email}:${timestamp}:${random}:${secret}`)
    .digest('hex');
}

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
    maxAge: 24 * 60 * 60,
    path: '/',
  };
  cookieStore.set('admin_session', sessionToken, cookieOptions);
  cookieStore.set('admin_email', email, cookieOptions);
  cookieStore.set('admin_role', role, cookieOptions);
}

async function clearAdminCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  cookieStore.delete('admin_email');
  cookieStore.delete('admin_role');
}

export async function POST(req: Request) {
  try {
    // Rate limiting — 5 attempts per minute per IP
    const identifier = getClientIdentifier(req);
    const rateCheck = checkRateLimit(`auth:${identifier}`, 5);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, action } = body;

    if (!action || !['login', 'logout', 'verify'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    const sessionSecret = process.env.ADMIN_SESSION_SECRET;
    if (!sessionSecret && action === 'login') {
      console.error('CRITICAL: ADMIN_SESSION_SECRET environment variable is not set');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration. Contact administrator.' },
        { status: 500 }
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const supabase = getServiceRoleClient();

    // ===== LOGIN =====
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required' },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }

      const { data: adminAccounts, error: dbError } = await supabase
        .from('admin_accounts')
        .select('id, email, password_hash, full_name, role, is_active')
        .eq('email', email.toLowerCase().trim())
        .limit(1);

      if (dbError) {
        console.error('Admin login - Database error:', dbError);
        return NextResponse.json(
          { success: false, error: 'Database error. Please try again.' },
          { status: 500 }
        );
      }

      if (!adminAccounts || adminAccounts.length === 0) {
        incrementRateLimit(`auth:${identifier}`);
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const adminAccount = adminAccounts[0];

      if (!adminAccount.is_active) {
        return NextResponse.json(
          { success: false, error: 'Account is inactive. Contact an administrator.' },
          { status: 403 }
        );
      }

      // Use bcrypt.compare — works with both bcrypt hashes and legacy SHA-256 hashes
      // during migration period
      let passwordValid = false;
      if (adminAccount.password_hash.startsWith('$2')) {
        // bcrypt hash
        passwordValid = await bcrypt.compare(password, adminAccount.password_hash);
      } else {
        // Legacy SHA-256 — still support during migration, log warning
        const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
        passwordValid = sha256Hash === adminAccount.password_hash;
        if (passwordValid) {
          console.warn(
            `Admin account ${adminAccount.email} is using legacy SHA-256 password hash. ` +
            `Please update to bcrypt by resetting the password.`
          );
          // Auto-upgrade hash to bcrypt on successful login
          const newHash = await bcrypt.hash(password, 12);
          await supabase
            .from('admin_accounts')
            .update({ password_hash: newHash })
            .eq('id', adminAccount.id);
        }
      }

      if (!passwordValid) {
        incrementRateLimit(`auth:${identifier}`);
        console.warn(`Failed login attempt for: ${email}`);
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      await supabase
        .from('admin_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminAccount.id);

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
        console.error('Failed to log audit entry:', auditError);
      }

      const sessionToken = generateSessionToken(adminAccount.email, sessionSecret!);
      await setAdminCookies(adminAccount.email, adminAccount.role, sessionToken, isProduction);

      return NextResponse.json({
        success: true,
        data: {
          email: adminAccount.email,
          role: adminAccount.role,
          fullName: adminAccount.full_name,
        },
      });
    }

    // ===== LOGOUT =====
    if (action === 'logout') {
      const cookieStore = await cookies();
      const adminEmail = cookieStore.get('admin_email')?.value;

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
                details: { email: adminEmail, timestamp: new Date().toISOString() },
              },
            ]);
          }
        } catch (auditError) {
          console.error('Failed to log logout audit entry:', auditError);
        }
      }

      await clearAdminCookies();
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    }

    // ===== VERIFY =====
    if (action === 'verify') {
      const cookieStore = await cookies();
      const session = cookieStore.get('admin_session')?.value;
      const adminEmail = cookieStore.get('admin_email')?.value;
      const adminRole = cookieStore.get('admin_role')?.value;

      if (!session || !adminEmail) {
        return NextResponse.json({ authenticated: false }, { status: 200 });
      }

      try {
        const { data: adminAccount } = await supabase
          .from('admin_accounts')
          .select('id, email, role, is_active')
          .eq('email', adminEmail)
          .single();

        if (!adminAccount || !adminAccount.is_active) {
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
    console.error('Admin auth error:', err);
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
