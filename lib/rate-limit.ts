import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter stub (sliding/fixed window basic logic)
const ipMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(req: NextRequest, limit = 60, windowMs = 60000): { success: boolean; limit: number; remaining: number; reset: number } {
  const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1'
  const now = Date.now()
  const record = ipMap.get(ip)

  if (!record || now > record.resetAt) {
    const newRecord = { count: 1, resetAt: now + windowMs }
    ipMap.set(ip, newRecord)
    return { success: true, limit, remaining: limit - 1, reset: newRecord.resetAt }
  }

  record.count++
  const remaining = Math.max(0, limit - record.count)
  
  if (record.count > limit) {
    return { success: false, limit, remaining: 0, reset: record.resetAt }
  }

  return { success: true, limit, remaining, reset: record.resetAt }
}

export function handleRateLimitResponse(limitRes: { limit: number; remaining: number; reset: number }) {
  return new Response(JSON.stringify({
    ok: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded'
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': String(limitRes.limit),
      'X-RateLimit-Remaining': String(limitRes.remaining),
      'X-RateLimit-Reset': String(Math.ceil(limitRes.reset / 1000))
    }
  })
}
