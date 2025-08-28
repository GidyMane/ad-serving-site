import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Ensure proper transpilation
  transpilePackages: ['lucide-react'],
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Optimize images for better performance
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Environment variable handling
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Webpack configuration for better builds
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        default: false,
        vendors: false,
        // Bundle recharts separately due to size
        recharts: {
          name: 'recharts',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]recharts[\\/]/,
          priority: 10,
          reuseExistingChunk: true,
        },
        // Bundle lucide icons separately
        lucide: {
          name: 'lucide',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
          priority: 10,
          reuseExistingChunk: true,
        },
      };
    }
    
    return config;
  },
  
  // Headers for better security and performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'kinde-auth',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
