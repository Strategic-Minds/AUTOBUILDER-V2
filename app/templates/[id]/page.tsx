'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getTemplate } from '@/lib/templates'
import { ArrowLeft, CheckCircle, Clock, Zap, ArrowRight, Users, FileText, Settings } from 'lucide-react'
import { PageShell, Card, GoldCard, Badge, GoldButton, GhostButton } from '@/components/page-shell'

const COMPLEXITY_STYLE: Record<string, React.CSSProperties> = {
  simple:   { background: 'rgba(74,222,128,0.14)',  color: '#4ADE80', border: '1px solid rgba(74,222,128,0.28)' },
  moderate: { background: 'rgba(245,217,107,0.14)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(245,217,107,0.28)' },
  complex:  { background: 'rgba(248,113,113,0.14)', color: '#F87171', border: '1px solid rgba(248,113,113,0.28)' },
}

const CATEGORY_LABEL: Record<string, string> = {
  landing:       'Landing Page',
  business:      'Business',
  'local-service': 'Local Service',
  portal:        'Portal',
  saas:          'SaaS',
  funnel:        'Sales Funnel',
  estimate:      'Estimate System',
  'ai-consulting': 'AI Consulting',
  ecommerce:     'E-Commerce',
  dashboard:     'Dashboard',
}

export default function TemplateDetailPage() {
  const params = useParams()
  const id = params.id as string
  const template = getTemplate(id)

  if (!template) {
    return (
      <PageShell title="Template Not Found" subtitle="The template you are looking for does not exist.">
        <Link href="/templates">
          <GhostButton><ArrowLeft size={14} /> Back to Templates</GhostButton>
        </Link>
      </PageShell>
    )
  }

  return (
    <PageShell title={template.name} subtitle={template.bestFor}>
      <div className="mb-6">
        <Link href="/templates">
          <GhostButton><ArrowLeft size={14} /> All Templates</GhostButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main detail */}
        <div className="lg:col-span-2 space-y-5">

          {/* Description */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge color="gold">{CATEGORY_LABEL[template.category] ?? template.category}</Badge>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={COMPLEXITY_STYLE[template.estimatedComplexity] ?? COMPLEXITY_STYLE.moderate}>
                {template.estimatedComplexity}
              </span>
            </div>
            <p className="leading-relaxed text-sm" style={{ color: 'rgba(255,255,255,0.90)' }}>{template.description}</p>
            <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { icon: Clock,     text: template.estimatedLaunchTime },
                { icon: Zap,       text: `${template.estimatedComplexity} complexity` },
                { icon: FileText,  text: `${template.requiredPages.length} pages` },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  <Icon size={14} style={{ color: 'rgba(59,130,246,0.70)' }} /> {text}
                </span>
              ))}
            </div>
          </Card>

          {/* Pages */}
          <Card className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-4" style={{ color: 'rgba(59,130,246,0.60)' }}>Required Pages</p>
            <div className="flex flex-wrap gap-2">
              {template.requiredPages.map((page, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', color: '#FFFFFF' }}>
                  {page}
                </span>
              ))}
            </div>
          </Card>

          {/* Sections */}
          <Card className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-4" style={{ color: 'rgba(59,130,246,0.60)' }}>Default Sections</p>
            <div className="grid grid-cols-2 gap-2.5">
              {template.defaultSections.map((section, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <CheckCircle size={13} style={{ color: 'rgba(255,255,255,0.90)', flexShrink: 0 }} />
                  {section}
                </div>
              ))}
            </div>
          </Card>

          {/* Validation Checks */}
          <Card className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-4" style={{ color: 'rgba(59,130,246,0.60)' }}>Built-In Validation Checks</p>
            <div className="space-y-2.5">
              {template.validationChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(74,222,128,0.12)' }}>
                    <CheckCircle size={12} style={{ color: '#4ADE80' }} />
                  </div>
                  {check}
                </div>
              ))}
            </div>
          </Card>

          {/* Lead Fields */}
          {template.leadFields.length > 0 && (
            <Card className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-4" style={{ color: 'rgba(59,130,246,0.60)' }}>Lead Capture Fields</p>
              <div className="flex flex-wrap gap-2">
                {template.leadFields.map((field, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.18)' }}>
                    {field}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Social Assets */}
          {template.socialAssets.length > 0 && (
            <Card className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-4" style={{ color: 'rgba(59,130,246,0.60)' }}>Social Launch Assets Included</p>
              <div className="space-y-2">
                {template.socialAssets.map((asset, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.90)' }} />
                    {asset}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* CTA Box */}
          <GoldCard className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: 'rgba(59,130,246,0.70)' }}>CTA Strategy</p>
            <p className="text-sm font-medium mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.90)' }}>{template.ctaStrategy}</p>
            <Link href={`/new-website?template=${template.id}`} className="block">
              <GoldButton className="w-full justify-center">Use This Template <ArrowRight size={14} /></GoldButton>
            </Link>
            <div className="mt-3">
              <Link href="/templates" className="block">
                <GhostButton className="w-full justify-center">Browse All <ArrowRight size={13} /></GhostButton>
              </Link>
            </div>
          </GoldCard>

          {/* Quick Stats */}
          <Card className="p-5 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(59,130,246,0.60)' }}>At a Glance</p>
            {[
              { icon: Clock,    label: 'Launch Time', value: template.estimatedLaunchTime },
              { icon: Zap,      label: 'Complexity',  value: template.estimatedComplexity },
              { icon: FileText, label: 'Pages',       value: `${template.requiredPages.length} pages` },
              { icon: Users,    label: 'Lead Fields', value: `${template.leadFields.length} fields` },
              { icon: Settings, label: 'Workflow',    value: template.recommendedWorkflow.replace(/-/g, ' ') },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  <Icon size={13} style={{ color: 'rgba(59,130,246,0.70)' }} /> {label}
                </span>
                <span className="text-sm font-semibold capitalize" style={{ color: '#FFFFFF' }}>{value}</span>
              </div>
            ))}
          </Card>

          {/* Recommended Workflow */}
          <Card className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: 'rgba(59,130,246,0.60)' }}>Recommended Workflow</p>
            <div className="px-4 py-3 rounded-lg text-sm font-semibold capitalize" style={{ background: 'linear-gradient(135deg,rgba(200,150,12,0.18),rgba(59,130,246,0.10))', border: '1px solid rgba(59,130,246,0.35)', color: 'rgba(255,255,255,0.70)' }}>
              {template.recommendedWorkflow.replace(/-/g, ' ')}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
