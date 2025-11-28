/**
 * Gallery Module - Clean, modular gallery components with PhotoSwipe lightbox
 *
 * Usage:
 * import { Gallery, Lightbox, GalleryGrid } from '@/components/Gallery';
 * import type { GalleryItem, LayoutType } from '@/components/Gallery';
 */

export { default as Gallery } from './Gallery';
export { default as Lightbox } from './Lightbox';
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
