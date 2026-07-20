import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-auth';

/**
 * GET /api/admin/whoami
 * Lightweight, no-DB check of whether the caller holds a valid signed admin
 * session. Used by owner/admin-only pages (e.g. the photo manager) to grant
 * admins support access to any event without exposing whether a session exists
 * to unauthenticated callers beyond a boolean.
 */
export async function GET() {
  const isAdmin = await hasAdminSession();
  return NextResponse.json({ isAdmin });
}
