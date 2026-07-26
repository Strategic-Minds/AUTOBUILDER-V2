type JsonRecord = Record<string, unknown>

export type GeneratedSiteInput = {
  projectId: string
  projectName: string
  clientName: string
  industry: string
  region: string
  services: string
  brief: string
  approvedBrand: JsonRecord
  approvedWebsite: JsonRecord
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function stringList(value: unknown, fallback: string[]) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : fallback
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function slugifyProject(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || 'generated-project'
}

function generatedPackageJson(name: string) {
  return {
    name,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'npm run validate && next build',
      start: 'next start',
      lint: 'biome lint app lib tests next.config.mjs',
      test: 'node --test tests/contract.test.mjs',
      typecheck: 'tsc --noEmit',
      validate: 'npm audit --audit-level=high && npm run lint && npm run test && npm run typecheck',
    },
    dependencies: {
      next: '15.5.22',
      react: '^19.1.0',
      'react-dom': '^19.1.0',
      zod: '^3.25.76',
    },
    devDependencies: {
      '@biomejs/biome': '2.5.5',
      '@types/node': '^22.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      typescript: '^5.8.0',
    },
    overrides: {
      postcss: '8.5.23',
      sharp: '0.35.3',
    },
  }
}

export function buildGeneratedSiteFiles(input: GeneratedSiteInput): Record<string, string> {
  const brandConfig = (input.approvedBrand.config && typeof input.approvedBrand.config === 'object'
    ? input.approvedBrand.config
    : input.approvedBrand) as JsonRecord
  const websiteConfig = (input.approvedWebsite.config && typeof input.approvedWebsite.config === 'object'
    ? input.approvedWebsite.config
    : input.approvedWebsite) as JsonRecord

  const palette = stringList(brandConfig.palette, ['#F5F6F8', '#101114', '#D4AF37'])
  const background = palette[0] || '#F5F6F8'
  const primary = palette[1] || '#101114'
  const accent = palette[2] || '#D4AF37'
  const positioning = stringValue(brandConfig.positioning, `${input.clientName} turns new requests into organized, trackable projects.`)
  const voice = stringValue(brandConfig.voice, 'Clear, decisive, calm, and operational')
  const layout = stringValue(websiteConfig.layout, 'Premium operations command center with a focused public intake funnel')
  const services = input.services.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
  const capabilities = services.length ? services : ['Project intake', 'Status tracking', 'Search and filtering', 'Operational visibility']
  const sections = stringList(websiteConfig.sections, ['Hero', 'Capabilities', 'Workflow', 'Proof', 'Intake'])
  const intakeTableName = `xab_${slugifyProject(input.projectName).replace(/-/g, '_')}_intakes`

  const content = {
    projectId: input.projectId,
    projectName: input.projectName,
    clientName: input.clientName,
    industry: input.industry,
    region: input.region,
    brief: input.brief,
    positioning,
    voice,
    layout,
    capabilities,
    sections,
    palette: { background, primary, accent },
  }

  const packageJson = generatedPackageJson(slugifyProject(input.projectName))

  const serverLib = `import { createHash, timingSafeEqual } from 'node:crypto'\n\ntype IntakeInput = { name: string; email: string; company: string; service: string; details: string }\n\nfunction env(name: string) {\n  const value = process.env[name]?.trim()\n  if (!value) throw new Error('Missing server configuration: ' + name)\n  return value\n}\n\nexport function supabaseConfig() {\n  return {\n    url: (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\/$/, ''),\n    key: env('SUPABASE_SERVICE_ROLE_KEY'),\n  }\n}\n\nexport function restPath(table: string, query: URLSearchParams | string = '') {\n  const value = typeof query === 'string' ? query : query.toString()\n  return value ? [table, value].join('?') : table\n}\n\nexport async function supabase<T>(path: string, init: RequestInit = {}): Promise<T> {\n  const { url, key } = supabaseConfig()\n  if (!url) throw new Error('Missing server configuration: SUPABASE_URL')\n  const response = await fetch(url + '/rest/v1/' + path, {\n    ...init,\n    headers: {\n      apikey: key,\n      Authorization: 'Bearer ' + key,\n      'Content-Type': 'application/json',\n      Prefer: 'return=representation',\n      ...(init.headers || {}),\n    },\n    cache: 'no-store',\n  })\n  const raw = await response.text()\n  const data = raw ? JSON.parse(raw) : null\n  if (!response.ok) throw new Error('Database request failed ' + response.status + ': ' + raw.slice(0, 300))\n  return data as T\n}\n\nexport function clientIp(request: Request) {\n  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()\n  return forwarded || request.headers.get('x-real-ip') || 'unknown'\n}\n\nexport function ipHash(request: Request) {\n  return createHash('sha256').update(clientIp(request)).digest('hex')\n}\n\nexport function validIntake(value: unknown): IntakeInput | null {\n  if (!value || typeof value !== 'object') return null\n  const data = value as Record<string, unknown>\n  const clean = {\n    name: typeof data.name === 'string' ? data.name.trim().slice(0, 120) : '',\n    email: typeof data.email === 'string' ? data.email.trim().toLowerCase().slice(0, 180) : '',\n    company: typeof data.company === 'string' ? data.company.trim().slice(0, 160) : '',\n    service: typeof data.service === 'string' ? data.service.trim().slice(0, 160) : '',\n    details: typeof data.details === 'string' ? data.details.trim().slice(0, 2000) : '',\n  }\n  if (clean.name.length < 2 || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(clean.email) || clean.details.length < 10) return null\n  return clean\n}\n\nexport function operatorAuthorized(request: Request) {\n  const expected = process.env.PROOF_OPERATOR_TOKEN || ''\n  const actual = request.headers.get('x-proof-operator') || ''\n  if (!expected || expected.length !== actual.length) return false\n  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual))\n}\n`

  const intakeRoute = `import { NextResponse } from 'next/server'
import { ipHash, restPath, supabase, validIntake } from '@/lib/proof-server'

export const dynamic = 'force-dynamic'
const intakeTable = ${safeJson(intakeTableName)}

export async function POST(request: Request) {
  try {
    const body = validIntake(await request.json())
    if (!body) return NextResponse.json({ ok: false, error: 'Please provide a valid name, email, and project description.' }, { status: 400 })
    const hash = ipHash(request)
    const since = encodeURIComponent(new Date(Date.now() - 60 * 60 * 1000).toISOString())
    const recentQuery = new URLSearchParams({ ip_hash: ['eq.', hash].join(''), created_at: ['gte.', since].join(''), select: 'id', limit: '6' })
    const recent = await supabase<Array<{ id: string }>>(restPath(intakeTable, recentQuery))
    if (recent.length >= 5) return NextResponse.json({ ok: false, error: 'Rate limit reached. Try again later.' }, { status: 429 })
    const rows = await supabase<Array<Record<string, unknown>>>(intakeTable, {
      method: 'POST',
      body: JSON.stringify({ ...body, status: 'new', source: 'generated-public-intake', ip_hash: hash }),
    })
    return NextResponse.json({ ok: true, project: rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unexpected intake error' }, { status: 500 })
  }
}
`

  const projectsRoute = `import { NextResponse } from 'next/server'
import { operatorAuthorized, restPath, supabase } from '@/lib/proof-server'

export const dynamic = 'force-dynamic'
const intakeTable = ${safeJson(intakeTableName)}
const statuses = new Set(['new', 'reviewing', 'active', 'completed'])

export async function GET(request: Request) {
  if (!operatorAuthorized(request)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const query = id
    ? restPath(intakeTable, new URLSearchParams({ id: ['eq.', id].join(''), select: '*', limit: '1' }))
    : restPath(intakeTable, new URLSearchParams({ select: '*', order: 'created_at.desc', limit: '100' }))
  const rows = await supabase<Array<Record<string, unknown>>>(query)
  return NextResponse.json({ ok: true, projects: rows })
}

export async function PATCH(request: Request) {
  if (!operatorAuthorized(request)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const body = await request.json() as { id?: unknown; status?: unknown }
  const id = typeof body.id === 'string' ? body.id : ''
  const status = typeof body.status === 'string' ? body.status : ''
  if (!id || !statuses.has(status)) return NextResponse.json({ ok: false, error: 'Invalid status update' }, { status: 400 })
  const rows = await supabase<Array<Record<string, unknown>>>(restPath(intakeTable, new URLSearchParams({ id: ['eq.', id].join('') })), {
    method: 'PATCH',
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  })
  return NextResponse.json({ ok: true, project: rows[0] })
}
`

  const healthRoute = `import { NextResponse } from 'next/server'\nimport { supabaseConfig } from '@/lib/proof-server'\n\nexport async function GET() {\n  try {\n    const config = supabaseConfig()\n    return NextResponse.json({ ok: true, service: 'proof-flow-operations', database_configured: Boolean(config.url && config.key), production: true, timestamp: new Date().toISOString() })\n  } catch (error) {\n    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Health failure' }, { status: 503 })\n  }\n}\n`

  const homePage = `'use client'\n\nimport { FormEvent, useEffect, useState } from 'react'\n\nconst content = ${safeJson(content)} as const\n\ntype FormState = 'idle' | 'submitting' | 'success' | 'error'\n\nexport default function HomePage() {\n  const [menuOpen, setMenuOpen] = useState(false)\n  const [state, setState] = useState<FormState>('idle')\n  const [message, setMessage] = useState('')\n\n  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined) }, [])\n\n  async function submit(event: FormEvent<HTMLFormElement>) {\n    event.preventDefault()\n    setState('submitting')\n    setMessage('')\n    const data = Object.fromEntries(new FormData(event.currentTarget).entries())\n    const response = await fetch('/api/intake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })\n    const result = await response.json() as { ok?: boolean; error?: string }\n    if (!response.ok || !result.ok) { setState('error'); setMessage(result.error || 'Unable to save the project request.'); return }\n    event.currentTarget.reset()\n    setState('success')\n    setMessage('Your project request is saved and visible in the operations dashboard.')\n  }\n\n  return <main>\n    <header className="topbar">\n      <a className="brand" href="#top"><span>PF</span><strong>{content.clientName}</strong></a>\n      <button className="menu-button" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>Menu</button>\n      <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Primary navigation">\n        <a href="#capabilities">Capabilities</a><a href="#workflow">Workflow</a><a href="#intake">Start a project</a><a href="/privacy">Privacy</a><a className="pill" href="/dashboard">Operator dashboard</a>\n      </nav>\n    </header>\n    <section className="hero" id="top">\n      <div className="hero-copy"><p className="eyebrow">Operations clarity, without the clutter</p><h1>{content.positioning}</h1><p>{content.brief}</p><div className="actions"><a className="button" href="#intake">Start a project</a><a className="button ghost" href="/dashboard">Open dashboard</a></div></div>\n      <div className="command-card" aria-label="ProofFlow live workflow"><div className="command-head"><span>Live operating flow</span><b>Production</b></div>{['Capture the request','Organize the details','Track the status','Close the loop'].map((item, index) => <div className="flow-row" key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong><i>{index === 0 ? 'Ready' : 'Automated'}</i></div>)}</div>\n    </section>\n    <section className="section" id="capabilities"><div className="section-title"><p className="eyebrow">Capabilities</p><h2>A clean operating system for the work arriving next.</h2></div><div className="grid">{content.capabilities.map((item, index) => <article className="feature" key={item}><span>0{index + 1}</span><h3>{item}</h3><p>Structured intake, visible progress, and a durable record designed for decisive follow-through.</p></article>)}</div></section>\n    <section className="section workflow" id="workflow"><div><p className="eyebrow">Workflow</p><h2>Every request moves through a visible state.</h2><p>{content.layout}. The public experience stays simple while the operator sees the complete pipeline.</p></div><ol>{['New request','Reviewing','Active project','Completed'].map((item, index) => <li key={item}><span>{index + 1}</span><div><strong>{item}</strong><p>Clear ownership, searchable details, and a status that survives every refresh.</p></div></li>)}</ol></section>\n    <section className="section intake" id="intake"><div><p className="eyebrow">Project intake</p><h2>Tell ProofFlow what needs to move.</h2><p>Submissions are validated server-side and stored in the clean-room Supabase data plane.</p></div><form onSubmit={submit}>\n      <label>Name<input name="name" required minLength={2} autoComplete="name" /></label><label>Email<input name="email" type="email" required autoComplete="email" /></label><label>Company<input name="company" autoComplete="organization" /></label><label>Capability<select name="service">{content.capabilities.map((item) => <option key={item}>{item}</option>)}</select></label><label className="wide">Project details<textarea name="details" required minLength={10} rows={6} /></label><button className="button wide" type="submit" disabled={state === 'submitting'}>{state === 'submitting' ? 'Saving…' : 'Save project request'}</button>{message && <p className={state === 'error' ? 'notice error' : 'notice success'} role="status">{message}</p>}\n    </form></section>\n    <footer><div><strong>{content.clientName}</strong><span>{content.voice}</span></div><div><a href="/privacy">Privacy</a><a href="/dashboard">Operator</a><span>{content.region}</span></div></footer>\n  </main>\n}\n`

  const dashboardPage = `'use client'\n\nimport { FormEvent, useEffect, useMemo, useState } from 'react'\n\ntype Project = { id: string; name: string; email: string; company: string; service: string; details: string; status: string; created_at: string; updated_at: string }\n\nexport default function DashboardPage() {\n  const [token, setToken] = useState('')\n  const [projects, setProjects] = useState<Project[]>([])\n  const [query, setQuery] = useState('')\n  const [status, setStatus] = useState('all')\n  const [error, setError] = useState('')\n  const [loading, setLoading] = useState(false)\n\n  async function load(nextToken = token) {\n    setLoading(true); setError('')\n    const response = await fetch('/api/projects', { headers: { 'x-proof-operator': nextToken } })\n    const result = await response.json() as { ok?: boolean; projects?: Project[]; error?: string }\n    if (!response.ok || !result.ok) { setError(result.error || 'Unable to load projects'); setProjects([]) } else setProjects(result.projects || [])\n    setLoading(false)\n  }\n\n  function authenticate(event: FormEvent<HTMLFormElement>) { event.preventDefault(); sessionStorage.setItem('proof-operator-token', token); void load(token) }\n  useEffect(() => { const saved = sessionStorage.getItem('proof-operator-token') || ''; if (saved) { setToken(saved); void load(saved) } }, [])\n\n  const visible = useMemo(() => projects.filter((project) => {\n    const haystack = [project.name, project.email, project.company, project.service, project.details].join(' ').toLowerCase()\n    return (status === 'all' || project.status === status) && haystack.includes(query.toLowerCase())\n  }), [projects, query, status])\n\n  async function updateStatus(id: string, nextStatus: string) {\n    const response = await fetch('/api/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-proof-operator': token }, body: JSON.stringify({ id, status: nextStatus }) })\n    if (!response.ok) { setError('Status update failed'); return }\n    await load()\n  }\n\n  if (!projects.length && !loading) return <main className="dashboard-shell"><a className="back" href="/">← ProofFlow</a><section className="login-card"><p className="eyebrow">Operator access</p><h1>Open the project command center.</h1><form onSubmit={authenticate}><label>Operator token<input type="password" value={token} onChange={(event) => setToken(event.target.value)} required /></label><button className="button" type="submit">Open dashboard</button>{error && <p className="notice error">{error}</p>}</form></section></main>\n\n  return <main className="dashboard-shell"><header className="dashboard-head"><div><a className="back" href="/">← ProofFlow</a><p className="eyebrow">Operations dashboard</p><h1>Projects moving through the system.</h1></div><button className="button ghost" type="button" onClick={() => load()}>Refresh</button></header><section className="filters"><input aria-label="Search projects" placeholder="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="new">New</option><option value="reviewing">Reviewing</option><option value="active">Active</option><option value="completed">Completed</option></select></section>{loading ? <div className="empty">Loading projects…</div> : visible.length ? <section className="project-list">{visible.map((project) => <article className="project-row" key={project.id}><div><span className={'status ' + project.status}>{project.status}</span><h2>{project.name}</h2><p>{project.company || project.email} · {project.service}</p></div><div className="row-actions"><a className="button ghost" href={'/projects/' + project.id}>View</a><select aria-label={'Update ' + project.name + ' status'} value={project.status} onChange={(event) => updateStatus(project.id, event.target.value)}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="active">Active</option><option value="completed">Completed</option></select></div></article>)}</section> : <div className="empty">No projects match the current filters.</div>}</main>\n}\n`

  const detailPage = `'use client'\n\nimport { useEffect, useState } from 'react'\nimport { useParams } from 'next/navigation'\n\ntype Project = { id: string; name: string; email: string; company: string; service: string; details: string; status: string; created_at: string; updated_at: string }\n\nexport default function ProjectDetailPage() {\n  const params = useParams<{ id: string }>()\n  const [project, setProject] = useState<Project | null>(null)\n  const [error, setError] = useState('')\n  useEffect(() => {\n    const token = sessionStorage.getItem('proof-operator-token') || ''\n    fetch('/api/projects?id=' + encodeURIComponent(params.id), { headers: { 'x-proof-operator': token } }).then(async (response) => {\n      const result = await response.json() as { ok?: boolean; projects?: Project[]; error?: string }\n      if (!response.ok || !result.ok) setError(result.error || 'Unable to load project'); else setProject(result.projects?.[0] || null)\n    }).catch(() => setError('Unable to load project'))\n  }, [params.id])\n  if (error) return <main className="dashboard-shell"><a className="back" href="/dashboard">← Dashboard</a><div className="empty">{error}</div></main>\n  if (!project) return <main className="dashboard-shell"><a className="back" href="/dashboard">← Dashboard</a><div className="empty">Loading project…</div></main>\n  return <main className="dashboard-shell"><a className="back" href="/dashboard">← Dashboard</a><article className="detail-card"><div><span className={'status ' + project.status}>{project.status}</span><p className="eyebrow">Project detail</p><h1>{project.name}</h1><p>{project.company || 'Independent request'} · {project.email}</p></div><dl><div><dt>Capability</dt><dd>{project.service}</dd></div><div><dt>Created</dt><dd>{new Date(project.created_at).toLocaleString()}</dd></div><div className="wide"><dt>Project details</dt><dd>{project.details}</dd></div></dl></article></main>\n}\n`

  const privacyPage = `export default function PrivacyPage() { return <main className="legal"><a className="back" href="/">← ProofFlow</a><p className="eyebrow">Privacy</p><h1>Clean-room proof data policy.</h1><p>ProofFlow Operations stores submitted project information in a dedicated Supabase table for the purpose of demonstrating authenticated server-side persistence, search, filtering, status tracking, and production validation.</p><p>Do not submit sensitive personal, financial, medical, or customer production information to this proof environment.</p><p>Access to operator project data requires the isolated proof operator token. Server credentials are never shipped to the browser.</p></main> }\n`

  const offlinePage = `export default function OfflinePage() { return <main className="legal"><p className="eyebrow">Offline</p><h1>ProofFlow is temporarily offline.</h1><p>Your connection appears unavailable. Return to the homepage when service resumes.</p><a className="button" href="/">Try again</a></main> }\n`

  const css = `:root{--bg:${background};--ink:${primary};--accent:${accent};--muted:#6b7078;--panel:#fff;--line:rgba(16,17,20,.13);--shadow:0 24px 70px rgba(16,17,20,.09)}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:inherit;text-decoration:none}button,input,select,textarea{font:inherit}.topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:28px;padding:18px clamp(20px,5vw,72px);background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(18px);border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:12px}.brand span{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--ink);color:var(--bg);font-weight:800}.brand strong{letter-spacing:-.03em}.nav{display:flex;align-items:center;gap:24px;font-size:14px}.menu-button{display:none;border:1px solid var(--line);border-radius:999px;padding:10px 16px;background:var(--panel)}.pill{padding:11px 17px;border-radius:999px;background:var(--ink);color:var(--bg)}.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:7vw;align-items:center;min-height:82vh;padding:clamp(80px,11vw,150px) clamp(20px,7vw,110px);border-bottom:1px solid var(--line)}.hero-copy{max-width:900px}.eyebrow{margin:0 0 16px;color:var(--accent);font-size:12px;font-weight:850;letter-spacing:.17em;text-transform:uppercase}h1{margin:0;font-size:clamp(48px,7vw,100px);line-height:.94;letter-spacing:-.06em}h2{margin:12px 0 20px;font-size:clamp(36px,5vw,68px);line-height:1;letter-spacing:-.05em}h3{font-size:24px;letter-spacing:-.035em}.hero-copy>p:not(.eyebrow),.section p,.legal p{color:var(--muted);font-size:clamp(17px,1.8vw,22px);line-height:1.6}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px}.button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border:1px solid var(--ink);border-radius:999px;background:var(--ink);color:var(--bg);font-weight:780;cursor:pointer}.button:disabled{opacity:.55;cursor:wait}.button.ghost{background:transparent;color:var(--ink)}.command-card{overflow:hidden;border:1px solid rgba(255,255,255,.18);border-radius:28px;background:#101114;color:#fff;box-shadow:var(--shadow)}.command-head,.flow-row{display:grid;grid-template-columns:1fr auto;align-items:center;padding:22px 24px;border-bottom:1px solid rgba(255,255,255,.12)}.command-head b{color:var(--accent);font-size:12px;text-transform:uppercase}.flow-row{grid-template-columns:40px 1fr auto}.flow-row span{color:var(--accent);font-size:12px}.flow-row i{color:#aeb4bf;font-size:12px;font-style:normal}.section{padding:clamp(80px,10vw,145px) clamp(20px,7vw,110px);border-bottom:1px solid var(--line)}.section-title{max-width:900px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:46px}.feature{min-height:260px;padding:26px;border:1px solid var(--line);border-radius:22px;background:var(--panel);box-shadow:0 12px 34px rgba(16,17,20,.04)}.feature>span{color:var(--accent);font-size:12px;font-weight:800}.feature p{font-size:15px}.workflow{display:grid;grid-template-columns:1fr 1fr;gap:8vw}.workflow ol{list-style:none;margin:0;padding:0}.workflow li{display:grid;grid-template-columns:48px 1fr;gap:16px;padding:22px 0;border-bottom:1px solid var(--line)}.workflow li>span{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:var(--ink);color:var(--bg);font-weight:800}.workflow li p{margin:5px 0 0;font-size:15px}.intake{display:grid;grid-template-columns:.8fr 1.2fr;gap:8vw}.intake form{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:26px;border:1px solid var(--line);border-radius:26px;background:var(--panel);box-shadow:var(--shadow)}label{display:flex;flex-direction:column;gap:8px;font-size:13px;font-weight:750}input,select,textarea{width:100%;border:1px solid var(--line);border-radius:14px;background:#fff;color:var(--ink);padding:14px 15px;outline:none}input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}.wide{grid-column:1/-1}.notice{grid-column:1/-1;margin:0!important;padding:13px 15px;border-radius:12px;font-size:14px!important}.notice.success{background:#e9f7ef;color:#17653a}.notice.error{background:#fff0f0;color:#9c2f2f}footer{display:flex;justify-content:space-between;gap:24px;padding:34px clamp(20px,7vw,110px);color:var(--muted);font-size:13px}footer>div{display:flex;gap:18px;flex-wrap:wrap}.dashboard-shell,.legal{min-height:100vh;padding:clamp(28px,6vw,76px);background:var(--bg)}.back{display:inline-block;margin-bottom:28px;color:var(--muted)}.login-card,.detail-card{max-width:920px;margin:7vh auto;padding:clamp(26px,5vw,64px);border:1px solid var(--line);border-radius:30px;background:var(--panel);box-shadow:var(--shadow)}.login-card form{display:grid;gap:15px;max-width:500px;margin-top:28px}.dashboard-head{display:flex;justify-content:space-between;gap:24px;align-items:end}.dashboard-head h1,.detail-card h1,.login-card h1,.legal h1{font-size:clamp(42px,6vw,82px)}.filters{display:grid;grid-template-columns:1fr 220px;gap:12px;margin:36px 0}.project-list{display:grid;gap:12px}.project-row{display:flex;justify-content:space-between;gap:24px;align-items:center;padding:22px;border:1px solid var(--line);border-radius:20px;background:var(--panel)}.project-row h2{margin:8px 0 5px;font-size:25px}.project-row p{margin:0;color:var(--muted)}.row-actions{display:flex;align-items:center;gap:10px}.status{display:inline-flex;padding:6px 10px;border-radius:999px;background:#eceff3;font-size:11px;font-weight:850;text-transform:uppercase}.status.active,.status.completed{background:#e8f6ed;color:#17653a}.status.reviewing{background:#fff4d7;color:#775800}.empty{padding:50px;border:1px dashed var(--line);border-radius:24px;text-align:center;color:var(--muted)}.detail-card dl{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:36px}.detail-card dl>div{padding:20px;border:1px solid var(--line);border-radius:16px}.detail-card dt{color:var(--muted);font-size:12px;text-transform:uppercase}.detail-card dd{margin:8px 0 0;font-size:17px;line-height:1.55}.legal{max-width:960px;margin:auto}.legal p{font-size:18px}.legal .button{margin-top:20px}@media(max-width:960px){.nav{display:none;position:absolute;top:78px;left:16px;right:16px;flex-direction:column;align-items:stretch;padding:18px;border:1px solid var(--line);border-radius:20px;background:var(--panel);box-shadow:var(--shadow)}.nav.open{display:flex}.menu-button{display:block}.hero,.workflow,.intake{grid-template-columns:1fr}.hero{min-height:auto}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-head,.project-row{align-items:stretch;flex-direction:column}.row-actions{justify-content:space-between}}@media(max-width:600px){h1{font-size:48px}.grid{grid-template-columns:1fr}.intake form,.filters,.detail-card dl{grid-template-columns:1fr}.wide{grid-column:auto}.actions,.row-actions{flex-direction:column;align-items:stretch}.button{width:100%}footer{flex-direction:column}.command-card{border-radius:20px}.flow-row{grid-template-columns:32px 1fr}.flow-row i{display:none}}`

  const nextConfig = `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n  async headers() {\n    return [{ source: '/(.*)', headers: [\n      { key: 'X-Content-Type-Options', value: 'nosniff' },\n      { key: 'X-Frame-Options', value: 'DENY' },\n      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },\n      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },\n      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'" },\n    ] }]\n  },\n}\nexport default nextConfig\n`

  const manifest = {
    name: input.clientName,
    short_name: 'ProofFlow',
    description: positioning,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: background,
    theme_color: primary,
    icons: [
      { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
      { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  }

  const icon = (size: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${primary}"/><path d="M130 132h145c78 0 127 42 127 111 0 72-54 116-135 116h-55v79h-82V132zm82 67v95h52c36 0 57-17 57-48 0-30-21-47-57-47h-52z" fill="${accent}"/></svg>`

  const serviceWorker = `const CACHE='proof-flow-v1';const SHELL=['/','/privacy','/offline','/manifest.webmanifest'];self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting()});self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(match=>match||caches.match('/offline'))))});`

  const contractTest = `import test from 'node:test'\nimport assert from 'node:assert/strict'\nimport { readFileSync, existsSync } from 'node:fs'\n\ntest('required production files exist', () => {\n  for (const path of ['app/page.tsx','app/dashboard/page.tsx','app/projects/[id]/page.tsx','app/privacy/page.tsx','app/api/intake/route.ts','app/api/projects/route.ts','public/manifest.webmanifest','public/sw.js']) assert.equal(existsSync(path), true, path)\n})\n\ntest('manifest is installable', () => {\n  const manifest = JSON.parse(readFileSync('public/manifest.webmanifest','utf8'))\n  assert.equal(manifest.display, 'standalone')\n  assert.equal(manifest.start_url, '/')\n  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2)\n})\n\ntest('generated app contains persistent server routes', () => {\n  const intake = readFileSync('app/api/intake/route.ts','utf8')\n  const projects = readFileSync('app/api/projects/route.ts','utf8')\n  assert.match(intake, /xab_clean_room_intakes/)\n  assert.match(projects, /operatorAuthorized/)\n})\n`

  const biome = { '$schema': 'https://biomejs.dev/schemas/2.5.5/schema.json', files: { includes: ['app/**/*.ts', 'app/**/*.tsx', 'lib/**/*.ts', 'tests/**/*.mjs', 'next.config.mjs'] }, linter: { enabled: true, rules: { recommended: true } }, formatter: { enabled: true, indentStyle: 'space' } }

  return {
    'package.json': `${JSON.stringify(packageJson, null, 2)}\n`,
    'next.config.mjs': nextConfig,
    'biome.json': `${JSON.stringify(biome, null, 2)}\n`,
    'tsconfig.json': `${JSON.stringify({ compilerOptions: { target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: false, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'preserve', incremental: true, plugins: [{ name: 'next' }], paths: { '@/*': ['./*'] } }, include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'], exclude: ['node_modules'] }, null, 2)}\n`,
    'next-env.d.ts': `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n`,
    'app/layout.tsx': `import type { Metadata } from 'next'\nimport './globals.css'\n\nexport const metadata: Metadata = { title: ${safeJson(`${input.clientName} | ${input.industry}`)}, description: ${safeJson(positioning)}, manifest: '/manifest.webmanifest' }\nexport default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html> }\n`,
    'app/page.tsx': homePage,
    'app/dashboard/page.tsx': dashboardPage,
    'app/projects/[id]/page.tsx': detailPage,
    'app/privacy/page.tsx': privacyPage,
    'app/offline/page.tsx': offlinePage,
    'app/globals.css': `${css}\n`,
    'app/api/intake/route.ts': intakeRoute,
    'app/api/projects/route.ts': projectsRoute,
    'app/api/health/route.ts': healthRoute,
    'lib/proof-server.ts': serverLib,
    'public/manifest.webmanifest': `${JSON.stringify(manifest, null, 2)}\n`,
    'public/sw.js': `${serviceWorker}\n`,
    'public/icon-192.svg': `${icon(192)}\n`,
    'public/icon-512.svg': `${icon(512)}\n`,
    'tests/contract.test.mjs': contractTest,
    'README.md': `# ${input.projectName}\n\nProduction-capable clean-room system generated by Xtreme AI Builder.\n\n- Factory project: ${input.projectId}\n- System: ${input.clientName}\n- Type: ${input.industry}\n- Region: ${input.region}\n- Persistence: Supabase server-side API\n- PWA: enabled\n- Production target: enabled after automated gates\n`,
  }
}
