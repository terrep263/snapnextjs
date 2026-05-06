import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  if (process.env.NODE_ENV !== 'production') {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com'}/sitemap.xml`,
  };
}
