'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Eye, EyeOff, ArrowRight, Lock, Shield, CheckCircle, Cpu,
} from 'lucide-react'

type AuthMode = 'login' | 'signup'

const DIM   = 'rgba(255,255,255,0.38)'
const EDGE  = 'rgba(255,255,255,0.08)'
const BLUE  = '#3B82F6'

const STATS = [
  { value: '9',    label: 'Active Modules' },
  { value: '100%', label: 'Automated Pipeline' },
  { value: '2wk',  label: 'Avg Site Launch' },
]

export default function LoginPage() {
  const router = useRouter()
  const [mode,       setMode]       = useState<AuthMode>('login')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [focused,    setFocused]    = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  useEffect(() => {
    createClient().auth.getUser()
      .then(({ data: { user } }) => { if (user) router.replace('/dashboard') })
      .catch(() => {})
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(''); setSubmitting(true)
    const client = createClient()
    if (mode === 'login') {
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setSubmitting(false) }
      else router.push('/dashboard')
    } else {
      const { error } = await client.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setSuccess('Check your email to confirm your account.')
      setSubmitting(false)
    }
  }

  const inputStyle = (name: string) => ({
    width: '100%',
    padding: '13px 16px 13px 42px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${focused === name ? 'rgba(59,130,246,0.55)' : EDGE}`,
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
    boxShadow: focused === name ? `0 0 0 3px rgba(59,130,246,0.10)` : 'none',
  })

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 52,
        background: 'rgba(8,8,8,0.95)', borderBottom: `1px solid ${EDGE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, overflow: 'hidden', border: `1px solid ${EDGE}`, flexShrink: 0 }}>
            <Image src="/xps-logo.png" alt="XPS" width={26} height={26} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.10em' }}>XPS INTELLIGENCE</span>
          <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, fontFamily: 'monospace' }}>// AI BUILD OS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: `1px solid ${EDGE}`, borderRadius: 6, padding: '4px 12px' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.14em' }}>ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Page body — single centered column */}
      <div style={{ flex: 1, paddingTop: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 60px' }}>

        {/* Logo + headline */}
        <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 520 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, overflow: 'hidden', border: `1px solid rgba(59,130,246,0.25)`, boxShadow: '0 0 40px rgba(59,130,246,0.12)' }}>
              <Image src="/xps-logo.png" alt="XPS Intelligence" width={72} height={72} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          <p style={{ color: 'rgba(59,130,246,0.80)', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.26em', marginBottom: 16, textTransform: 'uppercase' }}>
            AI-POWERED BUILD OS
          </p>
          <h1 style={{ color: '#fff', fontSize: 40, fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.03em', margin: '0 0 18px' }}>
            The operating system<br />for websites at scale.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            One AI command center that runs your entire website delivery pipeline — from client intake to launch.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 48, border: `1px solid ${EDGE}`, borderRadius: 14, overflow: 'hidden', width: '100%', maxWidth: 480 }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              flex: 1, padding: '20px 0', textAlign: 'center',
              borderRight: i < STATS.length - 1 ? `1px solid ${EDGE}` : 'none',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <p style={{ color: '#fff', fontSize: 24, fontWeight: 900, fontFamily: 'monospace', margin: '0 0 5px' }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.16em', margin: 0, textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Auth card */}
        <div style={{
          width: '100%', maxWidth: 480,
          background: '#0D0D0D',
          border: `1px solid rgba(59,130,246,0.15)`,
          borderRadius: 18,
          padding: '36px 36px 32px',
          boxShadow: '0 0 60px rgba(59,130,246,0.06)',
        }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 3, background: '#080808', border: `1px solid ${EDGE}`, borderRadius: 10, padding: 3, marginBottom: 28 }}>
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.10em',
                  textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
                  background: mode === m ? '#1A1A1A' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.28)',
                  border: mode === m ? `1px solid rgba(255,255,255,0.10)` : '1px solid transparent',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8, color: focused === 'email' ? '#fff' : DIM }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Shield size={13} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: focused === 'email' ? BLUE : 'rgba(255,255,255,0.22)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="operator@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  style={inputStyle('email')}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8, color: focused === 'pw' ? '#fff' : DIM }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={13} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: focused === 'pw' ? BLUE : 'rgba(255,255,255,0.22)', pointerEvents: 'none' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pw')}
                  onBlur={() => setFocused(null)}
                  style={{ ...inputStyle('pw'), paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, display: 'flex' }}>
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 10, fontSize: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.20)', color: '#FCA5A5' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, fontSize: 12, background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.20)', color: '#86EFAC' }}>
                <CheckCircle size={12} />{success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !email || !password}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px 0', borderRadius: 10, fontWeight: 800, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none',
                cursor: (submitting || !email || !password) ? 'not-allowed' : 'pointer',
                background: BLUE, color: '#fff',
                opacity: (submitting || !email || !password) ? 0.40 : 1,
                transition: 'opacity 0.15s',
                boxShadow: '0 0 24px rgba(59,130,246,0.28)',
              }}
            >
              {submitting ? (
                <>
                  <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'xps-spin 0.8s linear infinite' }} />
                  {mode === 'login' ? 'Authenticating…' : 'Creating account…'}
                </>
              ) : (
                <>{mode === 'login' ? 'Access Command Center' : 'Create Account'}<ArrowRight size={14} /></>
              )}
            </button>
          </form>

          {/* Trust row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24, paddingTop: 24, borderTop: `1px solid ${EDGE}` }}>
            {[
              { icon: Shield, text: 'Encrypted' },
              { icon: Lock,   text: 'Role-gated' },
              { icon: Cpu,    text: 'SOC 2' },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={11} color="rgba(59,130,246,0.50)" />
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{item.text}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 36, color: 'rgba(255,255,255,0.10)', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.14em' }}>
          XPS INTELLIGENCE // 2026 // NATIONAL EPOXY PROS
        </p>
      </div>

      <style>{`@keyframes xps-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

