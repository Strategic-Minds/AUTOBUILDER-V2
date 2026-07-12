import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Paths that never require authentication
const PUBLIC_PATHS = new Set(['/', '/auth/error'])
const PUBLIC_PREFIXES = ['/auth/', '/_next/', '/favicon', '/api/cron/', '/api/gpt-bridge', '/api/base44-agent']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not put any code between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some(p => pathname.startsWith(p))

  if (!isPublic && !user) {
    // API routes get a 401 JSON response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Browser routes get redirected to login
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
