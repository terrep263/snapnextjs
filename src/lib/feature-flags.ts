/**
 * Feature Flag System
 * Supports staged rollout of new gallery experience
 */

export type GalleryVersion = 'legacy' | 'new';
export type RolloutStage = 'staging' | 'internal' | 'beta' | 'production';

export interface FeatureFlags {
  galleryVersion: GalleryVersion;
  rolloutStage: RolloutStage;
  enabledEventIds?: string[]; // Specific events to enable new gallery
  enabledEventSlugs?: string[]; // Specific event slugs to enable new gallery
  enabledPercentage?: number; // Percentage of events to enable (0-100)
  enabledForAdmins?: boolean; // Always enable for admins
  enabledForOwners?: boolean; // Always enable for event owners
}

// Default configuration
const defaultFlags: FeatureFlags = {
  galleryVersion: 'new',
  rolloutStage: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
  enabledForAdmins: true,
  enabledForOwners: true,
};

/**
 * Get feature flags from environment or database
 */
export function getFeatureFlags(): FeatureFlags {
  // Check environment variables first
  const envVersion = process.env.GALLERY_VERSION as GalleryVersion | undefined;
  const envStage = process.env.ROLLOUT_STAGE as RolloutStage | undefined;
  const envEnabledEvents = process.env.ENABLED_EVENT_IDS?.split(',') || [];
  const envEnabledSlugs = process.env.ENABLED_EVENT_SLUGS?.split(',') || [];
  const envPercentage = process.env.ENABLED_PERCENTAGE
    ? parseInt(process.env.ENABLED_PERCENTAGE, 10)
    : undefined;

  return {
    galleryVersion: envVersion || defaultFlags.galleryVersion,
    rolloutStage: envStage || defaultFlags.rolloutStage,
    enabledEventIds: envEnabledEvents.length > 0 ? envEnabledEvents : undefined,
    enabledEventSlugs: envEnabledSlugs.length > 0 ? envEnabledSlugs : undefined,
    enabledPercentage: envPercentage,
    enabledForAdmins: defaultFlags.enabledForAdmins,
    enabledForOwners: defaultFlags.enabledForOwners,
  };
}

/**
 * Check if new gallery should be enabled for a specific event
 */
export function isNewGalleryEnabled(
  eventId?: string,
  eventSlug?: string,
  isAdmin?: boolean,
  isOwner?: boolean
): boolean {
  const flags = getFeatureFlags();

  // Always enable for admins if configured
  if (flags.enabledForAdmins && isAdmin) {
    return true;
  }

  // Always enable for owners if configured
  if (flags.enabledForOwners && isOwner) {
    return true;
  }

  // Check specific event IDs
  if (flags.enabledEventIds && eventId) {
    return flags.enabledEventIds.includes(eventId);
  }

  // Check specific event slugs
  if (flags.enabledEventSlugs && eventSlug) {
    return flags.enabledEventSlugs.includes(eventSlug);
  }

  // Percentage-based rollout
  if (flags.enabledPercentage !== undefined && eventId) {
    // Use hash of event ID for consistent assignment
    const hash = eventId.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    const percentage = Math.abs(hash) % 100;
    return percentage < flags.enabledPercentage;
  }

  // Default: use gallery version setting
  return flags.galleryVersion === 'new';
}

/**
 * Get gallery route based on feature flags
 */
export function getGalleryRoute(
  eventSlug: string,
  eventId?: string,
  isAdmin?: boolean,
  isOwner?: boolean
): string {
  const useNewGallery = isNewGalleryEnabled(eventId, eventSlug, isAdmin, isOwner);
  
  if (useNewGallery) {
    return `/e/${eventSlug}/gallery`;
  }
  
  // Legacy gallery route (keep for rollback)
  return `/e/${eventSlug}`;
}

