/**
 * SEO Configuration
 * Centralized SEO settings for next-seo and site-wide metadata
 */

export const seoConfig = {
  // Site information
  site: {
    name: 'Snapworxx',
    domain: 'snapworxx.com',
    url: 'https://snapworxx.com',
    description: 'Professional event photography and gallery hosting platform',
    locale: 'en_US',
  },

  // Brand information
  brand: {
    name: 'Snapworxx',
    logo: 'https://snapworxx.com/logo.png',
    logoSquare: 'https://snapworxx.com/logo-square.png',
    tagline: 'Your moments, perfectly captured',
    color: '#9333ea', // Purple brand color
  },

  // Social media
  social: {
    twitter: '@snapworxx',
    instagram: 'snapworxx',
    facebook: 'snapworxx',
  },

  // Contact
  contact: {
    email: 'hello@snapworxx.com',
    phone: '+1-800-SNAP-PRO',
  },

  // OpenGraph defaults
  og: {
    type: 'website' as const,
    locale: 'en_US',
    siteName: 'Snapworxx',
  },

  // Twitter Card defaults
  twitter: {
    handle: '@snapworxx',
    site: '@snapworxx',
    cardType: 'summary_large_image' as const,
  },

  // Image optimization
  images: {
    thumbnail: {
      width: 400,
      height: 400,
    },
    og: {
      width: 1200,
      height: 630,
    },
    twitter: {
      width: 1200,
      height: 675,
    },
  },

  // Robots & Indexing
  robots: {
    follow: true,
    index: true,
    nocache: false,
    googleBot: {
      follow: true,
      index: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  // Alternative language versions (for hreflang)
  languages: {
    en: 'https://snapworxx.com',
    es: 'https://es.snapworxx.com',
    fr: 'https://fr.snapworxx.com',
  },
};

/**
 * Generate canonical URL
 */
export function getCanonical(path: string): string {
  return `${seoConfig.site.url}${path}`;
}

/**
 * Generate full image URL
 */
export function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${seoConfig.site.url}${path}`;
}

/**
 * Default NextSEO config
 */
export const defaultSeoConfig = {
  titleTemplate: `%s | ${seoConfig.site.name}`,
  defaultTitle: `${seoConfig.site.name} - ${seoConfig.brand.tagline}`,
  description: seoConfig.site.description,
  canonical: seoConfig.site.url,
  languageAlternates: Object.entries(seoConfig.languages).map(([lang, url]) => ({
    hrefLang: lang,
    href: url,
  })),
  openGraph: {
    type: seoConfig.og.type,
    locale: seoConfig.og.locale,
    url: seoConfig.site.url,
    siteName: seoConfig.og.siteName,
    images: [
      {
        url: getImageUrl(seoConfig.brand.logo),
        width: seoConfig.images.og.width,
        height: seoConfig.images.og.height,
        alt: seoConfig.site.name,
      },
    ],
  },
  twitter: {
    handle: seoConfig.twitter.handle,
    site: seoConfig.twitter.site,
    cardType: seoConfig.twitter.cardType,
  },
  robotsProps: {
    noindex: false,
    nofollow: false,
    notranslate: false,
    noimageindex: false,
    nosnippet: false,
  },
};

/**
 * Event Gallery SEO Config Generator
 */
export interface EventSeoData {
  eventId: string;
  eventName: string;
  description?: string;
  imageUrl?: string;
  photos?: Array<{ url: string; title?: string }>;
  date?: string;
  location?: string;
  author?: string;
}

export function getEventSeoConfig(event: EventSeoData) {
  const eventUrl = getCanonical(`/e/${event.eventId}`);
  const ogImage = event.imageUrl || seoConfig.brand.logo;

  return {
    title: event.eventName,
    description: event.description || `Browse beautiful photos from ${event.eventName} on ${seoConfig.site.name}`,
    canonical: eventUrl,
    openGraph: {
      type: 'website' as const,
      url: eventUrl,
      title: event.eventName,
      description: event.description || `Event gallery for ${event.eventName}`,
      images: [
        {
          url: getImageUrl(ogImage),
          width: seoConfig.images.og.width,
          height: seoConfig.images.og.height,
          alt: event.eventName,
          type: 'image/jpeg',
        },
      ],
      siteName: seoConfig.site.name,
    },
    twitter: {
      cardType: seoConfig.twitter.cardType,
      handle: seoConfig.twitter.handle,
      site: seoConfig.twitter.site,
    },
    additionalMetaTags: [
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      ...(event.date
        ? [
            {
              name: 'event-date',
              content: event.date,
            },
          ]
        : []),
      ...(event.location
        ? [
            {
              name: 'event-location',
              content: event.location,
            },
          ]
        : []),
    ],
  };
}

/**
 * Share URL generator
 */
export function getShareUrls(event: EventSeoData) {
  const eventUrl = encodeURIComponent(getCanonical(`/e/${event.eventId}`));
  const title = encodeURIComponent(event.eventName);
  const description = encodeURIComponent(
    event.description || `Browse photos from ${event.eventName}`
  );

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${eventUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${eventUrl}&text=${title}`,
    whatsapp: `https://wa.me/?text=${title}%20${eventUrl}`,
    telegram: `https://t.me/share/url?url=${eventUrl}&text=${title}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${eventUrl}`,
    email: `mailto:?subject=${title}&body=${description}%20${eventUrl}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${eventUrl}&description=${description}`,
  };
}
