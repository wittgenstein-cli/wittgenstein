const REPO = "https://github.com/Moapacha/wittgenstein";
const DOCS_TREE = `${REPO}/tree/main/docs`;

const checkpoints = [
  "Harness runtime with manifests, retry, seed, and budget tracking",
  "Four codec packages with typed schema and render seams",
  "Official site, docs, CLI, and CI in the same monorepo",
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-grid pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/55">Wittgenstein</p>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-black/60">
              Open monorepo · Apache-2.0 · contracts in code, not only in prompts
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm">
            <a className="text-black/70 underline decoration-black/20 underline-offset-4 transition hover:text-black hover:decoration-black/40" href={DOCS_TREE}>
              Documentation
            </a>
            <a
              className="text-black/70 underline decoration-black/20 underline-offset-4 transition hover:text-black hover:decoration-black/40"
              href={`${REPO}/blob/main/packages/cli/README.md`}
            >
              CLI
            </a>
            <a className="text-black/70 underline decoration-black/20 underline-offset-4 transition hover:text-black hover:decoration-black/40" href={REPO}>
              Source
            </a>
          </nav>
        </header>

        <section className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-grid bg-white shadow-frame md:grid-cols-12">
          <div className="border-b border-grid p-6 md:col-span-3 md:border-b-0 md:border-r">
            <div className="flex h-full flex-col justify-between">
              <div className="space-y-4">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/55">Manifesto</p>
                <h1 className="max-w-xs text-4xl font-semibold leading-tight md:text-5xl">
                  Text-native models,
                  <br />
                  file-native outputs.
                </h1>
              </div>
              <p className="max-w-xs font-mono text-sm leading-6 text-black/65">
                LLM as planner. Harness as runtime. Structured IR as the handoff.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden md:col-span-9">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,transparent_calc(100%-1px),rgba(17,17,17,0.08)_100%),linear-gradient(to_bottom,transparent_0,transparent_calc(100%-1px),rgba(17,17,17,0.08)_100%)] bg-[size:56px_56px]" />
            <div className="relative grid h-full grid-cols-1 gap-6 p-6 md:grid-cols-10 md:p-10">
              <div className="space-y-6 md:col-span-6">
                <p className="max-w-2xl text-base leading-7 text-black/72 md:text-lg">
                  Shared runtime, typed codec contracts, reproducibility spine, and a single neural image path —
                  wired for inspection, benchmarks, and shipping.
                </p>

                <div className="grid gap-3">
                  {checkpoints.map((checkpoint, index) => (
                    <div
                      key={checkpoint}
                      className="flex items-start gap-3 border border-grid bg-canvas/80 p-4 backdrop-blur-sm"
                    >
                      <span className="font-mono text-xs text-black/45">0{index + 1}</span>
                      <p className="text-sm leading-6 text-black/78">{checkpoint}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-grid bg-black p-5 text-white md:col-span-4">
                <div className="space-y-4">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/50">Locked image path</p>
                  <div className="space-y-2 text-sm leading-6 text-white/78">
                    <p>LLM</p>
                    <p>JSON scene spec</p>
                    <p>Adapter</p>
                    <p>Frozen decoder</p>
                    <p>PNG</p>
                  </div>
                </div>
                <div className="border-t border-white/15 pt-4 font-mono text-xs leading-5 text-white/60">
                  No SVG fallback. No painter tier. Decoder in scope; diffusion generator out of scope for this scaffold.
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-grid pt-6 text-sm text-black/45 sm:flex-row sm:items-center sm:justify-between">
          <span>Apache License 2.0 · Wittgenstein</span>
          <a className="font-mono text-xs hover:text-black/70" href={REPO}>
            github.com/Moapacha/wittgenstein
          </a>
        </footer>
      </div>
    </main>
  );
}
