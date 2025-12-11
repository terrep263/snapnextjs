/**
 * Moderation Utility Functions
 * Helper functions for moderation actions and permissions
 */

import { NextRequest } from 'next/server';

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
 * Check if request is from authenticated admin
 */
export function isAdminRequest(request: NextRequest): boolean {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split('; ');
    const adminSessionCookie = cookies.find(c => c.startsWith('admin_session='));
    if (adminSessionCookie) return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer admin_')) return true;

  return false;
}

/**
 * Get admin email from request
 */
export function getAdminEmail(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return cookies.admin_email || null;
  }
  return null;
}

/**
 * Get user email from request (for event owners)
 */
export function getUserEmail(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return cookies.userEmail || null;
  }
  return null;
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

