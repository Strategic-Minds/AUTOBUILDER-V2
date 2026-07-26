'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'

type Project = {
  id: string
  name: string
  client_name: string
  industry: string
  region: string
  status: string
  website_url: string | null
  production_locked: boolean
}

type OptionRecord = {
  id: string
  option_number: number
  label?: string
  config: Record<string, unknown>
}

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
          name: form.get('name'),
          clientName: form.get('clientName'),
          industry: form.get('industry'),
          region: form.get('region'),
          services: form.get('services'),
          brief: form.get('brief'),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Project creation failed')
      e.currentTarget.reset()
      await loadProjects()
      await loadProject(data.project.id)
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value))
    } finally {
      setBusy(false)
    }
  }

  async function approve(kind: 'logo' | 'website', option: number) {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/factory/projects/${selected.project.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, option }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Approval failed')
      await loadProject(selected.project.id)
      await loadProjects()
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value))
    } finally {
      setBusy(false)
    }
  }

  const pendingLogo = selected?.approvals.find((item) => item.kind === 'logo' && item.state === 'pending')
  const pendingWebsite = selected?.approvals.find((item) => item.kind === 'website' && item.state === 'pending')

  return (
    <main className="min-h-screen bg-[#f8f9fb] text-zinc-950">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        <header className="mb-8 flex flex-col gap-3 border-b border-zinc-200 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b7b19]">Xtreme AI Builder</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">From a few details to a finished system.</h1>
            <p className="mt-3 max-w-3xl text-zinc-600">Create the project, approve one brand pack, approve one website pack, then let the factory build and validate the final preview.</p>
          </div>
          <div className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-600">Production stays locked until final approval</div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <form onSubmit={create} className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Start a project</h2>
              <input name="name" required placeholder="Project name" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <input name="clientName" required placeholder="Business or client name" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <input name="industry" required placeholder="Industry" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <input name="region" required placeholder="City, state, or market" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <textarea name="services" rows={3} placeholder="Services" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <textarea name="brief" rows={4} placeholder="A few notes about the style and goal" className="w-full rounded-xl border border-zinc-200 px-4 py-3" />
              <button disabled={busy} className="w-full rounded-xl bg-zinc-950 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Working...' : 'Create and generate brand packs'}</button>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </form>

            <section className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm">
              <h2 className="px-2 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Projects</h2>
              <div className="space-y-2">
                {projects.map((project) => (
                  <button key={project.id} onClick={() => loadProject(project.id)} className="w-full rounded-2xl border border-zinc-200 p-4 text-left hover:border-zinc-400">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{project.name}</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs">{project.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{project.client_name} · {project.region}</p>
                  </button>
                ))}
                {!projects.length && <p className="p-4 text-sm text-zinc-500">No projects yet.</p>}
              </div>
            </section>
          </aside>

          <section className="min-w-0">
            {!selected && <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">Select a project or create the first one.</div>}
            {selected && (
              <div className="space-y-6">
                <div className="rounded-3xl bg-zinc-950 p-6 text-white shadow-xl">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">{selected.project.industry}</p>
                      <h2 className="mt-2 text-3xl font-semibold">{selected.project.name}</h2>
                      <p className="mt-2 text-zinc-400">{selected.project.client_name} · {selected.project.region}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">Current state</p>
                      <p className="font-semibold">{selected.project.status}</p>
                    </div>
                  </div>
                  {selected.project.website_url && <a href={selected.project.website_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 font-semibold text-black">Open final preview</a>}
                </div>

                {!!selected.logos.length && (
                  <section>
                    <div className="mb-3"><p className="text-xs uppercase tracking-[0.22em] text-[#9b7b19]">Approval 1</p><h3 className="text-2xl font-semibold">Choose the brand pack</h3></div>
                    <div className="grid gap-4 md:grid-cols-3">
                      {selected.logos.map((option) => (
                        <article key={option.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Option {option.option_number}</p>
                          <h4 className="mt-2 text-xl font-semibold">{String(option.config.label || `Brand ${option.option_number}`)}</h4>
                          <p className="mt-3 text-sm leading-6 text-zinc-600">{String(option.config.positioning || '')}</p>
                          <p className="mt-3 text-sm text-zinc-500">{String(option.config.logo_direction || '')}</p>
                          {pendingLogo && <button disabled={busy} onClick={() => approve('logo', option.option_number)} className="mt-5 w-full rounded-xl bg-zinc-950 px-4 py-3 font-semibold text-white">Approve this brand</button>}
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {!!selected.websites.length && (
                  <section>
                    <div className="mb-3"><p className="text-xs uppercase tracking-[0.22em] text-[#9b7b19]">Approval 2</p><h3 className="text-2xl font-semibold">Choose the website pack</h3></div>
                    <div className="grid gap-4 md:grid-cols-3">
                      {selected.websites.map((option) => (
                        <article key={option.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Option {option.option_number}</p>
                          <h4 className="mt-2 text-xl font-semibold">{option.label || `Website ${option.option_number}`}</h4>
                          <p className="mt-3 text-sm leading-6 text-zinc-600">{String(option.config.layout || '')}</p>
                          <p className="mt-3 text-sm text-zinc-500">{String(option.config.interaction || '')}</p>
                          {pendingWebsite && <button disabled={busy} onClick={() => approve('website', option.option_number)} className="mt-5 w-full rounded-xl bg-[#d4af37] px-4 py-3 font-semibold text-black">Approve and build</button>}
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-zinc-200 bg-white p-5"><h3 className="font-semibold">Workflow</h3><div className="mt-3 space-y-2">{selected.jobs.slice(0, 8).map((job) => <div key={job.id} className="flex justify-between rounded-xl bg-zinc-50 p-3 text-sm"><span>{job.type}</span><span className="text-zinc-500">{job.state}</span></div>)}</div></div>
                  <div className="rounded-3xl border border-zinc-200 bg-white p-5"><h3 className="font-semibold">Receipts</h3><div className="mt-3 space-y-2">{selected.receipts.slice(0, 8).map((item) => <div key={item.id} className="flex justify-between rounded-xl bg-zinc-50 p-3 text-sm"><span>{item.kind}</span><span>{item.passed ? 'PASS' : 'BLOCKED'}</span></div>)}</div></div>
                </section>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
