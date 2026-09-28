import createNextIntlPlugin from 'next-intl/plugin';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: process.env.REPLIT_DEV_DOMAIN
    ? [process.env.REPLIT_DEV_DOMAIN]
    : [],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'vietnamparasports.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {
    root: resolve(__dirname, '../'),
  },
  async rewrites() {
    // The web and API servers run in the same deployment process. Use a
    // separate service hostname only when explicitly configured.
    const internalUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
    const backendUrl = new URL(internalUrl).origin;

    return [
      {
        source: '/uploads/public/:path*',
        destination: `${backendUrl}/uploads/public/:path*`,
      },
      {
        source: '/uploads/settings/:path*',
        destination: `${backendUrl}/uploads/settings/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

