'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects } from '@/lib/storage'
import { Project } from '@/lib/types'
import { FolderOpen, ArrowRight, Plus } from 'lucide-react'
import { PageShell, Card, Badge, GoldButton } from '@/components/page-shell'

const PHASE_BADGE: Record<string, 'gold' | 'green' | 'red' | 'gray' | 'blue'> = {
  planning:   'gray',
  building:   'blue',
  validation: 'gold',
  deployment: 'green',
  live:       'green',
  archived:   'gray',
}

const STATUS_BADGE: Record<string, 'gold' | 'green' | 'red' | 'gray' | 'blue'> = {
  active:    'green',
  blocked:   'red',
  'on-hold': 'gold',
  completed: 'gray',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    setProjects(getProjects())
  }, [])

  return (
    <PageShell
      title="Projects"
      subtitle="Manage and track all website projects"
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
          <FolderOpen size={44} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.18)' }} />
          <h2 className="text-xl font-bold text-foreground mb-2">No projects yet</h2>
          <p className="text-muted-foreground mb-6">Create your first website project to get started</p>
          <Link href="/new-website">
            <GoldButton>
              <Plus size={14} />
              Create New Project
            </GoldButton>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="p-6 glass-card-hover cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate transition-colors group-hover:text-[rgba(255,255,255,0.70)]">
                      {project.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-0.5">{project.clientName}</p>
                  </div>
                  <ArrowRight size={18} className="transition-colors shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }} />
                </div>

                <p className="text-muted-foreground text-sm mb-5">{project.industry}</p>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Phase</span>
                    <Badge color={PHASE_BADGE[project.phase] ?? 'gray'}>{project.phase}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Status</span>
                    <Badge color={STATUS_BADGE[project.status] ?? 'gray'}>{project.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Readiness</span>
                    <span className="font-semibold text-sm text-foreground">{project.readinessScore}%</span>
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${project.readinessScore}%`,
                      background: project.readinessScore >= 80
                        ? 'linear-gradient(90deg,rgba(255,255,255,0.55),rgba(255,255,255,0.70),rgba(255,255,255,0.90))'
                        : project.readinessScore >= 50
                        ? '#FCD34D'
                        : '#F87171',
                    }}
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  {project.blockers.length > 0 && (
                    <Badge color="red">{project.blockers.length} blocker{project.blockers.length !== 1 ? 's' : ''}</Badge>
                  )}
                  {project.approvalStatus === 'approved' && (
                    <Badge color="green">Approved</Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  )
}

