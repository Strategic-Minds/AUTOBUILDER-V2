'use client'

import { useEffect, useState } from 'react'

type ModuleStatus = {
  id: string
  name: string
  status: string
  purpose: string
}

type Snapshot = {
  missionId: string
  system: string
  environment: string
  productionLocked: boolean
  sourceTruth: {
    workbook: string
    workbookSha256: string
    repository: string
    branch: string
  }
  modules: ModuleStatus[]
  connectors: Record<string, string>
  blockers: string[]
}

type Finding = {
  id: string
  signal: string
  severity: string
  domain: string
  state: string
  deduction: number
  repairDirective: string
}

type CycleResult = {
  cycleId: string
  stages: string[]
  score: number
  blockingDefects: number
  resolvedDefects: number
  releaseGate: string
  findings: Finding[]
}

const syntheticFaults = [
  {
    id: 'fault-source-drift',
    signal: 'Workbook checksum and deployment commit mismatch',
    severity: 'critical',
    detected: true,
    repaired: true,
    regressionPass: true,
  },
  {
    id: 'fault-mobile-overflow',
    signal: 'Mobile layout horizontal overflow on command center',
    severity: 'high',
    detected: true,
    repaired: true,
    regressionPass: true,
  },
  {
    id: 'fault-rls-policy',
    signal: 'Supabase RLS policy missing from isolated validation table',
    severity: 'critical',
    detected: true,
    repaired: false,
    regressionPass: false,
  },
  {
    id: 'fault-provider-timeout',
    signal: 'External connector provider timeout during validation queue',
    severity: 'medium',
    detected: true,
    repaired: true,
    regressionPass: true,
  },
] as const

const connectorLabels: Record<string, string> = {
  googleDrive: 'Google Drive',
  github: 'GitHub',
  vercel: 'Vercel',
  supabase: 'Supabase',
  xtremeAiBuilder: 'Xtreme AI Builder',
  browserworker: 'BrowserWorker',
}

function statusTone(status: string) {
  if (status.includes('VERIFIED') || status.includes('IMPLEMENTED')) return 'border-emerald-300 bg-emerald-50 text-emerald-800'
  if (status.includes('PENDING') || status.includes('REQUIRED') || status.includes('RESTRICTED')) return 'border-amber-300 bg-amber-50 text-amber-900'
  return 'border-zinc-300 bg-zinc-50 text-zinc-700'
}

export default function ResiliencePage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [result, setResult] = useState<CycleResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/resilience/status', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load resilience status.')
        setSnapshot(data.snapshot)
      })
      .catch((value) => setError(value instanceof Error ? value.message : String(value)))
  }, [])

  async function runCycle() {
    setBusy(true)
    setError('')

    try {
      const response = await fetch('/api/resilience/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: `preview-cycle-${Date.now()}`,
          faults: syntheticFaults,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Resilience cycle failed.')
      setSnapshot(data.snapshot)
      setResult(data.result)
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-zinc-950">
      <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-9 md:py-12">
        <header className="overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
          <div className="grid gap-8 p-7 md:p-10 lg:grid-cols-[1fr_420px] lg:p-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">Universal Reliability Control Plane</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] md:text-6xl">XAB Resilience OS</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
                Detect drift. Break Preview safely. Repair the smallest responsible layer. Retest until evidence supports the release decision.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-[#d4af37]/50 bg-[#d4af37]/10 px-4 py-2 text-[#f4d66d]">Mission {snapshot?.missionId || 'loading'}</span>
                <span className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300">Preview only</span>
                <span className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-200">Production locked</span>
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-700 bg-zinc-900/90 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Recursive command</p>
              <p className="mt-3 text-2xl font-semibold">Audit → Repair → Harden → Prove</p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">Run a deterministic controlled-fault cycle against the Preview engine. One unresolved database policy intentionally keeps the release gate closed.</p>
              <button type="button" onClick={runCycle} disabled={busy} className="mt-6 w-full rounded-2xl bg-[#d4af37] px-5 py-4 font-semibold text-black transition hover:bg-[#e2c55d] disabled:cursor-wait disabled:opacity-60">
                {busy ? 'Running recursive cycle…' : 'Run controlled resilience cycle'}
              </button>
            </div>
          </div>
        </header>

        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}

        <section className="mt-7 grid gap-5 lg:grid-cols-3">
          {(snapshot?.modules || []).map((module) => (
            <article key={module.id} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-lg font-semibold text-[#d4af37]">{module.name.charAt(0)}</div>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusTone(module.status)}`}>{module.status.replaceAll('_', ' ')}</span>
              </div>
              <h2 className="mt-6 text-xl font-semibold tracking-tight">{module.name}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{module.purpose}</p>
            </article>
          ))}
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7b19]">Cycle evidence</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Recursive decision engine</h2>
              </div>
              {result && (
                <div className="text-right">
                  <p className="text-4xl font-semibold tabular-nums">{result.score}</p>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Evidence score</p>
                </div>
              )}
            </div>

            {!result && <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-zinc-500">Run the controlled cycle to produce a scored repair receipt.</div>}

            {result && (
              <div className="mt-7 space-y-4">
                <div className={`rounded-2xl border p-4 ${result.releaseGate === 'PREVIEW_ACCEPTABLE' ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{result.releaseGate.replaceAll('_', ' ')}</p>
                    <p className="text-sm">{result.resolvedDefects} resolved · {result.blockingDefects} blocking</p>
                  </div>
                </div>
                {result.findings.map((finding) => (
                  <article key={finding.id} className="rounded-2xl border border-zinc-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{finding.signal}</p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{finding.domain.replaceAll('_', ' ')} · {finding.severity}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${finding.state === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{finding.state.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-zinc-600">{finding.repairDirective}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7b19]">Connector state</p>
              <div className="mt-5 space-y-3">
                {Object.entries(snapshot?.connectors || {}).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-4 py-3">
                    <span className="font-medium">{connectorLabels[key] || key}</span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusTone(status)}`}>{status.replaceAll('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4af37]">Release blockers</p>
              <div className="mt-5 space-y-4">
                {(snapshot?.blockers || []).map((blocker) => (
                  <div key={blocker} className="flex gap-3 text-sm leading-6 text-zinc-300">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#d4af37]" />
                    <p>{blocker}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="mt-7 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7b19]">Source truth</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-zinc-50 p-5"><p className="text-xs uppercase tracking-wider text-zinc-500">Workbook</p><p className="mt-2 break-words font-semibold">{snapshot?.sourceTruth.workbook}</p><p className="mt-2 break-all text-xs text-zinc-500">SHA-256 {snapshot?.sourceTruth.workbookSha256}</p></div>
            <div className="rounded-2xl bg-zinc-50 p-5"><p className="text-xs uppercase tracking-wider text-zinc-500">Branch authority</p><p className="mt-2 font-semibold">{snapshot?.sourceTruth.repository}</p><p className="mt-2 break-all text-xs text-zinc-500">{snapshot?.sourceTruth.branch}</p></div>
          </div>
        </section>
      </div>
    </main>
  )
}
