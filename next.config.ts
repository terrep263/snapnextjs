import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Enable system TLS certificates for Turbopack to fetch Google Fonts
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
