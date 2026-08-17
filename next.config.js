/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'sharedfrom.snapworxx.com',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  /**
   * HeyCatch short links. Single-character paths (/a-/z, /0-/9) are reserved
   * for campaign attribution and redirect to the homepage carrying the code as
   * a utm_campaign. Matches one segment only, so /e/<slug> galleries are
   * unaffected — the app has no bare single-character routes.
   */
  async redirects() {
    return [
      {
        source: '/:l([a-z0-9])',
        destination: '/?utm_source=heycatch&utm_campaign=:l',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
