import type { Metadata, Viewport } from 'next'
import { Figtree, Space_Grotesk } from 'next/font/google'
import { PwaUpdateToast } from '@/components/pwa-update-toast'
import { brand } from '@/lib/config/brand'
import './globals.css'

const sans = Figtree({
  subsets: ['latin'],
  variable: '--font-sans',
})

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
  // Paths omit basePath; Next.js prefixes `/goal` automatically.
  manifest: '/manifest.webmanifest',
  applicationName: brand.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: brand.name,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f6f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1715' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} font-sans`}>
        {children}
        <PwaUpdateToast />
      </body>
    </html>
  )
}
