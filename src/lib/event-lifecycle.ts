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
 *
 * GRANDFATHERING: expiry is only ENFORCED for events created on/after
 * ENFORCEMENT_START. Every event that already existed when enforcement shipped
 * stays open indefinitely, even if it carries an expires_at — so turning this on
 * never closes a live gallery retroactively.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
export const GALLERY_GRACE_MS = 7 * DAY_MS;

// Events created before this instant are grandfathered (never auto-close).
// Set to the start of the enforcement rollout day (UTC); all pre-existing
// events fall before it.
const ENFORCEMENT_START_MS = Date.parse('2026-07-22T00:00:00Z');

/** ISO expiry timestamp for a paid package, measured from `fromIso`. */
export function expiresAtForPackage(
  packageType: 'basic' | 'premium',
  fromIso: string
): string {
  const days = packageType === 'premium' ? 90 : 30;
  return new Date(new Date(fromIso).getTime() + days * DAY_MS).toISOString();
}

/**
 * Whether an event is grandfathered out of expiry enforcement.
 * Missing created_at is treated as grandfathered (safe: never auto-close an
 * event whose age we can't establish).
 */
function isGrandfathered(event: { created_at?: string | null } | null | undefined): boolean {
  if (!event?.created_at) return true;
  const created = Date.parse(event.created_at);
  if (Number.isNaN(created)) return true;
  return created < ENFORCEMENT_START_MS;
}

/** True once the event's active window has ended (uploads should be refused). */
export function uploadsClosed(
  event: { expires_at?: string | null; created_at?: string | null } | null | undefined
): boolean {
  if (!event?.expires_at) return false; // no expiry configured = never closes
  if (isGrandfathered(event)) return false; // pre-enforcement event = never closes
  return Date.now() > new Date(event.expires_at).getTime();
}

/** True once the 7-day post-expiry grace has also elapsed (gallery + downloads close). */
export function galleryClosed(
  event: { expires_at?: string | null; created_at?: string | null } | null | undefined
): boolean {
  if (!event?.expires_at) return false;
  if (isGrandfathered(event)) return false;
  return Date.now() > new Date(event.expires_at).getTime() + GALLERY_GRACE_MS;
}
