/**
 * Gallery Module - Modular gallery components with YARL (Yet Another React Lightbox)
 *
 * Usage:
 * import { YarlLightbox, GalleryGrid } from '@/components/Gallery';
 * import type { GalleryItem, LayoutType } from '@/components/Gallery';
 */

export { default as YarlLightbox } from './YarlLightbox';
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
