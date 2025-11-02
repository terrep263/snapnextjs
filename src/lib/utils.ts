/**
 * Get the base URL for the application
 * Automatically detects production vs development environment
 */
export const getBaseUrl = (): string => {
  // In production, use the production URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://snapworxx.com';
  }
  
  // In development, use the environment variable or localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

/**
 * Generate event URL
 */
export const getEventUrl = (slug: string): string => {
  return `${getBaseUrl()}/e/${slug}`;
};

/**
 * Generate dashboard URL
 */
export const getDashboardUrl = (eventId: string): string => {
  return `${getBaseUrl()}/dashboard/${eventId}`;
};