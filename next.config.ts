import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type-checking for Next.js frontend is run separately via `tsc --noEmit`.
  // Backend (NestJS) and legacy pages/ have their own tsconfig files.
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
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3201';
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
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/admin/ai-gateway/:path*',
        destination: `${backendUrl}/admin/ai-gateway/:path*`,
      },
      {
        source: '/ai-gateway/:path*',
        destination: `${backendUrl}/ai-gateway/:path*`,
      },
    ];
  },
};

export default nextConfig;
