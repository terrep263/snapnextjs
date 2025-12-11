'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Image Component
 * Uses Next.js Image with lazy loading, WebP support, and proper sizing
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);

  // Fallback to regular img if Next.js Image fails
  if (imageError) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  try {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          className={className}
          priority={priority}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          onLoad={onLoad}
          onError={() => {
            setImageError(true);
            onError?.();
          }}
          quality={85}
        />
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={width || 400}
        height={height || 400}
        className={className}
        priority={priority}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        onLoad={onLoad}
        onError={() => {
          setImageError(true);
          onError?.();
        }}
        quality={85}
      />
    );
  } catch (error) {
    // Fallback to regular img if Image component fails
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }
}

