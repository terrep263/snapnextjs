/** @type {import('next-sitemap').IConfig} */

const config = {
  siteUrl: process.env.SITE_URL || 'https://snapworxx.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 50000,
  changefreq: 'daily',
  priority: 0.7,
  robotsTxtOptions: {
    sitemaps: [
      'https://snapworxx.com/sitemap.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/auth'],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
  },
  exclude: [
    '/404',
    '/500',
    '/admin',
    '/admin/*',
    '/api',
    '/api/*',
    '/auth',
    '/auth/*',
  ],
  // Dynamic routes can be added here
  additionalPaths: async (config) => {
    const paths = [];
    
    // Add home page
    paths.push({
      loc: 'https://snapworxx.com',
      changefreq: 'weekly',
      priority: 1,
    });

    // Add static pages
    const staticPages = [
      '/pricing',
      '/features',
      '/about',
      '/contact',
    ];

    staticPages.forEach((page) => {
      paths.push({
        loc: `https://snapworxx.com${page}`,
        changefreq: 'monthly',
        priority: 0.8,
      });
    });

    return paths;
  },
};

module.exports = config;
