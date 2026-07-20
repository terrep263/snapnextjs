/**
 * Moderation Utility Functions
 * Helper functions for moderation actions and permissions
 */

export type ModerationAction = 
  | 'remove' 
  | 'flag' 
  | 'restore' 
  | 'download_original'
  | 'hide'
  | 'unhide';

export interface ModerationPermission {
  canRemove: boolean;
  canFlag: boolean;
  canRestore: boolean;
  canDownloadOriginal: boolean;
  canHide: boolean;
  canUnhide: boolean;
}

/**
 * Determine moderation permissions based on user role
 */
export function getModerationPermissions(
  isAdmin: boolean,
  isOwner: boolean,
  photoEventId: string,
  userEventId?: string
): ModerationPermission {
  if (isAdmin) {
    // Admins have full permissions
    return {
      canRemove: true,
      canFlag: true,
      canRestore: true,
      canDownloadOriginal: true,
      canHide: true,
      canUnhide: true,
    };
  }

  if (isOwner && photoEventId === userEventId) {
    // Event owners can moderate their own event's content
    return {
      canRemove: true,
      canFlag: false, // Owners don't flag, they remove
      canRestore: true,
      canDownloadOriginal: false, // Only admins get original
      canHide: true,
      canUnhide: true,
    };
  }

  // No permissions for public users
  return {
    canRemove: false,
    canFlag: false,
    canRestore: false,
    canDownloadOriginal: false,
    canHide: false,
    canUnhide: false,
  };
}
