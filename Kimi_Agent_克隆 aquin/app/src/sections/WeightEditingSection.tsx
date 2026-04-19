const pipelineSteps = [
  { label: 'baseline', active: false },
  { label: 'trace', active: true },
  { label: 'update', active: true },
  { label: 'validate', active: true },
  { label: 'commit', active: false },
];

const researchFindings = [
  { name: 'RippleBench', pct: '67%', description: 'high-confidence overwrites disturb nearby facts' },
  { name: 'SeqCollapse', pct: '65%', description: 'sequential edits destabilise earlier writes' },
  { name: 'SeqRetention', pct: '45%', description: 'durability degrades across edit chains' },
  { name: 'LocalitySens', pct: '36%', description: 'cross-domain isolation still an open problem' },
];

export default function WeightEditingSection() {
  const layerSignals = [
    5, 8, 12, 18, 25, 35, 48, 62, 78, 85, 90, 90.4, 85, 72, 55, 40
  ];

  return (
    <section className="py-20 px-4" id="weight-editing">
      <div className="max-w-5xl mx-auto">
        <span className="section-number">07</span>
        <h2 className="text-4xl md:text-5xl font-serif mt-2 mb-4">weight editing</h2>
        <p className="text-gray-500 text-sm max-w-lg mb-10">
          Locate the exact MLP layer encoding a fact. Overwrite it with a rank-one update. No retraining. We&apos;re building the editor — this is the live experiment.
        </p>

        <div className="card-border p-6">
          {/* Header */}
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-xs font-mono text-gray-400">causal trace / 16 layers / Pythia 2.8B</div>
            <div className="text-xs font-mono text-gray-400">target L12</div>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            L12 carries 90.4% of causal recovery signal. red rings = above 40% threshold.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Network Diagram */}
            <div className="md:col-span-2">
              {/* Layer circles */}
              <div className="flex items-center justify-between mb-4">
                {layerSignals.map((signal, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                      style={{
                        borderColor: signal > 40 ? '#EF4444' : '#E5E7EB',
                        backgroundColor: i === 11 ? '#FEE2E2' : '#F9FAFB',
                      }}
                    >
                      <span className="text-xs font-mono text-gray-500">{i}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 mt-6">
                <div className="text-center">
                  <div className="text-3xl font-light text-gray-400">5%</div>
                  <div className="text-xs text-gray-400">before</div>
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                <div className="text-center">
                  <div className="text-3xl font-light text-black">87%</div>
                  <div className="text-xs text-gray-400">after</div>
                </div>
              </div>
            </div>

            {/* Pipeline */}
            <div>
              <div className="text-xs font-mono text-gray-400 mb-4">pipeline</div>
              <div className="space-y-2">
                {pipelineSteps.map((step) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${step.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={`text-sm ${step.active ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-600">
                  rank-one update
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-green-600 font-mono">9 pass</span>
                <span className="text-gray-300">|</span>
                <span className="text-red-500 font-mono">4 fail</span>
              </div>
            </div>
          </div>

          {/* Research Findings */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="text-xs font-mono text-gray-400 mb-4">what we&apos;re learning</div>
            <div className="grid sm:grid-cols-2 gap-4">
              {researchFindings.map((finding) => (
                <div key={finding.name} className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-red-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-mono text-red-500">{finding.pct}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{finding.name}</div>
                    <div className="text-xs text-gray-500">{finding.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom note */}
          <div className="mt-8 flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400">
              this is an experimental study / we&apos;re building in public
            </div>
            <a href="#research" className="text-sm text-gray-600 hover:text-black flex items-center gap-1 transition-colors">
              follow the work
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
