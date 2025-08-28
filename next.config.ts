import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Essential configuration for Vercel Hobby plan
  serverExternalPackages: ['@prisma/client'],

  // Ensure proper transpilation of packages
  transpilePackages: ['lucide-react'],

  // Images configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
