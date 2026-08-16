/**
 * Event lifecycle helpers — tier-based lifespan and expiry gating.
 *
 * Product rules (owner-defined):
 *   - Paid Basic events:   30 days of active life
 *   - Paid Premium events: 90 days of active life
 *   - New self-serve free events: event-date based window
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

import {
  FREE_GALLERY_DAYS,
  FREE_TIER_HARDENING_START_ISO,
  FREE_UPLOADS_OPEN_DAYS_BEFORE_EVENT,
} from '@/config/free-tier';

const DAY_MS = 24 * 60 * 60 * 1000;
export const GALLERY_GRACE_MS = 7 * DAY_MS;

// Events created before this instant are grandfathered (never auto-close).
// Set to the start of the enforcement rollout day (UTC); all pre-existing
// events fall before it.
const ENFORCEMENT_START_MS = Date.parse('2026-07-22T00:00:00Z');
const FREE_TIER_HARDENING_START_MS = Date.parse(FREE_TIER_HARDENING_START_ISO);

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

function isFreeTierGrandfathered(
  event: { created_at?: string | null } | null | undefined
): boolean {
  if (!event?.created_at) return true;
  const created = Date.parse(event.created_at);
  if (Number.isNaN(created)) return true;
  return created < FREE_TIER_HARDENING_START_MS;
}

type UploadWindowEvent = {
  is_free?: boolean | null;
  promo_type?: string | null;
  payment_type?: string | null;
  event_date?: string | null;
  activated_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
};

export type UploadBlockedReason = 'inactive' | 'not_open' | 'closed';

function eventDateMs(eventDate: string | null | undefined): number | null {
  if (!eventDate) return null;
  const parsed = Date.parse(`${eventDate}T00:00:00Z`);
  return Number.isNaN(parsed) ? null : parsed;
}

function isSelfServeFreeEvent(event: UploadWindowEvent): boolean {
  return (
    event.is_free === true &&
    (event.promo_type === 'FREE_SELF_SERVE' || event.payment_type === 'self_serve')
  );
}

export function uploadBlockedReason(
  event: UploadWindowEvent | null | undefined,
  nowMs: number = Date.now()
): UploadBlockedReason | null {
  if (!event) return null;

  if (isSelfServeFreeEvent(event) && !isFreeTierGrandfathered(event)) {
    if (!event.activated_at) return 'inactive';

    const eventMs = eventDateMs(event.event_date);
    if (eventMs !== null) {
      const opensAt = eventMs - FREE_UPLOADS_OPEN_DAYS_BEFORE_EVENT * DAY_MS;
      const closesAt = eventMs + FREE_GALLERY_DAYS * DAY_MS;
      if (nowMs < opensAt) return 'not_open';
      if (nowMs > closesAt) return 'closed';
      return null;
    }
  }

  if (event.expires_at && !isGrandfathered(event)) {
    return nowMs > new Date(event.expires_at).getTime() ? 'closed' : null;
  }

  if (isSelfServeFreeEvent(event) && !isFreeTierGrandfathered(event) && event.created_at) {
    const created = Date.parse(event.created_at);
    if (!Number.isNaN(created) && nowMs > created + FREE_GALLERY_DAYS * DAY_MS) {
      return 'closed';
    }
  }

  return null;
}

/** True once the event's active window has ended (uploads should be refused). */
export function uploadsClosed(
  event: UploadWindowEvent | null | undefined
): boolean {
  return uploadBlockedReason(event) !== null;
}

/** True once the 7-day post-expiry grace has also elapsed (gallery + downloads close). */
export function galleryClosed(
  event: { expires_at?: string | null; created_at?: string | null } | null | undefined
): boolean {
  if (!event?.expires_at) return false;
  if (isGrandfathered(event)) return false;
  return Date.now() > new Date(event.expires_at).getTime() + GALLERY_GRACE_MS;
}
