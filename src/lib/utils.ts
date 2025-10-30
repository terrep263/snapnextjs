import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { getServiceRoleClient } from './supabase';

/**
 * Generates a URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a unique slug for an event
 * Format: event-name-randomid
 */
export async function generateUniqueSlug(eventName: string): Promise<string> {
  const supabase = getServiceRoleClient();
  const baseSlug = slugify(eventName);

  // Generate a unique slug by appending a random ID
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Create slug with random suffix
    const randomSuffix = nanoid(8); // 8 character random string
    const slug = `${baseSlug}-${randomSuffix}`.slice(0, 100); // Limit to 100 chars

    // Check if slug exists
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    // If no data found (error will be PGRST116), slug is unique
    if (!data && error?.code === 'PGRST116') {
      return slug;
    }

    attempts++;
  }

  // Fallback: use just nanoid if all attempts failed
  return nanoid(16);
}

/**
 * Generates a QR code as a data URL
 */
export async function generateQRCode(url: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 512,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Calculates expiration date (30 days from now)
 */
export function getExpirationDate(): Date {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30);
  return expirationDate;
}
