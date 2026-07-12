'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects } from '@/lib/storage'
import { AlertTriangle, AlertCircle, CheckCircle, Search } from 'lucide-react'
import { PageShell, Card, Badge, GoldButton } from '@/components/page-shell'

interface QAIssue {
  id: string
  projectId: string
  projectName: string
  issue: string
  severity: 'info' | 'warning' | 'blocked' | 'critical'
  recommendedFix: string
}

const SEV_ORDER = { critical: 0, blocked: 1, warning: 2, info: 3 }

const SEV_BADGE: Record<string, 'red' | 'gold' | 'blue' | 'gray'> = {
  critical: 'red',
  blocked:  'red',
  warning:  'gold',
  info:     'blue',
}

const SEV_CARD_STYLE: Record<string, React.CSSProperties> = {
  critical: { background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' },
  blocked:  { background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.18)' },
  warning:  { background: 'rgba(245,197,24,0.05)', border: '1px solid rgba(59,130,246,0.20)' },
  info:     { background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)' },
}

const SEV_ICON: Record<string, React.ReactElement> = {
  critical: <AlertTriangle size={16} style={{ color: '#F87171' }} />,
  blocked:  <AlertTriangle size={16} style={{ color: '#FCA5A5' }} />,
  warning:  <AlertTriangle size={16} style={{ color: '#FCD34D' }} />,
  info:     <AlertCircle  size={16} style={{ color: '#93C5FD' }} />,
}

export default function QAInspectorPage() {
  const [issues, setIssues] = useState<QAIssue[]>([])

  useEffect(() => {
    const projects = getProjects()
    const found: QAIssue[] = []

    projects.forEach(project => {
      if (!project.sourceTruth || Object.values(project.sourceTruth).some(v => !v))
        found.push({ id: `${project.id}-st`, projectId: project.id, projectName: project.name, issue: 'Source truth incomplete', severity: 'blocked', recommendedFix: 'Complete all source truth fields in project settings' })
      if (!project.offerIntake?.productName)
        found.push({ id: `${project.id}-offer`, projectId: project.id, projectName: project.name, issue: 'Missing offer definition', severity: 'blocked', recommendedFix: 'Define offer and target audience' })
      if (!project.selectedBrandPack)
        found.push({ id: `${project.id}-brand`, projectId: project.id, projectName: project.name, issue: 'No brand pack selected', severity: 'warning', recommendedFix: 'Choose a brand pack from templates' })
      if (!project.selectedWebsiteDesign)
        found.push({ id: `${project.id}-design`, projectId: project.id, projectName: project.name, issue: 'No website design selected', severity: 'warning', recommendedFix: 'Select a website design template' })
      if (project.blockers?.length > 0)
        found.push({ id: `${project.id}-blockers`, projectId: project.id, projectName: project.name, issue: `${project.blockers.length} open blocker(s)`, severity: 'critical', recommendedFix: 'Resolve all blockers before release' })
      if (project.approvalStatus !== 'approved')
        found.push({ id: `${project.id}-approval`, projectId: project.id, projectName: project.name, issue: 'Missing approval receipt', severity: 'blocked', recommendedFix: 'Get stakeholder approval' })
      const failedV = (project.receipts || []).filter(r => r.type === 'validation-check' && r.status === 'rejected')
      if (failedV.length > 0)
        found.push({ id: `${project.id}-val`, projectId: project.id, projectName: project.name, issue: `${failedV.length} failed validation check(s)`, severity: 'blocked', recommendedFix: 'Fix failed validations' })
      const stale = (Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (stale > 7)
        found.push({ id: `${project.id}-stale`, projectId: project.id, projectName: project.name, issue: `Project stale (${Math.floor(stale)} days)`, severity: 'warning', recommendedFix: 'Review and update project' })
    })

    found.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
    setIssues(found)
  }, [])

  const critical = issues.filter(i => i.severity === 'critical').length
  const blocked  = issues.filter(i => i.severity === 'blocked').length
  const warning  = issues.filter(i => i.severity === 'warning').length

  return (
    <PageShell title="QA Inspector" subtitle="Automated quality assurance checks across all projects">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Issues', value: issues.length,  color: '#FFFFFF' },
          { label: 'Critical',     value: critical,        color: '#F87171' },
          { label: 'Blocked',      value: blocked,         color: '#FCA5A5' },
          { label: 'Warnings',     value: warning,         color: '#FCD34D' },
        ].map(s => (
          <Card key={s.label} className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Issues */}
      {issues.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <CheckCircle size={40} className="mx-auto mb-3" style={{ color: '#4ADE80' }} />
          <p className="font-bold text-foreground">All projects are healthy!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {issues.map(issue => (
            <div key={issue.id} className="rounded-xl p-4 flex items-start justify-between gap-4" style={SEV_CARD_STYLE[issue.severity]}>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="mt-0.5 shrink-0">{SEV_ICON[issue.severity]}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-sm text-foreground">{issue.issue}</span>
                    <Badge color={SEV_BADGE[issue.severity]}>{issue.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Project: {issue.projectName}</p>
                  <p className="text-xs text-muted-foreground">Fix: {issue.recommendedFix}</p>
                </div>
              </div>
              <Link href={`/projects/${issue.projectId}`} className="blue-shimmer shrink-0 text-xs font-bold uppercase tracking-wider hover:underline">
                View →
              </Link>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
