const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  // Auth-gated start URL redirects (login ↔ dashboard). Caching that HTML —
  // especially the default opaqueredirect→blank-200 start-url handler — is a
  // common cause of iOS home-screen icons opening a blank/error shell.
  cacheStartUrl: false,
  dynamicStartUrl: false,
  // Scope defaults to nextConfig.basePath (`/goal`).
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    // Override default NetworkFirst page/RSC caches: never serve a stale
    // document shell after deploys (mismatched `_next/static` chunks → blank).
    runtimeCaching: [
      {
        urlPattern: ({ request, url: { pathname }, sameOrigin }) =>
          sameOrigin &&
          request.headers.get('RSC') === '1' &&
          request.headers.get('Next-Router-Prefetch') === '1' &&
          !pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
        options: { cacheName: 'pages-rsc-prefetch' },
      },
      {
        urlPattern: ({ request, url: { pathname }, sameOrigin }) =>
          sameOrigin && request.headers.get('RSC') === '1' && !pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
        options: { cacheName: 'pages-rsc' },
      },
      {
        urlPattern: ({ url: { pathname }, sameOrigin }) =>
          sameOrigin && !pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
        options: { cacheName: 'pages' },
      },
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/goal',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/goal',
        permanent: false,
        basePath: false,
      },
      // Pre-basePath home-screen / bookmarks (best-effort; prefer reinstall).
      {
        source: '/dashboard',
        destination: '/goal/dashboard',
        permanent: false,
        basePath: false,
      },
      {
        source: '/auth/:path*',
        destination: '/goal/auth/:path*',
        permanent: false,
        basePath: false,
      },
      {
        source: '/onboarding',
        destination: '/goal/onboarding',
        permanent: false,
        basePath: false,
      },
    ]
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: '/goal',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = withPWA(nextConfig)
