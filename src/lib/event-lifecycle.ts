/**
 * Event lifecycle helpers — tier-based lifespan and expiry gating.
 *
 * Product rules (owner-defined):
 *   - Paid Basic events:   30 days of active life
 *   - Paid Premium events: 90 days of active life
 *   - Free / promo events: 30 days (set at claim time)
 *   - Unlimited comp events: never expire (expires_at = null)
 *
 * After expiry, UPLOADS close immediately; the GALLERY stays viewable and
 * downloadable for a 7-day grace window, then fully closes.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
export const GALLERY_GRACE_MS = 7 * DAY_MS;

/** ISO expiry timestamp for a paid package, measured from `from` (default now-safe caller passes it). */
export function expiresAtForPackage(
  packageType: 'basic' | 'premium',
  fromIso: string
): string {
  const days = packageType === 'premium' ? 90 : 30;
  return new Date(new Date(fromIso).getTime() + days * DAY_MS).toISOString();
}

/** True once the event's active window has ended (uploads should be refused). */
export function uploadsClosed(event: { expires_at?: string | null } | null | undefined): boolean {
  if (!event?.expires_at) return false; // no expiry configured = never closes
  return Date.now() > new Date(event.expires_at).getTime();
}

/** True once the 7-day post-expiry grace has also elapsed (gallery + downloads close). */
export function galleryClosed(event: { expires_at?: string | null } | null | undefined): boolean {
  if (!event?.expires_at) return false;
  return Date.now() > new Date(event.expires_at).getTime() + GALLERY_GRACE_MS;
}
