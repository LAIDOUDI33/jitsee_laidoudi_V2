import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', '21.0.19.27'],

  // Strict mode disabled in dev for memory efficiency (enable in production)
  reactStrictMode: false,

  // Docker-compatible standalone output
  output: 'standalone',

  // Exclude Node.js built-ins from bundling (crypto is used for scrypt password hashing)
  serverExternalPackages: ['crypto'],

  // Limit server action body size
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Security headers applied to every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' wss: ws:",
              'frame-src https://meet.jit.si',
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
