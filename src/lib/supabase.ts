import { createClient } from '@supabase/supabase-js';

const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!publicSupabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must both be set.'
  );
}

// This module is imported by BOTH server code and 'use client' components.
// Server-side we must reach Supabase over the container network: the host
// cannot resolve its own public hostname (NAT hairpin), so every server-side
// call to the public URL fails. The browser has the opposite constraint — it
// can only reach the public URL — so the split is made at runtime.
const supabaseUrl =
  typeof window === 'undefined'
    ? process.env.SUPABASE_INTERNAL_URL || publicSupabaseUrl
    : publicSupabaseUrl;

// Use image proxy to serve storage files through snapworxx.com domain
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com';
const STORAGE_BASE_URL = `${publicSupabaseUrl}/storage/v1/object/public/photos`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: 'snapnextjs' } });

export const getServiceRoleClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Service role operations require this key to be configured in the environment.'
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    db: { schema: 'snapnextjs' },
  });
};

/**
 * Rewrite a storage URL that a SERVER-SIDE Supabase client built (signed
 * download URLs, for example) from the internal container address back to the
 * public address. Anything handed to a browser MUST go through this — the
 * internal hostname is not resolvable outside the VPS.
 */
export const toPublicStorageUrl = (
  url: string | null | undefined
): string | null | undefined => {
  if (!url) return url;
  const internalUrl = process.env.SUPABASE_INTERNAL_URL;
  if (internalUrl && url.startsWith(internalUrl)) {
    return `${publicSupabaseUrl}${url.slice(internalUrl.length)}`;
  }
  return url;
};

/**
 * Get the public URL for a file in the photos bucket.
 * Routes through the image proxy so all URLs use snapworxx.com domain.
 */
export const getPhotoPublicUrl = (filePath: string): string => {
  return `${APP_URL}/api/img/${filePath}`;
};

/**
 * Transform any storage URL to use the image proxy (snapworxx.com/api/img/...).
 * Handles direct Supabase URLs and legacy custom domain URLs.
 */
export const transformToCustomDomain = (
  url: string | null | undefined
): string | null | undefined => {
  if (!url) return url;

  // Already a proxy URL
  if (url.includes('/api/img/')) return url;

  // Convert direct Supabase storage URL
  const supabaseMatch = url.match(/supabase\.co\/storage\/v1\/object\/public\/photos\/(.*)/);
  if (supabaseMatch) return `${APP_URL}/api/img/${supabaseMatch[1]}`;

  // Convert legacy custom domain URLs
  const legacyMatch = url.match(/sharedfrom\.snapworxx\.com\/storage\/v1\/object\/public\/photos\/(.*)/);
  if (legacyMatch) return `${APP_URL}/api/img/${legacyMatch[1]}`;

  // Handle relative paths
  if (!url.startsWith('http')) return `${APP_URL}/api/img/${url}`;

  return url;
};
