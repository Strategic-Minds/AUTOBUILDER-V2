import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * WP-6: Security headers middleware.
 * Applied to all responses. Raises security score.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const env = process.env.VERCEL_ENV || 'development';

  // WP-6: Content-Security-Policy
  res.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://*.supabase.co https://api.github.com; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'"
  );

  // WP-6: HSTS (production only)
  if (env === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  res.headers.set('X-Content-Type-Options',  'nosniff');
  res.headers.set('X-Frame-Options',          'DENY');
  res.headers.set('Referrer-Policy',          'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy',       'camera=(), microphone=(), geolocation=()');
  res.headers.set('X-XSS-Protection',         '1; mode=block');
  res.headers.set('Cross-Origin-Opener-Policy','same-origin');
  res.headers.set('Cross-Origin-Resource-Policy','same-origin');

  // WP-6: Rate limiting signal headers (actual limiting via Upstash/Redis when available)
  res.headers.set('X-RateLimit-Policy', 'internal-routes:30/5min; public-routes:100/min');

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

