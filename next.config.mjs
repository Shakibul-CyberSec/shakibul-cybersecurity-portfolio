/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization for strict CSP
  images: {
    domains: [],
    unoptimized: true, // Required for strict CSP
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Security headers (some will be overridden by middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), serial=(), hid=(), browsing-topics=()'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        ],
      },
    ];
  },
  
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Disable powered by header
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  
  // Compiler options for CSP and production optimization
  compiler: {
    // Remove React DevTools and properties in production
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? { 
      properties: ['^data-testid$'] 
    } : false,
  },
  
  // Empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig; 
