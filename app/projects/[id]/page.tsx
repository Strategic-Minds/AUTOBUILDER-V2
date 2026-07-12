'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getProject, updateProject, addTask, updateTask, addReceipt, deleteTask } from '@/lib/storage'
import { generateBuildPacket, generateClientDeliveryPacket, calculateReadinessScore } from '@/lib/generators'
import { calculateAutoBuilderScore, getScoreColor, getScoreLabelColor } from '@/lib/scoring'
import { Project, Task, Receipt, AutoBuilderScore } from '@/lib/types'
import { Copy, Check, AlertCircle, CheckCircle, Zap, FileText, Users, TrendingUp, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { PageShell, Card, Badge, GoldButton, GhostButton } from '@/components/page-shell'

type TabType = 'overview' | 'source-truth' | 'tasks' | 'validation' | 'receipts' | 'preview' | 'delivery' | 'governance'

const PHASE_STYLE: Record<string, React.CSSProperties> = {
  planning:   { background: 'rgba(167,139,250,0.18)', color: '#C4B5FD', border: '1px solid rgba(167,139,250,0.32)' },
  building:   { background: 'rgba(96,165,250,0.18)',  color: '#93C5FD', border: '1px solid rgba(96,165,250,0.32)' },
  validation: { background: 'linear-gradient(135deg,rgba(200,150,12,0.20),rgba(245,217,107,0.12))', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(59,130,246,0.50)' },
  deployment: { background: 'rgba(52,211,153,0.16)',  color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.32)' },
  live:       { background: 'rgba(74,222,128,0.16)',  color: '#4ADE80', border: '1px solid rgba(74,222,128,0.32)' },
  archived:   { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.12)' },
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  active:    { background: 'rgba(74,222,128,0.16)',  color: '#4ADE80', border: '1px solid rgba(74,222,128,0.32)' },
  blocked:   { background: 'rgba(248,113,113,0.16)', color: '#F87171', border: '1px solid rgba(248,113,113,0.32)' },
  'on-hold': { background: 'rgba(245,217,107,0.16)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(245,217,107,0.32)' },
  completed: { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.12)' },
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [score, setScore] = useState<AutoBuilderScore | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [copied, setCopied] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)

  useEffect(() => {
    const proj = getProject(projectId)
    if (proj) {
      setProject(proj)
      const calcScore = calculateAutoBuilderScore(projectId)
      setScore(calcScore)
    }
  }, [projectId])

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddTask = () => {
    if (!project || !newTaskTitle.trim()) return
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: project.id,
      title: newTaskTitle,
      phase: project.phase,
      priority: 'medium',
      owner: 'Assigned',
      status: 'pending',
      blocker: false,
      nextAction: 'Start work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addTask(project.id, newTask)
    const updated = getProject(project.id)
    if (updated) setProject(updated)
    setNewTaskTitle('')
    setShowTaskForm(false)
  }

  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    if (!project) return
    updateTask(project.id, taskId, { status })
    const updated = getProject(project.id)
    if (updated) setProject(updated)
  }

  const handleDeleteTask = (taskId: string) => {
    if (!project) return
    deleteTask(project.id, taskId)
    const updated = getProject(project.id)
    if (updated) setProject(updated)
  }

  const handleGenerateHandoff = () => {
    if (!project) return
    const receipt: Receipt = {
      id: `receipt-${Date.now()}`,
      projectId: project.id,
      type: 'builder-handoff',
      status: 'pending',
      evidence: 'Build packet generated',
      summary: 'Builder handoff package created',
      createdAt: new Date().toISOString(),
      notes: 'Ready for developer assignment',
    }
    addReceipt(project.id, receipt)
    const updated = getProject(project.id)
    if (updated) {
      updated.readinessScore = calculateReadinessScore(updated)
      updateProject(project.id, updated)
      setProject(updated)
    }
  }

  if (!project) {
    return (
      <PageShell title="Loading..." subtitle="">
        <p className="text-muted-foreground">Loading project data...</p>
      </PageShell>
    )
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview',     label: 'Overview' },
    { id: 'source-truth', label: 'Source Truth' },
    { id: 'tasks',        label: `Tasks (${project.tasks.length})` },
    { id: 'validation',   label: 'Validation' },
    { id: 'receipts',     label: `Receipts (${project.receipts.length})` },
    { id: 'preview',      label: 'Preview' },
    { id: 'delivery',     label: 'Client Delivery' },
    { id: 'governance',   label: 'Governance' },
  ]

  const completedTasks = project.tasks.filter(t => t.status === 'passed').length

  return (
    <PageShell title={project.name} subtitle={`${project.clientName} · ${project.industry}`}>
      {/* Back */}
      <div className="mb-6">
        <Link href="/projects">
          <GhostButton><ArrowLeft size={14} /> All Projects</GhostButton>
        </Link>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'rgba(59,130,246,0.60)' }}>Phase</p>
          <span
            className="inline-block px-2.5 py-1 rounded-full text-xs font-bold capitalize"
            style={PHASE_STYLE[project.phase] ?? PHASE_STYLE.archived}
          >
            {project.phase}
          </span>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'rgba(59,130,246,0.60)' }}>Status</p>
          <span
            className="inline-block px-2.5 py-1 rounded-full text-xs font-bold capitalize"
            style={STATUS_STYLE[project.status] ?? STATUS_STYLE.completed}
          >
            {project.status}
          </span>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'rgba(59,130,246,0.60)' }}>Readiness</p>
          <div>
            <div className="text-2xl font-black" style={{ color: '#FFFFFF' }}>{project.readinessScore}%</div>
            <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${project.readinessScore}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.55), rgba(255,255,255,0.70), rgba(255,255,255,0.90))' }}
              />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'rgba(59,130,246,0.60)' }}>Tasks</p>
          <div className="text-2xl font-black" style={{ color: '#FFFFFF' }}>{completedTasks}/{project.tasks.length}</div>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.82)' }}>completed</p>
        </Card>
        {score && (
          <Card className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'rgba(59,130,246,0.60)' }}>Score</p>
            <div className="text-2xl font-black blue-shimmer">{score.totalScore}</div>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.88)' }}>{score.label}</p>
          </Card>
        )}
      </div>

      {/* Release blockers */}
      {score && score.releaseBlockers.length > 0 && (
        <div
          className="rounded-xl p-4 mb-6 flex gap-3"
          style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}
        >
          <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-bold mb-1.5" style={{ color: '#DC2626' }}>Release Blockers</p>
            <ul className="space-y-1">
              {score.releaseBlockers.map((blocker, i) => (
                <li key={i} className="text-sm text-foreground">{blocker}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab bar + actions */}
      <div className="flex items-center justify-between mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex gap-1 flex-wrap pb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2.5 text-sm font-semibold transition-all duration-150 -mb-px"
              style={
                activeTab === tab.id
                  ? { color: 'rgba(255,255,255,0.70)', borderBottom: '2px solid rgba(255,255,255,0.90)' }
                  : { color: 'rgba(255,255,255,0.82)', borderBottom: '2px solid transparent' }
              }
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <GoldButton onClick={handleGenerateHandoff} className="mb-1">
          Generate Handoff
        </GoldButton>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Project Info</p>
            <div className="space-y-4">
              <InfoRow label="Primary Goal" value={project.primaryGoal} />
              <InfoRow label="Deadline" value={new Date(project.deadline).toLocaleDateString()} />
              <InfoRow label="Priority" value={<span className="capitalize">{project.priority}</span>} />
              <InfoRow label="Owner" value={project.owner} />
            </div>
          </Card>
          <Card className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Selected Options</p>
            <div className="space-y-4">
              <InfoRow label="Brand Pack" value={project.selectedBrandPack?.name ?? 'Not selected'} />
              <InfoRow label="Design" value={project.selectedWebsiteDesign?.name ?? 'Not selected'} />
              <InfoRow label="Workflow" value={project.selectedWorkflow?.name ?? 'Not selected'} />
              <InfoRow label="Approval" value={<span className="capitalize">{project.approvalStatus}</span>} />
            </div>
          </Card>
          {project.blockers.length > 0 && (
            <div
              className="md:col-span-2 rounded-xl p-5"
              style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)' }}
            >
              <p className="font-bold text-sm mb-3" style={{ color: '#DC2626' }}>Active Blockers</p>
              <ul className="space-y-1.5">
                {project.blockers.map((b, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <AlertCircle size={13} style={{ color: '#DC2626', marginTop: 2, flexShrink: 0 }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'source-truth' && (
        <Card className="p-6">
          {project.sourceTruth ? (
            <div className="space-y-5">
              <SourceRow label="Business Name" value={project.sourceTruth.businessName} />
              <SourceRow label="Offer" value={project.sourceTruth.offer} />
              <SourceRow label="Target Buyer" value={project.sourceTruth.buyer} />
              <SourceRow label="Problem Solved" value={project.sourceTruth.problemSolved} />
              <SourceRow label="CTA" value={project.sourceTruth.cta} />
              <SourceRow label="Proof" value={project.sourceTruth.proof} />
              <SourceRow label="Differentiator" value={project.sourceTruth.differentiator} />
              {project.sourceTruth.objections.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Objections</p>
                  <ul className="space-y-1">
                    {project.sourceTruth.objections.map((o, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="blue-shimmer">•</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Source truth not yet defined for this project.</p>
          )}
        </Card>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{completedTasks} of {project.tasks.length} tasks completed</p>
            {!showTaskForm && (
              <GoldButton onClick={() => setShowTaskForm(true)}>
                <Plus size={14} /> Add Task
              </GoldButton>
            )}
          </div>
          {showTaskForm && (
            <Card className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New task title..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddTask() }}
                  className="glass-input flex-1 px-4 py-2.5 text-sm"
                  autoFocus
                />
                <GoldButton onClick={handleAddTask}>Add</GoldButton>
                <GhostButton onClick={() => setShowTaskForm(false)}>Cancel</GhostButton>
              </div>
            </Card>
          )}
          <div className="space-y-2.5">
            {project.tasks.map(task => (
              <Card key={task.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground text-sm truncate">{task.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.nextAction}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge color={task.priority === 'critical' ? 'gold' : 'gray'}>{task.priority}</Badge>
                      {task.blocker && <Badge color="gold">Blocker</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={task.status}
                      onChange={e => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                      className="glass-input px-3 py-1.5 text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: '#DC2626' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      aria-label="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'validation' && (
        <div className="space-y-2.5">
          {['Page Load Performance Test', 'CTA Functionality Test', 'Form Submission Test', 'Lead Capture Verification', 'Mobile Layout Test', 'Console Error Check', 'SEO Basics', 'Accessibility Check', 'Cross-Browser Test', 'Security Headers Check'].map(check => (
            <Card key={check} className="p-4 flex items-center justify-between">
              <span className="text-sm text-foreground">{check}</span>
              <select
                defaultValue="pending"
                className="glass-input px-3 py-1.5 text-xs"
              >
                <option value="pending">Pending</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'receipts' && (
        <div className="space-y-2.5">
          {project.receipts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No receipts yet. Generate a builder handoff to create the first receipt.</p>
            </Card>
          ) : (
            project.receipts.map(receipt => (
              <Card key={receipt.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground capitalize">{receipt.type.replace(/-/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{receipt.summary}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(receipt.createdAt).toLocaleString()}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                    style={
                      receipt.status === 'approved'
                        ? { background: 'rgba(74,222,128,0.14)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.28)' }
                        : { background: 'rgba(245,217,107,0.14)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(245,217,107,0.28)' }
                    }
                  >
                    {receipt.status}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="space-y-5">
          <Card className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Preview URL</p>
            {project.previewUrl ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={project.previewUrl}
                  readOnly
                  className="glass-input flex-1 px-4 py-2.5 text-sm"
                />
                <GoldButton onClick={() => handleCopyToClipboard(project.previewUrl)}>
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </GoldButton>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No preview URL set yet.</p>
            )}
          </Card>
          <Card className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Readiness Score</p>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-black blue-shimmer">{project.readinessScore}%</div>
              <div className="flex-1">
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${project.readinessScore}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.55), rgba(255,255,255,0.70), rgba(255,255,255,0.90))' }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">Ready for release</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'delivery' && (
        <Card className="p-6">
          <div className="flex justify-end mb-4">
            <GoldButton onClick={() => handleCopyToClipboard(generateClientDeliveryPacket(project))}>
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy Packet'}
            </GoldButton>
          </div>
          <pre
            className="rounded-xl p-5 text-xs leading-relaxed whitespace-pre-wrap break-words max-h-96 overflow-y-auto font-mono text-foreground"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)', color: '#D4E8C0' }}
          >
            {generateClientDeliveryPacket(project)}
          </pre>
        </Card>
      )}

      {activeTab === 'governance' && (
        <div className="space-y-2.5">
          {[
            { name: 'Production Release', requires: 'Approval required', status: project.approvalStatus === 'approved' },
            { name: 'All Secrets in Env Vars', requires: 'Validation required', status: false },
            { name: 'Mobile Layout Tested', requires: 'QA required', status: project.releaseStatus !== 'not-ready' },
            { name: 'Console Error-Free', requires: 'Validation required', status: false },
            { name: 'Client Review Completed', requires: 'Approval required', status: project.approvalStatus === 'approved' },
            { name: 'Build Packet Generated', requires: 'System generated', status: project.receipts.some(r => r.type === 'builder-handoff') },
            { name: 'Source Truth Locked', requires: 'Source truth required', status: !!project.sourceTruth },
            { name: 'Readiness Score >= 80', requires: 'Score threshold', status: project.readinessScore >= 80 },
          ].map(gate => (
            <Card key={gate.name} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{gate.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{gate.requires}</p>
              </div>
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={
                  gate.status
                    ? { background: 'rgba(74,222,128,0.14)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.28)' }
                    : { background: 'rgba(248,113,113,0.14)', color: '#F87171', border: '1px solid rgba(248,113,113,0.28)' }
                }
              >
                {gate.status
                  ? <><CheckCircle size={12} /> Passed</>
                  : <><AlertCircle size={12} /> Required</>
                }
              </span>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(59,130,246,0.60)' }}>{label}</p>
      <p className="text-sm mt-0.5" style={{ color: '#FFFFFF' }}>{value}</p>
    </div>
  )
}

function SourceRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: 'rgba(59,130,246,0.60)' }}>{label}</p>
      <p className="text-sm leading-relaxed" style={{ color: '#FFFFFF' }}>{value}</p>
    </div>
  )
}
