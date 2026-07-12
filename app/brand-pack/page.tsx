'use client'

import { useState } from 'react'
import {
  Palette, Type, AlignLeft, MousePointer, Camera, PenTool,
  Volume2, Tag, Globe, Accessibility, Layers, Download,
  Lock, CheckCircle2, RefreshCw, Copy,
} from 'lucide-react'
import { PageShell, Card, GoldCard, GoldButton, GhostButton, Badge, StatCard, SectionHeader } from '@/components/page-shell'
import { XpsAgent } from '@/components/xps-agent'

// ─── Brand token schema ───────────────────────────────────────────────────────
interface ColorToken { name: string; hex: string; role: string }
interface FontToken   { name: string; stack: string; weight: string; usage: string }

const DEFAULT_COLORS: ColorToken[] = [
  { name: 'Gold',         hex: 'rgba(255,255,255,0.90)', role: 'Primary brand, CTAs, accents' },
  { name: 'Deep Black',   hex: '#0A0A08', role: 'Backgrounds, deep glass' },
  { name: 'Off-White',    hex: '#F5F3EF', role: 'Body text, light surfaces' },
  { name: 'Steel',        hex: '#2C2C2A', role: 'Cards, secondary surfaces' },
  { name: 'Amber',        hex: 'rgba(255,255,255,0.55)', role: 'Hover states, borders' },
]

const DEFAULT_FONTS: FontToken[] = [
  { name: 'Heading',  stack: 'Geist / Inter',     weight: '700–900', usage: 'H1, H2, hero text' },
  { name: 'Body',     stack: 'Geist / System UI', weight: '400–500', usage: 'Paragraphs, labels' },
  { name: 'Mono',     stack: 'Geist Mono',        weight: '400',     usage: 'Code, IDs, data' },
]

const TABS = ['Guidelines', 'Colors', 'Typography', 'Voice', 'Spacing', 'Components', 'Manifest']

const BRAND_SECTIONS = [
  {
    id: 'mission', label: 'Mission', icon: Globe,
    content: 'We exist to transform ordinary concrete into flawless, durable surfaces that elevate how people live and work — delivered with precision, backed by a warranty no competitor can match.',
  },
  {
    id: 'vision', label: 'Vision', icon: Layers,
    content: 'To be the most trusted surface coating company in Texas, recognized for zero-callback quality, on-time execution, and a client experience so exceptional that every job becomes a referral.',
  },
  {
    id: 'values', label: 'Values', icon: CheckCircle2,
    content: 'Precision over speed. Warranty that means something. No sub-contractors, ever. Transparency on every quote. Done right or we do it again.',
  },
]

const VOICE_DESCRIPTORS = [
  { word: 'Direct',       opp: 'Meandering'    },
  { word: 'Confident',    opp: 'Apologetic'    },
  { word: 'Expert',       opp: 'Generic'       },
  { word: 'Warm',         opp: 'Cold/Clinical' },
  { word: 'Premium',      opp: 'Cheap'         },
]

const COMPONENT_STYLES = [
  { name: 'Primary Button',  style: 'Gold gradient, 0.75rem radius, 700 weight, shadow glow' },
  { name: 'Ghost Button',    style: 'Translucent white, 0.75rem radius, border 1px' },
  { name: 'Card',            style: 'Deep glass bg, blur 40px, gold-tinted border on hover' },
  { name: 'Input',           style: 'Glass fill, white border 10%, gold focus ring' },
  { name: 'Badge',           style: 'Pill shape, category-color background at 12% opacity' },
  { name: 'Icon Style',      style: '14–20px, stroke-width 1.5, consistent with Lucide library' },
]

export default function BrandPackPage() {
  const [activeTab, setActiveTab] = useState('Guidelines')
  const [colors, setColors] = useState<ColorToken[]>(DEFAULT_COLORS)
  const [editingColor, setEditingColor] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex)
    setCopied(hex)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <PageShell
      title="Brand Pack"
      subtitle="Phase 2 — Complete brand identity system. Every token becomes reusable across all phases."
      action={
        <div className="flex items-center gap-3">
          <Badge color="gold">v1.0 — Draft</Badge>
          <GhostButton><RefreshCw size={14} /> Regenerate</GhostButton>
          <GoldButton><Download size={14} /> Export Pack</GoldButton>
        </div>
      }
    >
      {/* Doctrine */}
      <GoldCard className="p-4 mb-6 flex items-start gap-3">
        <Lock size={16} style={{ color: 'rgba(255,255,255,0.90)', marginTop: 2, flexShrink: 0 }} />
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
          <span className="font-bold" style={{ color: 'rgba(255,255,255,0.70)' }}>Brand Pack Doctrine.</span>
          {' '}Every design token, guideline, and voice rule defined here is referenced by the Website Pack, Content Pack, AI Pack, and every future agent. Never duplicate brand information — extend this manifest instead.
        </p>
      </GoldCard>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Color Tokens"    value={colors.length}     icon={Palette}    accent="rgba(255,255,255,0.90)" />
        <StatCard label="Font Families"   value={DEFAULT_FONTS.length} icon={Type}    accent="#93C5FD" />
        <StatCard label="Components"      value={COMPONENT_STYLES.length} icon={Layers} accent="#4ADE80" />
        <StatCard label="Phase"           value="2 of 10"           icon={Globe}      accent="#F87171" sub="Brand System" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 px-3 rounded-lg text-[12px] font-semibold transition-all duration-150"
            style={{
              background: activeTab === tab ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: activeTab === tab ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.55)',
              border: activeTab === tab ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Guidelines Tab ── */}
      {activeTab === 'Guidelines' && (
        <div className="grid grid-cols-3 gap-4">
          {BRAND_SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <Card key={s.id} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <Icon size={13} style={{ color: 'rgba(255,255,255,0.90)' }} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(245,197,24,0.70)' }}>{s.label}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.80)' }}>{s.content}</p>
              </Card>
            )
          })}
          <Card className="p-5 col-span-3">
            <SectionHeader>Brand Rules — Non-Negotiable</SectionHeader>
            <div className="grid grid-cols-3 gap-3">
              {[
                'Never use "affordable" or "cheap" in any copy.',
                'Always lead with the guarantee or warranty.',
                'Gold is the only accent color. Never use purple.',
                'Photos must show finished floors only — no mid-job mess.',
                'Every CTA must include a specific action and time: "Get your free estimate today."',
                'All body text minimum 14px, minimum 4.5:1 contrast ratio.',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[11px] font-black mt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.90)' }}>→</span>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.75)' }}>{rule}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Colors Tab ── */}
      {activeTab === 'Colors' && (
        <div className="space-y-4">
          <Card className="p-5">
            <SectionHeader>Color Palette — Design Tokens</SectionHeader>
            <div className="grid grid-cols-5 gap-3">
              {colors.map((c, i) => (
                <div key={i} className="space-y-2">
                  <div
                    className="w-full h-20 rounded-xl cursor-pointer relative group"
                    style={{ background: c.hex, border: '1px solid rgba(255,255,255,0.12)' }}
                    onClick={() => copyHex(c.hex)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy size={16} style={{ color: c.hex === '#F5F3EF' ? '#000' : '#fff' }} />
                    </div>
                    {copied === c.hex && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <CheckCircle2 size={20} style={{ color: '#4ADE80' }} />
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] font-bold text-white">{c.name}</p>
                  <p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.90)' }}>{c.hex}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{c.role}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <SectionHeader>Design Token Variables</SectionHeader>
            <div className="font-mono text-[12px] space-y-1.5 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                '--color-gold:         rgba(255,255,255,0.90);',
                '--color-gold-dark:    rgba(255,255,255,0.55);',
                '--color-gold-light:   rgba(255,255,255,0.70);',
                '--color-background:   #0A0A08;',
                '--color-surface:      rgba(255,255,255,0.04);',
                '--color-text:         #FFFFFF;',
                '--color-text-muted:   rgba(255,255,255,0.55);',
                '--color-border:       rgba(255,255,255,0.10);',
                '--color-border-gold:  rgba(59,130,246,0.35);',
                '--radius-sm:          0.5rem;',
                '--radius-base:        0.75rem;',
                '--radius-lg:          1.25rem;',
              ].map((line, i) => (
                <p key={i} style={{ color: line.startsWith('--color-gold') ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.70)' }}>{line}</p>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Typography Tab ── */}
      {activeTab === 'Typography' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {DEFAULT_FONTS.map((f, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Type size={14} style={{ color: 'rgba(255,255,255,0.90)' }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(245,197,24,0.70)' }}>{f.name} Font</span>
                </div>
                <p className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'inherit' }}>{f.stack}</p>
                <div className="space-y-1.5 mt-4">
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>Weight</span>
                    <span style={{ color: 'rgba(255,255,255,0.70)' }}>{f.weight}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>Usage</span>
                    <span style={{ color: 'rgba(255,255,255,0.75)' }}>{f.usage}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <SectionHeader>Type Scale</SectionHeader>
            <div className="space-y-3">
              {[
                { label: 'Display',  size: '48px / 3rem',   weight: '900', sample: 'The Floor You Deserve' },
                { label: 'H1',       size: '36px / 2.25rem', weight: '800', sample: 'Professional Epoxy Flooring' },
                { label: 'H2',       size: '24px / 1.5rem',  weight: '700', sample: 'Our Service Areas' },
                { label: 'H3',       size: '18px / 1.125rem',weight: '600', sample: 'What customers say' },
                { label: 'Body Lg',  size: '16px / 1rem',    weight: '400', sample: 'We grind, coat, and seal your concrete floor to last.' },
                { label: 'Body Sm',  size: '14px / 0.875rem',weight: '400', sample: 'Free on-site estimates across Houston and surrounding areas.' },
                { label: 'Label',    size: '11px / 0.6875rem',weight: '700', sample: 'CALL US TODAY' },
              ].map((t, i) => (
                <div key={i} className="flex items-baseline gap-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-20 shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(245,197,24,0.60)' }}>{t.label}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.size} / {t.weight}</p>
                  </div>
                  <p style={{ fontSize: t.size.split('/')[0].trim(), fontWeight: t.weight, color: '#FFFFFF', lineHeight: 1.2 }}>{t.sample}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Voice Tab ── */}
      {activeTab === 'Voice' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <SectionHeader>Voice Descriptors</SectionHeader>
              <div className="space-y-3">
                {VOICE_DESCRIPTORS.map((v, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white w-28">{v.word}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)' }}>
                      <div className="h-full rounded-full" style={{ width: '80%', background: 'linear-gradient(90deg, rgba(255,255,255,0.55), rgba(255,255,255,0.70))' }} />
                    </div>
                    <span className="text-[11px] w-24 text-right line-through" style={{ color: 'rgba(255,255,255,0.30)' }}>not {v.opp}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <SectionHeader>Tagline Options</SectionHeader>
              <div className="space-y-2">
                {[
                  'Built to Last. Backed by Warranty.',
                  'Precision Surfaces. Professional Results.',
                  'From Concrete to Showroom. In a Day.',
                  'The Last Floor You\'ll Ever Need to Install.',
                  'We Coat It Right. We Warrant It Forever.',
                ].map((tag, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <span className="text-[11px] font-black" style={{ color: 'rgba(59,130,246,0.60)' }}>0{i + 1}</span>
                    <p className="text-sm font-medium text-white">{tag}</p>
                    <button onClick={() => copyHex(tag)} className="ml-auto shrink-0"><Copy size={12} style={{ color: 'rgba(255,255,255,0.35)' }} /></button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card className="p-5">
            <SectionHeader>Copywriting Rules</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              {[
                { rule: 'Lead with the guarantee.', example: '"Backed by our 10-year warranty" before listing features.' },
                { rule: 'Name the buyer.', example: '"Houston homeowners" not "our customers".' },
                { rule: 'Use specific numbers.', example: '"400+ jobs" not "hundreds of jobs".' },
                { rule: 'Action CTAs only.', example: '"Schedule your free estimate" not "Contact us".' },
                { rule: 'Short sentences in hero.', example: 'Max 12 words. One idea per sentence.' },
                { rule: 'Never use passive voice.', example: '"We coat your floor" not "Your floor will be coated".' },
              ].map((r, i) => (
                <div key={i} className="p-3 rounded-lg space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[12px] font-bold text-white">{r.rule}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.50)' }}>{r.example}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Spacing Tab ── */}
      {activeTab === 'Spacing' && (
        <Card className="p-6">
          <SectionHeader>Spacing Scale</SectionHeader>
          <div className="space-y-3">
            {[2,4,6,8,10,12,16,20,24,32,40,48,64].map(v => (
              <div key={v} className="flex items-center gap-4">
                <span className="text-[11px] font-mono w-8 shrink-0" style={{ color: 'rgba(255,255,255,0.90)' }}>{v}</span>
                <div className="rounded" style={{ width: v * 4, height: 12, background: 'linear-gradient(90deg, rgba(245,197,24,0.5), rgba(59,130,246,0.15))' }} />
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{v / 4}rem / {v * 4}px</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Components Tab ── */}
      {activeTab === 'Components' && (
        <div className="space-y-4">
          <Card className="p-5">
            <SectionHeader>Component Style Guide</SectionHeader>
            <div className="space-y-3">
              {COMPONENT_STYLES.map((c, i) => (
                <div key={i} className="flex items-start gap-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-sm font-bold text-white w-36 shrink-0">{c.name}</span>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.60)' }}>{c.style}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <SectionHeader>Live Examples</SectionHeader>
            <div className="flex flex-wrap gap-3 items-center">
              <GoldButton>Primary CTA</GoldButton>
              <GhostButton>Secondary Action</GhostButton>
              <Badge color="gold">Gold</Badge>
              <Badge color="green">Active</Badge>
              <Badge color="red">Blocked</Badge>
              <Badge color="blue">Review</Badge>
            </div>
          </Card>
        </div>
      )}

      {/* ── Manifest Tab ── */}
      {activeTab === 'Manifest' && (
        <Card className="p-6">
          <SectionHeader>Brand Manifest — Exportable JSON</SectionHeader>
          <div className="font-mono text-[11px] leading-relaxed p-4 rounded-xl overflow-auto max-h-[520px]"
            style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.70)' }}>
            <pre>{JSON.stringify({
              brand: {
                name: 'National Epoxy Pros',
                version: '1.0.0',
                lockedAt: new Date().toISOString(),
                colors: { primary: 'rgba(255,255,255,0.90)', background: '#0A0A08', text: '#FFFFFF' },
                fonts: { heading: 'Geist', body: 'Geist', mono: 'Geist Mono' },
                radius: '0.75rem',
                voice: { tone: 'Direct & Confident', tagline: 'Built to Last. Backed by Warranty.' },
                mission: 'Transform ordinary concrete into flawless, durable surfaces.',
                values: ['Precision', 'Warranty', 'No sub-contractors', 'Transparency'],
              }
            }, null, 2)}</pre>
          </div>
          <div className="flex gap-3 mt-4">
            <GhostButton><Copy size={14} /> Copy JSON</GhostButton>
            <GoldButton><Download size={14} /> Download manifest.json</GoldButton>
          </div>
        </Card>
      )}
      <XpsAgent
        pageLabel="Phase 2 — Brand Pack"
        greeting="I'm your XPS Brand Agent. Let's define the look and feel of this business. Describe the emotion you want clients to feel when they land on the site — bold and industrial? Clean and professional? Premium and luxury? Tell me about the brand."
        context="The user is building the Brand Pack for Phase 2 of their website build. Help them define brand colors, typography, voice, tone, and visual style. Ask about competitors, what they admire visually, their target client's taste, and the feeling they want to convey."
      />
    </PageShell>
  )
}
