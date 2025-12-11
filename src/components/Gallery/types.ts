/**
 * Unified Gallery Type Definitions
 * Used across all gallery components for type consistency
 */

export interface GalleryItem {
  id: string;
  url: string;
  filename?: string;
  alt?: string;
  title?: string;
  description?: string;
  type?: 'header' | 'profile' | 'photo' | 'video';
  created_at?: string;
  uploadedAt?: string;

  // Media properties
  isVideo?: boolean;
  duration?: number;
  size?: number;
  width?: number;
  height?: number;

  // Thumbnail/poster
  thumb?: string;
  poster?: string;
  thumbnail_url?: string;
  storage_url?: string;

  // MIME type (for video detection)
  mimeType?: string;
}

export type LayoutType = 'masonry' | 'grid';

export type ViewMode = 'public' | 'owner' | 'admin';

export type PackageType = 'basic' | 'premium' | 'freebie';

export interface GalleryPermissions {
  canUpload: boolean;
  canDelete: boolean;
  canManage: boolean;
  canBulkDownload: boolean;
}

export interface GalleryProps {
  items: GalleryItem[];
  eventName?: string;
  eventSlug?: string;
  eventId?: string;
  eventCode?: string;
  headerImage?: string;
  profileImage?: string;

  // Permissions
  viewMode?: ViewMode;
  packageType?: PackageType;
  isFree?: boolean;
  isFreebie?: boolean;
  isSharedView?: boolean;

  // Layout
  layout?: LayoutType;
  showHeader?: boolean;

  // Callbacks
  onDownload?: (item: GalleryItem) => void;
  onDownloadAll?: () => void;
  onDelete?: (itemId: string) => void;
  onShare?: (item: GalleryItem) => void;
}

export interface LightboxProps {
  items: GalleryItem[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  eventName?: string;
}
