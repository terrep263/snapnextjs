/**
 * Gallery Module - Modular gallery components with PhotoSwipe v5
 *
 * Usage:
 * import { PhotoSwipeLightbox, GalleryGrid } from '@/components/Gallery';
 * import type { GalleryItem, LayoutType } from '@/components/Gallery';
 */

export { default as PhotoSwipeLightbox } from './PhotoSwipeLightbox';
export { default as GalleryGrid } from './GalleryGrid';
export { default as GalleryControls } from './GalleryControls';

export type {
  GalleryItem,
  LayoutType,
  ViewMode,
  PackageType,
  GalleryPermissions,
  GalleryProps,
  LightboxProps,
} from './types';
