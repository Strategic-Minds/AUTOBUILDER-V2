'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects, addValidationCheck } from '@/lib/storage'
import { Project, ValidationCheck } from '@/lib/types'
import { CheckCircle2, XCircle, ShieldCheck, Plus, ArrowRight } from 'lucide-react'
import { PageShell, Card, GoldButton } from '@/components/page-shell'

const VALIDATION_RULES = [
  'Page Load Performance',
  'CTA Functionality',
  'Form Submission',
  'Lead Capture',
  'Mobile Layout',
  'Console Errors',
  'SEO Basics',
  'Accessibility Standards',
]

export default function ValidationPage() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    setProjects(getProjects())
  }, [])

  const handleCheck = (projectId: string, ruleName: string, passed: boolean) => {
    const check: ValidationCheck = {
      id: `check-${Date.now()}`,
      projectId,
      name: ruleName,
      status: passed ? 'pass' : 'fail',
      timestamp: new Date().toISOString(),
      evidence: `${ruleName} ${passed ? 'passed' : 'failed'} validation`,
      repairAction: passed ? undefined : 'Review and fix issues',
    }
    addValidationCheck(projectId, check)
  }

  return (
    <PageShell
      title="Validation Center"
      subtitle="Track validation checks across all projects"
      action={
        <Link href="/new-website">
          <GoldButton>
            <Plus size={14} />
            New Project
          </GoldButton>
        </Link>
      }
    >
      {projects.length === 0 ? (
        <Card className="p-16 text-center">
          <ShieldCheck size={44} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.18)' }} />
          <p className="text-muted-foreground mb-4">No projects yet</p>
          <Link href="/new-website">
            <GoldButton>Create a project</GoldButton>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map(project => (
            <Card key={project.id} className="overflow-hidden">
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div>
                  <h2 className="text-base font-bold text-foreground">{project.name}</h2>
                  <p className="text-sm text-muted-foreground">{project.clientName}</p>
                </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-1 text-sm font-semibold hover:underline blue-shimmer"
                >
                  View Project <ArrowRight size={13} />
                </Link>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                {VALIDATION_RULES.map(rule => (
                  <div
                    key={rule}
                    className="flex items-center justify-between rounded-lg px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{rule}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Click to record result</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleCheck(project.id, rule, true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                        style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.30)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,222,128,0.22)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(74,222,128,0.12)')}
                      >
                        <CheckCircle2 size={12} /> Pass
                      </button>
                      <button
                        onClick={() => handleCheck(project.id, rule, false)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                        style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.30)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.22)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.12)')}
                      >
                        <XCircle size={12} /> Fail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
