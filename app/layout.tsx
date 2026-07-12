import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AUTO_BUILDER OS',
  description: 'Enterprise Agent Command Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
