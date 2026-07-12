'use client'

import { useState } from 'react'
import {
  Brain, User, Building2, Bot, FileText, Search, Clock, Tag,
  ChevronRight, Archive, RefreshCw, Zap, BarChart2, Circle,
  MessageSquare, Layers, Shield, CheckCircle2, Plus, Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'

type MemoryScope = 'conversation' | 'project' | 'customer' | 'business' | 'agent' | 'document'

interface MemoryEntry {
  id: string
  scope: MemoryScope
  title: string
  content: string
  linkedId?: string
  linkedName?: string
  importance: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  version: number
  createdAt: string
  updatedAt: string
  expiresAt?: string
  embeddingReady: boolean
}

interface MemoryStats {
  scope: MemoryScope
  count: number
  totalTokens: number
  icon: React.ElementType
  label: string
  color: string
}

const ENTRIES: MemoryEntry[] = [
  {
    id: 'm1', scope: 'business', title: 'Company Core Identity',
    content: 'National Epoxy Pros operates in 12 states. Primary service is residential and commercial epoxy flooring. 10-Year No-Peel Warranty is core differentiator. Average ticket: $4,800 residential, $22,000 commercial.',
    importance: 'critical', tags: ['core', 'identity'], version: 3,
    createdAt: '2025-01-15', updatedAt: '2h ago', embeddingReady: true,
  },
  {
    id: 'm2', scope: 'business', title: 'Pricing Rules — Current',
    content: 'Residential metallic epoxy: $6.50–$9.00/sqft base. Commercial: $7.50–$12.00/sqft. High-moisture remediation: +$2.00–$3.50. Never discount more than 8% without manager approval.',
    importance: 'critical', tags: ['pricing', 'rules'], version: 5,
    createdAt: '2025-01-20', updatedAt: '1d ago', embeddingReady: true,
  },
  {
    id: 'm3', scope: 'customer', title: 'Mike Johnson — Tampa Lead',
    content: 'Homeowner, 2,400sqft garage + patio. Interested in metallic bronze finish. Budget-sensitive, needs financing options. Follow up Friday. Prefers text over calls.',
    importance: 'high', tags: ['lead', 'residential', 'tampa'], version: 2,
    createdAt: '2025-06-15', updatedAt: '3h ago', embeddingReady: true,
    linkedId: 'proj-001', linkedName: 'Tampa Garage Shield',
  },
  {
    id: 'm4', scope: 'project', title: 'Miami Commercial — Blockers',
    content: 'Project blocked on moisture test results. Contractor says sub-floor needs 72hr dry time. Client approval pending. Expected unblock: July 8. Notify Sarah when green.',
    importance: 'high', tags: ['blocker', 'miami', 'commercial'], version: 1,
    createdAt: '2025-07-01', updatedAt: '6h ago', embeddingReady: true,
    linkedId: 'proj-002', linkedName: 'Miami Commercial',
  },
  {
    id: 'm5', scope: 'conversation', title: 'Sales Call — Rodriguez Family',
    content: 'Voice session 45min. Client concerned about pets during cure. Advised 48hr exit. Offered pet-safe formulation. Quote sent: $6,900 for 1,100sqft kitchen + living room. Decision by EOW.',
    importance: 'medium', tags: ['sales-call', 'residential'], version: 1,
    createdAt: '2025-07-04', updatedAt: '1d ago', embeddingReady: false,
    expiresAt: '2025-08-04',
  },
  {
    id: 'm6', scope: 'agent', title: 'Base44 Orchestrator — Run History',
    content: 'Last 7 runs: 6 success, 1 failed (network timeout on Drive sync). Average run time: 4.2min. Next scheduled: Tonight 11pm. Retry policy: 3 attempts with exponential backoff.',
    importance: 'medium', tags: ['agent', 'base44', 'ops'], version: 8,
    createdAt: '2025-06-01', updatedAt: '30min ago', embeddingReady: true,
  },
  {
    id: 'm7', scope: 'document', title: 'Operations Manual — Key Rules',
    content: 'Extracted from: Operations Manual v3.2 (pg 12–18). Cure times: 24hr residential, 48hr commercial. Temperature window: 50–90F. Humidity max: 85%RH. Do not apply over existing coating without grinding.',
    importance: 'high', tags: ['ops', 'field', 'extracted'], version: 1,
    createdAt: '2025-07-01', updatedAt: '2h ago', embeddingReady: true,
    linkedName: 'Operations Manual v3.2',
  },
]

const MEMORY_STATS: MemoryStats[] = [
  { scope: 'conversation', count: 24,  totalTokens: 18400, icon: MessageSquare, label: 'Conversation', color: '#3b82f6' },
  { scope: 'project',      count: 18,  totalTokens: 29100, icon: Building2,     label: 'Project',      color: '#a78bfa' },
  { scope: 'customer',     count: 71,  totalTokens: 48200, icon: User,          label: 'Customer',     color: '#22c55e' },
  { scope: 'business',     count: 12,  totalTokens: 9800,  icon: Shield,        label: 'Business',     color: 'rgba(255,255,255,0.90)' },
  { scope: 'agent',        count: 8,   totalTokens: 6200,  icon: Bot,           label: 'Agent',        color: '#fb923c' },
  { scope: 'document',     count: 312, totalTokens: 241000,icon: FileText,      label: 'Document',     color: '#ef4444' },
]

const IMPORTANCE_STYLES = {
  critical: { bg: 'rgba(239,68,68,0.12)',  text: '#ef4444', label: 'Critical' },
  high:     { bg: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.90)', label: 'High'     },
  medium:   { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', label: 'Medium'   },
  low:      { bg: 'rgba(255,255,255,0.06)',text: 'rgba(255,255,255,0.4)', label: 'Low' },
}

const SCOPE_ICONS: Record<MemoryScope, React.ElementType> = {
  conversation: MessageSquare,
  project:      Building2,
  customer:     User,
  business:     Shield,
  agent:        Bot,
  document:     FileText,
}

const SCOPE_COLORS: Record<MemoryScope, string> = {
  conversation: '#3b82f6',
  project:      '#a78bfa',
  customer:     '#22c55e',
  business:     'rgba(255,255,255,0.90)',
  agent:        '#fb923c',
  document:     '#ef4444',
}

export default function XpsMemoryPage() {
  const [activeScope, setActiveScope] = useState<MemoryScope | 'all'>('all')
  const [query, setQuery]             = useState('')
  const [selected, setSelected]       = useState<MemoryEntry | null>(null)

  const filtered = ENTRIES.filter(e =>
    (activeScope === 'all' || e.scope === activeScope) &&
    (query === '' || e.title.toLowerCase().includes(query.toLowerCase()) || e.content.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(245,197,24,0.1)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: 'rgba(255,255,255,0.90)' }}>XPS Intelligence — Memory</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">XPS Memory</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Persistent AI memory across conversations, projects, customers, and agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <RefreshCw size={14} />
              Sync
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.70) 28%, rgba(255,255,255,0.90) 52%, rgba(255,255,255,0.55) 76%)',
                color: '#0A0A0A',
                boxShadow: '0 0 24px rgba(245,197,24,0.4)',
              }}
            >
              <Plus size={14} />
              Add Memory
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Memory scope stats */}
        <div className="grid grid-cols-6 gap-3">
          {MEMORY_STATS.map(s => (
            <button
              key={s.scope}
              onClick={() => setActiveScope(activeScope === s.scope ? 'all' : s.scope)}
              className="rounded-xl p-4 text-left transition-all"
              style={{
                background: activeScope === s.scope ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeScope === s.scope ? `${s.color}40` : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${s.color}18` }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <p className="text-lg font-bold text-white leading-none">{s.count}</p>
              <p className="text-[10px] mt-0.5 font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{(s.totalTokens / 1000).toFixed(1)}k tokens</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search memory entries..."
            className="w-full rounded-xl pl-10 pr-4 py-3 text-[14px] outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          />
        </div>

        {/* Memory list + detail */}
        <div className={`grid gap-5 ${selected ? 'grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
          {/* List */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {filtered.length} entries
              </p>
              <div className="flex items-center gap-2">
                {activeScope !== 'all' && (
                  <button
                    onClick={() => setActiveScope('all')}
                    className="text-[11px] px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(245,197,24,0.1)', color: 'rgba(255,255,255,0.90)' }}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {filtered.map(entry => {
                const ScopeIcon = SCOPE_ICONS[entry.scope]
                const scopeColor = SCOPE_COLORS[entry.scope]
                const imp = IMPORTANCE_STYLES[entry.importance]
                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                    className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors"
                    style={{ background: selected?.id === entry.id ? 'rgba(245,197,24,0.05)' : 'transparent' }}
                    onMouseEnter={e => { if (selected?.id !== entry.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { if (selected?.id !== entry.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${scopeColor}15` }}>
                      <ScopeIcon size={16} style={{ color: scopeColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-white">{entry.title}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize" style={{ background: imp.bg, color: imp.text }}>
                          {imp.label}
                        </span>
                        {!entry.embeddingReady && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}>
                            Not Embedded
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] mt-1 leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {entry.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] capitalize" style={{ color: scopeColor }}>{entry.scope}</span>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>v{entry.version}</span>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                        <Clock size={10} style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Updated {entry.updatedAt}</span>
                        {entry.linkedName && (
                          <>
                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.90)' }}>{entry.linkedName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div
              className="rounded-2xl p-6 flex flex-col gap-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(245,197,24,0.5)' }}>
                    Memory Entry
                  </p>
                  <p className="text-[15px] font-bold text-white">{selected.title}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-[11px] p-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  ×
                </button>
              </div>
              <div
                className="p-4 rounded-xl text-[13px] leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)' }}
              >
                {selected.content}
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Scope',     value: selected.scope },
                  { label: 'Version',   value: `v${selected.version}` },
                  { label: 'Created',   value: selected.createdAt },
                  { label: 'Updated',   value: selected.updatedAt },
                  { label: 'Embedded',  value: selected.embeddingReady ? 'Yes' : 'Pending' },
                  ...(selected.expiresAt ? [{ label: 'Expires', value: selected.expiresAt }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                    <span className="text-[12px] font-semibold capitalize" style={{ color: 'rgba(255,255,255,0.75)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: 'rgba(245,197,24,0.1)', color: 'rgba(255,255,255,0.90)', border: '1px solid rgba(59,130,246,0.20)' }}
                >
                  Edit
                </button>
                <button
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
                >
                  Archive
                </button>
                <button
                  className="py-2 px-3 rounded-xl text-[12px]"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
