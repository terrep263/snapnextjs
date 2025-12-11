/**
 * Gallery Utility Functions
 * Helper functions for package type determination, permissions, and gallery logic
 */

import { PackageType, ViewMode, GalleryPermissions } from '@/components/Gallery/types';

export interface EventData {
  id: string;
  name: string;
  slug: string;
  header_image?: string | null;
  profile_image?: string | null;
  is_freebie?: boolean;
  is_free?: boolean;
  payment_type?: string | null;
  feed_enabled?: boolean;
  password_hash?: string | null;
  owner_email?: string | null;
  owner_id?: string | null;
  stripe_session_id?: string | null;
  promo_type?: string | null;
  watermark_enabled?: boolean;
  max_storage_bytes?: number | null;
  max_photos?: number | null;
}

/**
 * Determine package type from event data
 * Logic: Freebie > Premium (has premium features) > Basic (paid) > Basic (free promo)
 */
export function getPackageType(event: EventData): PackageType {
  // Freebie: explicitly marked as freebie
  if (event.is_freebie === true || event.payment_type === 'freebie') {
    return 'freebie';
  }

  // Premium: has premium features (feed_enabled or password protection)
  if (event.feed_enabled === true || event.password_hash) {
    return 'premium';
  }

  // Basic: everything else (paid or free promo)
  return 'basic';
}

/**
 * Determine view mode from user context and event data
 */
export function getViewMode(
  event: EventData,
  userEmail?: string | null
): ViewMode {
  // Check if admin (client-side check via localStorage)
  if (typeof window !== 'undefined') {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        if (session.isAuthenticated) {
          return 'admin';
        }
      } catch (e) {
        // Invalid session
      }
    }
  }

  // Check if event owner (by email match)
  if (userEmail && event.owner_email) {
    if (userEmail.toLowerCase() === event.owner_email.toLowerCase()) {
      return 'owner';
    }
  }

  // Check if user owns this event (via ownedEvents in localStorage)
  if (typeof window !== 'undefined') {
    const ownedEvents = localStorage.getItem('ownedEvents');
    if (ownedEvents) {
      try {
        const events = JSON.parse(ownedEvents);
        if (events.includes(event.id)) {
          return 'owner';
        }
      } catch (e) {
        // Invalid ownedEvents
      }
    }
  }

  // Default to public
  return 'public';
}

/**
 * Calculate gallery permissions based on package type and view mode
 */
export function getGalleryPermissions(
  packageType: PackageType,
  viewMode: ViewMode
): GalleryPermissions {
  const isOwnerOrAdmin = viewMode === 'owner' || viewMode === 'admin';

  return {
    canUpload: true, // All users can upload (subject to moderation)
    canDelete: isOwnerOrAdmin, // Only owners/admins can delete
    canManage: isOwnerOrAdmin, // Only owners/admins can manage
    canBulkDownload: true, // All users can bulk download (with watermark restrictions)
  };
}

/**
 * Check if event requires password
 */
export function requiresPassword(event: EventData): boolean {
  return !!event.password_hash;
}

/**
 * Check if event has premium features
 */
export function hasPremiumFeatures(event: EventData): boolean {
  return event.feed_enabled === true || !!event.password_hash;
}

