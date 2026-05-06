/**
 * Get the base URL for the application.
 * Client-side: uses window.location.origin (always correct for current host).
 * Server-side: uses NEXT_PUBLIC_APP_URL environment variable.
 */
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export const getEventUrl = (slug: string): string => {
  return `${getBaseUrl()}/e/${slug}`;
};

export const getDashboardUrl = (eventId: string): string => {
  return `${getBaseUrl()}/dashboard/${eventId}`;
};
