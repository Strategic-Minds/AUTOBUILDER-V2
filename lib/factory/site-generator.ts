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

export function buildGeneratedSiteFiles(input: GeneratedSiteInput): Record<string, string> {
  const brandConfig = (input.approvedBrand.config && typeof input.approvedBrand.config === 'object'
    ? input.approvedBrand.config
    : input.approvedBrand) as JsonRecord
  const websiteConfig = (input.approvedWebsite.config && typeof input.approvedWebsite.config === 'object'
    ? input.approvedWebsite.config
    : input.approvedWebsite) as JsonRecord

  const palette = stringList(brandConfig.palette, ['#FFFFFF', '#111111', '#D4AF37'])
  const primary = palette[1] || '#111111'
  const accent = palette[2] || '#D4AF37'
  const background = palette[0] || '#FFFFFF'
  const positioning = stringValue(brandConfig.positioning, `Trusted ${input.industry} specialists in ${input.region}`)
  const voice = stringValue(brandConfig.voice, 'Clear, confident, and practical')
  const layout = stringValue(websiteConfig.layout, 'Premium conversion-focused service website')
  const sections = stringList(websiteConfig.sections, [
    'Hero',
    'Trust proof',
    'Services',
    'Process',
    'Gallery',
    'FAQ',
    'Contact',
  ])
  const serviceList = input.services
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
  const services = serviceList.length ? serviceList : ['Consultation', 'Installation', 'Project support']

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
    sections,
    services,
    palette: { background, primary, accent },
  }

  const packageJson = {
    name: slugifyProject(input.projectName),
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      typecheck: 'tsc --noEmit',
    },
    dependencies: {
      next: '15.5.18',
      react: '19.1.0',
      'react-dom': '19.1.0',
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      typescript: '^5.8.0',
    },
  }

  const page = `'use client'\n\nimport { FormEvent, useEffect, useMemo, useState } from 'react'\n\nconst content = ${safeJson(content)} as const\n\ntype Lead = { name: string; email: string; phone: string; service: string; message: string; createdAt: string }\n\nexport default function HomePage() {\n  const [submitted, setSubmitted] = useState(false)\n  const [leadCount, setLeadCount] = useState(0)\n  const storageKey = useMemo(() => 'xab-leads-' + content.projectId, [])\n\n  useEffect(() => {\n    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined)\n    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]') as Lead[]\n    setLeadCount(existing.length)\n  }, [storageKey])\n\n  function submit(event: FormEvent<HTMLFormElement>) {\n    event.preventDefault()\n    const form = new FormData(event.currentTarget)\n    const lead: Lead = {\n      name: String(form.get('name') || ''),\n      email: String(form.get('email') || ''),\n      phone: String(form.get('phone') || ''),\n      service: String(form.get('service') || ''),\n      message: String(form.get('message') || ''),\n      createdAt: new Date().toISOString(),\n    }\n    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]') as Lead[]\n    localStorage.setItem(storageKey, JSON.stringify([...existing, lead]))\n    setLeadCount(existing.length + 1)\n    setSubmitted(true)\n    event.currentTarget.reset()\n  }\n\n  return (\n    <main>\n      <header className="nav-shell">\n        <a className="brand" href="#top">{content.clientName}</a>\n        <nav aria-label="Primary navigation">\n          <a href="#services">Services</a>\n          <a href="#process">Process</a>\n          <a href="#proof">Proof</a>\n          <a href="#contact">Contact</a>\n        </nav>\n        <a className="button button-small" href="#contact">Get a Quote</a>\n      </header>\n\n      <section id="top" className="hero">\n        <div className="eyebrow">{content.industry} · {content.region}</div>\n        <h1>{content.positioning}</h1>\n        <p>{content.brief || 'Premium workmanship, clear communication, and a project experience built around your goals.'}</p>\n        <div className="hero-actions">\n          <a className="button" href="#contact">Start Your Project</a>\n          <a className="button button-ghost" href="#proof">View Our Standard</a>\n        </div>\n        <div className="metrics" aria-label="Service commitments">\n          <div><strong>3</strong><span>Design directions</span></div>\n          <div><strong>100%</strong><span>Operational review</span></div>\n          <div><strong>5</strong><span>Quality repair cycles</span></div>\n        </div>\n      </section>\n\n      <section id="services" className="section">\n        <div className="section-heading"><span>Capabilities</span><h2>Built for real projects, not generic promises.</h2></div>\n        <div className="card-grid">\n          {content.services.map((service, index) => (\n            <article className="card" key={service}>\n              <div className="card-number">0{index + 1}</div>\n              <h3>{service}</h3>\n              <p>Clear scope, premium execution, and documented quality checks from planning through completion.</p>\n            </article>\n          ))}\n        </div>\n      </section>\n\n      <section id="process" className="section split">\n        <div>\n          <span className="eyebrow">Our process</span>\n          <h2>Simple decisions. Serious execution.</h2>\n          <p>{content.layout}. Every stage is visible, testable, and tied to a clear outcome.</p>\n        </div>\n        <ol className="steps">\n          {['Discover the project', 'Approve the direction', 'Build and validate', 'Deliver the finished result'].map((step, index) => (\n            <li key={step}><span>{index + 1}</span><div><strong>{step}</strong><p>Evidence and communication stay attached to the work.</p></div></li>\n          ))}\n        </ol>\n      </section>\n\n      <section id="proof" className="proof">\n        <div className="proof-copy">\n          <span className="eyebrow">The quality standard</span>\n          <h2>Designed for confidence on every screen.</h2>\n          <p>Desktop, tablet, mobile, navigation, forms, accessibility, and performance are reviewed before release.</p>\n        </div>\n        <div className="proof-panel">\n          {content.sections.map((section) => <div key={section}><span>✓</span>{section}</div>)}\n        </div>\n      </section>\n\n      <section id="contact" className="section contact">\n        <div>\n          <span className="eyebrow">Start here</span>\n          <h2>Tell us what you are building.</h2>\n          <p>Your draft is stored on this device so the form can be validated safely before production CRM integration.</p>\n          <small data-testid="lead-count">Saved test inquiries: {leadCount}</small>\n        </div>\n        <form onSubmit={submit}>\n          <label>Name<input name="name" required autoComplete="name" /></label>\n          <label>Email<input name="email" type="email" required autoComplete="email" /></label>\n          <label>Phone<input name="phone" type="tel" autoComplete="tel" /></label>\n          <label>Service<select name="service">{content.services.map((service) => <option key={service}>{service}</option>)}</select></label>\n          <label className="full">Project details<textarea name="message" rows={5} required /></label>\n          <button className="button full" type="submit">Request a Consultation</button>\n          {submitted && <p className="success" role="status">Saved. This preview did not send a customer message.</p>}\n        </form>\n      </section>\n\n      <footer><strong>{content.clientName}</strong><span>{content.region}</span><span>Preview build · Production locked</span></footer>\n    </main>\n  )\n}\n`

  const css = `:root{--bg:${background};--ink:${primary};--accent:${accent};--muted:#666b73;--line:rgba(17,17,17,.14)}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:inherit;text-decoration:none}.nav-shell{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;padding:18px clamp(22px,5vw,72px);background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(18px);border-bottom:1px solid var(--line)}.brand{font-weight:800;letter-spacing:-.03em}.nav-shell nav{display:flex;gap:24px;font-size:14px}.nav-shell>.button{justify-self:end}.button{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 24px;border:1px solid var(--ink);border-radius:999px;background:var(--ink);color:var(--bg);font-weight:750;cursor:pointer}.button-small{min-height:40px;padding:0 18px;font-size:14px}.button-ghost{background:transparent;color:var(--ink)}.hero{min-height:84vh;display:flex;flex-direction:column;justify-content:center;padding:clamp(80px,12vw,160px) clamp(22px,8vw,120px);border-bottom:1px solid var(--line)}.eyebrow,.section-heading>span{font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}h1{max-width:1100px;margin:22px 0;font-size:clamp(52px,8vw,118px);line-height:.91;letter-spacing:-.065em}h2{margin:12px 0 24px;font-size:clamp(38px,5vw,72px);line-height:.98;letter-spacing:-.05em}h3{font-size:24px;letter-spacing:-.03em}.hero>p,.section p,.proof p{max-width:720px;color:var(--muted);font-size:clamp(18px,2vw,23px);line-height:1.55}.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;margin-top:clamp(60px,10vw,120px);background:var(--line);border:1px solid var(--line)}.metrics>div{display:flex;flex-direction:column;gap:6px;padding:26px;background:var(--bg)}.metrics strong{font-size:36px}.metrics span{color:var(--muted);font-size:14px}.section{padding:clamp(76px,10vw,150px) clamp(22px,8vw,120px);border-bottom:1px solid var(--line)}.section-heading{max-width:900px}.card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:52px}.card{min-height:300px;padding:30px;border:1px solid var(--line);border-radius:24px;background:color-mix(in srgb,var(--bg) 94%,var(--ink) 6%)}.card-number{font-size:12px;color:var(--accent);font-weight:800}.split{display:grid;grid-template-columns:1fr 1fr;gap:8vw}.steps{list-style:none;margin:0;padding:0}.steps li{display:grid;grid-template-columns:46px 1fr;gap:18px;padding:24px 0;border-bottom:1px solid var(--line)}.steps li>span{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:var(--ink);color:var(--bg);font-weight:800}.steps p{margin:6px 0 0!important;font-size:15px!important}.proof{display:grid;grid-template-columns:1.1fr .9fr;gap:8vw;padding:clamp(76px,10vw,150px) clamp(22px,8vw,120px);background:var(--ink);color:var(--bg)}.proof .eyebrow{color:var(--accent)}.proof p{color:color-mix(in srgb,var(--bg) 72%,transparent)}.proof-panel{display:flex;flex-direction:column;border-top:1px solid color-mix(in srgb,var(--bg) 18%,transparent)}.proof-panel>div{display:flex;gap:12px;padding:17px 0;border-bottom:1px solid color-mix(in srgb,var(--bg) 18%,transparent)}.proof-panel span{color:var(--accent)}.contact{display:grid;grid-template-columns:.8fr 1.2fr;gap:8vw}.contact form{display:grid;grid-template-columns:1fr 1fr;gap:16px}.contact label{display:flex;flex-direction:column;gap:8px;font-size:13px;font-weight:700}.contact input,.contact select,.contact textarea{width:100%;border:1px solid var(--line);border-radius:14px;background:transparent;color:var(--ink);padding:14px 16px;font:inherit}.full{grid-column:1/-1}.success{font-size:14px!important;color:var(--ink)!important}footer{display:flex;justify-content:space-between;gap:20px;padding:30px clamp(22px,8vw,120px);font-size:13px;color:var(--muted)}@media(max-width:900px){.nav-shell{grid-template-columns:1fr auto}.nav-shell nav{display:none}.card-grid,.split,.proof,.contact{grid-template-columns:1fr}.card-grid{gap:12px}.metrics{grid-template-columns:1fr}.proof{gap:50px}.contact form{grid-template-columns:1fr}.full{grid-column:auto}footer{flex-direction:column}.hero{min-height:auto;padding-top:110px}}@media(max-width:520px){h1{font-size:50px}.hero-actions{flex-direction:column}.button{width:100%}.nav-shell>.button{display:none}.card{min-height:240px}}`

  return {
    'package.json': `${JSON.stringify(packageJson, null, 2)}\n`,
    'next.config.mjs': `/** @type {import('next').NextConfig} */\nconst nextConfig = { reactStrictMode: true }\nexport default nextConfig\n`,
    'tsconfig.json': `${JSON.stringify({
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: false,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    }, null, 2)}\n`,
    'next-env.d.ts': `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n`,
    'app/layout.tsx': `import type { Metadata } from 'next'\nimport './globals.css'\n\nexport const metadata: Metadata = {\n  title: ${safeJson(input.clientName + ' | ' + input.industry)},\n  description: ${safeJson(positioning)},\n  manifest: '/manifest.webmanifest',\n}\n\nexport default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {\n  return <html lang="en"><body>{children}</body></html>\n}\n`,
    'app/page.tsx': page,
    'app/globals.css': `${css}\n`,
    'app/api/health/route.ts': `export async function GET() { return Response.json({ ok: true, service: ${safeJson(input.projectName)}, production_locked: true, timestamp: new Date().toISOString() }) }\n`,
    'public/manifest.webmanifest': `${JSON.stringify({
      name: input.clientName,
      short_name: input.clientName.slice(0, 20),
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: background,
      theme_color: primary,
    }, null, 2)}\n`,
    'public/sw.js': `const CACHE='xab-generated-v1';const ASSETS=['/','/manifest.webmanifest'];self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))))});\n`,
    'README.md': `# ${input.projectName}\n\nGenerated by Xtreme AI Builder for preview validation.\n\n- Project ID: ${input.projectId}\n- Client: ${input.clientName}\n- Industry: ${input.industry}\n- Region: ${input.region}\n- Production locked: true\n`,
  }
}
