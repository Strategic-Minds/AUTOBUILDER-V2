import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AUTO_BUILDER OS',
    short_name: 'AUTO_BUILDER',
    description: 'Enterprise agent command dashboard',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    icons: []
  }
}
