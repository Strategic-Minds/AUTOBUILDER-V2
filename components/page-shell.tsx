'use client'

import React from 'react'

/* ─────────────────────────────────────────────────────────────────
   CARD  — deep rich black glassmorphic panel
   Uses .glass-card utility from globals.css
───────────────────────────────────────────────────────────────── */
export function Card({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`glass-card glass-card-hover ${className}`} style={style}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   GOLD CARD  — doctrine / callout panel with metallic gold border
───────────────────────────────────────────────────────────────── */
export function GoldCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`glass-gold ${className}`}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   PAGE SHELL  — full-page wrapper with heading bar
───────────────────────────────────────────────────────────────── */
export function PageShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-2xl font-black tracking-tight uppercase leading-none"
              style={{ color: '#111111', letterSpacing: '-0.01em' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-2 leading-relaxed" style={{ color: '#444440' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SECTION HEADER  — label divider inside a page
───────────────────────────────────────────────────────────────── */
export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[10px] font-bold uppercase tracking-[0.20em] mb-3"
      style={{ color: 'rgba(59,130,246,0.60)' }}
    >
      {children}
    </h2>
  )
}

/* ─────────────────────────────────────────────────────────────────
   GOLD BUTTON  — metallic 5-stop gradient CTA
───────────────────────────────────────────────────────────────── */
export function GoldButton({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.97] ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.70) 28%, rgba(255,255,255,0.90) 52%, rgba(255,255,255,0.55) 76%, rgba(255,255,255,0.70) 100%)',
        color: '#0A0A0A',
        boxShadow: '0 0 20px rgba(59,130,246,0.50), 0 2px 8px rgba(59,130,246,0.50)',
        textShadow: '0 1px 2px rgba(255,255,255,0.25)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.70) 22%, rgba(255,255,255,0.70) 45%, rgba(255,255,255,0.90) 60%, rgba(255,255,255,0.55) 80%, rgba(255,255,255,0.70) 100%)'
        e.currentTarget.style.boxShadow = '0 0 32px rgba(59,130,246,0.70), 0 4px 16px rgba(59,130,246,0.60)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.70) 28%, rgba(255,255,255,0.90) 52%, rgba(255,255,255,0.55) 76%, rgba(255,255,255,0.70) 100%)'
        e.currentTarget.style.boxShadow = '0 0 20px rgba(59,130,246,0.50), 0 2px 8px rgba(59,130,246,0.50)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────
   GHOST BUTTON  — translucent white on dark glass
───────────────────────────────────────────────────────────────── */
export function GhostButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-ghost inline-flex items-center gap-1.5 px-4 py-2 rounded-lg
        text-sm font-medium ${className}`}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────
   BADGE  — small status pill
───────────────────────────────────────────────────────────────── */
export function Badge({
  children,
  color = 'gray',
}: {
  children: React.ReactNode
  color?: 'gold' | 'green' | 'red' | 'gray' | 'blue'
}) {
  const styles: Record<string, React.CSSProperties> = {
    gold: {
      background: 'linear-gradient(135deg, rgba(200,150,12,0.22) 0%, rgba(245,217,107,0.12) 100%)',
      color: 'rgba(255,255,255,0.70)',
      border: '1px solid rgba(59,130,246,0.50)',
      textShadow: '0 1px 4px rgba(59,130,246,0.35)',
    },
    green: {
      background: 'rgba(34,197,94,0.12)',
      color: '#4ADE80',
      border: '1px solid rgba(34,197,94,0.28)',
    },
    red: {
      background: 'rgba(239,68,68,0.12)',
      color: '#F87171',
      border: '1px solid rgba(239,68,68,0.28)',
    },
    gray: {
      background: 'rgba(255,255,255,0.07)',
      color: 'rgba(255,255,255,0.90)',
      border: '1px solid rgba(255,255,255,0.10)',
    },
    blue: {
      background: 'rgba(96,165,250,0.12)',
      color: '#93C5FD',
      border: '1px solid rgba(96,165,250,0.25)',
    },
  }

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
      style={styles[color]}
    >
      {children}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────
   GOLD LINK
───────────────────────────────────────────────────────────────── */
export function GoldLink({
  children,
  href,
  className = '',
}: {
  children: React.ReactNode
  href: string
  className?: string
}) {
  return (
    <a
      href={href}
      className={`blue-shimmer font-semibold hover:underline ${className}`}
    >
      {children}
    </a>
  )
}

/* ─────────────────────────────────────────────────────────────────
   STAT CARD  — glass stat tile (used across pages)
───────────────────────────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'rgba(255,255,255,0.90)',
  sub,
}: {
  label: string
  value: string | number
  icon?: React.ElementType
  accent?: string
  sub?: string
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(59,130,246,0.70)' }}>
          {label}
        </p>
        {Icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${accent}18`, boxShadow: `0 0 12px ${accent}28` }}
          >
            <Icon size={14} style={{ color: accent }} />
          </div>
        )}
      </div>
      <p className="text-3xl font-black tabular-nums leading-none" style={{ color: '#FFFFFF' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

