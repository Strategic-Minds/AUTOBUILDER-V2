'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects } from '@/lib/storage'
import { Project, ClientReview } from '@/lib/types'
import { Eye, Mail, CheckCircle, Share2, Users } from 'lucide-react'
import { PageShell, Card, Badge, GoldButton, GhostButton } from '@/components/page-shell'

const STATUS_BADGE: Record<string, 'gold' | 'green' | 'blue' | 'gray'> = {
  draft:     'gray',
  sent:      'blue',
  'in-review': 'gold',
  approved:  'green',
}

const STATUS_BORDER: Record<string, string> = {
  draft:      'rgba(255,255,255,0.15)',
  sent:       'rgba(96,165,250,0.50)',
  'in-review':'rgba(59,130,246,0.70)',
  approved:   'rgba(74,222,128,0.50)',
}

const GOLD_GRADIENT = 'linear-gradient(135deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.70) 28%,rgba(255,255,255,0.90) 52%,rgba(255,255,255,0.55) 76%,rgba(255,255,255,0.70) 100%)'

export default function ClientReviewPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [reviews, setReviews] = useState<Record<string, ClientReview>>({})
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const all = getProjects()
    setProjects(all)
    const map: Record<string, ClientReview> = {}
    all.forEach(p => {
      map[p.id] = {
        projectId: p.id,
        status: ['draft', 'sent', 'in-review', 'approved'][Math.floor(Math.random() * 4)] as any,
        clientEmail: `client-${p.id.slice(0, 4)}@example.com`,
        clientFeedback: '',
        sections: [
          { name: 'Design',   previewUrl: `${p.previewUrl}/design`,   feedback: '', approved: false, notes: '' },
          { name: 'Copy',     previewUrl: `${p.previewUrl}/copy`,     feedback: '', approved: false, notes: '' },
          { name: 'Features', previewUrl: `${p.previewUrl}/features`, feedback: '', approved: false, notes: '' },
        ],
        shareUrl: `https://review.example.com/${p.id}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      }
    })
    setReviews(map)
    if (all.length > 0) setSelected(all[0].id)
  }, [])

  const review = selected ? reviews[selected] : null
  const proj   = selected ? projects.find(p => p.id === selected) : null

  return (
    <PageShell title="Client Review Portal" subtitle="Manage client approvals and feedback">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects list */}
        <div>
          <Card>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-bold text-foreground">Projects</h2>
            </div>
            <div className="p-3 space-y-1 max-h-[400px] overflow-y-auto">
              {projects.map(p => {
                const r = reviews[p.id]
                const isSelected = selected === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className="w-full text-left p-3 rounded-lg transition-all duration-150"
                    style={{
                      background: isSelected ? GOLD_GRADIENT : 'rgba(255,255,255,0.05)',
                      color: isSelected ? '#0A0A0A' : '#FFFFFF',
                      borderLeft: `3px solid ${isSelected ? 'rgba(255,255,255,0.90)' : (STATUS_BORDER[r?.status] ?? 'rgba(255,255,255,0.15)')}`,
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  >
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs opacity-60 mt-0.5 capitalize">{r?.status ?? 'draft'}</p>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {review ? (
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground">Review Status</h3>
                  <Badge color={STATUS_BADGE[review.status] ?? 'gray'}>{review.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Client Email', value: review.clientEmail },
                    { label: 'Created',      value: new Date(review.createdAt).toLocaleDateString() },
                    { label: 'Expires',      value: new Date(review.expiresAt).toLocaleDateString() },
                    { label: 'Status',       value: review.status },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="font-semibold text-foreground capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Review Sections</p>
                <div className="space-y-2.5">
                  {review.sections.map((section, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg p-3.5"
                      style={{
                        background: section.approved ? 'rgba(74,222,128,0.10)' : 'rgba(255,255,255,0.05)',
                        border: section.approved ? '1px solid rgba(74,222,128,0.28)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div>
                        <p className="font-semibold text-sm text-foreground">{section.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{section.previewUrl}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {section.approved && <CheckCircle size={16} style={{ color: '#4ADE80' }} />}
                        <button
                          className="flex items-center gap-1 text-xs font-semibold hover:underline blue-shimmer"
                        >
                          <Eye size={12} /> Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex gap-2 flex-wrap">
                {review.status === 'draft' && (
                  <GoldButton>
                    <Mail size={14} /> Send to Client
                  </GoldButton>
                )}
                <GhostButton>
                  <Share2 size={14} /> Copy Link
                </GhostButton>
                {proj && (
                  <Link href={`/projects/${proj.id}`}>
                    <GhostButton>Edit Project</GhostButton>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <Card className="p-16 text-center">
              <Users size={40} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.18)' }} />
              <p className="text-muted-foreground">No projects to review</p>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  )
}
