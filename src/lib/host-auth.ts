import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getServiceRoleClient } from '@/lib/supabase';

/**
 * Verified host (event-owner) session.
 *
 * Mirrors the admin session in src/lib/admin-auth.ts: an HMAC-signed cookie
 * proves the browser holds a claim to an email; per-event authorization is the
 * DB ownership check in verifyHostSession(). This replaces the historical
 * UNSIGNED `userEmail` cookie as the trustworthy owner signal.
 *
 * Domain separation: the signing key is derived from the base secret with a
 * fixed context string, so a host token can never validate as an admin token
 * (or vice-versa) even when both fall back to the same ADMIN_SESSION_SECRET.
 */

export interface HostSession {
  email: string;
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const HOST_COOKIE = 'host_session';

function getHostKey(): Buffer | null {
  const base = process.env.HOST_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!base) return null;
  return crypto.createHmac('sha256', base).update('snapworxx-host-session-v1').digest();
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** Sign a host session token: base64url(payload).HMAC. Null if no secret. */
export function signHostSession(email: string, ttlMs: number = SESSION_TTL_MS): string | null {
  const key = getHostKey();
  if (!key) return null;
  const payload = JSON.stringify({ email: email.toLowerCase().trim(), exp: Date.now() + ttlMs });
  const p = base64url(payload);
  const sig = crypto.createHmac('sha256', key).update(p).digest('base64url');
  return `${p}.${sig}`;
}

/** Verify a host token's signature + expiry. Null if invalid/expired/no secret. */
export function verifyHostSessionToken(
  token: string | undefined
): { email: string; exp: number } | null {
  const key = getHostKey();
  if (!key || !token || !token.includes('.')) return null;
  const [p, sig] = token.split('.');
  if (!p || !sig) return null;

  const expected = crypto.createHmac('sha256', key).update(p).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(json);
    if (!payload?.email || !payload?.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Issue the signed host_session cookie for an email. No-op if no secret. */
export async function setHostCookie(email: string, isProduction: boolean): Promise<void> {
  const token = signHostSession(email);
  if (!token) return;
  const cookieStore = await cookies();
  cookieStore.set(HOST_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
}

/** Clear the host session cookie. */
export async function clearHostCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(HOST_COOKIE);
}

/**
 * Returns the verified host for eventId, or null. Proves: the browser holds a
 * signed claim to email X AND X owns this event (owner_email OR email).
 */
export async function verifyHostSession(eventId: string): Promise<HostSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(HOST_COOKIE)?.value;
    if (!token) return null;

    const payload = verifyHostSessionToken(token);
    if (!payload) return null;
    const email = payload.email.toLowerCase().trim();

    const supabase = getServiceRoleClient();
    const { data: event } = await supabase
      .from('events')
      .select('id, owner_email, email')
      .eq('id', eventId)
      .single();
    if (!event) return null;

    const owners = [event.owner_email, event.email]
      .filter(Boolean)
      .map((e: string) => e.toLowerCase());
    if (!owners.includes(email)) return null;

    return { email };
  } catch {
    return null;
  }
}
