'use client'

import Link from 'next/link'
import { getSettings } from '@/lib/storage'
import { CheckCircle, AlertCircle, AlertTriangle, Settings } from 'lucide-react'
import { PageShell, Card, GoldCard, Badge, GoldButton } from '@/components/page-shell'

export default function SystemHealthPage() {
  const settings = getSettings()

  const checks = [
    { name: 'Database Mode',         status: 'localStorage', description: 'Using browser localStorage', ok: true },
    { name: 'Authentication',         status: settings.notificationEmail ? 'configured' : 'not-configured', description: settings.notificationEmail ? 'Auth ready' : 'Auth not configured', ok: true },
    { name: 'GitHub Integration',     status: settings.githubRepo ? 'configured' : 'not-configured', description: settings.githubRepo ? `Repository: ${settings.githubRepo}` : 'Not configured', ok: !!settings.githubRepo },
    { name: 'Vercel Integration',     status: settings.vercelProject ? 'configured' : 'not-configured', description: settings.vercelProject ? `Project: ${settings.vercelProject}` : 'Not configured', ok: !!settings.vercelProject },
    { name: 'Supabase Integration',   status: settings.supabaseProject ? 'configured' : 'not-configured', description: settings.supabaseProject ? `Project: ${settings.supabaseProject}` : 'Not configured', ok: !!settings.supabaseProject },
    { name: 'AI Gateway',             status: settings.aiGatewayModel ? 'configured' : 'not-configured', description: settings.aiGatewayModel ? `Model: ${settings.aiGatewayModel}` : 'Not configured', ok: !!settings.aiGatewayModel },
    { name: 'Email Notifications',    status: settings.notificationEmail ? 'configured' : 'not-configured', description: settings.notificationEmail ? `Email: ${settings.notificationEmail}` : 'Not configured', ok: !!settings.notificationEmail },
    { name: 'Cron Heartbeat',         status: settings.cronEndpoint ? 'configured' : 'not-configured', description: settings.cronEndpoint ? 'Cron endpoint configured' : 'Not configured', ok: !!settings.cronEndpoint },
  ]

  const healthyCount = checks.filter(c => c.ok).length
  const pct = Math.round((healthyCount / checks.length) * 100)

  return (
    <PageShell title="System Health" subtitle="System status and integration configuration">
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Overall Health</p>
            <p className="text-5xl font-black text-foreground">{pct}%</p>
            <p className="text-sm text-muted-foreground mt-1">{healthyCount} of {checks.length} systems ready</p>
          </div>
          <div className="w-40">
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,rgba(255,255,255,0.55),rgba(255,255,255,0.70),rgba(255,255,255,0.90))' }}
              />
            </div>
          </div>
        </div>
      </Card>

      <GoldCard className="p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.70)" }} />
          <div>
            <p className="font-semibold text-sm blue-shimmer">Demo Mode Active</p>
            <p className="text-sm mt-0.5 text-muted-foreground">
              Running in localStorage mode. To connect real services, configure integration credentials in Settings.
            </p>
          </div>
        </div>
      </GoldCard>

      <div className="space-y-2.5 mb-6">
        {checks.map((check, i) => (
          <Card key={i} className="p-4 flex items-center gap-4">
            {check.ok
              ? <CheckCircle size={18} style={{ color: '#4ADE80' }} className="shrink-0" />
              : <AlertCircle size={18} style={{ color: '#FCD34D' }} className="shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">{check.name}</p>
              <p className="text-xs text-muted-foreground">{check.description}</p>
            </div>
            <Badge color={check.ok ? 'green' : 'gold'}>{check.status}</Badge>
          </Card>
        ))}
      </div>

      <Card className="p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground">Configure Integrations</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Add credentials in Settings to enable real integrations</p>
        </div>
        <Link href="/settings">
          <GoldButton><Settings size={14} /> Go to Settings</GoldButton>
        </Link>
      </Card>
    </PageShell>
  )
}
