import type { MetadataRoute } from 'next';

/**
 * Robots policy (audit D5.5).
 *
 * Kept in sync with /public/robots.txt. AI crawlers are allowed on the public
 * marketing pages — the previous policy blocked GPTBot, CCBot, anthropic-ai
 * and Claude-Web outright, which opted the site out of AI-assistant discovery.
 * Private areas stay disallowed for everyone.
 */

const PRIVATE_PATHS = [
  '/admin/',
  '/api/',
  '/auth/',
  '/dashboard/',
  '/claim/',
  '/promo/',
  '/success',
  '/private/',
  // NOTE: /e/ (guest galleries) is deliberately NOT disallowed here. Those URLs
  // are already listed in sitemap.xml and their Open Graph / Twitter cards are
  // what make a shared gallery link preview correctly. Blocking them would
  // break link previews. If you decide galleries should be out of search,
  // remove them from sitemap.ts and add '/e/' here at the same time.
];

const AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'anthropic-ai',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
];

export default function robots(): MetadataRoute.Robots {
  if (process.env.NODE_ENV !== 'production') {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      ...AI_AGENTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com'}/sitemap.xml`,
  };
}
