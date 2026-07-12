'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getProjects, getStorage } from '@/lib/storage'
import { Project } from '@/lib/types'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  ArrowRight,
  Package,
  ShieldCheck,
  BarChart3,
  Globe,
  Layers,
} from 'lucide-react'

interface Stats {
  activeProjects: number
  inBuild: number
  waitingApproval: number
  validationPass: number
  blockers: number
  readyForReview: number
  released: number
}

const PHASE_STYLES: Record<string, React.CSSProperties> = {
  planning:   { color: '#C4B5FD', background: 'rgba(167,139,250,0.14)', border: '1px solid rgba(167,139,250,0.28)' },
  building:   { color: '#93C5FD', background: 'rgba(96,165,250,0.14)',  border: '1px solid rgba(96,165,250,0.28)' },
  validation: {
    color: 'rgba(255,255,255,0.70)',
    background: 'linear-gradient(135deg, rgba(200,150,12,0.18) 0%, rgba(245,217,107,0.10) 100%)',
    border: '1px solid rgba(255,255,255,0.22)',
  },
  deployment: { color: '#6EE7B7', background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.28)' },
  live:       { color: '#4ADE80', background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.28)' },
  archived:   { color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' },
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  active:    { color: '#4ADE80', background: 'rgba(74,222,128,0.13)' },
  blocked:   { color: '#F87171', background: 'rgba(248,113,113,0.13)' },
  'on-hold': { color: 'rgba(255,255,255,0.70)', background: 'rgba(245,217,107,0.13)' },
  completed: { color: 'rgba(255,255,255,0.78)', background: 'rgba(255,255,255,0.06)' },
}

/* gold bar gradient thresholds */
const barGradient = (score: number) =>
  score >= 80
    ? 'linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.70) 50%, rgba(255,255,255,0.90) 100%)'
    : score >= 50
      ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
      : '#F87171'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<Stats>({
    activeProjects: 0, inBuild: 0, waitingApproval: 0,
    validationPass: 0, blockers: 0, readyForReview: 0, released: 0,
  })

  useEffect(() => {
    const all = getProjects()
    setProjects(all)
    const data = getStorage()
    const checks = data.validationChecks || []
    const passed = checks.filter(c => c.status === 'pass').length
    setStats({
      activeProjects: all.length,
      inBuild: all.filter(p => p.phase === 'building').length,
      waitingApproval: all.filter(p => p.approvalStatus === 'pending').length,
      validationPass: checks.length > 0 ? Math.round((passed / checks.length) * 100) : 0,
      blockers: all.filter(p => p.blockers.length > 0).length,
      readyForReview: all.filter(p => p.releaseStatus === 'ready-for-review').length,
      released: all.filter(p => p.releaseStatus === 'released').length,
    })
  }, [])

  const avgReadiness = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + p.readinessScore, 0) / projects.length) : 0
  const releaseRate = projects.length > 0
    ? Math.round((stats.released / projects.length) * 100) : 0

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top bar — light frosted glass ── */}
      <header className="glass-header h-14 flex items-center justify-between px-8 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Image
            src="/xps-logo.png" alt="XPS Logo" width={28} height={28}
            className="rounded object-contain"
            style={{ background: 'rgba(10,10,10,0.90)', padding: '2px' }}
          />
          <div>
            <h1 className="text-[13px] font-bold tracking-wider uppercase leading-none" style={{ color: '#0A0A0A' }}>
              XPS Intelligence
            </h1>
            <p className="text-[10px] leading-none mt-0.5 tracking-widest uppercase" style={{ color: '#3A3835' }}>
              Command Center
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs hidden sm:block" style={{ color: '#3A3835' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <Link
            href="/new-website"
            className="flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-md transition-all duration-200 active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.70) 28%, rgba(255,255,255,0.90) 52%, rgba(255,255,255,0.55) 76%, rgba(255,255,255,0.70) 100%)',
              color: '#0A0A0A',
              boxShadow: '0 0 20px rgba(59,130,246,0.50), 0 2px 8px rgba(59,130,246,0.50)',
              letterSpacing: '0.05em',
            }}
          >
            <Zap size={12} />
            NEW PROJECT
          </Link>
        </div>
      </header>

      <div className="px-8 py-8 max-w-[1440px] mx-auto">

        {/* ── Hero heading ── */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-3xl font-black tracking-tight leading-none text-balance uppercase"
              style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}
            >
              Command Center
            </h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#2A2825' }}>
              AI generates. Vercel runs.{' '}
              <span className="font-semibold blue-shimmer">Xtreme validates.</span>
            </p>
          </div>
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0"
            style={{
              background: 'rgba(74,222,128,0.10)',
              border: '1px solid rgba(74,222,128,0.30)',
              color: '#4ADE80',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Factory Online
          </div>
        </div>

        {/* ── Primary stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GlassStatCard label="Total Projects"    value={stats.activeProjects}       icon={Package}    sub="All time"         accent="#93C5FD" />
          <GlassStatCard label="In Build"          value={stats.inBuild}              icon={Zap}        sub="Active builds"    accent="rgba(255,255,255,0.90)" />
          <GlassStatCard label="Awaiting Approval" value={stats.waitingApproval}      icon={Clock}      sub="Pending review"   accent={stats.waitingApproval > 0 ? '#FBBF24' : 'rgba(255,255,255,0.30)'} />
          <GlassStatCard label="Validation Rate"   value={`${stats.validationPass}%`} icon={ShieldCheck} sub="All-time pass rate" accent={stats.validationPass >= 80 ? '#4ADE80' : '#FBBF24'} />
        </div>

        {/* ── Mini stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <GlassMiniStat label="Active Blockers"  value={stats.blockers}       icon={AlertTriangle} danger={stats.blockers > 0} />
          <GlassMiniStat label="Ready for Review" value={stats.readyForReview} icon={CheckCircle2} />
          <GlassMiniStat label="Released"         value={stats.released}       icon={Activity} />
        </div>

        {/* ── Main 3-col grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Projects table — 2 cols */}
          <div className="xl:col-span-2 glass-card overflow-hidden">
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: 'rgba(59,130,246,0.70)' }}
              >
                Recent Projects
              </h3>
              <Link
                href="/projects"
                className="flex items-center gap-1 text-[11px] font-medium transition-colors blue-shimmer"
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="py-20 text-center px-6">
                <Layers size={36} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.18)' }} />
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>No projects yet.</p>
                <Link
                  href="/new-website"
                  className="text-xs font-bold uppercase tracking-widest blue-shimmer"
                >
                  Create your first project
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['Project', 'Phase', 'Status', 'Readiness', ''].map((h, i) => (
                        <th
                          key={i}
                          className={`py-3 text-[10px] font-bold uppercase tracking-[0.12em] ${i === 4 ? 'text-right pr-6' : i === 0 ? 'text-left pl-6' : 'text-left px-4'}`}
                          style={{ color: 'rgba(255,255,255,0.30)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.slice(0, 7).map((project, i) => (
                      <tr
                        key={project.id}
                        className="transition-colors"
                        style={{ borderBottom: i < Math.min(projects.length, 7) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="py-4 pl-6 pr-4">
                          <p className="font-semibold truncate max-w-[180px]" style={{ color: '#FFFFFF' }}>{project.name}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>{project.clientName}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize"
                            style={PHASE_STYLES[project.phase] ?? PHASE_STYLES.archived}>
                            {project.phase}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize"
                            style={STATUS_STYLES[project.status] ?? STATUS_STYLES.completed}>
                            {project.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${project.readinessScore}%`, background: barGradient(project.readinessScore) }} />
                            </div>
                            <span className="text-[11px] tabular-nums" style={{ color: 'rgba(255,255,255,0.85)' }}>
                              {project.readinessScore}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link href={`/projects/${project.id}`}
                            className="text-[11px] font-bold uppercase tracking-wider blue-shimmer"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Factory Health */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={14} style={{ color: "rgba(255,255,255,0.90)" }} />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  Factory Health
                </h3>
              </div>
              <div className="space-y-4">
                <GlassHealthRow label="Avg. Readiness"   value={`${avgReadiness}%`}          score={avgReadiness} />
                <GlassHealthRow label="Release Rate"     value={`${releaseRate}%`}            score={releaseRate} />
                <GlassHealthRow label="Validation Score" value={`${stats.validationPass}%`}   score={stats.validationPass} />
                <GlassHealthRow
                  label="Blocker Rate"
                  value={projects.length > 0 ? `${Math.round((stats.blockers / projects.length) * 100)}%` : '0%'}
                  score={projects.length > 0 ? 100 - Math.round((stats.blockers / projects.length) * 100) : 100}
                />
              </div>
            </div>

            {/* Doctrine callout — gold glass */}
            <div className="glass-gold p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'rgba(245,217,107,0.55)' }}>
                Doctrine
              </p>
              <div className="space-y-3">
                {[
                  'AI generates. Vercel runs. Xtreme validates.',
                  'Build the smallest version that proves the money path.',
                  'No release without receipts.',
                  'Source truth first. Build second. Validate before release.',
                ].map((line, i) => (
                  <p key={i} className="text-[12px] leading-relaxed pl-3"
                    style={{ color: 'rgba(255,255,255,0.95)', borderLeft: '2px solid rgba(255,255,255,0.30)' }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="glass-card p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Quick Actions
              </p>
              <div className="space-y-0.5">
                {[
                  { label: 'New Project',       href: '/new-website',       icon: Zap },
                  { label: 'Run Validation',    href: '/validation',        icon: ShieldCheck },
                  { label: 'Build Queue',       href: '/build-queue',       icon: Clock },
                  { label: 'Command Center',    href: '/command-center',    icon: TrendingUp },
                  { label: 'Market Validation', href: '/market-validation', icon: Globe },
                ].map(({ label, href, icon: Icon }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
                    style={{ color: 'rgba(255,255,255,0.90)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.70)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.90)'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <Icon size={13} className="shrink-0" style={{ color: 'inherit' }} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Brand footer strip — gold glass ── */}
        <div className="mt-10 glass-gold flex items-center justify-between py-4 px-6 rounded-xl">
          <div className="flex items-center gap-3">
            <Image src="/xps-logo.png" alt="XPS" width={28} height={28} className="rounded object-contain"
              style={{ background: 'rgba(10,10,10,0.90)', padding: '2px' }} />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest blue-shimmer">
                XPS Intelligence
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                National Epoxy Pros &mdash; Powered by XPS Intelligence
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
            <span>{projects.length} projects</span>
            <span style={{ color: 'rgba(59,130,246,0.35)' }}>|</span>
            <span>{stats.released} released</span>
            <span style={{ color: 'rgba(59,130,246,0.35)' }}>|</span>
            <span className="blue-shimmer">v3.0</span>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   PAGE-LOCAL SUB-COMPONENTS
════════════════════════════════════════ */

function GlassStatCard({
  label, value, icon: Icon, sub, accent = 'rgba(255,255,255,0.90)',
}: {
  label: string; value: string | number; icon: React.ElementType; sub?: string; accent?: string
}) {
  return (
    <div
      className="glass-card glass-card-hover p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(59,130,246,0.60)' }}>
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30`, boxShadow: `0 0 12px ${accent}20` }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-3xl font-black tabular-nums leading-none" style={{ color: '#FFFFFF' }}>
        {value}
      </p>
      {sub && <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.78)' }}>{sub}</p>}
    </div>
  )
}

function GlassMiniStat({
  label, value, icon: Icon, danger = false,
}: {
  label: string; value: number; icon: React.ElementType; danger?: boolean
}) {
  const accent = danger && value > 0 ? '#F87171' : 'rgba(255,255,255,0.50)'
  return (
    <div
      className="glass-card flex items-center justify-between px-5 py-3.5"
      style={danger && value > 0 ? { borderColor: 'rgba(248,113,113,0.30)' } : {}}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: accent }} />
        <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.90)' }}>{label}</span>
      </div>
      <span className="text-[15px] font-black tabular-nums" style={{ color: danger && value > 0 ? '#F87171' : '#FFFFFF' }}>
        {value}
      </span>
    </div>
  )
}

function GlassHealthRow({ label, value, score }: { label: string; value: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.82)' }}>{label}</span>
        <span className="text-[12px] font-bold tabular-nums" style={{ color: '#FFFFFF' }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, score)}%`, background: barGradient(score) }}
        />
      </div>
    </div>
  )
}
