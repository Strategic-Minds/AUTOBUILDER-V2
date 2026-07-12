'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Shield } from 'lucide-react'

type AuthMode = 'login' | 'signup'

const GOLD  = '#C99000'
const INK   = '#0B0B0B'
const SURF  = '#F7F7F6'
const MUTED = '#6B7280'

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

  const inputBorder = (name: string) =>
    `1px solid ${focused === name ? GOLD : '#D1D5DB'}`

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #FFFFFF; }

        .login-root {
          min-height: 100vh;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
        }

        /* ── TOP BAR ── */
        .topbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 56px;
          background: #FFFFFF;
          border-bottom: 1px solid #E5E7EB;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }
        .topbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .topbar-logo {
          width: 32px; height: 32px;
          background: ${INK};
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 900; color: ${GOLD};
          letter-spacing: -0.02em;
          flex-shrink: 0;
        }
        .topbar-name {
          font-size: 13px;
          font-weight: 800;
          color: ${INK};
          letter-spacing: 0.08em;
        }
        .topbar-sub {
          font-size: 10px;
          color: ${MUTED};
          letter-spacing: 0.12em;
          font-family: monospace;
        }
        .topbar-status {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 20px;
          padding: 4px 12px;
        }
        .topbar-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #16A34A;
        }
        .topbar-status-text {
          font-size: 10px;
          font-weight: 600;
          color: #15803D;
          letter-spacing: 0.10em;
          font-family: monospace;
        }

        /* ── LAYOUT ── */
        .page-body {
          flex: 1;
          padding-top: 56px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }

        /* ── LEFT PANEL ── */
        .left-panel {
          background: ${INK};
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 60px 56px;
          gap: 40px;
        }
        .left-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.26em;
          color: ${GOLD};
          font-family: monospace;
          text-transform: uppercase;
        }
        .left-headline {
          font-size: clamp(28px, 3vw, 44px);
          font-weight: 900;
          color: #FFFFFF;
          line-height: 1.12;
          letter-spacing: -0.03em;
          margin: 0;
        }
        .left-headline span {
          color: ${GOLD};
        }
        .left-body {
          font-size: 15px;
          color: rgba(255,255,255,0.52);
          line-height: 1.7;
          max-width: 400px;
          margin: 0;
        }
        .stats-row {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 900;
          color: #FFFFFF;
          font-family: monospace;
          line-height: 1;
        }
        .stat-label {
          font-size: 9px;
          font-weight: 700;
          color: rgba(255,255,255,0.32);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-family: monospace;
        }
        .trust-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .trust-pill {
          padding: 6px 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          letter-spacing: 0.06em;
        }

        /* ── RIGHT PANEL ── */
        .right-panel {
          background: ${SURF};
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 40px;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          padding: 40px 36px 36px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
        }
        .card-title {
          font-size: 22px;
          font-weight: 900;
          color: ${INK};
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }
        .card-sub {
          font-size: 13px;
          color: ${MUTED};
          margin: 0 0 28px;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 3px;
          background: ${SURF};
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 28px;
        }
        .tab-btn {
          flex: 1;
          padding: 10px 0;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .tab-btn-active {
          background: #FFFFFF;
          color: ${INK};
          border-color: #E5E7EB;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .tab-btn-inactive {
          background: transparent;
          color: ${MUTED};
        }

        /* Fields */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 24px;
        }
        .field-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 8px;
          color: ${INK};
        }
        .field-wrap {
          position: relative;
        }
        .field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: ${MUTED};
          display: flex;
        }
        .field-icon-active {
          color: ${GOLD};
        }
        .field-input {
          width: 100%;
          padding: 13px 16px 13px 42px;
          background: #FFFFFF;
          border-radius: 10px;
          color: ${INK};
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field-input::placeholder {
          color: #9CA3AF;
        }
        .field-input:focus {
          box-shadow: 0 0 0 3px rgba(201,144,0,0.12);
        }
        .pw-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: ${MUTED};
          padding: 0;
          display: flex;
          align-items: center;
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: ${INK};
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s, transform 0.10s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #222222;
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.99);
        }
        .submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Alerts */
        .alert-error {
          padding: 12px 14px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          font-size: 13px;
          color: #DC2626;
          margin-bottom: 16px;
        }
        .alert-success {
          padding: 12px 14px;
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 8px;
          font-size: 13px;
          color: #16A34A;
          margin-bottom: 16px;
        }

        /* Footer */
        .card-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 11px;
          color: ${MUTED};
          line-height: 1.6;
        }
        .card-footer a {
          color: ${GOLD};
          font-weight: 700;
          text-decoration: none;
        }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width: 768px) {
          .page-body {
            grid-template-columns: 1fr;
          }
          .left-panel {
            padding: 40px 24px;
            gap: 28px;
          }
          .left-headline {
            font-size: 28px;
          }
          .right-panel {
            padding: 40px 20px;
          }
          .auth-card {
            padding: 32px 24px 28px;
          }
          .topbar-sub {
            display: none;
          }
          .trust-pills {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .topbar {
            padding: 0 16px;
          }
          .left-panel {
            padding: 32px 20px;
          }
          .left-body {
            display: none;
          }
          .stats-row {
            gap: 20px;
          }
          .stat-value {
            font-size: 22px;
          }
          .auth-card {
            padding: 28px 20px 24px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="login-root">

        {/* TOP BAR */}
        <div className="topbar">
          <div className="topbar-brand">
            <div className="topbar-logo">XPS</div>
            <span className="topbar-name">XPS INTELLIGENCE</span>
            <span className="topbar-sub">// AI BUILD OS</span>
          </div>
          <div className="topbar-status">
            <div className="topbar-dot" />
            <span className="topbar-status-text">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>

        {/* PAGE BODY — two columns on desktop, stacked on mobile */}
        <div className="page-body">

          {/* LEFT — brand panel */}
          <div className="left-panel">
            <p className="left-eyebrow">AI-Powered Build OS</p>

            <h1 className="left-headline">
              The operating system<br />
              for websites <span>at scale.</span>
            </h1>

            <p className="left-body">
              One AI command center that runs your entire website delivery pipeline — from client intake to launch. Built for Xtreme Floor Systems.
            </p>

            <div className="stats-row">
              {[
                { value: '9',    label: 'Active Modules' },
                { value: '100%', label: 'Automated' },
                { value: '2wk',  label: 'Avg Launch' },
              ].map(s => (
                <div key={s.label} className="stat-item">
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="trust-pills">
              {['Supabase', 'Vercel', 'Next.js 16', 'Base44 AI', 'GitHub CI'].map(t => (
                <span key={t} className="trust-pill">{t}</span>
              ))}
            </div>
          </div>

          {/* RIGHT — auth card */}
          <div className="right-panel">
            <div className="auth-card">
              <h2 className="card-title">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="card-sub">
                {mode === 'login'
                  ? 'Sign in to your XPS Intelligence workspace'
                  : 'Register for XPS Intelligence access'}
              </p>

              {/* Tabs */}
              <div className="tabs">
                {(['login', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`tab-btn ${mode === m ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                  >
                    {m === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              {/* Alerts */}
              {error   && <div className="alert-error">{error}</div>}
              {success && <div className="alert-success">{success}</div>}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="field-group">
                  <div>
                    <label className="field-label">Email Address</label>
                    <div className="field-wrap">
                      <span className={`field-icon ${focused === 'email' ? 'field-icon-active' : ''}`}>
                        <Shield size={13} />
                      </span>
                      <input
                        type="email"
                        placeholder="operator@domain.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused(null)}
                        required
                        className="field-input"
                        style={{ border: inputBorder('email') }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Password</label>
                    <div className="field-wrap">
                      <span className={`field-icon ${focused === 'pw' ? 'field-icon-active' : ''}`}>
                        <Lock size={13} />
                      </span>
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setFocused('pw')}
                        onBlur={() => setFocused(null)}
                        required
                        className="field-input"
                        style={{ border: inputBorder('pw'), paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => !p)}
                        className="pw-toggle"
                      >
                        {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="submit-btn"
                >
                  {submitting
                    ? 'Please wait…'
                    : mode === 'login' ? '→ Sign In' : '→ Create Account'}
                </button>
              </form>

              <div className="card-footer">
                {mode === 'login'
                  ? <>Don&apos;t have access? <a href="#" onClick={e => { e.preventDefault(); setMode('signup') }}>Request access</a></>
                  : <>Already have an account? <a href="#" onClick={e => { e.preventDefault(); setMode('login') }}>Sign in</a></>
                }
                <br />
                <span style={{ color: '#9CA3AF', fontSize: 10, letterSpacing: '0.06em' }}>
                  XPS Intelligence · Xtreme Floor Systems
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
