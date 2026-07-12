'use client'

import { useEffect, useState } from 'react'
import { getProjects, getSettings } from '@/lib/storage'
import { Project, AppSettings, Base44Agent, Base44Run } from '@/lib/types'
import {
  Cpu,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Shield,
  GitBranch,
  FileText,
  Globe,
  BarChart3,
  Package,
  Search,
  Users,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { PageShell, Card, GoldCard, GoldButton } from '@/components/page-shell'

/* ─────────────────────────────────────────
   SEED BASE44 AGENTS
───────────────────────────────────────── */
const SEED_AGENTS: Base44Agent[] = [
  {
    id: 'b44-intake',
    name: 'Intake Orchestrator',
    type: 'intake',
    status: 'idle',
    mission: 'Processes new project intake forms, locks Source Truth, and queues build tasks.',
    receiptsCreated: 14,
    successRate: 98,
    templateUrl: 'https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o',
    allowedActions: ['lock-source-truth', 'create-receipt', 'queue-build', 'notify-slack'],
    blockedActions: ['approve-release', 'send-client-email'],
  },
  {
    id: 'b44-brand',
    name: 'Brand Pack Agent',
    type: 'brand-pack',
    status: 'idle',
    mission: 'Generates brand packages: color palette, typography, tone, hero style, button style.',
    receiptsCreated: 11,
    successRate: 95,
    templateUrl: 'https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o',
    allowedActions: ['generate-brand-pack', 'create-receipt', 'save-to-drive'],
    blockedActions: ['approve-release', 'deploy'],
  },
  {
    id: 'b44-website',
    name: 'Website Pack Agent',
    type: 'website-pack',
    status: 'idle',
    mission: 'Selects sections, CTA strategy, content style, and conversion goal for each project.',
    receiptsCreated: 9,
    successRate: 93,
    templateUrl: 'https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o',
    allowedActions: ['generate-website-pack', 'create-receipt', 'update-project'],
    blockedActions: ['approve-release', 'deploy', 'delete-project'],
  },
  {
    id: 'b44-validation',
    name: 'Validation Agent',
    type: 'validation',
    status: 'idle',
    mission: 'Runs automated validation checks: SEO, performance, CTA clarity, source truth alignment.',
    receiptsCreated: 42,
    successRate: 91,
    templateUrl: 'https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o',
    allowedActions: ['run-validation', 'create-receipt', 'flag-blocker', 'notify-slack'],
    blockedActions: ['approve-release', 'delete-project'],
  },
  {
    id: 'b44-release',
    name: 'Release Gate Agent',
    type: 'release-gate',
    status: 'idle',
    mission: 'Evaluates release readiness, enforces approval chain, blocks premature releases.',
    receiptsCreated: 7,
    successRate: 100,
    templateUrl: 'https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o',
    allowedActions: ['approve-release', 'block-release', 'create-receipt', 'notify-slack'],
    blockedActions: ['delete-project', 'send-client-email'],
  },
  {
    id: 'b44-docs',
    name: 'Builder Docs Agent',
    type: 'docs',
    status: 'idle',
    mission: 'Generates build specifications, deployment guides, rollback plans, and runbooks.',
    receiptsCreated: 18,
    successRate: 97,
    templateUrl: 'https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o',
    allowedActions: ['generate-docs', 'create-receipt', 'save-to-drive'],
    blockedActions: ['approve-release', 'deploy'],
  },
  {
    id: 'b44-seo',
    name: 'SEO & Market Agent',
    type: 'seo',
    status: 'idle',
    mission: 'Validates buyer clarity, offer resonance, competitive positioning, and CTA optimization.',
    receiptsCreated: 23,
    successRate: 89,
    templateUrl: 'https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o',
    allowedActions: ['run-market-validation', 'create-receipt', 'generate-repair-plan'],
    blockedActions: ['approve-release', 'deploy', 'delete-project'],
  },
  {
    id: 'b44-cron',
    name: 'Cron Heartbeat Agent',
    type: 'cron',
    status: 'idle',
    mission: 'Runs scheduled health checks, monitors production sites, sends daily briefs.',
    receiptsCreated: 156,
    successRate: 99,
    templateUrl: 'https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o',
    allowedActions: ['run-health-check', 'create-receipt', 'notify-slack', 'send-daily-brief'],
    blockedActions: ['approve-release', 'deploy', 'delete-project'],
  },
]

const SEED_RUNS: Base44Run[] = [
  {
    id: 'run-001',
    agentId: 'b44-validation',
    agentName: 'Validation Agent',
    projectId: undefined,
    phase: 'validation',
    action: 'run-validation',
    status: 'completed',
    output: 'Ran 12 checks. 11 passed. 1 flagged: missing OG image. Blocker added.',
    dryRun: false,
    approvalRequired: false,
    startedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    receiptId: 'rec-auto-001',
  },
  {
    id: 'run-002',
    agentId: 'b44-intake',
    agentName: 'Intake Orchestrator',
    phase: 'planning',
    action: 'lock-source-truth',
    status: 'completed',
    output: 'Source truth locked for project. Receipt created. Build queued.',
    dryRun: false,
    approvalRequired: false,
    startedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
  },
  {
    id: 'run-003',
    agentId: 'b44-release',
    agentName: 'Release Gate Agent',
    phase: 'deployment',
    action: 'approve-release',
    status: 'pending-approval',
    output: 'Readiness score 87/100. Awaiting final approval from owner.',
    dryRun: false,
    approvalRequired: true,
    startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'run-004',
    agentId: 'b44-cron',
    agentName: 'Cron Heartbeat Agent',
    phase: 'live',
    action: 'run-health-check',
    status: 'completed',
    output: 'All 3 production sites healthy. Response times < 400ms. No errors detected.',
    dryRun: false,
    approvalRequired: false,
    startedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
]

const AGENT_ICONS: Record<string, React.ElementType> = {
  intake: Package,
  'brand-pack': BarChart3,
  'website-pack': Globe,
  validation: ShieldCheck,
  'release-gate': Shield,
  docs: FileText,
  seo: TrendingUp,
  cron: Clock,
  orchestrator: Cpu,
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  idle:             { color: 'rgba(255,255,255,0.50)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' },
  running:          { color: 'rgba(255,255,255,0.70)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(59,130,246,0.35)' },
  'waiting-approval': { color: '#FBBF24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.30)' },
  completed:        { color: '#4ADE80', background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.28)' },
  failed:           { color: '#F87171', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.28)' },
  blocked:          { color: '#F87171', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.28)' },
}

const RUN_STATUS_STYLES: Record<string, React.CSSProperties> = {
  running:          { color: 'rgba(255,255,255,0.70)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(59,130,246,0.35)' },
  completed:        { color: '#4ADE80', background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.28)' },
  failed:           { color: '#F87171', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.28)' },
  'pending-approval': { color: '#FBBF24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.30)' },
}

export default function Base44AgentPage() {
  const [agents] = useState<Base44Agent[]>(SEED_AGENTS)
  const [runs] = useState<Base44Run[]>(SEED_RUNS)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Base44Agent | null>(SEED_AGENTS[0])
  const [activeTab, setActiveTab] = useState<'agents' | 'runs' | 'config'>('agents')

  useEffect(() => {
    setSettings(getSettings())
    setProjects(getProjects())
  }, [])

  const totalReceipts = agents.reduce((s, a) => s + a.receiptsCreated, 0)
  const avgSuccess = Math.round(agents.reduce((s, a) => s + a.successRate, 0) / agents.length)
  const runningCount = agents.filter(a => a.status === 'running').length
  const pendingApproval = runs.filter(r => r.status === 'pending-approval').length

  return (
    <PageShell
      title="Base44 Agent"
      subtitle="AI orchestration layer — autonomous agents with human-in-the-loop approvals"
      action={
        <a
          href="https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.70) 28%,rgba(255,255,255,0.90) 52%,rgba(255,255,255,0.55) 76%,rgba(255,255,255,0.70) 100%)',
            color: '#0A0A0A',
            boxShadow: '0 0 20px rgba(59,130,246,0.50), 0 2px 8px rgba(59,130,246,0.50)',
          }}
        >
          <ExternalLink size={13} />
          Open in Base44
        </a>
      }
    >

      {/* Config notice */}
      {settings && !settings.base44Enabled && (
        <div
          className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          <Cpu size={15} style={{ color: 'rgba(255,255,255,0.70)' }} />
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>
            Base44 integration not yet enabled.{' '}
            <Link href="/settings" className="font-bold blue-shimmer">Enable in Settings</Link>{' '}
            to activate live orchestration.
          </p>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Agents',     value: agents.length,   accent: '#93C5FD', icon: Cpu },
          { label: 'Receipts Created', value: totalReceipts,   accent: 'rgba(255,255,255,0.90)', icon: FileText },
          { label: 'Avg Success Rate', value: `${avgSuccess}%`,accent: '#4ADE80', icon: ShieldCheck },
          { label: 'Pending Approval', value: pendingApproval, accent: pendingApproval > 0 ? '#FBBF24' : 'rgba(255,255,255,0.30)', icon: Clock },
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

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-lg w-fit" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {(['agents', 'runs', 'config'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-md text-[12px] font-semibold uppercase tracking-wider transition-all duration-150"
            style={activeTab === tab
              ? { background: 'linear-gradient(135deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.70) 50%,rgba(255,255,255,0.90) 100%)', color: '#0A0A0A' }
              : { color: 'rgba(255,255,255,0.55)' }
            }
            onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = '#FFFFFF' }}
            onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >
            {tab === 'agents' ? 'Agents' : tab === 'runs' ? 'Run Log' : 'Config'}
          </button>
        ))}
      </div>

      {/* Agents tab */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent list */}
          <div className="space-y-2">
            {agents.map(agent => {
              const Icon = AGENT_ICONS[agent.type] ?? Cpu
              const isSelected = selectedAgent?.id === agent.id
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="w-full text-left rounded-xl p-3.5 transition-all duration-150"
                  style={isSelected
                    ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(59,130,246,0.45)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                  }
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(245,197,24,0.22)' }}
                    >
                      <Icon size={14} style={{ color: 'rgba(255,255,255,0.90)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#FFFFFF' }}>{agent.name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {agent.type}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                      style={STATUS_STYLES[agent.status]}
                    >
                      {agent.status}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selectedAgent ? (
              <Card>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = AGENT_ICONS[selectedAgent.type] ?? Cpu
                        return (
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)' }}
                          >
                            <Icon size={18} style={{ color: 'rgba(255,255,255,0.90)' }} />
                          </div>
                        )
                      })()}
                      <div>
                        <h2 className="text-[15px] font-bold" style={{ color: '#FFFFFF' }}>{selectedAgent.name}</h2>
                        <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {selectedAgent.type}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-bold uppercase px-3 py-1 rounded-full"
                      style={STATUS_STYLES[selectedAgent.status]}
                    >
                      {selectedAgent.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Mission */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-2" style={{ color: 'rgba(255,255,255,0.30)' }}>Mission</p>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{selectedAgent.mission}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>Receipts Created</p>
                      <p className="text-2xl font-black tabular-nums" style={{ color: '#FFFFFF' }}>{selectedAgent.receiptsCreated}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>Success Rate</p>
                      <p className="text-2xl font-black tabular-nums" style={{ color: selectedAgent.successRate >= 90 ? '#4ADE80' : '#FBBF24' }}>
                        {selectedAgent.successRate}%
                      </p>
                    </div>
                  </div>

                  {/* Allowed/blocked actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-2" style={{ color: 'rgba(74,222,128,0.55)' }}>Allowed Actions</p>
                      <ul className="space-y-1">
                        {selectedAgent.allowedActions.map(a => (
                          <li key={a} className="flex items-center gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            <CheckCircle2 size={11} style={{ color: '#4ADE80' }} />
                            {a.replace(/-/g, ' ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-2" style={{ color: 'rgba(248,113,113,0.55)' }}>Blocked Actions</p>
                      <ul className="space-y-1">
                        {selectedAgent.blockedActions.map(a => (
                          <li key={a} className="flex items-center gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            <AlertCircle size={11} style={{ color: '#F87171' }} />
                            {a.replace(/-/g, ' ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Assign to project */}
                  {projects.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-2" style={{ color: 'rgba(255,255,255,0.30)' }}>Assign to Project</p>
                      <div className="flex items-center gap-2">
                        <select
                          className="flex-1 px-3 py-2 rounded-lg text-sm text-foreground border border-black/10 bg-black/[0.03] focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.90)]/40"
                          style={{ color: '#FFFFFF', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                        >
                          <option value="">Select project...</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <GoldButton>Assign</GoldButton>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <GoldButton>
                      <Play size={13} /> Run Agent (Dry Run)
                    </GoldButton>
                    <a
                      href={selectedAgent.templateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.10)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                    >
                      <ExternalLink size={13} /> Base44 Template
                    </a>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-16 text-center">
                <Cpu size={36} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.18)' }} />
                <p style={{ color: 'rgba(255,255,255,0.50)' }}>Select an agent to view details</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Run Log tab */}
      {activeTab === 'runs' && (
        <Card>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(59,130,246,0.70)' }}>
              Recent Runs
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {runs.map(run => (
              <div key={run.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(245,197,24,0.22)' }}
                    >
                      <Cpu size={13} style={{ color: 'rgba(255,255,255,0.90)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: '#FFFFFF' }}>{run.agentName}</p>
                      <p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {run.action.replace(/-/g, ' ')} &middot; {run.phase}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {run.approvalRequired && (
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(251,191,36,0.12)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.28)' }}
                      >
                        Approval Required
                      </span>
                    )}
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={RUN_STATUS_STYLES[run.status]}
                    >
                      {run.status.replace(/-/g, ' ')}
                    </span>
                  </div>
                </div>
                <div
                  className="px-3 py-2 rounded-lg text-[12px] font-mono"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {run.output}
                </div>
                <p className="mt-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                  {new Date(run.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {run.completedAt && ` — ${new Date(run.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
                {run.status === 'pending-approval' && (
                  <div className="flex items-center gap-2 mt-3">
                    <GoldButton>Approve Release</GoldButton>
                    <button
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
                      style={{ background: 'rgba(248,113,113,0.10)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}
                    >
                      Block Release
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Config tab */}
      {activeTab === 'config' && (
        <div className="max-w-2xl space-y-5">
          <GoldCard className="p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'rgba(245,217,107,0.55)' }}>
              Base44 Orchestrator
            </p>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Base44 is the AI orchestration backbone of XPS Intelligence. Each agent above maps to a
              Base44 Super-Agent template that runs autonomously with human approval gates.
            </p>
            <a
              href="https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13px] font-bold"
              style={{ color: 'rgba(255,255,255,0.70)' }}
            >
              Open Clone Template <ExternalLink size={13} />
            </a>
          </GoldCard>

          <Card className="p-5">
            <h3 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Integration Settings</h3>
            <div className="space-y-3">
              {[
                { label: 'Agent URL',     value: settings?.base44AgentUrl || '—' },
                { label: 'Project ID',    value: settings?.base44ProjectId || 'Not configured' },
                { label: 'Status',        value: settings?.base44Enabled ? 'Enabled' : 'Disabled' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.60)' }}>{row.label}</span>
                  <span className="text-[12px] font-semibold font-mono truncate max-w-[200px]" style={{ color: '#FFFFFF' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <Link
              href="/settings"
              className="mt-4 flex items-center gap-1.5 text-[12px] font-bold"
              style={{ color: 'rgba(245,197,24,0.70)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,197,24,0.70)')}
            >
              Edit in Settings <ArrowRight size={12} />
            </Link>
          </Card>
        </div>
      )}
    </PageShell>
  )
}
