import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must both be set.'
  );
}

// Custom domain for shared storage URLs
const STORAGE_CUSTOM_DOMAIN = 'https://sharedfrom.snapworxx.com';

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
 * Get the public URL for a file in the photos bucket using the custom domain.
 */
export const getPhotoPublicUrl = (filePath: string): string => {
  return `${STORAGE_CUSTOM_DOMAIN}/storage/v1/object/public/photos/${filePath}`;
};

/**
 * Transform any Supabase storage URL to use the custom domain.
 */
export const transformToCustomDomain = (
  url: string | null | undefined
): string | null | undefined => {
  if (!url) return url;

  if (url.includes('sharedfrom.snapworxx.com')) return url;

  const supabaseStoragePattern =
    /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/photos\/(.*)/;
  const match = url.match(supabaseStoragePattern);
  if (match) {
    return `${STORAGE_CUSTOM_DOMAIN}/storage/v1/object/public/photos/${match[1]}`;
  }

  if (url.startsWith('events/') || !url.startsWith('http')) {
    return `${STORAGE_CUSTOM_DOMAIN}/storage/v1/object/public/photos/${url}`;
  }

  return url;
};
