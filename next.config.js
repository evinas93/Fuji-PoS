/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  
  // TypeScript and ESLint
  typescript: {
    // During development, we'll allow builds with TS errors
    // In production, this should be set to false
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // During development, we'll allow builds with linting errors
    // In production, this should be set to false
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      // Add your Supabase storage domain here
      // 'your-project.supabase.co',
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Enable server actions for form handling
    serverActions: true,
    // Optimize package imports
    optimizePackageImports: ['@supabase/supabase-js', 'date-fns', 'recharts'],
  },

  // Output configuration
  output: 'standalone',

  // Environment variables to be exposed to the client
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },
};

module.exports = nextConfig;