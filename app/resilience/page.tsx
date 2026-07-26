'use client'

import { useEffect, useState } from 'react'

type Snapshot = {
  missionId: string
  system: string
  environment: string
  productionLocked: boolean
  sourceTruth: { workbook: string; workbookSha256: string; repository: string; branch: string; commit?: string }
  modules: Array<{ id: string; name: string; status: string; purpose: string }>
  connectors: Record<string, string>
  blockers: string[]
}

type Run = {
  id?: string
  cycle_id?: string
  state?: string
  score?: number
  release_gate?: string
  browser_evidence?: { screenshotCount?: number; viewports?: Array<{ viewport: string; passed: boolean }> }
}

export default function ResiliencePage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [run, setRun] = useState<Run | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    const response = await fetch('/api/resilience/status', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load resilience status')
    setSnapshot(data.snapshot)
    setRun(data.latestRun || null)
  }

  useEffect(() => { refresh().catch((value) => setError(value instanceof Error ? value.message : String(value))) }, [])

  async function runLiveCycle() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/resilience/status', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `Validation failed with status ${response.status}`)
      setSnapshot(data.snapshot)
      setRun({
        id: data.runId,
        cycle_id: data.result.cycleId,
        state: 'completed',
        score: data.result.score,
        release_gate: data.result.releaseGate,
        browser_evidence: data.evidence,
      })
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value))
      await refresh().catch(() => undefined)
    } finally {
      setBusy(false)
    }
  }

  const gate = run?.release_gate || 'AWAITING_LIVE_RUN'
  const screenshots = run?.browser_evidence?.screenshotCount || 0

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-zinc-950">
      <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-9 md:py-12">
        <header className="overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
          <div className="grid gap-8 p-7 md:p-10 lg:grid-cols-[1fr_420px] lg:p-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">Autonomous Reliability Control Plane</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] md:text-6xl">XAB Resilience OS</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">Run real BrowserWorker validation across desktop, tablet, and mobile, persist every receipt, and keep release decisions fail-closed.</p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-[#d4af37]/50 bg-[#d4af37]/10 px-4 py-2 text-[#f4d66d]">Mission {snapshot?.missionId || 'loading'}</span>
                <span className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300">{snapshot?.environment || 'loading'}</span>
                <span className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-200">{snapshot?.productionLocked ? 'Production locked' : 'Production active'}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-700 bg-zinc-900/90 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Live validation</p>
              <p className="mt-3 text-2xl font-semibold">Audit → Execute → Persist → Decide</p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">This launches the authenticated BrowserWorker mesh and records the exact run in the isolated RLS runtime.</p>
              <button type="button" onClick={runLiveCycle} disabled={busy} className="mt-6 w-full rounded-2xl bg-[#d4af37] px-5 py-4 font-semibold text-black transition hover:bg-[#e2c55d] disabled:cursor-wait disabled:opacity-60">
                {busy ? 'Running live validation…' : 'Run live resilience cycle'}
              </button>
            </div>
          </div>
        </header>

        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}

        <section className="mt-7 grid gap-5 md:grid-cols-4">
          <Metric label="Release gate" value={gate.replaceAll('_', ' ')} />
          <Metric label="Evidence score" value={run?.score === undefined ? 'Not run' : String(run.score)} />
          <Metric label="Screenshots" value={String(screenshots)} />
          <Metric label="Run state" value={(run?.state || 'idle').replaceAll('_', ' ')} />
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-3">
          {(snapshot?.modules || []).map((module) => (
            <article key={module.id} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 font-semibold text-[#d4af37]">{module.name.charAt(0)}</div><span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">{module.status.replaceAll('_', ' ')}</span></div>
              <h2 className="mt-6 text-xl font-semibold">{module.name}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{module.purpose}</p>
            </article>
          ))}
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7b19]">Viewport evidence</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {['desktop', 'tablet', 'mobile'].map((viewport) => {
                const result = run?.browser_evidence?.viewports?.find((item) => item.viewport === viewport)
                return <div key={viewport} className="rounded-2xl border border-zinc-200 p-5"><p className="font-semibold capitalize">{viewport}</p><p className={`mt-3 text-sm font-semibold ${result?.passed ? 'text-emerald-700' : 'text-zinc-500'}`}>{result ? (result.passed ? 'Passed' : 'Failed') : 'Not run'}</p></div>
              })}
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4af37]">Connector state</p>
            <div className="mt-5 space-y-3">{Object.entries(snapshot?.connectors || {}).map(([name, status]) => <div key={name} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 px-4 py-3"><span className="capitalize">{name}</span><span className="text-xs text-emerald-300">{status.replaceAll('_', ' ')}</span></div>)}</div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p><p className="mt-3 text-xl font-semibold">{value}</p></div>
}
