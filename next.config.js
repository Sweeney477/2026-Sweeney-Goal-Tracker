const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  workboxOptions: {
    skipWaiting: true,
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
