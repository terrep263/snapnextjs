import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Custom domain for shared storage URLs
const STORAGE_CUSTOM_DOMAIN = 'https://sharedfrom.snapworxx.com';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations that need elevated permissions
// Falls back to anon key if service role key is not available
export const getServiceRoleClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, supabaseServiceKey);
};

/**
 * Get the public URL for a file in the photos bucket using the custom domain
 * @param filePath - The path to the file within the 'photos' bucket
 * @returns The public URL using the custom domain
 */
export const getPhotoPublicUrl = (filePath: string): string => {
  return `${STORAGE_CUSTOM_DOMAIN}/storage/v1/object/public/photos/${filePath}`;
};

/**
 * Transform any Supabase storage URL to use the custom domain
 * Handles both old default Supabase URLs and already-transformed URLs
 * @param url - The original URL (may be old Supabase format or already custom domain)
 * @returns The URL using the custom domain
 */
export const transformToCustomDomain = (url: string): string => {
  if (!url) return url;
  
  // Already using custom domain
  if (url.includes('sharedfrom.snapworxx.com')) {
    return url;
  }
  
  // Transform old Supabase URLs to custom domain
  // Pattern: https://<project-id>.supabase.co/storage/v1/object/public/photos/<path>
  const supabaseStoragePattern = /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/photos\/(.*)/;
  const match = url.match(supabaseStoragePattern);
  
  if (match) {
    return `${STORAGE_CUSTOM_DOMAIN}/storage/v1/object/public/photos/${match[1]}`;
  }
  
  // Return original if no pattern match
  return url;
};
