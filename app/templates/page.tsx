'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TEMPLATES } from '@/lib/templates'
import { Template } from '@/lib/types'
import { ArrowRight, Zap, Clock } from 'lucide-react'
import { PageShell, Card, Badge, GoldButton, GhostButton } from '@/components/page-shell'

const GOLD_GRADIENT = 'linear-gradient(135deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.70) 28%,rgba(255,255,255,0.90) 52%,rgba(255,255,255,0.55) 76%,rgba(255,255,255,0.70) 100%)'

type Category = Template['category'] | 'all'

const CATEGORIES: { id: Category; name: string }[] = [
  { id: 'all',            name: 'All Templates' },
  { id: 'landing',        name: 'Landing Pages' },
  { id: 'business',       name: 'Business' },
  { id: 'local-service',  name: 'Local Services' },
  { id: 'portal',         name: 'Portals' },
  { id: 'saas',           name: 'SaaS' },
  { id: 'funnel',         name: 'Sales Funnels' },
  { id: 'estimate',       name: 'Estimates' },
  { id: 'ai-consulting',  name: 'AI Consulting' },
  { id: 'ecommerce',      name: 'E-Commerce' },
  { id: 'dashboard',      name: 'Dashboards' },
]

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all')

  const filtered = selectedCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === selectedCategory)

  return (
    <PageShell title="Template Library" subtitle="Choose a reusable template to accelerate your project">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={
              selectedCategory === cat.id
                ? { background: GOLD_GRADIENT, color: '#0A0A0A', boxShadow: '0 0 16px rgba(59,130,246,0.45)' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.09)' }
            }
            onMouseEnter={e => { if (selectedCategory !== cat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
            onMouseLeave={e => { if (selectedCategory !== cat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No templates in this category yet.</p>
          <GhostButton onClick={() => setSelectedCategory('all')}>View all templates</GhostButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(template => (
            <Card key={template.id} className="p-6 flex flex-col glass-card-hover group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-foreground truncate">{template.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{template.bestFor}</p>
                </div>
                <Badge color="gold">{template.category.replace('-', ' ')}</Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-1">{template.description}</p>

              <div className="space-y-2 mb-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Pages</p>
                  <p className="text-sm text-foreground">{template.requiredPages.join(', ')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">CTA Strategy</p>
                  <p className="text-sm text-foreground">{template.ctaStrategy}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Zap size={12} /> {template.estimatedComplexity}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {template.estimatedLaunchTime}</span>
              </div>

              <div className="flex gap-2">
                <Link href={`/new-website?template=${template.id}`} className="flex-1">
                  <GoldButton className="w-full justify-center">
                    Use Template <ArrowRight size={14} />
                  </GoldButton>
                </Link>
                <Link href={`/templates/${template.id}`}>
                  <GhostButton>Details</GhostButton>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
