import { cookies } from 'next/headers';
import { getServiceRoleClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface AdminSession {
  authenticated: boolean;
  email?: string;
  role?: string;
  adminId?: string;
}

/**
 * Verify admin session from cookies
 * Returns session info or null if not authenticated
 */
export async function verifyAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    const adminEmail = cookieStore.get('admin_email')?.value;
    const adminRole = cookieStore.get('admin_role')?.value;

    if (!session || !adminEmail) {
      return null;
    }

    // Verify the session token is still valid by checking the admin account
    const supabase = getServiceRoleClient();
    const { data: adminAccount, error } = await supabase
      .from('admin_accounts')
      .select('id, email, role, is_active')
      .eq('email', adminEmail)
      .single();

    if (error || !adminAccount || !adminAccount.is_active) {
      return null;
    }

    return {
      authenticated: true,
      email: adminEmail,
      role: adminRole || adminAccount.role,
      adminId: adminAccount.id,
    };
  } catch (error) {
    console.error('Admin session verification error:', error);
    return null;
  }
}

/**
 * Middleware function to protect admin API routes
 * Returns NextResponse with error if not authenticated, or null if authenticated
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
  const session = await verifyAdminSession();

  if (!session || !session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  return null; // Authenticated, continue
}

/**
 * Check if request has admin session cookie (lightweight check)
 * Does not verify against database
 */
export async function hasAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    const adminEmail = cookieStore.get('admin_email')?.value;
    return !!(session && adminEmail);
  } catch {
    return false;
  }
}

