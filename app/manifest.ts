import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Xtreme AI Builder',
    short_name: 'Xtreme AI',
    description: 'Governed AI website and application factory',
    start_url: '/factory',
    scope: '/',
    display: 'standalone',
    background_color: '#f8f9fb',
    theme_color: '#050505',
    icons: [
      {
        src: '/pwa-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/pwa-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
