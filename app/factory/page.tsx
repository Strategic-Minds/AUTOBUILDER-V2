'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'

type VisualReference = {
  asset_id?: string
  file_name?: string
  public_url?: string
  sha256?: string
  width?: number
  height?: number
  approved_at?: string
}

type Project = {
  id: string
  name: string
  client_name: string
  industry: string
  region: string
  status: string
  website_url: string | null
  production_locked: boolean
  metadata?: { visual_reference?: VisualReference; visual_analysis_mode?: string; visual_analysis_warning?: string | null }
}

type OptionRecord = { id: string; option_number: number; label?: string; config: Record<string, unknown> }
type Bundle = {
  project: Project
  logos: OptionRecord[]
  websites: OptionRecord[]
  approvals: Array<{ id: string; kind: 'logo' | 'website'; state: string; selected_option: number | null }>
  jobs: Array<{ id: string; type: string; state: string; last_error?: string | null }>
  receipts: Array<{ id: string; kind: string; passed: boolean; created_at: string }>
}

export default function FactoryPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Bundle | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [visualFile, setVisualFile] = useState<File | null>(null)
  const [visualPreview, setVisualPreview] = useState('')
  const [visualSize, setVisualSize] = useState({ width: 0, height: 0 })

  const loadProjects = useCallback(async () => {
    const response = await fetch('/api/factory/projects', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load projects')
    setProjects(data.projects || [])
  }, [])

  const loadProject = useCallback(async (id: string) => {
    const response = await fetch(`/api/factory/projects/${id}`, { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load project')
    setSelected(data)
  }, [])

  useEffect(() => {
    loadProjects().catch((value) => setError(String(value)))
    const timer = setInterval(() => {
      loadProjects().catch(() => undefined)
      if (selected?.project.id) loadProject(selected.project.id).catch(() => undefined)
    }, 10000)
    return () => clearInterval(timer)
  }, [loadProject, loadProjects, selected?.project.id])

  useEffect(() => () => { if (visualPreview.startsWith('blob:')) URL.revokeObjectURL(visualPreview) }, [visualPreview])

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(e.currentTarget)
    try {
      const response = await fetch('/api/factory/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'), clientName: form.get('clientName'), industry: form.get('industry'), region: form.get('region'),
          services: form.get('services'), brief: form.get('brief'),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Project creation failed')
      e.currentTarget.reset()
      await loadProjects()
      await loadProject(data.project.id)
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value))
    } finally { setBusy(false) }
  }

  function chooseVisual(file: File | null) {
    setError('')
    setVisualFile(file)
    setVisualSize({ width: 0, height: 0 })
    if (visualPreview.startsWith('blob:')) URL.revokeObjectURL(visualPreview)
    if (!file) { setVisualPreview(''); return }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('Use a PNG, JPEG, or WebP image.'); return }
    if (file.size > 12 * 1024 * 1024) { setError('The approved image must be 12 MB or smaller.'); return }
    const url = URL.createObjectURL(file)
    setVisualPreview(url)
    const image = new Image()
    image.onload = () => setVisualSize({ width: image.naturalWidth, height: image.naturalHeight })
    image.src = url
  }

  async function approveVisual(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected || !visualFile || !visualSize.width || !visualSize.height) return
    setBusy(true)
    setError('')
    const fields = new FormData(e.currentTarget)
    fields.set('image', visualFile)
    fields.set('width', String(visualSize.width))
    fields.set('height', String(visualSize.height))
    try {
      const response = await fetch(`/api/factory/projects/${selected.project.id}/visual`, { method: 'POST', body: fields })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Visual approval failed')
      setVisualFile(null)
      setVisualPreview('')
      setVisualSize({ width: 0, height: 0 })
      await loadProject(selected.project.id)
      await loadProjects()
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value))
    } finally { setBusy(false) }
  }

  async function approve(kind: 'logo' | 'website', option: number) {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/factory/projects/${selected.project.id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, option }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Approval failed')
      await loadProject(selected.project.id)
      await loadProjects()
    } catch (value) { setError(value instanceof Error ? value.message : String(value)) }
    finally { setBusy(false) }
  }

  const pendingLogo = selected?.approvals.find((item) => item.kind === 'logo' && item.state === 'pending')
  const pendingWebsite = selected?.approvals.find((item) => item.kind === 'website' && item.state === 'pending')
  const approvedVisual = selected?.project.metadata?.visual_reference

  return (
    <main className="min-h-screen bg-[#f8f9fb] text-zinc-950">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        <header className="mb-8 flex flex-col gap-3 border-b border-zinc-200 pb-7 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b7b19]">Xtreme AI Builder</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Approve an image. Build the real system.</h1><p className="mt-3 max-w-3xl text-zinc-600">Create a project, upload the approved website or application image, lock it as the visual contract, then let the factory build and validate a Preview.</p></div>
          <div className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-600">Production stays locked until final approval</div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <form onSubmit={create} className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Start a project</h2>
              <input name="name" required placeholder="Project name" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <input name="clientName" required placeholder="Business or system name" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <input name="industry" required placeholder="Industry or system type" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <input name="region" required placeholder="City, market, or audience" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <textarea name="services" rows={3} placeholder="Services, capabilities, or modules" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <textarea name="brief" rows={4} placeholder="Goals, functionality, and important notes" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <button disabled={busy} className="w-full rounded-xl bg-zinc-950 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Working...' : 'Create project'}</button>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </form>
            <section className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm"><h2 className="px-2 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Projects</h2><div className="space-y-2">{projects.map((project) => <button key={project.id} onClick={() => loadProject(project.id)} className="w-full rounded-2xl border border-zinc-200 p-4 text-left hover:border-zinc-400"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{project.name}</span><span className="rounded-full bg-zinc-100 px-2 py-1 text-xs">{project.status}</span></div><p className="mt-1 text-sm text-zinc-500">{project.client_name} · {project.region}</p></button>)}{!projects.length && <p className="p-4 text-sm text-zinc-500">No projects yet.</p>}</div></section>
          </aside>

          <section className="min-w-0">
            {!selected && <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">Select a project or create the first one.</div>}
            {selected && <div className="space-y-6">
              <div className="rounded-3xl bg-zinc-950 p-6 text-white shadow-xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">{selected.project.industry}</p><h2 className="mt-2 text-3xl font-semibold">{selected.project.name}</h2><p className="mt-2 text-zinc-400">{selected.project.client_name} · {selected.project.region}</p></div><div className="text-right"><p className="text-sm text-zinc-400">Current state</p><p className="font-semibold">{selected.project.status}</p></div></div>{selected.project.website_url && <a href={selected.project.website_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 font-semibold text-black">Open final Preview</a>}</div>

              <section className="rounded-3xl border border-[#d4af37]/40 bg-white p-5 shadow-sm md:p-7">
                <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7b19]">Visual Approval</p><h3 className="mt-1 text-2xl font-semibold">Upload the exact image you approve</h3><p className="mt-2 text-zinc-600">The image is hashed, stored, analyzed into a visual contract, approved, and dispatched to the existing build queue. It is never used as a fake screenshot website.</p></div>
                {approvedVisual?.public_url && <div className="mb-5 grid gap-4 rounded-2xl bg-zinc-950 p-4 text-white md:grid-cols-[180px_1fr]"><img src={approvedVisual.public_url} alt="Approved visual contract" className="h-40 w-full rounded-xl object-cover object-top" /><div><p className="text-xs uppercase tracking-wider text-[#d4af37]">Locked visual</p><p className="mt-2 font-semibold">{approvedVisual.file_name}</p><p className="mt-1 break-all text-xs text-zinc-400">SHA-256 {approvedVisual.sha256}</p><p className="mt-2 text-sm text-zinc-300">{approvedVisual.width} × {approvedVisual.height} · {selected.project.metadata?.visual_analysis_mode}</p>{selected.project.metadata?.visual_analysis_warning && <p className="mt-2 text-sm text-amber-300">{selected.project.metadata.visual_analysis_warning}</p>}</div></div>}
                <form onSubmit={approveVisual} className="grid gap-4 md:grid-cols-[1fr_1fr]">
                  <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center"><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => chooseVisual(event.target.files?.[0] || null)} />{visualPreview ? <img src={visualPreview} alt="Selected approved visual" className="max-h-72 w-full rounded-xl object-contain" /> : <><span className="text-lg font-semibold">Choose approved image</span><span className="mt-2 text-sm text-zinc-500">PNG, JPEG, or WebP · 12 MB maximum</span></>}</label>
                  <div className="flex flex-col gap-3"><textarea name="notes" rows={7} placeholder="Optional notes: what must match, what may change, required functions, mobile behavior, or content corrections." className="w-full flex-1 rounded-2xl border border-zinc-200 px-4 py-3" />{visualFile && <p className="text-sm text-zinc-500">{visualFile.name} · {visualSize.width || '...'} × {visualSize.height || '...'}</p>}<button disabled={busy || !visualFile || !visualSize.width} className="rounded-xl bg-[#d4af37] px-4 py-3 font-semibold text-black disabled:opacity-40">{busy ? 'Locking visual and dispatching...' : 'Approve image and build Preview'}</button></div>
                </form>
              </section>

              {!!selected.logos.length && !approvedVisual && <section><div className="mb-3"><p className="text-xs uppercase tracking-[0.22em] text-[#9b7b19]">Optional text workflow</p><h3 className="text-2xl font-semibold">Choose a generated brand pack</h3></div><div className="grid gap-4 md:grid-cols-3">{selected.logos.map((option) => <article key={option.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Option {option.option_number}</p><h4 className="mt-2 text-xl font-semibold">{String(option.config.label || `Brand ${option.option_number}`)}</h4><p className="mt-3 text-sm leading-6 text-zinc-600">{String(option.config.positioning || '')}</p>{pendingLogo && <button disabled={busy} onClick={() => approve('logo', option.option_number)} className="mt-5 w-full rounded-xl bg-zinc-950 px-4 py-3 font-semibold text-white">Approve this brand</button>}</article>)}</div></section>}

              {!!selected.websites.length && !approvedVisual && <section><div className="mb-3"><p className="text-xs uppercase tracking-[0.22em] text-[#9b7b19]">Optional text workflow</p><h3 className="text-2xl font-semibold">Choose a generated website pack</h3></div><div className="grid gap-4 md:grid-cols-3">{selected.websites.map((option) => <article key={option.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Option {option.option_number}</p><h4 className="mt-2 text-xl font-semibold">{option.label || `Website ${option.option_number}`}</h4><p className="mt-3 text-sm leading-6 text-zinc-600">{String(option.config.layout || '')}</p>{pendingWebsite && <button disabled={busy} onClick={() => approve('website', option.option_number)} className="mt-5 w-full rounded-xl bg-[#d4af37] px-4 py-3 font-semibold text-black">Approve and build</button>}</article>)}</div></section>}

              <section className="grid gap-4 md:grid-cols-2"><div className="rounded-3xl border border-zinc-200 bg-white p-5"><h3 className="font-semibold">Workflow</h3><div className="mt-3 space-y-2">{selected.jobs.slice(0, 10).map((job) => <div key={job.id} className="rounded-xl bg-zinc-50 p-3 text-sm"><div className="flex justify-between"><span>{job.type}</span><span className="text-zinc-500">{job.state}</span></div>{job.last_error && <p className="mt-1 text-xs text-red-700">{job.last_error}</p>}</div>)}</div></div><div className="rounded-3xl border border-zinc-200 bg-white p-5"><h3 className="font-semibold">Receipts</h3><div className="mt-3 space-y-2">{selected.receipts.slice(0, 10).map((item) => <div key={item.id} className="flex justify-between rounded-xl bg-zinc-50 p-3 text-sm"><span>{item.kind}</span><span>{item.passed ? 'PASS' : 'BLOCKED'}</span></div>)}</div></div></section>
            </div>}
          </section>
        </div>
      </div>
    </main>
  )
}
