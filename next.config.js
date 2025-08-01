/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Enable React 18 features
    reactRoot: true,
    // Enable concurrent features
    concurrentFeatures: true,
    // Enable server components
    serverComponents: true,
    // Enable optimized loading
    optimizeImages: true,
    // Enable modern bundling
    esmExternals: true,
  },

  // Compiler optimizations
  compiler: {
    // Enable SWC minification (faster than Terser)
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable React optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    // Enable modern formats
    formats: ['image/webp', 'image/avif'],
    // Optimize images
    minimumCacheTTL: 60,
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for node_modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Common chunk for shared components
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
          // UI components chunk
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 15,
          },
          // Icons chunk (since you have many icon imports)
          icons: {
            test: /[\\/]node_modules[\\/](lucide-react|heroicons)[\\/]/,
            name: 'icons',
            chunks: 'all',
            priority: 20,
          },
          // Animation libraries
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|lottie-react)[\\/]/,
            name: 'animations',
            chunks: 'all',
            priority: 15,
          },
        },
      };
    }

    // Tree shaking optimizations
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;

    // Resolve optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      // Add path aliases to reduce bundle size
      '@components': path.resolve(__dirname, 'components'),
      '@utils': path.resolve(__dirname, 'utils'),
      '@hooks': path.resolve(__dirname, 'hooks'),
    };

    return config;
  },

  // Enable compression
  compress: true,

  // PoweredBy header removal
  poweredByHeader: false,

  // Generate etags for caching
  generateEtags: true,

  // Trailing slash handling
  trailingSlash: false,

  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // Output configuration
  output: 'standalone',

  // Optimize fonts
  optimizeFonts: true,

  // Enable modern JavaScript features
  swcMinify: true,

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Cache static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Performance headers
          {
            key: 'Link',
            value: '</css/app.css>; rel=preload; as=style',
          },
        ],
      },
    ];
  },

  // Redirects for performance
  async redirects() {
    return [
      // Add any necessary redirects here
    ];
  },

  // Rewrites for API optimization
  async rewrites() {
    return [
      // Add any necessary rewrites here
    ];
  },
};

const path = require('path');

module.exports = nextConfig;