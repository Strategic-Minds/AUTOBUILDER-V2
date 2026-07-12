/**
 * requireAuth — call at the top of every API route handler.
 * Returns the authenticated user or throws a 401 Response.
 * Middleware already blocks unauthenticated requests, but this
 * provides a second layer of defence and gives typed user access.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}

/**
 * requireCronSecret — validates the CRON_SECRET header on cron routes.
 * Prevents public triggering of cron jobs.
 */
export function requireCronSecret(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  const expected = process.env.CRON_SECRET
  if (!expected || secret !== expected) {
    throw NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
