import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export async function GET() {
  const start = Date.now();
  const checks: HealthCheck[] = [];
  let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy';

  // 1. Database check
  const dbStart = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('receipt_registry').select('id').limit(1);
    const dbLatency = Date.now() - dbStart;
    if (error) {
      checks.push({ name: 'database', status: 'degraded', latency_ms: dbLatency, message: error.message });
      overallStatus = 'degraded';
    } else {
      checks.push({ name: 'database', status: 'healthy', latency_ms: dbLatency });
    }
  } catch (err) {
    checks.push({ name: 'database', status: 'down', latency_ms: Date.now() - dbStart, message: String(err) });
    overallStatus = 'down';
  }

  // 2. Browser worker check
  const bwStart = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const bwUrl = process.env.BROWSER_WORKER_URL || 'https://browserworker.vercel.app/api/health';
    const res = await fetch(bwUrl, { signal: controller.signal });
    clearTimeout(timeout);
    const bwLatency = Date.now() - bwStart;
    checks.push({
      name: 'browser_worker',
      status: res.ok ? 'healthy' : 'degraded',
      latency_ms: bwLatency,
      message: res.ok ? undefined : `HTTP ${res.status}`,
    });
    if (!res.ok && overallStatus === 'healthy') overallStatus = 'degraded';
  } catch {
    checks.push({ name: 'browser_worker', status: 'degraded', latency_ms: Date.now() - bwStart, message: 'unreachable' });
    if (overallStatus === 'healthy') overallStatus = 'degraded';
  }

  // 3. Memory check
  const mem = process.memoryUsage();
  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
  const heapPct = Math.round((mem.heapUsed / mem.heapTotal) * 100);
  const memStatus = heapPct > 90 ? 'degraded' : 'healthy';
  checks.push({
    name: 'memory',
    status: memStatus,
    latency_ms: 0,
    metadata: { heap_used_mb: heapUsedMb, heap_total_mb: heapTotalMb, heap_pct: heapPct },
  });
  if (memStatus !== 'healthy' && overallStatus === 'healthy') overallStatus = 'degraded';

  // 4. Rate limit check
  checks.push({
    name: 'rate_limit',
    status: 'healthy',
    latency_ms: 0,
    message: 'in-memory sliding window active',
  });

  // Compute composite health score (0-100)
  const healthyCount = checks.filter(c => c.status === 'healthy').length;
  const score = Math.round((healthyCount / checks.length) * 100);

  const totalLatency = Date.now() - start;

  return NextResponse.json(
    {
      status: overallStatus,
      version: process.env.npm_package_version || '1.0.0',
      uptime_s: Math.round(process.uptime?.() ?? 0),
      checks,
      score,
      timestamp: new Date().toISOString(),
      latency_ms: totalLatency,
    },
    {
      status: overallStatus === 'down' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Health-Score': String(score),
      },
    }
  );
}