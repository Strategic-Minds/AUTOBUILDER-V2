'use client'

import { useState, useEffect } from 'react'
import { Zap, CheckCircle, Clock, GitBranch, AlertCircle } from 'lucide-react'
import { PageShell, Card, GoldCard } from '@/components/page-shell'
import { getProjects } from '@/lib/storage'
import { Project } from '@/lib/types'
import Link from 'next/link'

const PIPELINE_STEPS = [
  { number: 1,  title: 'Source Truth Locked',   phase: 'planning'    },
  { number: 2,  title: 'Builder Docs Created',   phase: 'planning'    },
  { number: 3,  title: 'GitHub Branch Created',  phase: 'building'    },
  { number: 4,  title: 'Agent Task Assigned',    phase: 'building'    },
  { number: 5,  title: 'Sandbox Test',           phase: 'building'    },
  { number: 6,  title: 'Preview Deploy',         phase: 'validation'  },
  { number: 7,  title: 'Smoke Test',             phase: 'validation'  },
  { number: 8,  title: 'Client Review',          phase: 'deployment'  },
  { number: 9,  title: 'Approval Gate',          phase: 'deployment'  },
  { number: 10, title: 'Production Release',     phase: 'live'        },
]

const PHASE_ORDER = ['planning', 'building', 'validation', 'deployment', 'live', 'archived']

function getStepStatus(stepPhase: string, projectPhase: string): 'complete' | 'in-progress' | 'pending' {
  const stepIdx    = PHASE_ORDER.indexOf(stepPhase)
  const projectIdx = PHASE_ORDER.indexOf(projectPhase)
  if (projectIdx > stepIdx)  return 'complete'
  if (projectIdx === stepIdx) return 'in-progress'
  return 'pending'
}

const STEP_STYLE: Record<string, React.CSSProperties> = {
  complete:     { background: 'rgba(74,222,128,0.14)',  color: '#4ADE80',  border: '1px solid rgba(74,222,128,0.28)' },
  'in-progress':{ background: 'rgba(245,197,24,0.16)',  color: 'rgba(255,255,255,0.70)',  border: '1px solid rgba(59,130,246,0.50)' },
  pending:      { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.10)' },
}

const PHASE_STYLE: Record<string, React.CSSProperties> = {
  planning:   { background: 'rgba(167,139,250,0.16)', color: '#C4B5FD', border: '1px solid rgba(167,139,250,0.30)' },
  building:   { background: 'rgba(96,165,250,0.16)',  color: '#93C5FD', border: '1px solid rgba(96,165,250,0.30)'  },
  validation: { background: 'rgba(245,197,24,0.16)',  color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(245,197,24,0.36)'  },
  deployment: { background: 'rgba(52,211,153,0.16)',  color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.30)'  },
  live:       { background: 'rgba(74,222,128,0.16)',  color: '#4ADE80', border: '1px solid rgba(74,222,128,0.30)'  },
  archived:   { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.10)' },
}

const DOCTRINE = [
  { text: 'AI generates. Vercel runs. Xtreme validates. The market decides.',                      accent: 'rgba(255,255,255,0.90)' },
  { text: 'Do not build the whole dream. Build the smallest version that proves the money path.',  accent: 'rgba(255,255,255,0.90)' },
  { text: 'No release without receipts.',                                                          accent: '#22C55E' },
  { text: 'Source truth first. Build second. Validate before release.',                            accent: 'rgba(255,255,255,0.90)' },
]

export default function VercelWorkflowPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [now] = useState(new Date())

  useEffect(() => {
    const loaded = getProjects()
    setProjects(loaded)
    if (loaded.length > 0) setSelectedId(loaded[0].id)
  }, [])

  const selected = projects.find(p => p.id === selectedId) ?? null

  const stepIcon = (status: string) => {
    if (status === 'complete')     return <CheckCircle size={20} style={{ color: '#4ADE80' }} />
    if (status === 'in-progress')  return <Zap size={20} style={{ color: 'rgba(255,255,255,0.70)' }} className="animate-pulse" />
    return <Clock size={20} style={{ color: 'rgba(255,255,255,0.35)' }} />
  }

  const completedSteps = selected
    ? PIPELINE_STEPS.filter(s => getStepStatus(s.phase, selected.phase) === 'complete').length
    : 0

  return (
    <PageShell title="Vercel Workflow" subtitle="10-step automated deployment pipeline">

      {/* Cron heartbeat */}
      <Card className="p-6 mb-6">
        <h2 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Cron Heartbeat Monitor</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Last Checked',   value: now.toLocaleTimeString(),                              ok: true  },
            { label: 'Next Run',       value: new Date(now.getTime() + 3600000).toLocaleTimeString(), ok: false },
            { label: 'Active Projects', value: String(projects.filter(p => p.status === 'active').length), ok: true },
            { label: 'Status',         value: 'Active',                                              ok: true  },
          ].map(item => (
            <div key={item.label} className="rounded-lg p-3.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <p className="text-xs mb-1.5 blue-shimmer font-semibold uppercase tracking-wider">{item.label}</p>
              <p className="font-semibold text-sm flex items-center gap-1.5" style={{ color: item.ok ? '#4ADE80' : '#FFFFFF' }}>
                {item.ok && <span className="inline-block w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Project selector */}
        <Card className="p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
            <GitBranch size={16} style={{ color: "rgba(255,255,255,0.90)" }} />
            <span>Projects</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.12)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.18)' }}>
              {projects.length}
            </span>
          </h2>

          {projects.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>No projects yet.</p>
              <Link href="/new-website" className="blue-shimmer text-xs font-bold mt-2 inline-block hover:underline">
                Create first project
              </Link>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {projects.map(p => {
                const isActive = p.id === selectedId
                const completed = PIPELINE_STEPS.filter(s => getStepStatus(s.phase, p.phase) === 'complete').length
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelectedId(p.id)}
                      className="w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                        border: isActive ? '1px solid rgba(59,130,246,0.45)' : '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate" style={{ color: isActive ? 'rgba(255,255,255,0.70)' : '#FFFFFF' }}>
                          {p.name}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold capitalize" style={PHASE_STYLE[p.phase] ?? PHASE_STYLE.archived}>
                          {p.phase}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{p.clientName}</p>
                      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(completed / 10) * 100}%`, background: 'linear-gradient(90deg,rgba(255,255,255,0.55),rgba(255,255,255,0.70),rgba(255,255,255,0.90))' }}
                        />
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{completed}/10 steps</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Pipeline */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold" style={{ color: '#FFFFFF' }}>
              {selected ? selected.name : 'Execution Pipeline'}
            </h2>
            {selected && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={PHASE_STYLE[selected.phase] ?? PHASE_STYLE.archived}>
                {selected.phase}
              </span>
            )}
          </div>

          {!selected ? (
            <p className="text-sm py-8 text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {projects.length === 0 ? 'Create a project to see the pipeline' : 'Select a project'}
            </p>
          ) : (
            <>
              {/* Progress summary */}
              <div className="flex items-center gap-3 mb-5 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex-1">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-semibold blue-shimmer">{completedSteps} of 10 steps complete</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>{Math.round((completedSteps / 10) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(completedSteps / 10) * 100}%`, background: 'linear-gradient(90deg,rgba(255,255,255,0.55),rgba(255,255,255,0.70),rgba(255,255,255,0.90))' }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {PIPELINE_STEPS.map((step, i) => {
                  const status = getStepStatus(step.phase, selected.phase)
                  return (
                    <div key={step.number}>
                      <div className="flex items-center gap-3 py-1.5">
                        <div className="shrink-0">{stepIcon(status)}</div>
                        <div className="flex-1 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium" style={{ color: status === 'pending' ? 'rgba(255,255,255,0.50)' : '#FFFFFF' }}>
                            <span className="text-xs mr-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{step.number}.</span>
                            {step.title}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize shrink-0" style={STEP_STYLE[status]}>
                            {status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div className="ml-[30px] h-3 border-l border-dashed" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 pt-4 flex gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <Link
                  href={`/projects/${selected.id}`}
                  className="white-cta px-4 py-2 rounded-lg text-xs font-bold transition-all"
                >
                  Open Project
                </Link>
                <Link
                  href="/build-queue"
                  className="glass-ghost px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Build Queue
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Doctrine */}
      <GoldCard className="p-6">
        <h2 className="font-bold mb-4 blue-shimmer text-lg">Core Doctrine</h2>
        <div className="space-y-3">
          {DOCTRINE.map((d, i) => (
            <p
              key={i}
              className="text-sm italic pl-4 leading-relaxed"
              style={{ borderLeft: `3px solid ${d.accent}`, color: '#FFFFFF' }}
            >
              &ldquo;{d.text}&rdquo;
            </p>
          ))}
        </div>
      </GoldCard>
    </PageShell>
  )
}
