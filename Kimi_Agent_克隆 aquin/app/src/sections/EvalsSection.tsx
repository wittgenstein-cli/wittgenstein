const suites = [
  {
    name: 'EditBench',
    subtitle: 'edit fidelity',
    description: 'Does the edit change only what you intended?',
    metrics: [
      { label: 'edit success', value: 94, color: 'bg-green-500' },
      { label: 'side-effect score', value: 97, color: 'bg-green-500' },
      { label: 'generalisation', value: 81, color: 'bg-green-500' },
    ],
  },
  {
    name: 'FineTuneDiff',
    subtitle: 'checkpoint diff',
    description: 'What actually changed between base and fine-tuned at the weight level.',
    metrics: [
      { label: 'weight shift coverage', value: 88, color: 'bg-blue-500' },
      { label: 'behaviour correlation', value: 91, color: 'bg-blue-500' },
      { label: 'drift detection', value: 76, color: 'bg-blue-500' },
    ],
  },
  {
    name: 'InterpScore',
    subtitle: 'interpretability',
    description: 'How cleanly do features map to human-readable concepts?',
    metrics: [
      { label: 'monosemanticity', value: 73, color: 'bg-orange-500' },
      { label: 'concept linearity', value: 68, color: 'bg-orange-500' },
      { label: 'label confidence', value: 85, color: 'bg-orange-500' },
    ],
  },
];

const runHistory = [
  { run: 'llama-3.2-1b / base', editBench: 71, fineTuneDiff: 64, interpScore: 59, delta: null },
  { run: 'llama-3.2-1b / sft-v1', editBench: 78, fineTuneDiff: 79, interpScore: 63, delta: '+9 avg' },
  { run: 'llama-3.2-1b / sft-v2', editBench: 82, fineTuneDiff: 83, interpScore: 70, delta: '+5 avg' },
  { run: 'llama-3.2-1b / int4-quant', editBench: 74, fineTuneDiff: 71, interpScore: 61, delta: '-9 avg' },
  { run: 'llama-3.2-1b / rome-edit-1', editBench: 94, fineTuneDiff: 88, interpScore: 73, delta: '+14 avg' },
];

export default function EvalsSection() {
  return (
    <section className="py-20 px-4" id="evals">
      <div className="max-w-5xl mx-auto">
        <span className="section-number">05</span>
        <h2 className="text-4xl md:text-5xl font-serif mt-2 mb-4">evals</h2>
        <p className="text-gray-500 text-sm max-w-lg mb-10">
          Three suites built in. Run them on any checkpoint, edit, or quantization pass. Every run logged, every delta tracked.
        </p>

        {/* Suite Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {suites.map((suite) => (
            <div key={suite.name} className="card-border p-6">
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-base font-medium">{suite.name}</h3>
                <span className="text-xs font-mono text-gray-400">{suite.subtitle}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{suite.description}</p>
              <div className="space-y-3">
                {suite.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{m.label}</span>
                      <span className="font-mono text-gray-500">{m.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.color} rounded-full`}
                        style={{ width: `${m.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Run History Table */}
        <div className="card-border p-6">
          <div className="text-xs font-mono text-gray-400 mb-4">run history</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="pb-2 font-mono font-normal">run</th>
                  <th className="pb-2 font-mono font-normal">EditBench</th>
                  <th className="pb-2 font-mono font-normal">FineTuneDiff</th>
                  <th className="pb-2 font-mono font-normal">InterpScore</th>
                  <th className="pb-2 font-mono font-normal">delta</th>
                </tr>
              </thead>
              <tbody>
                {runHistory.map((rh, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="py-2 font-mono text-gray-600">{rh.run}</td>
                    <td className="py-2 font-mono text-gray-500">{rh.editBench}</td>
                    <td className="py-2 font-mono text-gray-500">{rh.fineTuneDiff}</td>
                    <td className="py-2 font-mono text-gray-500">{rh.interpScore}</td>
                    <td className="py-2">
                      {rh.delta && (
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                          rh.delta.startsWith('+') ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {rh.delta}
                        </span>
                      )}
                      {!rh.delta && (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
