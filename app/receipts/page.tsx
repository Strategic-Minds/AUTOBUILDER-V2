'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects } from '@/lib/storage'
import { Receipt } from '@/lib/types'
import { FileText, Plus } from 'lucide-react'
import { PageShell, Card, Badge, GoldButton } from '@/components/page-shell'

const TYPE_BADGE: Record<string, 'gold' | 'green' | 'red' | 'gray' | 'blue'> = {
  'source-truth':    'blue',
  'builder-handoff': 'gray',
  'validation-check':'green',
  'client-review':   'gold',
  approval:          'green',
  'cron-heartbeat':  'gold',
  release:           'green',
}

const STATUS_BADGE: Record<string, 'gold' | 'green' | 'red' | 'gray'> = {
  approved: 'green',
  rejected: 'red',
  pending:  'gold',
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<(Receipt & { projectName: string; projectId: string })[]>([])

  useEffect(() => {
    const projects = getProjects()
    const allReceipts: (Receipt & { projectName: string; projectId: string })[] = []
    projects.forEach(project => {
      project.receipts.forEach(receipt => {
        allReceipts.push({ ...receipt, projectName: project.name, projectId: project.id })
      })
    })
    setReceipts(allReceipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }, [])

  return (
    <PageShell
      title="Receipts & Audit Log"
      subtitle="Complete activity record with evidence"
      action={
        <Link href="/new-website">
          <GoldButton><Plus size={14} /> New Project</GoldButton>
        </Link>
      }
    >
      {receipts.length === 0 ? (
        <Card className="p-16 text-center">
          <FileText size={44} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.18)' }} />
          <p className="text-muted-foreground mb-4">No receipts yet. Create a project to generate receipts.</p>
          <Link href="/new-website"><GoldButton>Create a project</GoldButton></Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {receipts.map(receipt => (
            <Card key={receipt.id} className="p-6">
              <div className="flex items-start gap-3 mb-3">
                <Badge color={TYPE_BADGE[receipt.type] ?? 'gray'}>{receipt.type.replace(/-/g, ' ')}</Badge>
                <Badge color={STATUS_BADGE[receipt.status] ?? 'gold'}>{receipt.status}</Badge>
              </div>
              <h3 className="font-bold text-foreground mb-1.5">{receipt.summary}</h3>
              <p className="text-sm text-muted-foreground mb-4">{receipt.notes}</p>
              <div className="flex flex-wrap gap-8 text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Project</p>
                  <Link href={`/projects/${receipt.projectId}`} className="font-semibold hover:underline blue-shimmer">
                    {receipt.projectName}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                  <p className="font-medium text-foreground">{new Date(receipt.createdAt).toLocaleString()}</p>
                </div>
                {receipt.approvedBy && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Approved By</p>
                    <p className="font-medium text-foreground">{receipt.approvedBy}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}

