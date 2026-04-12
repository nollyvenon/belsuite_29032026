import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type-checking for Next.js frontend is run separately via `tsc --noEmit`.
  // API is served by Laravel (`apps/api`); Next rewrites `/api/*` to it.
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    // Strangler order: specific rules first, then catch-all to Laravel.
    const laravelApiUrl = process.env.LARAVEL_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${laravelApiUrl}/api/v1/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${laravelApiUrl}/api/v1/auth/:path*`,
      },
      {
        source: '/api/deals',
        destination: `${laravelApiUrl}/api/v1/crm/deals`,
      },
      {
        source: '/api/deals/:path*',
        destination: `${laravelApiUrl}/api/v1/crm/deals/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${laravelApiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
