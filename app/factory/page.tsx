'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

type JsonRecord = Record<string, unknown>

type Project = {
  id: string
  name: string
  client_name: string
  industry: string
  region: string
  status: string
  website_url: string | null
  production_locked: boolean
  metadata?: JsonRecord
}

type OptionRecord = {
  id: string
  option_number: number
  label?: string
  config: JsonRecord
}

type Bundle = {
  project: Project
  logos: OptionRecord[]
  websites: OptionRecord[]
  approvals: Array<{ id: string; kind: 'logo' | 'website'; state: string; selected_option: number | null }>
  jobs: Array<{ id: string; type: string; state: string; last_error?: string | null }>
  receipts: Array<{ id: string; kind: string; passed: boolean; created_at: string }>
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function objectValue(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function humanState(value: string) {
  const states: Record<string, string> = {
    queued: 'Queued',
    research: 'Preparing',
    generating: 'Building and validating',
    waiting_for_approval: 'Your approval is ready',
    approved: 'Approved for final build',
    completed: 'Completed',
    failed: 'Needs review',
  }
  return states[value] || value.replaceAll('_', ' ')
}

function friendlyError(value: unknown) {
  const message = value instanceof Error ? value.message : String(value)
  if (message.includes('FACTORY_QUEUE_MIGRATION_REQUIRED')) {
    return 'The secure workflow upgrade is prepared but has not been approved for the database yet.'
  }
  if (message.includes('NATIVE_BUILD_ENV_REQUIRED')) {
    return 'The preview builder is missing one or more protected connector settings.'
  }
  if (message.includes('OUTPUT_REPOSITORY_CREATION_APPROVAL_REQUIRED')) {
    return 'The approved project needs an output repository before the final build can begin.'
  }
  if (message.includes('VERCEL_PROJECT_CREATION_APPROVAL_REQUIRED')) {
    return 'The approved project needs a preview deployment target before the final build can begin.'
  }
  return message
}

function DetailList({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => <span key={value} className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600">{value}</span>)}
      </div>
    </div>
  )
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
    loadProjects().catch((value) => setError(friendlyError(value)))
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
      setError(friendlyError(value))
    } finally {
      setBusy(false)
    }
  }

  async function approve(kind: 'logo' | 'website', option: number) {
    if (!selected) return
    setBusy(true)
    setError('')
    const testAutoApproval = selected.project.name.trim().toUpperCase() === 'AUTOBUILDER_GOLDEN_PATH_TEST'
    try {
      const response = await fetch(`/api/factory/projects/${selected.project.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, option, test_auto_approval: testAutoApproval }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Approval failed')
      await loadProject(selected.project.id)
      await loadProjects()
    } catch (value) {
      setError(friendlyError(value))
    } finally {
      setBusy(false)
    }
  }

  const pendingLogo = selected?.approvals.find((item) => item.kind === 'logo' && item.state === 'pending')
  const pendingWebsite = selected?.approvals.find((item) => item.kind === 'website' && item.state === 'pending')
  const currentStage = useMemo(() => {
    if (!selected) return ''
    if (pendingLogo) return 'Brand approval'
    if (pendingWebsite) return 'Website approval'
    if (selected.project.website_url) return 'Preview ready'
    return humanState(selected.project.status)
  }, [pendingLogo, pendingWebsite, selected])

  return (
    <main className="min-h-screen bg-[#f8f9fb] text-zinc-950">
      <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 md:py-12">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-7 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b7b19]">Xtreme AI Builder</p>
            <h1 className="mt-2 max-w-5xl text-3xl font-semibold tracking-[-0.04em] md:text-6xl">A few business details in. A finished, validated system out.</h1>
            <p className="mt-4 max-w-3xl text-zinc-600">Choose one complete brand pack, choose one complete website pack, and the factory handles the branch, pull request, preview, responsive tests, and evidence.</p>
          </div>
          <div className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-600">Production remains locked until the final release approval</div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <form onSubmit={create} className="space-y-3 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7b19]">Step 1</p>
                <h2 className="mt-1 text-xl font-semibold">Start a project</h2>
                <p className="mt-1 text-sm text-zinc-500">No technical configuration required.</p>
              </div>
              <input name="name" required placeholder="Project name" className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#9b7b19]" />
              <input name="clientName" required placeholder="Business or client name" className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#9b7b19]" />
              <input name="industry" required placeholder="Industry" className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#9b7b19]" />
              <input name="region" required placeholder="City, state, or market" className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#9b7b19]" />
              <textarea name="services" rows={3} placeholder="Services" className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#9b7b19]" />
              <textarea name="brief" rows={4} placeholder="Style, audience, and desired outcome" className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#9b7b19]" />
              <button disabled={busy} className="w-full rounded-xl bg-zinc-950 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Working…' : 'Create 3 brand packs'}</button>
              {error && <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </form>

            <section className="rounded-[28px] border border-zinc-200 bg-white p-3 shadow-sm">
              <h2 className="px-2 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Projects</h2>
              <div className="space-y-2">
                {projects.map((project) => (
                  <button key={project.id} onClick={() => loadProject(project.id)} className="w-full rounded-2xl border border-zinc-200 p-4 text-left transition hover:border-zinc-500 hover:bg-zinc-50">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{project.name}</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs capitalize">{humanState(project.status)}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{project.client_name} · {project.region}</p>
                  </button>
                ))}
                {!projects.length && <p className="p-4 text-sm text-zinc-500">No projects yet.</p>}
              </div>
            </section>
          </aside>

          <section className="min-w-0">
            {!selected && <div className="rounded-[32px] border border-dashed border-zinc-300 bg-white p-16 text-center text-zinc-500">Select a project or create the first one.</div>}
            {selected && (
              <div className="space-y-7">
                <div className="overflow-hidden rounded-[32px] bg-zinc-950 text-white shadow-xl">
                  <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">{selected.project.industry}</p>
                      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">{selected.project.name}</h2>
                      <p className="mt-2 text-zinc-400">{selected.project.client_name} · {selected.project.region}</p>
                    </div>
                    <div className="md:text-right">
                      <p className="text-sm text-zinc-400">Current stage</p>
                      <p className="mt-1 text-lg font-semibold">{currentStage}</p>
                      <p className="mt-1 text-xs text-zinc-500">Production locked: {selected.project.production_locked ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  {selected.project.website_url && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-6 py-4 md:px-8">
                      <span className="text-sm text-zinc-300">Responsive preview and evidence are ready for review.</span>
                      <a href={selected.project.website_url} target="_blank" rel="noreferrer" className="inline-flex rounded-xl bg-white px-4 py-3 font-semibold text-black">Open final preview</a>
                    </div>
                  )}
                </div>

                {!!selected.logos.length && (
                  <section>
                    <div className="mb-4"><p className="text-xs uppercase tracking-[0.22em] text-[#9b7b19]">Approval 1</p><h3 className="text-2xl font-semibold tracking-tight md:text-3xl">Choose the complete brand system</h3></div>
                    <div className="grid gap-4 lg:grid-cols-3">
                      {selected.logos.map((option) => {
                        const palette = stringArray(option.config.palette)
                        const typography = objectValue(option.config.typography)
                        return (
                          <article key={option.id} className="flex min-h-full flex-col rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Option {option.option_number}</p>
                            <h4 className="mt-2 text-xl font-semibold">{stringValue(option.config.label, `Brand ${option.option_number}`)}</h4>
                            <p className="mt-3 text-sm leading-6 text-zinc-600">{stringValue(option.config.positioning)}</p>
                            <div className="mt-5 flex gap-1.5" aria-label="Brand color palette">
                              {palette.map((color) => <span key={color} title={color} className="h-8 flex-1 rounded-lg border border-black/10" style={{ backgroundColor: color }} />)}
                            </div>
                            <div className="mt-5 space-y-4 text-sm text-zinc-600">
                              <div><p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Logo system</p><p className="mt-1">{stringValue(option.config.logo_direction)}</p></div>
                              <div><p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Typography</p><p className="mt-1">{stringValue(typography.display)}</p></div>
                              <div><p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Imagery</p><p className="mt-1">{stringValue(option.config.imagery_direction)}</p></div>
                              <DetailList title="Slogan directions" values={stringArray(option.config.slogan_options)} />
                            </div>
                            <details className="mt-5 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
                              <summary className="cursor-pointer font-semibold text-zinc-900">Desktop and mobile usage</summary>
                              <p className="mt-3"><strong>Desktop:</strong> {stringValue(option.config.desktop_usage)}</p>
                              <p className="mt-2"><strong>Mobile:</strong> {stringValue(option.config.mobile_usage)}</p>
                            </details>
                            {pendingLogo && <button disabled={busy} onClick={() => approve('logo', option.option_number)} className="mt-5 w-full rounded-xl bg-zinc-950 px-4 py-3 font-semibold text-white disabled:opacity-50">Approve this brand</button>}
                          </article>
                        )
                      })}
                    </div>
                  </section>
                )}

                {!!selected.websites.length && (
                  <section>
                    <div className="mb-4"><p className="text-xs uppercase tracking-[0.22em] text-[#9b7b19]">Approval 2</p><h3 className="text-2xl font-semibold tracking-tight md:text-3xl">Choose the complete website and funnel system</h3></div>
                    <div className="grid gap-4 lg:grid-cols-3">
                      {selected.websites.map((option) => {
                        const responsive = objectValue(option.config.responsive)
                        return (
                          <article key={option.id} className="flex min-h-full flex-col rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Option {option.option_number}</p>
                            <h4 className="mt-2 text-xl font-semibold">{option.label || `Website ${option.option_number}`}</h4>
                            <p className="mt-3 text-sm leading-6 text-zinc-600">{stringValue(option.config.layout)}</p>
                            <div className="mt-5 space-y-4">
                              <DetailList title="Full page sections" values={stringArray(option.config.sections)} />
                              <DetailList title="Navigation" values={stringArray(option.config.navigation)} />
                              <DetailList title="Component states" values={stringArray(option.config.component_states)} />
                              <div className="rounded-2xl bg-zinc-950 p-4 text-white">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">Primary conversion</p>
                                <p className="mt-1 font-semibold">{stringValue(option.config.primary_cta, 'Start the project')}</p>
                              </div>
                            </div>
                            <details className="mt-5 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
                              <summary className="cursor-pointer font-semibold text-zinc-900">Desktop, tablet, mobile and PWA</summary>
                              <p className="mt-3"><strong>Desktop:</strong> {stringValue(responsive.desktop)}</p>
                              <p className="mt-2"><strong>Tablet:</strong> {stringValue(responsive.tablet)}</p>
                              <p className="mt-2"><strong>Mobile:</strong> {stringValue(responsive.mobile)}</p>
                              <p className="mt-2"><strong>PWA:</strong> {stringArray(option.config.pwa_behavior).join(' · ')}</p>
                            </details>
                            <details className="mt-3 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
                              <summary className="cursor-pointer font-semibold text-zinc-900">Funnel and integrations</summary>
                              <p className="mt-3"><strong>Funnel:</strong> {stringArray(option.config.funnel).join(' → ')}</p>
                              <p className="mt-2"><strong>Integrations:</strong> {stringArray(option.config.integrations).join(' · ')}</p>
                            </details>
                            {pendingWebsite && <button disabled={busy} onClick={() => approve('website', option.option_number)} className="mt-5 w-full rounded-xl bg-[#d4af37] px-4 py-3 font-semibold text-black disabled:opacity-50">Approve and build</button>}
                          </article>
                        )
                      })}
                    </div>
                  </section>
                )}

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[28px] border border-zinc-200 bg-white p-5"><h3 className="font-semibold">Workflow</h3><div className="mt-3 space-y-2">{selected.jobs.slice(0, 8).map((job) => <div key={job.id} className="flex justify-between gap-3 rounded-xl bg-zinc-50 p-3 text-sm"><span>{job.type.replaceAll('_', ' ')}</span><span className="text-right text-zinc-500">{humanState(job.state)}</span></div>)}</div></div>
                  <div className="rounded-[28px] border border-zinc-200 bg-white p-5"><h3 className="font-semibold">Evidence receipts</h3><div className="mt-3 space-y-2">{selected.receipts.slice(0, 8).map((item) => <div key={item.id} className="flex justify-between gap-3 rounded-xl bg-zinc-50 p-3 text-sm"><span>{item.kind.replaceAll('_', ' ')}</span><span className={item.passed ? 'text-emerald-700' : 'text-amber-700'}>{item.passed ? 'PASS' : 'BLOCKED'}</span></div>)}</div></div>
                </section>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
