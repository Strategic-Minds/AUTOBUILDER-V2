'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/lib/storage'
import { calculateExecutionState, getProjectsNeedingAttention } from '@/lib/execution'
import { Project, ExecutionState, CommandAction } from '@/lib/types'
import { AlertCircle, CheckCircle, Zap, AlertTriangle, Clock, ChevronRight, Target } from 'lucide-react'
import Link from 'next/link'
import { PageShell, Card, GoldCard, Badge, GoldButton } from '@/components/page-shell'

const GOLD_GRADIENT = 'linear-gradient(135deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.70) 28%,rgba(255,255,255,0.90) 52%,rgba(255,255,255,0.55) 76%,rgba(255,255,255,0.70) 100%)'

export default function CommandCenterPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [needsAttention, setNeedsAttention] = useState<Project[]>([])
  const [states, setStates] = useState<Record<string, ExecutionState>>({})
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  useEffect(() => {
    const allProjects = getProjects()
    setProjects(allProjects)
    const attention = getProjectsNeedingAttention()
    setNeedsAttention(attention)
    const statesMap: Record<string, ExecutionState> = {}
    allProjects.forEach(p => { statesMap[p.id] = calculateExecutionState(p.id) })
    setStates(statesMap)
    if (attention.length > 0) setSelectedProject(attention[0].id)
  }, [])

  const selectedState = selectedProject ? states[selectedProject] : null

  return (
    <PageShell title="Command Center" subtitle="Orchestrate builds across all projects">
      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Projects',    value: projects.length,                                                        color: '#FFFFFF' },
          { label: 'Needs Attention',   value: needsAttention.length,                                                  color: '#FCA5A5' },
          { label: 'Active Builds',     value: projects.filter(p => p.phase === 'building').length,                    color: '#93C5FD' },
          { label: 'Ready for Release', value: projects.filter(p => p.releaseStatus === 'ready-for-release').length,   color: '#4ADE80' },
        ].map(item => (
          <Card key={item.label} className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{item.label}</p>
            <p className="text-3xl font-black" style={{ color: item.color }}>{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project list */}
        <div>
          <Card>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-bold text-foreground">Projects</h2>
            </div>
            <div className="p-3 space-y-1 max-h-[420px] overflow-y-auto">
              {projects.map(project => {
                const state = states[project.id]
                const isSelected = selectedProject === project.id
                const hasBlockers = state?.blockers.length > 0
                return (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className="w-full text-left p-3 rounded-lg transition-all duration-150"
                    style={
                      isSelected
                        ? { background: GOLD_GRADIENT, color: '#0A0A0A' }
                        : hasBlockers
                        ? { background: 'rgba(248,113,113,0.12)', color: '#FCA5A5', border: '1px solid rgba(248,113,113,0.25)' }
                        : { background: 'rgba(255,255,255,0.05)', color: '#FFFFFF' }
                    }
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = hasBlockers ? 'rgba(248,113,113,0.20)' : 'rgba(255,255,255,0.09)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = hasBlockers ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{project.name}</p>
                        <p className="text-xs opacity-60 capitalize mt-0.5">{project.phase}</p>
                      </div>
                      {hasBlockers && <AlertTriangle size={14} className="shrink-0" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selectedProject && selectedState ? (
            <div className="space-y-4">
              {/* Blockers */}
              {selectedState.blockers.length > 0 && (
                <div
                  className="rounded-xl p-5"
                  style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.28)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={16} style={{ color: '#F87171' }} />
                    <h3 className="font-bold" style={{ color: '#F87171' }}>Blockers</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedState.blockers.map((blocker, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#FCA5A5' }}>
                        <span className="mt-0.5">•</span>
                        <span>{blocker}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              {selectedState.nextActions.length > 0 && (
                <Card>
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Zap size={15} style={{ color: "rgba(255,255,255,0.90)" }} />
                      Available Actions
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedState.nextActions.map((action, i) => (
                      <ActionCard key={i} action={action} projectId={selectedProject} />
                    ))}
                  </div>
                </Card>
              )}

              {/* Approval chain */}
              {selectedState.approvalChain.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-bold text-foreground mb-4">Approval Chain</h3>
                  <div className="space-y-2">
                    {selectedState.approvalChain.map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: 'rgba(59,130,246,0.18)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.22)' }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm text-foreground capitalize">{step.replace(/-/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Readiness */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">Readiness</h3>
                  <span className="text-sm text-muted-foreground">{selectedState.readinessPercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${selectedState.readinessPercentage}%`, background: 'linear-gradient(90deg,rgba(255,255,255,0.55),rgba(255,255,255,0.70),rgba(255,255,255,0.90))' }}
                  />
                </div>
              </Card>

              <Link href={`/projects/${selectedProject}`}>
                <GoldButton className="w-full justify-center">
                  View Project <ChevronRight size={15} />
                </GoldButton>
              </Link>
            </div>
          ) : (
            <Card className="p-16 text-center">
              <Target size={36} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.18)' }} />
              <p className="text-muted-foreground">Select a project to view available actions</p>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  )
}

function ActionCard({ action, projectId }: { action: CommandAction; projectId: string }) {
  const statusStyle: Record<string, React.CSSProperties> = {
    available:    { background: 'rgba(74,222,128,0.10)',  border: '1px solid rgba(74,222,128,0.28)' },
    blocked:      { background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.28)' },
    'in-progress':{ background: 'rgba(255,255,255,0.07)',  border: '1px solid rgba(59,130,246,0.35)' },
    completed:    { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' },
    failed:       { background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.28)' },
  }

  const iconEl = {
    available:    <CheckCircle size={15} style={{ color: '#4ADE80' }} />,
    blocked:      <AlertCircle size={15} style={{ color: '#F87171' }} />,
    'in-progress':<Zap size={15} style={{ color: "rgba(255,255,255,0.90)" }} />,
    completed:    <CheckCircle size={15} style={{ color: 'rgba(255,255,255,0.30)' }} />,
    failed:       <AlertCircle size={15} style={{ color: '#F87171' }} />,
  }

  return (
    <div className="rounded-xl p-4" style={statusStyle[action.status] ?? statusStyle.completed}>
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {iconEl[action.status]}
          <span className="font-semibold text-sm text-foreground capitalize">{action.action.replace(/-/g, ' ')}</span>
        </div>
        {action.estimatedMinutes && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={11} /> {action.estimatedMinutes}m
          </span>
        )}
      </div>
      {action.reason && <p className="text-xs text-muted-foreground mb-3">{action.reason}</p>}
      {action.status === 'available' && (
        <GoldButton className="w-full justify-center text-xs py-1.5">
          Execute {action.dryRun && '(Dry Run)'}
        </GoldButton>
      )}
    </div>
  )
}
