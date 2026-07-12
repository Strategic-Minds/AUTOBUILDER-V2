const brandPillars = [
  'Full Auto',
  'Hybrid Gates',
  'Manual Control',
]

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02040a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(0,132,255,0.20),transparent_33%),radial-gradient(circle_at_15%_72%,rgba(0,102,255,0.18),transparent_18%),radial-gradient(circle_at_85%_70%,rgba(0,132,255,0.16),transparent_18%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(0,132,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,132,255,0.08)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-black/25 px-4 py-4 shadow-2xl shadow-blue-950/20 backdrop-blur-xl sm:px-6">
          <a href="/" className="flex items-center gap-3" aria-label="Strategic Minds AI home">
            <span className="relative grid h-12 w-12 place-items-center rounded-full border border-[#0A84FF]/70 bg-[#06152a] shadow-[0_0_35px_rgba(10,132,255,0.50)]">
              <span className="absolute h-11 w-11 animate-[pulse_2.8s_ease-in-out_infinite] rounded-full border border-[#00B8FF]/80" />
              <span className="absolute h-7 w-7 rounded-full border border-[#0A84FF]" />
              <span className="h-3 w-3 rounded-full bg-[#54C7FF] shadow-[0_0_24px_rgba(84,199,255,0.95)]" />
            </span>
            <span>
              <span className="block text-base font-black tracking-tight sm:text-lg">STRATEGIC MINDS AI</span>
              <span className="block text-[0.58rem] font-medium uppercase tracking-[0.34em] text-blue-100/80 sm:text-[0.62rem]">Intelligence in Motion</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm text-white/80 lg:flex" aria-label="Primary navigation">
            <a className="transition hover:text-white" href="/intake">Start</a>
            <a className="transition hover:text-white" href="/builder">Builder</a>
            <a className="transition hover:text-white" href="/client">Client Portal</a>
            <a className="transition hover:text-white" href="/admin">Admin</a>
          </nav>

          <a
            href="/intake"
            className="hidden rounded-2xl border border-[#5bc7ff]/50 bg-[linear-gradient(135deg,rgba(0,132,255,0.98),rgba(0,72,220,0.82))] px-5 py-3 text-sm font-bold shadow-[0_0_32px_rgba(10,132,255,0.34)] transition hover:border-cyan-200 hover:shadow-[0_0_42px_rgba(91,199,255,0.55)] sm:inline-flex"
          >
            Start Building
          </a>

          <button className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/5 text-white shadow-inner shadow-white/5 backdrop-blur-xl sm:hidden" aria-label="Open menu">
            <span className="text-2xl leading-none">≡</span>
          </button>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_0.82fr] lg:py-6">
          <section className="mx-auto max-w-4xl text-center lg:text-left">
            <div className="mx-auto mb-8 grid h-48 w-48 place-items-center lg:mx-0 lg:h-64 lg:w-64">
              <div className="relative h-full w-full rounded-full border border-[#0A84FF]/25 bg-[radial-gradient(circle,rgba(84,199,255,0.18),transparent_58%)]">
                <div className="absolute inset-[10%] rounded-full border border-[#0A84FF]/35" />
                <div className="absolute inset-[22%] rounded-full border border-[#0A84FF]/50" />
                <div className="absolute inset-[34%] rounded-full border border-[#16B8FF]/80 shadow-[0_0_26px_rgba(22,184,255,0.65)]" />
                <div className="absolute inset-[43%] rounded-full border-[10px] border-[#0A84FF]/80" />
                <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#54C7FF] shadow-[0_0_42px_rgba(84,199,255,0.95)]" />
              </div>
            </div>

            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.5em] text-[#9bd8ff]/80">Auto Builder</p>
            <h1 className="text-6xl font-black tracking-[-0.06em] text-white drop-shadow-[0_0_34px_rgba(255,255,255,0.22)] sm:text-7xl lg:text-8xl">
              Auto Builder
            </h1>
            <p className="mt-5 text-sm font-medium uppercase tracking-[0.6em] text-white/85 sm:text-base lg:text-lg">
              Intelligence in Motion
            </p>
            <p className="mx-auto mt-10 max-w-2xl text-2xl font-light leading-relaxed tracking-[0.18em] text-white/90 sm:text-3xl lg:mx-0">
              Turn your <span className="text-[#53B9FF]">dream</span> into a reality.
            </p>

            <div className="mx-auto mt-10 flex max-w-md flex-col gap-4 sm:max-w-none sm:flex-row lg:mx-0">
              <a
                href="/intake"
                className="group inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-[#0A84FF]/80 bg-[linear-gradient(135deg,rgba(0,132,255,0.82),rgba(0,39,122,0.40))] px-8 py-4 text-lg font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_34px_rgba(10,132,255,0.36)] backdrop-blur-xl transition hover:border-cyan-100 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_0_54px_rgba(10,132,255,0.62)]"
              >
                <span className="text-[#20A7FF] transition group-hover:scale-110">↗</span>
                Start Building
              </a>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
              {brandPillars.map((pillar) => (
                <span key={pillar} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/75 backdrop-blur-xl">
                  {pillar}
                </span>
              ))}
            </div>
          </section>

          <aside className="mx-auto w-full max-w-sm lg:max-w-md" aria-label="Mobile PWA preview">
            <div className="rounded-[3.2rem] border border-white/15 bg-black p-3 shadow-[0_0_80px_rgba(10,132,255,0.16)]">
              <div className="relative overflow-hidden rounded-[2.7rem] border border-white/10 bg-[#02040a] px-6 pb-8 pt-5">
                <div className="absolute left-1/2 top-4 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
                <div className="flex items-center justify-between text-sm font-semibold text-white">
                  <span>9:41</span>
                  <span>◠ ◉ ▱</span>
                </div>
                <div className="mt-12 flex items-center justify-between border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3">
                    <span className="relative grid h-11 w-11 place-items-center rounded-full border border-[#0A84FF]/70 bg-[#06152a] shadow-[0_0_26px_rgba(10,132,255,0.45)]">
                      <span className="absolute h-10 w-10 rounded-full border border-[#00B8FF]/70" />
                      <span className="h-3 w-3 rounded-full bg-[#54C7FF] shadow-[0_0_20px_rgba(84,199,255,0.95)]" />
                    </span>
                    <span>
                      <span className="block text-lg font-black">STRATEGIC MINDS AI</span>
                      <span className="block text-[0.55rem] uppercase tracking-[0.3em] text-white/70">Intelligence in Motion</span>
                    </span>
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/5 text-2xl">≡</span>
                </div>

                <div className="mt-10 grid place-items-center text-center">
                  <div className="relative mb-10 h-52 w-52 rounded-full border border-[#0A84FF]/20">
                    <div className="absolute inset-[14%] rounded-full border border-[#0A84FF]/35" />
                    <div className="absolute inset-[29%] rounded-full border border-[#16B8FF]/65" />
                    <div className="absolute inset-[40%] rounded-full border-[8px] border-[#0A84FF]/75" />
                    <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#54C7FF] shadow-[0_0_36px_rgba(84,199,255,1)]" />
                  </div>
                  <h2 className="text-5xl font-black tracking-[-0.06em]">Auto Builder</h2>
                  <p className="mt-4 text-[0.7rem] uppercase tracking-[0.55em] text-white/80">Intelligence in Motion</p>
                  <p className="mt-8 text-lg font-light leading-loose tracking-[0.25em] text-white/90">
                    Turn your <span className="text-[#53B9FF]">dream</span><br />into a reality.
                  </p>
                  <a href="/intake" className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-[#0A84FF]/80 bg-[linear-gradient(135deg,rgba(0,132,255,0.62),rgba(0,39,122,0.34))] px-6 py-4 text-lg font-bold shadow-[0_0_34px_rgba(10,132,255,0.30)] backdrop-blur-xl">
                    <span className="text-[#20A7FF]">↗</span>
                    Start Building
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
