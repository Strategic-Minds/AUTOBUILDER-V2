'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, CheckCircle2, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallState = 'idle' | 'prompt-shown' | 'installed' | 'ios'

export default function PwaInstallButton({ collapsed }: { collapsed: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installState, setInstallState] = useState<InstallState>('idle')
  const [showIosBanner, setShowIosBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('[XSB] SW registration failed:', err))
    }

    // Already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstallState('installed')
      return
    }

    // iOS detection (Safari doesn't fire beforeinstallprompt)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isInStandalone = ('standalone' in navigator) && (navigator as { standalone?: boolean }).standalone
    if (isIos && !isInStandalone) {
      setInstallState('ios')
      return
    }

    // Android / Desktop Chrome/Edge
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setInstallState('prompt-shown')
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstallState('installed'))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (installState === 'ios') {
      setShowIosBanner(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstallState('installed')
    setDeferredPrompt(null)
  }

  // Already installed — show subtle badge
  if (installState === 'installed') {
    return (
      <div
        className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium ${
          collapsed ? 'justify-center' : ''
        }`}
        style={{ color: 'rgba(245,197,24,0.6)' }}
        title="App installed"
      >
        <CheckCircle2 size={14} className="shrink-0" />
        {!collapsed && <span>App Installed</span>}
      </div>
    )
  }

  // Nothing to show (no prompt available and not iOS)
  if (installState === 'idle') return null

  return (
    <>
      {/* Install button */}
      <button
        onClick={handleInstallClick}
        title={collapsed ? 'Install App' : undefined}
        className={`w-full flex items-center gap-2 rounded-md text-[12px] font-bold transition-all duration-150 active:scale-95 ${
          collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
        }`}
        style={{
          background: 'rgba(10,10,10,0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.30)',
          borderTopColor: 'rgba(245,217,107,0.55)',
          color: 'rgba(255,255,255,0.90)',
          boxShadow: '0 0 16px rgba(59,130,246,0.18), 0 2px 8px rgba(0,0,0,0.35)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(245,197,24,0.80)'
          e.currentTarget.style.boxShadow = '0 0 28px rgba(59,130,246,0.45), 0 4px 16px rgba(0,0,0,0.40)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.30)'
          e.currentTarget.style.boxShadow = '0 0 16px rgba(59,130,246,0.18), 0 2px 8px rgba(0,0,0,0.35)'
        }}
      >
        {installState === 'ios' ? (
          <Smartphone size={13} className="shrink-0" />
        ) : (
          <Download size={13} className="shrink-0" />
        )}
        {!collapsed && (
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[11px] text-white/60 font-normal">
              {installState === 'ios' ? 'Add to Home Screen' : 'Install App'}
            </span>
            <span>Xtreme Site Builder</span>
          </span>
        )}
      </button>

      {/* iOS instruction banner */}
      {showIosBanner && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-2xl px-5 py-4 max-w-xs w-[calc(100vw-32px)] shadow-2xl"
          style={{
            background: 'rgba(10,10,10,0.97)',
            border: '1px solid rgba(245,197,24,0.4)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <button
            onClick={() => setShowIosBanner(false)}
            className="absolute top-3 right-3"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/pwa-icon-192.png"
              alt="Xtreme Site Builder"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <div>
              <p className="text-white text-[13px] font-bold leading-tight">Xtreme Site Builder</p>
              <p className="text-[11px] leading-tight blue-shimmer">
                Enterprise Website Factory
              </p>
            </div>
          </div>
          <p className="text-white/70 text-[12px] leading-relaxed">
            Tap the{' '}
            <span className="font-bold text-white">Share</span>
            {' '}button in Safari, then select{' '}
            <span className="font-bold text-white">"Add to Home Screen"</span>
            {' '}to install this app.
          </p>
        </div>
      )}
    </>
  )
}
