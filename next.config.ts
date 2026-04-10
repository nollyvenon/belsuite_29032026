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
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
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
