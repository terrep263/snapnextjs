/**
 * Gallery Module - Modular gallery components with PhotoSwipe v5
 *
 * Usage:
 * import { PhotoSwipeLightbox } from '@/components/Gallery';
 * import type { GalleryItem } from '@/components/Gallery';
 */

export { default as PhotoSwipeLightbox } from './PhotoSwipeLightbox';
export { default as GalleryContainer } from './GalleryContainer';
export { default as EventGalleryHeader } from './EventGalleryHeader';
export { default as GalleryControls } from './GalleryControls';
export { default as GalleryContent } from './GalleryContent';
export { default as FullScreenLightbox } from './FullScreenLightbox';
export { default as UploadModal } from './UploadModal';
export type { GalleryLayout } from './GalleryControls';

export type {
  GalleryItem,
  ViewMode,
  PackageType,
  GalleryPermissions,
  GalleryProps,
  LightboxProps,
} from './types';
