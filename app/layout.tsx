// build-trigger: 2026-07-12T19:08:54.631551
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'XPS INTELLIGENCE',
    template: '%s | XPS INTELLIGENCE',
  },
  description: 'XPS Intelligence — AI-powered website launch system for National Epoxy Pros. Intake. Build. Validate. Ship.',
  keywords: ['xps intelligence', 'xps', 'website builder', 'enterprise dashboard', 'website factory', 'xtreme polishing systems', 'national epoxy pros'],
  generator: 'v0.app',
  metadataBase: new URL('https://autobuilderos.vercel.app'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'XPS Intelligence',
    startupImage: '/pwa-splash.png',
  },
  icons: {
    icon: [
      { url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/pwa-icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'dark',
  themeColor: '#080808',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{ background: '#080808' }} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ background: '#080808', color: '#ffffff' }} className="antialiased font-sans">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
