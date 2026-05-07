import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must both be set.'
  );
}

// Use direct Supabase URL — custom domain requires Supabase enterprise plan configuration
const STORAGE_BASE_URL = `${supabaseUrl}/storage/v1/object/public/photos`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Returns a service-role Supabase client for server-side privileged operations.
 * Throws if SUPABASE_SERVICE_ROLE_KEY is not set — never falls back silently.
 */
export const getServiceRoleClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Service role operations require this key to be configured in the environment.'
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
};

/**
 * Get the public URL for a file in the photos bucket.
 */
export const getPhotoPublicUrl = (filePath: string): string => {
  return `${STORAGE_BASE_URL}/${filePath}`;
};

/**
 * Transform any storage URL to use the direct Supabase URL.
 * Handles legacy custom domain URLs by converting them back.
 */
export const transformToCustomDomain = (
  url: string | null | undefined
): string | null | undefined => {
  if (!url) return url;

  // Already a direct Supabase URL — return as-is
  if (url.includes('supabase.co')) return url;

  // Convert legacy custom domain URLs to direct Supabase URL
  if (url.includes('sharedfrom.snapworxx.com')) {
    const match = url.match(/sharedfrom\.snapworxx\.com\/storage\/v1\/object\/public\/photos\/(.*)/);
    if (match) {
      return `${STORAGE_BASE_URL}/${match[1]}`;
    }
  }

  // Handle relative paths
  if (!url.startsWith('http')) {
    return `${STORAGE_BASE_URL}/${url}`;
  }

  return url;
};
