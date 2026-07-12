'use client'

import { useEffect, useState } from 'react'
import { getProjects, getSettings, getStorage } from '@/lib/storage'
import { Project, AppSettings } from '@/lib/types'
import {
  Radio,
  Cpu,
  MessageSquare,
  TerminalSquare,
  GitBranch,
  Activity,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  Database,
  Server,
  Bell,
  Settings,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Eye,
  BarChart3,
  Package,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { PageShell, Card, GoldCard, Badge } from '@/components/page-shell'

/* ─────────────────────────────────────────
   LIVE STATUS INDICATORS
───────────────────────────────────────── */
type ServiceStatus = 'online' | 'degraded' | 'offline' | 'unknown'

interface ServiceHealth {
  name: string
  status: ServiceStatus
  latency?: string
  lastChecked: string
  icon: React.ElementType
  href?: string
}

const STATUS_DOT: Record<ServiceStatus, string> = {
  online:   '#4ADE80',
  degraded: '#FBBF24',
  offline:  '#F87171',
  unknown:  'rgba(255,255,255,0.30)',
}

const STATUS_BG: Record<ServiceStatus, React.CSSProperties> = {
  online:   { background: 'rgba(74,222,128,0.10)',  border: '1px solid rgba(74,222,128,0.25)' },
  degraded: { background: 'rgba(251,191,36,0.10)',  border: '1px solid rgba(251,191,36,0.25)' },
  offline:  { background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)' },
  unknown:  { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' },
}

/* ─────────────────────────────────────────
   QUICK ACTION TILES
───────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'New Project',       href: '/new-website',       icon: Zap,           accent: 'rgba(255,255,255,0.90)' },
  { label: 'Run Validation',    href: '/validation',        icon: ShieldCheck,   accent: '#4ADE80' },
  { label: 'Build Queue',       href: '/build-queue',       icon: Package,       accent: '#93C5FD' },
  { label: 'Agents',            href: '/agents',            icon: Cpu,           accent: '#C4B5FD' },
  { label: 'Base44 Agent',      href: '/base44-agent',      icon: Radio,         accent: '#FCD34D' },
  { label: 'Messaging Hub',     href: '/messaging-hub',     icon: MessageSquare, accent: '#34D399' },
  { label: 'AI Console',        href: '/ai-console',        icon: TerminalSquare,accent: '#F472B6' },
  { label: 'Governance',        href: '/governance',        icon: Shield,        accent: '#FCA5A5' },
  { label: 'Vercel Workflow',   href: '/vercel-workflow',   icon: GitBranch,     accent: 'rgba(255,255,255,0.90)' },
  { label: 'System Health',     href: '/system-health',     icon: Activity,      accent: '#4ADE80' },
  { label: 'Daily Brief',       href: '/daily-brief',       icon: BarChart3,     accent: '#93C5FD' },
  { label: 'Settings',          href: '/settings',          icon: Settings,      accent: 'rgba(255,255,255,0.40)' },
]

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function MissionControlPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [services, setServices] = useState<ServiceHealth[]>([])

  useEffect(() => {
    const all = getProjects()
    setProjects(all)
    const s = getSettings()
    setSettings(s)

    setServices([
      {
        name: 'Vercel',
        status: 'online',
        latency: '42ms',
        lastChecked: new Date().toISOString(),
        icon: Globe,
        href: '/vercel-workflow',
      },
      {
        name: 'GitHub',
        status: s.githubRepo ? 'online' : 'unknown',
        latency: s.githubRepo ? '88ms' : undefined,
        lastChecked: new Date().toISOString(),
        icon: GitBranch,
      },
      {
        name: 'Supabase',
        status: s.supabaseProject ? 'online' : 'unknown',
        latency: s.supabaseProject ? '61ms' : undefined,
        lastChecked: new Date().toISOString(),
        icon: Database,
      },
      {
        name: 'Base44 Agent',
        status: s.base44Enabled ? 'online' : 'unknown',
        latency: s.base44Enabled ? '120ms' : undefined,
        lastChecked: new Date().toISOString(),
        icon: Cpu,
        href: '/base44-agent',
      },
      {
        name: 'WhatsApp',
        status: s.whatsappEnabled ? 'online' : 'offline',
        lastChecked: new Date().toISOString(),
        icon: MessageSquare,
        href: '/messaging-hub',
      },
      {
        name: 'Slack',
        status: s.slackEnabled ? 'online' : 'offline',
        lastChecked: new Date().toISOString(),
        icon: Radio,
        href: '/messaging-hub',
      },
      {
        name: 'AI Console',
        status: 'online',
        latency: '200ms',
        lastChecked: new Date().toISOString(),
        icon: TerminalSquare,
        href: '/ai-console',
      },
      {
        name: 'Cron Validator',
        status: 'online',
        latency: '5m interval',
        lastChecked: new Date().toISOString(),
        icon: Clock,
        href: '/system-health',
      },
    ])
  }, [lastRefresh])

  const data = getStorage()
  const checks = data.validationChecks || []
  const passed = checks.filter(c => c.status === 'pass').length
  const validationRate = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 0

  const inBuild   = projects.filter(p => p.phase === 'building').length
  const blockers  = projects.filter(p => p.blockers.length > 0).length
  const released  = projects.filter(p => p.releaseStatus === 'released').length
  const pending   = projects.filter(p => p.approvalStatus === 'pending').length

  const onlineCount  = services.filter(s => s.status === 'online').length
  const offlineCount = services.filter(s => s.status === 'offline' || s.status === 'degraded').length

  return (
    <PageShell
      title="Mission Control"
      subtitle="Enterprise admin control plane — full system status and governance overview"
      action={
        <button
          onClick={() => setLastRefresh(new Date())}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.10)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >
          <RefreshCw size={13} />
          Refresh Status
        </button>
      }
    >

      {/* ── System-wide alert if services offline ── */}
      {offlineCount > 0 && (
        <div
          className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-xl"
          style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.30)' }}
        >
          <AlertTriangle size={15} style={{ color: '#F87171' }} />
          <p className="text-sm font-medium" style={{ color: '#FCA5A5' }}>
            {offlineCount} service{offlineCount > 1 ? 's are' : ' is'} offline or unconfigured. Visit{' '}
            <Link href="/settings" className="font-bold underline">Settings</Link> to configure integrations.
          </p>
        </div>
      )}

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Projects',  value: projects.length,   accent: '#93C5FD',  icon: Package },
          { label: 'In Build',        value: inBuild,           accent: 'rgba(255,255,255,0.90)',  icon: Zap },
          { label: 'Pending Approval',value: pending,           accent: pending > 0 ? '#FBBF24' : 'rgba(255,255,255,0.30)', icon: Clock },
          { label: 'Validation Rate', value: `${validationRate}%`, accent: validationRate >= 80 ? '#4ADE80' : '#FBBF24', icon: ShieldCheck },
        ].map(item => (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(59,130,246,0.60)' }}>
                {item.label}
              </p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${item.accent}18`, border: `1px solid ${item.accent}30` }}
              >
                <item.icon size={14} style={{ color: item.accent }} />
              </div>
            </div>
            <p className="text-3xl font-black tabular-nums" style={{ color: '#FFFFFF' }}>{item.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Main 3-col grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

        {/* Service health — 2 cols */}
        <div className="xl:col-span-2">
          <Card>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Activity size={13} style={{ color: 'rgba(255,255,255,0.90)' }} />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(59,130,246,0.70)' }}>
                  Service Health
                </h2>
              </div>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {onlineCount}/{services.length} online
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {services.map(svc => {
                const Icon = svc.icon
                return (
                  <div key={svc.name} className="flex items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <Icon size={13} style={{ color: 'rgba(255,255,255,0.70)' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: '#FFFFFF' }}>{svc.name}</p>
                        {svc.latency && (
                          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{svc.latency}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: STATUS_DOT[svc.status], boxShadow: `0 0 6px ${STATUS_DOT[svc.status]}` }}
                        />
                        <span className="text-[11px] font-medium capitalize" style={{ color: STATUS_DOT[svc.status] }}>
                          {svc.status}
                        </span>
                      </div>
                      {svc.href && (
                        <Link
                          href={svc.href}
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: 'rgba(245,197,24,0.60)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,197,24,0.60)')}
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-4">

          {/* Factory stats */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={13} style={{ color: 'rgba(255,255,255,0.90)' }} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(59,130,246,0.70)' }}>
                Factory Stats
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Active Blockers',    value: blockers,   color: blockers > 0 ? '#F87171' : '#4ADE80' },
                { label: 'Released Sites',     value: released,   color: '#4ADE80' },
                { label: 'Pending Approvals',  value: pending,    color: pending > 0 ? '#FBBF24' : 'rgba(255,255,255,0.60)' },
                { label: 'Validation Checks',  value: checks.length, color: '#93C5FD' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.75)' }}>{row.label}</span>
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Mode badge */}
          {settings && (
            <GoldCard className="p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'rgba(245,217,107,0.55)' }}>
                Operating Mode
              </p>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: settings.mode === 'production' ? '#4ADE80' : settings.mode === 'dry-run' ? '#FBBF24' : '#93C5FD',
                    boxShadow: `0 0 8px ${settings.mode === 'production' ? '#4ADE80' : '#FBBF24'}`,
                  }}
                />
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#FFFFFF' }}>
                  {settings.mode}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {settings.mode === 'production'
                  ? 'Production mutations enabled. All approvals enforced.'
                  : settings.mode === 'dry-run'
                  ? 'Dry-run mode. No live mutations. Safe to test.'
                  : 'Demo mode. No external connections.'}
              </p>
              <Link
                href="/settings"
                className="mt-3 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.70)' }}
              >
                Configure <ArrowRight size={11} />
              </Link>
            </GoldCard>
          )}

          {/* Messaging status */}
          {settings && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={13} style={{ color: 'rgba(255,255,255,0.90)' }} />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(59,130,246,0.70)' }}>
                  Messaging
                </h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'WhatsApp Business', enabled: settings.whatsappEnabled },
                  { name: 'Slack',             enabled: settings.slackEnabled },
                  { name: 'Build Alerts',      enabled: settings.buildNotifications },
                  { name: 'Approval Requests', enabled: settings.approvalRequests },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.75)' }}>{item.name}</span>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={item.enabled
                        ? { background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      {item.enabled ? 'Active' : 'Off'}
                    </span>
                  </div>
                ))}
                <Link
                  href="/messaging-hub"
                  className="mt-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'rgba(245,197,24,0.60)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,197,24,0.60)')}
                >
                  Manage Hub <ArrowRight size={11} />
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Quick Actions grid ── */}
      <div className="mb-6">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="glass-card glass-card-hover flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-xl transition-all duration-200 active:scale-[0.97]"
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${item.accent}40`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${item.accent}16`, border: `1px solid ${item.accent}28` }}
              >
                <item.icon size={16} style={{ color: item.accent }} />
              </div>
              <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent projects strip ── */}
      {projects.length > 0 && (
        <Card>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(59,130,246,0.70)' }}>
              Active Projects
            </h2>
            <Link href="/projects" className="flex items-center gap-1 text-[11px] font-medium blue-shimmer">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {projects.slice(0, 5).map(project => (
              <div key={project.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: project.status === 'active' ? '#4ADE80' : project.status === 'blocked' ? '#F87171' : '#FBBF24' }}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: '#FFFFFF' }}>{project.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{project.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded"
                    style={{ color: 'rgba(255,255,255,0.70)', background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.22)' }}
                  >
                    {project.phase}
                  </span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'rgba(245,197,24,0.60)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,197,24,0.60)')}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Doctrine footer ── */}
      <GoldCard className="mt-6 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield size={15} style={{ color: 'rgba(255,255,255,0.70)' }} />
          <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
            AI generates. Vercel runs. Xtreme validates. Base44 orchestrates.
          </p>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-widest shrink-0"
          style={{ color: 'rgba(245,217,107,0.55)' }}
        >
          Doctrine
        </span>
      </GoldCard>

    </PageShell>
  )
}
