'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

type AuthMode = 'login' | 'signup'

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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 52, background: 'rgba(8,8,8,0.96)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900, color: '#C99000', letterSpacing: '-0.02em',
          }}>XPS</div>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.10em' }}>
            XPS INTELLIGENCE
          </span>
          <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.10em' }}>
            // AI BUILD OS
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 6, padding: '4px 12px',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.14em' }}>
            ALL SYSTEMS OPERATIONAL
          </span>
        </div>
      </div>

      {/* ── MAIN LAYOUT: side-by-side on desktop, stacked on mobile ── */}
      <div style={{
        flex: 1,
        paddingTop: 52,
        display: 'flex',
        minHeight: 'calc(100vh - 52px)',
      }}>

        {/* LEFT BRAND PANEL */}
        <div style={{
          flex: '1 1 50%',
          background: '#080808',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 52px',
          gap: 36,
        }}>
          <p style={{
            margin: 0, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.26em', color: 'rgba(59,130,246,0.80)',
            fontFamily: 'monospace', textTransform: 'uppercase',
          }}>
            AI-Powered Build OS
          </p>

          <h1 style={{
            margin: 0, fontSize: 'clamp(28px, 3.2vw, 46px)',
            fontWeight: 900, color: '#fff', lineHeight: 1.10, letterSpacing: '-0.03em',
          }}>
            The operating system<br />
            for websites{' '}
            <span style={{ color: '#C99000' }}>at scale.</span>
          </h1>

          <p style={{
            margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.36)',
            lineHeight: 1.75, maxWidth: 380,
          }}>
            One AI command center that runs your entire website delivery pipeline — from client intake to launch.
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, overflow: 'hidden', maxWidth: 380,
          }}>
            {[
              { value: '9',    label: 'Active Modules' },
              { value: '100%', label: 'Automated' },
              { value: '2wk',  label: 'Avg Launch' },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1, padding: '18px 0', textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'monospace', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'monospace' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Supabase', 'Vercel', 'Next.js 16', 'Base44 AI', 'GitHub CI'].map(t => (
              <span key={t} style={{
                padding: '5px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.38)', letterSpacing: '0.06em',
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* RIGHT SIGN-IN PANEL */}
        <div style={{
          flex: '1 1 50%',
          background: '#111111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 32px',
        }}>

          {/* CARD — much lighter so it reads clearly */}
          <div style={{
            width: '100%',
            maxWidth: 400,
            background: '#2A2A2A',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 18,
            padding: '36px 32px 32px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
          }}>

            <h2 style={{ margin: '0 0 4px', fontSize: 21, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ margin: '0 0 26px', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              Sign in to your XPS Intelligence workspace
            </p>

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 3,
              background: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 10, padding: 3, marginBottom: 26,
            }}>
              {(['login', 'signup'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 8,
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.10em',
                  textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
                  background: mode === m ? '#3A3A3A' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.35)',
                  border: mode === m ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                }}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {/* Alerts */}
            {error && (
              <div style={{
                padding: '11px 14px', marginBottom: 16,
                background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.30)',
                borderRadius: 8, fontSize: 13, color: '#FCA5A5',
              }}>{error}</div>
            )}
            {success && (
              <div style={{
                padding: '11px 14px', marginBottom: 16,
                background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.25)',
                borderRadius: 8, fontSize: 13, color: '#86EFAC',
              }}>{success}</div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  marginBottom: 8, color: 'rgba(255,255,255,0.70)',
                }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: focused === 'email' ? '#3B82F6' : 'rgba(255,255,255,0.35)',
                    pointerEvents: 'none', transition: 'color 0.15s',
                  }} />
                  <input
                    type="email"
                    placeholder="operator@domain.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                    style={{
                      width: '100%', padding: '12px 14px 12px 40px',
                      background: '#1E1E1E',
                      border: focused === 'email' ? '1px solid rgba(59,130,246,0.60)' : '1px solid rgba(255,255,255,0.14)',
                      borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: focused === 'email' ? '0 0 0 3px rgba(59,130,246,0.10)' : 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  marginBottom: 8, color: 'rgba(255,255,255,0.70)',
                }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: focused === 'pw' ? '#3B82F6' : 'rgba(255,255,255,0.35)',
                    pointerEvents: 'none', transition: 'color 0.15s',
                  }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('pw')}
                    onBlur={() => setFocused(null)}
                    required
                    style={{
                      width: '100%', padding: '12px 42px 12px 40px',
                      background: '#1E1E1E',
                      border: focused === 'pw' ? '1px solid rgba(59,130,246,0.60)' : '1px solid rgba(255,255,255,0.14)',
                      borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: focused === 'pw' ? '0 0 0 3px rgba(59,130,246,0.10)' : 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{
                    position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex',
                  }}>
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={submitting} style={{
                width: '100%', padding: '13px',
                marginTop: 4,
                background: submitting ? 'rgba(255,255,255,0.15)' : '#FFFFFF',
                color: '#080808',
                fontSize: 12, fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase', border: 'none', borderRadius: 9,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}>
                {submitting ? 'Please wait…' : mode === 'login' ? '→  Sign In' : '→  Create Account'}
              </button>

            </form>

            {/* Footer */}
            <p style={{
              marginTop: 20, marginBottom: 0,
              textAlign: 'center', fontSize: 12,
              color: 'rgba(255,255,255,0.30)', lineHeight: 1.6,
            }}>
              {mode === 'login'
                ? <>Don&apos;t have access?{' '}
                    <a href="#" onClick={e => { e.preventDefault(); setMode('signup') }}
                      style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none' }}>
                      Request access
                    </a>
                  </>
                : <>Already have an account?{' '}
                    <a href="#" onClick={e => { e.preventDefault(); setMode('login') }}
                      style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none' }}>
                      Sign in
                    </a>
                  </>
              }
            </p>

          </div>
        </div>
      </div>

      {/* ── MOBILE STYLES injected via style tag ── */}
      <style>{`
        @media (max-width: 768px) {
          .login-layout { flex-direction: column !important; }
        }
      `}</style>

    </div>
  )
}
