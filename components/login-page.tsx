'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Shield } from 'lucide-react'

type AuthMode = 'login' | 'signup'

const GOLD = '#C99000'
const EDGE = 'rgba(255,255,255,0.08)'
const BLUE = '#3B82F6'

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

  const inputBorder = (name: string) =>
    focused === name ? `1px solid rgba(59,130,246,0.55)` : `1px solid rgba(255,255,255,0.15)`

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #080808; }

        .login-root {
          min-height: 100vh;
          background: #080808;
          display: flex;
          flex-direction: column;
        }

        /* TOP BAR */
        .topbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 52px;
          background: rgba(8,8,8,0.95);
          border-bottom: 1px solid ${EDGE};
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          backdrop-filter: blur(12px);
        }
        .topbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .topbar-logo {
          width: 28px; height: 28px;
          background: #1A1A1A;
          border: 1px solid ${EDGE};
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 900;
          color: ${GOLD};
          letter-spacing: -0.02em;
          flex-shrink: 0;
        }
        .topbar-name {
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.10em;
        }
        .topbar-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.18);
          font-family: monospace;
          letter-spacing: 0.12em;
        }
        .topbar-status {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid ${EDGE};
          border-radius: 6px;
          padding: 4px 12px;
        }
        .topbar-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #4ade80;
        }
        .topbar-status-text {
          font-size: 9px;
          font-weight: 600;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.14em;
          font-family: monospace;
        }

        /* PAGE LAYOUT */
        .page-body {
          flex: 1;
          padding-top: 52px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }

        /* LEFT PANEL — dark brand */
        .left-panel {
          background: #080808;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 60px 56px;
          gap: 40px;
          border-right: 1px solid ${EDGE};
        }
        .left-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.26em;
          color: rgba(59,130,246,0.80);
          font-family: monospace;
          text-transform: uppercase;
        }
        .left-headline {
          font-size: clamp(28px, 3vw, 44px);
          font-weight: 900;
          color: #fff;
          line-height: 1.12;
          letter-spacing: -0.03em;
          margin: 0;
        }
        .left-headline span { color: ${GOLD}; }
        .left-body {
          font-size: 15px;
          color: rgba(255,255,255,0.38);
          line-height: 1.7;
          max-width: 400px;
          margin: 0;
        }
        .stats-row {
          display: flex;
          gap: 0;
          border: 1px solid ${EDGE};
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
          max-width: 400px;
        }
        .stat-item {
          flex: 1;
          padding: 20px 0;
          text-align: center;
          background: rgba(255,255,255,0.02);
        }
        .stat-item + .stat-item { border-left: 1px solid ${EDGE}; }
        .stat-value {
          font-size: 24px;
          font-weight: 900;
          color: #fff;
          font-family: monospace;
          display: block;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 9px;
          font-weight: 700;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-family: monospace;
          display: block;
        }
        .trust-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .trust-pill {
          padding: 5px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid ${EDGE};
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.40);
          letter-spacing: 0.06em;
        }

        /* RIGHT PANEL — slightly lighter dark for contrast */
        .right-panel {
          background: #0F0F0F;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 40px;
        }

        /* AUTH CARD — noticeably lighter than the page */
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #1C1C1C;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          padding: 40px 36px 36px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 24px 64px rgba(0,0,0,0.5);
        }
        .card-title {
          font-size: 22px;
          font-weight: 900;
          color: #fff;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }
        .card-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.38);
          margin: 0 0 28px;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 3px;
          background: #111111;
          border: 1px solid rgba(255,255,255,0.08);
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
        .tab-active {
          background: #2A2A2A;
          color: #fff;
          border-color: rgba(255,255,255,0.10);
        }
        .tab-inactive {
          background: transparent;
          color: rgba(255,255,255,0.28);
        }

        /* Labels */
        .field-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 8px;
          color: rgba(255,255,255,0.55);
        }

        /* Inputs */
        .field-wrap { position: relative; }
        .field-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: rgba(255,255,255,0.22);
          display: flex;
          transition: color 0.15s;
        }
        .field-icon-focused { color: ${BLUE}; }
        .field-input {
          width: 100%;
          padding: 13px 16px 13px 42px;
          background: #111111;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.22); }
        .field-input:focus {
          box-shadow: 0 0 0 3px rgba(59,130,246,0.10);
        }
        .pw-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.28);
          padding: 0;
          display: flex;
          align-items: center;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 24px;
        }

        /* Submit */
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #fff;
          color: #080808;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.10s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.92; }
        .submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Alerts */
        .alert-error {
          padding: 12px 14px;
          background: rgba(220,38,38,0.10);
          border: 1px solid rgba(220,38,38,0.25);
          border-radius: 8px;
          font-size: 13px;
          color: #FCA5A5;
          margin-bottom: 16px;
        }
        .alert-success {
          padding: 12px 14px;
          background: rgba(74,222,128,0.08);
          border: 1px solid rgba(74,222,128,0.20);
          border-radius: 8px;
          font-size: 13px;
          color: #86EFAC;
          margin-bottom: 16px;
        }

        /* Footer */
        .card-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.28);
          line-height: 1.7;
        }
        .card-footer a {
          color: ${BLUE};
          font-weight: 700;
          text-decoration: none;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .page-body {
            grid-template-columns: 1fr;
          }
          .left-panel {
            padding: 40px 24px;
            gap: 28px;
            border-right: none;
            border-bottom: 1px solid ${EDGE};
          }
          .left-headline { font-size: 28px; }
          .right-panel { padding: 40px 20px; }
          .auth-card { padding: 32px 24px 28px; }
          .topbar { padding: 0 20px; }
          .topbar-sub { display: none; }
        }

        @media (max-width: 480px) {
          .topbar { padding: 0 16px; }
          .left-panel { padding: 28px 16px; }
          .left-body { display: none; }
          .trust-pills { display: none; }
          .stats-row { max-width: 100%; }
          .stat-value { font-size: 20px; }
          .auth-card {
            padding: 24px 18px 22px;
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

        {/* TWO-COLUMN LAYOUT */}
        <div className="page-body">

          {/* LEFT — dark brand panel */}
          <div className="left-panel">
            <p className="left-eyebrow">AI-Powered Build OS</p>

            <h1 className="left-headline">
              The operating system<br />
              for websites <span>at scale.</span>
            </h1>

            <p className="left-body">
              One AI command center that runs your entire website delivery pipeline — from client intake to launch.
            </p>

            <div className="stats-row">
              {STATS.map(s => (
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

          {/* RIGHT — lighter panel with bright card */}
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
                    className={`tab-btn ${mode === m ? 'tab-active' : 'tab-inactive'}`}
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
                      <span className={`field-icon ${focused === 'email' ? 'field-icon-focused' : ''}`}>
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
                      <span className={`field-icon ${focused === 'pw' ? 'field-icon-focused' : ''}`}>
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

                <button type="submit" disabled={submitting} className="submit-btn">
                  {submitting
                    ? 'Please wait…'
                    : mode === 'login' ? '→  Sign In' : '→  Create Account'}
                </button>
              </form>

              <div className="card-footer">
                {mode === 'login'
                  ? <>Don&apos;t have access?{' '}
                      <a href="#" onClick={e => { e.preventDefault(); setMode('signup') }}>Request access</a>
                    </>
                  : <>Already have an account?{' '}
                      <a href="#" onClick={e => { e.preventDefault(); setMode('login') }}>Sign in</a>
                    </>
                }
                <br />
                <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10, letterSpacing: '0.06em' }}>
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
