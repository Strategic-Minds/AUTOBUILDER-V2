'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects } from '@/lib/storage'
import { Task } from '@/lib/types'
import { Zap, Plus } from 'lucide-react'
import { PageShell, Card, Badge, GoldButton } from '@/components/page-shell'

const STATUS_BADGE: Record<string, 'gold' | 'green' | 'red' | 'gray' | 'blue'> = {
  pending:     'gray',
  'in-progress': 'blue',
  passed:      'green',
  failed:      'red',
  blocked:     'gold',
}

const PRIORITY_BADGE: Record<string, 'gold' | 'green' | 'red' | 'gray'> = {
  critical: 'red',
  high:     'red',
  medium:   'gold',
  low:      'gray',
}

export default function BuildQueuePage() {
  const [tasks, setTasks] = useState<(Task & { projectName: string; projectId: string })[]>([])

  useEffect(() => {
    const projects = getProjects()
    const allTasks: (Task & { projectName: string; projectId: string })[] = []
    projects.forEach(project => {
      project.tasks.forEach(task => {
        allTasks.push({ ...task, projectName: project.name, projectId: project.id })
      })
    })
    setTasks(allTasks)
  }, [])

  return (
    <PageShell
      title="Build Queue"
      subtitle="Manage and track all build tasks across projects"
      action={
        <Link href="/new-website">
          <GoldButton>
            <Plus size={14} />
            New Project
          </GoldButton>
        </Link>
      }
    >
      {tasks.length === 0 ? (
        <Card className="p-16 text-center">
          <Zap size={44} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.18)' }} />
          <p className="text-muted-foreground mb-4">No build tasks yet</p>
          <Link href="/new-website">
            <GoldButton>Create a project</GoldButton>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="text-left py-3.5 px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Task</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Project</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Phase</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Status</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Priority</th>
                  <th className="text-right py-3.5 px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, i) => (
                  <tr
                    key={task.id}
                    className="transition-colors"
                    style={{
                      borderBottom: i < tasks.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="py-4 px-6">
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.nextAction}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/projects/${task.projectId}`}
                        className="font-medium hover:underline blue-shimmer"
                      >
                        {task.projectName}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-muted-foreground capitalize text-sm">{task.phase}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge color={STATUS_BADGE[task.status] ?? 'gray'}>{task.status}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge color={PRIORITY_BADGE[task.priority] ?? 'gray'}>{task.priority}</Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/projects/${task.projectId}`}
                        className="text-[12px] font-bold uppercase tracking-wider hover:underline blue-shimmer"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageShell>
  )
}
