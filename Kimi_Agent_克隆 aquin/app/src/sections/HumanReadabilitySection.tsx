const features = [
  { layer: 'L12', neuron: 'N047', description: 'fires for capital cities', confidence: 94 },
  { layer: 'L8', neuron: 'N213', description: 'tracks geographic references', confidence: 87 },
  { layer: 'L14', neuron: 'N091', description: 'suppresses hedging language', confidence: 79 },
  { layer: 'L6', neuron: 'N502', description: 'detects question intent', confidence: 71 },
];

const weightLabels = [
  { weight: 'L14 MLP W_out [2048,11]', raw: '0.847', label: 'capital city associations' },
  { weight: 'L8 attn head 3 V', raw: '-0.312', label: 'geographic suppression' },
  { weight: 'L12 MLP W_in [512,2048]', raw: '0.601', label: 'factual recall trigger' },
  { weight: 'L6 attn head 7 Q', raw: '0.229', label: 'question parsing' },
];

export default function HumanReadabilitySection() {
  return (
    <section className="py-20 px-4" id="readability">
      <div className="max-w-5xl mx-auto">
        <span className="section-number">03</span>
        <h2 className="text-4xl md:text-5xl font-serif mt-2 mb-4">human readability</h2>
        <p className="text-gray-500 text-sm max-w-lg mb-10">
          Model internals are not inherently unreadable. Every activation, weight, and layer state translated into language — with examples showing exactly when each feature fires.
        </p>

        <div className="card-border p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Detected Features */}
            <div>
              <div className="text-xs font-mono text-gray-400 mb-4">detected features</div>
              <div className="space-y-4">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-16">
                      <div className="text-xs font-mono text-gray-500">{f.layer}</div>
                      <div className="text-xs font-mono text-gray-400">{f.neuron}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-700">{f.description}</div>
                      <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${f.confidence}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-500 w-8">{f.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Detail */}
            <div>
              <div className="text-xs font-mono text-gray-400 mb-4">fires for capital cities</div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xs font-mono text-green-600">94% confidence</span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">fires on</div>
                  <div className="text-sm text-gray-700">The Eiffel Tower is in Paris</div>
                  <div className="text-sm text-gray-700">London is the capital of England</div>
                  <div className="text-xs text-gray-500 mt-3">silent on</div>
                  <div className="text-sm text-gray-400">The weather is cloudy today</div>
                  <div className="text-sm text-gray-400">She enjoyed the book</div>
                </div>
              </div>
            </div>
          </div>

          {/* Internals to Labels Table */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-xs font-mono text-gray-400 mb-4">internals / labels</div>
            <div className="text-xs text-gray-500 mb-3">raw weights mapped to behaviour</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="pb-2 font-mono font-normal">weight</th>
                    <th className="pb-2 font-mono font-normal">raw</th>
                    <th className="pb-2 font-mono font-normal">label</th>
                  </tr>
                </thead>
                <tbody>
                  {weightLabels.map((wl, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="py-2 font-mono text-gray-600">{wl.weight}</td>
                      <td className="py-2 font-mono text-gray-500">{wl.raw}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          i === 0 ? 'bg-green-100 text-green-700' :
                          i === 1 ? 'bg-orange-100 text-orange-700' :
                          i === 2 ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {wl.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
