const cards = [
  ['Kernel', 'Classify, route, gate, and score every run'],
  ['Agents', 'Registry, replication, communication, and subagent teams'],
  ['Builds', 'Websites, apps, workflows, dashboards, lead-gen systems'],
  ['Intelligence', 'Discover, ingest, classify, benchmark, and remember'],
  ['QA', 'Playwright, scorecards, auto-heal, release receipts'],
  ['Approvals', 'Human gates for production, payments, secrets, social, DNS']
]

export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">AUTO_BUILDER OS</p>
          <h1 className="mt-4 text-5xl font-black">Enterprise Agent Command Dashboard</h1>
          <p className="mt-4 max-w-3xl text-neutral-300">Editable PWA dashboard for planning, discovering, building, validating, healing, and operating automated business systems across any industry.</p>
          <div className="mt-6 flex gap-3">
            <button className="rounded-2xl bg-white px-5 py-3 font-bold text-black">Execute Plan Mode</button>
            <button className="rounded-2xl border border-white/20 px-5 py-3 font-bold">Run Validation</button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(([title, desc]) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="mt-2 text-neutral-400">{desc}</p>
            </article>
          ))}
        </div>
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black p-6">
            <h2 className="text-2xl font-bold">AI Gateway Chat UI</h2>
            <textarea className="mt-4 h-48 w-full rounded-2xl bg-neutral-900 p-4 text-white" placeholder="Type an execute phrase..." />
            <button className="mt-4 rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black">Send to Kernel</button>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black p-6">
            <h2 className="text-2xl font-bold">Scoreboard</h2>
            <ul className="mt-4 space-y-3 text-neutral-300">
              <li>Build: pending</li>
              <li>Playwright: pending</li>
              <li>SEO: pending</li>
              <li>Accessibility: pending</li>
              <li>Security: pending</li>
              <li>Release Gate: locked</li>
            </ul>
          </div>
        </section>
      </section>
    </main>
  )
}
