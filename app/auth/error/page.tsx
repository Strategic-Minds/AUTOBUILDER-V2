'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

export default function AuthErrorPage() {
  const router = useRouter()

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#080808' }}
    >
      <div
        className="rounded-2xl p-10 flex flex-col items-center gap-6 max-w-sm w-full text-center"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <AlertTriangle size={26} style={{ color: '#ef4444' }} />
        </div>

        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: 'rgba(255,255,255,0.90)' }}
          >
            XPS Intelligence
          </p>
          <h1 className="text-xl font-bold text-white mb-2">Authentication Error</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            The sign-in link has expired or is invalid. Please try again.
          </p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.90)', color: '#080808' }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  )
}
