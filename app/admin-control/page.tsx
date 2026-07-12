'use client'

import { useState } from 'react'
import {
  Shield, Activity, Bot, GitBranch, Database, Server, Globe,
  CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw,
  Zap, BarChart2, Eye, Flag, Users, FileText, Lock, Cpu,
  ChevronRight, Circle, ArrowUpRight, Wifi, WifiOff,
} from 'lucide-react'

type DashboardId =
  | 'executive' | 'operations' | 'callcenter' | 'ai-activity'
  | 'workflow-queue' | 'memory-status' | 'knowledge-index' | 'deployments'
  | 'github' | 'supabase' | 'workflow-health' | 'agent-status'
  | 'audit-logs' | 'approvals' | 'feature-flags'

interface Panel {
  id: DashboardId
  label: string
  icon: React.ElementType
  status: 'healthy' | 'warning' | 'critical' | 'offline'
  value: string
  sub: string
  color: string
}

const PANELS: Panel[] = [
  { id: 'executive',       label: 'Executive',        icon: Users,      status: 'healthy',  value: '7 active',  sub: '3 pending approvals', color: 'rgba(255,255,255,0.90)' },
  { id: 'operations',      label: 'Operations',       icon: Zap,        status: 'healthy',  value: '12 queued', sub: '94% success rate',    color: '#22c55e' },
  { id: 'callcenter',      label: 'Call Center',      icon: Activity,   status: 'warning',  value: 'Beta',      sub: 'Twilio not configured',color: '#fb923c' },
  { id: 'ai-activity',     label: 'AI Activity',      icon: Bot,        status: 'healthy',  value: '4 runs',    sub: 'Last: 18 min ago',    color: '#a78bfa' },
  { id: 'workflow-queue',  label: 'Workflow Queue',   icon: GitBranch,  status: 'healthy',  value: '2 running', sub: '0 failed today',      color: '#3b82f6' },
  { id: 'memory-status',   label: 'Memory Status',    icon: Cpu,        status: 'healthy',  value: '445 entries',sub: '353k tokens',         color: '#fb923c' },
  { id: 'knowledge-index', label: 'Knowledge Index',  icon: Database,   status: 'warning',  value: '11/12 ok', sub: '1 stale doc',          color: '#3b82f6' },
  { id: 'deployments',     label: 'Deployments',      icon: Globe,      status: 'healthy',  value: '37 routes', sub: 'Vercel prod live',     color: '#22c55e' },
  { id: 'github',          label: 'GitHub',           icon: GitBranch,  status: 'healthy',  value: '4 commits', sub: 'fix-deployment-error', color: '#f0f0f0' },
  { id: 'supabase',        label: 'Supabase',         icon: Database,   status: 'healthy',  value: '12 tables', sub: 'RLS enabled all',      color: '#22c55e' },
  { id: 'workflow-health', label: 'Workflow Health',  icon: Activity,   status: 'healthy',  value: '4 crons',   sub: 'All on schedule',      color: 'rgba(255,255,255,0.90)' },
  { id: 'agent-status',    label: 'Agent Status',     icon: Bot,        status: 'healthy',  value: '9 agents',  sub: '1 running now',        color: '#a78bfa' },
  { id: 'audit-logs',      label: 'Audit Logs',       icon: FileText,   status: 'healthy',  value: '1,842',     sub: '12 events today',      color: 'rgba(255,255,255,0.90)' },
  { id: 'approvals',       label: 'Approvals',        icon: Shield,     status: 'warning',  value: '3 pending', sub: 'Oldest: 2h ago',       color: '#fb923c' },
  { id: 'feature-flags',   label: 'Feature Flags',    icon: Flag,       status: 'healthy',  value: '8 flags',   sub: '3 enabled in prod',    color: '#3b82f6' },
]

const STATUS_ICON: Record<Panel['status'], { icon: React.ElementType; color: string }> = {
  healthy:  { icon: CheckCircle2,  color: '#22c55e' },
  warning:  { icon: AlertTriangle, color: '#fb923c' },
  critical: { icon: XCircle,       color: '#ef4444' },
  offline:  { icon: WifiOff,       color: 'rgba(255,255,255,0.25)' },
}

interface AuditEvent {
  id: string
  actor: string
  action: string
  resource: string
  result: 'success' | 'blocked' | 'pending'
  ts: string
}

const AUDIT_EVENTS: AuditEvent[] = [
  { id: 'a1', actor: 'XPS Voice AI',   action: 'Queried project status',      resource: 'project:miami-commercial', result: 'success', ts: '2 min ago'  },
  { id: 'a2', actor: 'Base44 Agent',   action: 'Triggered brand pack build',  resource: 'project:tampa-garage',     result: 'pending', ts: '18 min ago' },
  { id: 'a3', actor: 'Cron Heartbeat', action: 'Health check completed',      resource: 'system:cron',              result: 'success', ts: '22 min ago' },
  { id: 'a4', actor: 'Base44 Agent',   action: 'Attempted: delete old files', resource: 'drive:folder-2024',        result: 'blocked', ts: '1h ago'     },
  { id: 'a5', actor: 'XPS Voice AI',   action: 'Updated customer memory',     resource: 'memory:customer:m3',       result: 'success', ts: '2h ago'     },
  { id: 'a6', actor: 'Cron Validation', action: 'Validation sweep completed',  resource: 'system:validation',        result: 'success', ts: '4h ago'     },
]

const APPROVALS = [
  { id: 'ap1', title: 'Brand Pack Deployment — Tampa',   requestor: 'Base44 Agent',  age: '2h ago',   risk: 'low',  action: 'Deploy brand assets to production' },
  { id: 'ap2', title: 'Pricing Update — Metallic Q3',    requestor: 'Operations AI', age: '6h ago',   risk: 'medium', action: 'Update pricing matrix across all proposals' },
  { id: 'ap3', title: 'Drive Folder Cleanup — 2024',     requestor: 'Base44 Agent',  age: '2d ago',   risk: 'high', action: 'Permanently delete archived project folders' },
]

const CRON_JOBS = [
  { name: 'Heartbeat',    schedule: '*/5 * * * *',   lastRun: '3 min ago',  nextRun: '2 min',   status: 'healthy' },
  { name: 'Daily Brief',  schedule: '0 8 * * *',     lastRun: '16h ago',    nextRun: '8h',      status: 'healthy' },
  { name: 'Validation',   schedule: '0 */4 * * *',   lastRun: '2h ago',     nextRun: '2h',      status: 'healthy' },
  { name: 'Readiness',    schedule: '*/30 * * * *',  lastRun: '14 min ago', nextRun: '16 min',  status: 'healthy' },
]

export default function AdminControlPage() {
  const [active, setActive] = useState<DashboardId>('audit-logs')
  const panel = PANELS.find(p => p.id === active)

  const healthyCount = PANELS.filter(p => p.status === 'healthy').length
  const warningCount = PANELS.filter(p => p.status === 'warning').length

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(245,197,24,0.1)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: 'rgba(255,255,255,0.90)' }}>XPS Intelligence — Control</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Admin Control Plane</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              15-dashboard monitoring and governance hub
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px]" style={{ color: '#22c55e' }}>
              <CheckCircle2 size={14} />
              {healthyCount} healthy
            </div>
            <div className="flex items-center gap-2 text-[13px]" style={{ color: '#fb923c' }}>
              <AlertTriangle size={14} />
              {warningCount} warning
            </div>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 grid grid-cols-[260px_1fr] gap-6">
        {/* Panel selector grid */}
        <div className="space-y-5">
          {[
            { title: 'Modules',       ids: ['executive', 'operations', 'callcenter'] as DashboardId[] },
            { title: 'AI Systems',    ids: ['ai-activity', 'agent-status', 'memory-status', 'knowledge-index'] as DashboardId[] },
            { title: 'Infrastructure',ids: ['deployments', 'github', 'supabase', 'workflow-health', 'workflow-queue'] as DashboardId[] },
            { title: 'Governance',    ids: ['audit-logs', 'approvals', 'feature-flags'] as DashboardId[] },
          ].map(group => (
            <div key={group.title}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] px-1 mb-1.5" style={{ color: 'rgba(245,197,24,0.4)' }}>
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.ids.map(id => {
                  const p = PANELS.find(x => x.id === id)!
                  const si = STATUS_ICON[p.status]
                  return (
                    <button
                      key={id}
                      onClick={() => setActive(id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                      style={
                        active === id
                          ? { background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(59,130,246,0.28)' }
                          : { background: 'transparent', border: '1px solid transparent' }
                      }
                    >
                      <p.icon size={13} style={{ color: active === id ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                      <span className="text-[12px] flex-1 truncate" style={{ color: active === id ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                        {p.label}
                      </span>
                      <si.icon size={10} style={{ color: si.color, flexShrink: 0 }} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Main content area */}
        <div className="space-y-5">
          {/* Panel header */}
          {panel && (
            <div
              className="rounded-2xl p-5 flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${panel.color}18` }}>
                  <panel.icon size={22} style={{ color: panel.color }} />
                </div>
                <div>
                  <p className="text-[16px] font-bold text-white">{panel.label}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{panel.sub}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[22px] font-bold text-white">{panel.value}</p>
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  {(() => { const si = STATUS_ICON[panel.status]; return <si.icon size={12} style={{ color: si.color }} /> })()}
                  <span className="text-[11px] capitalize" style={{ color: STATUS_ICON[panel.status].color }}>{panel.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Audit logs */}
          {active === 'audit-logs' && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Recent Audit Events
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {AUDIT_EVENTS.map(evt => (
                  <div key={evt.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: evt.result === 'success' ? 'rgba(34,197,94,0.12)' : evt.result === 'blocked' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      {evt.result === 'success'
                        ? <CheckCircle2 size={13} style={{ color: '#22c55e' }} />
                        : evt.result === 'blocked'
                        ? <Lock size={13} style={{ color: '#ef4444' }} />
                        : <Clock size={13} style={{ color: 'rgba(255,255,255,0.90)' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>{evt.actor}</span>
                        <ChevronRight size={10} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        <span className="text-[12px] text-white">{evt.action}</span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{evt.resource}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={
                          evt.result === 'success'
                            ? { background: 'rgba(34,197,94,0.1)',  color: '#22c55e' }
                            : evt.result === 'blocked'
                            ? { background: 'rgba(239,68,68,0.1)',  color: '#ef4444' }
                            : { background: 'rgba(245,197,24,0.1)', color: 'rgba(255,255,255,0.90)' }
                        }
                      >
                        {evt.result}
                      </span>
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{evt.ts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approvals */}
          {active === 'approvals' && (
            <div className="space-y-3">
              {APPROVALS.map(ap => (
                <div
                  key={ap.id}
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[14px] font-bold text-white">{ap.title}</p>
                      <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Requested by {ap.requestor} · {ap.age}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                      style={
                        ap.risk === 'low'    ? { background: 'rgba(34,197,94,0.12)',   color: '#22c55e' }
                        : ap.risk === 'medium' ? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.90)' }
                        :                        { background: 'rgba(239,68,68,0.12)',   color: '#ef4444' }
                      }
                    >
                      {ap.risk} risk
                    </span>
                  </div>
                  <p className="text-[12px] mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)' }}>
                    {ap.action}
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2 rounded-xl text-[12px] font-bold"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                      Approve
                    </button>
                    <button
                      className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      Reject
                    </button>
                    <button
                      className="px-4 py-2 rounded-xl text-[12px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cron health */}
          {active === 'workflow-health' && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Cron Jobs — Vercel
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {CRON_JOBS.map(job => (
                  <div key={job.name} className="flex items-center gap-4 px-5 py-4">
                    <CheckCircle2 size={15} style={{ color: '#22c55e' }} />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-white">{job.name}</p>
                      <p className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{job.schedule}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Last: {job.lastRun}</p>
                      <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.90)' }}>Next: {job.nextRun}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default — show module overview for other panels */}
          {!['audit-logs', 'approvals', 'workflow-health'].includes(active) && (
            <div
              className="rounded-2xl p-6 grid grid-cols-3 gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {PANELS.map(p => {
                const si = STATUS_ICON[p.status]
                return (
                  <button
                    key={p.id}
                    onClick={() => setActive(p.id)}
                    className="flex items-start gap-3 p-3.5 rounded-xl text-left transition-all"
                    style={{
                      background: active === p.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active === p.id ? 'rgba(59,130,246,0.20)' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${p.color}18` }}>
                      <p.icon size={14} style={{ color: p.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-semibold text-white truncate">{p.label}</span>
                        <si.icon size={9} style={{ color: si.color }} />
                      </div>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.value}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
