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
};

export default nextConfig;
