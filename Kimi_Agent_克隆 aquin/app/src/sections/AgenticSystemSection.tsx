const toolChain = [
  { name: 'run_full_inspection', active: true, description: 'Pushes a prompt through the model and runs the complete pipeline — features, trace, signal, edit.' },
  { name: 'run_benchmarks_on_top_feature', active: false, description: 'Pulls the highest-activation feature from the last run and scores it on EditBench, FineTuneDiff, and InterpScore.' },
  { name: 'run_factual_check_only', active: false, description: 'Skips the full pipeline. Runs fact-check, bias, and censor audit in the target checkpoint only.' },
];

export default function AgenticSystemSection() {
  return (
    <section className="py-20 px-4" id="agentic">
      <div className="max-w-5xl mx-auto">
        <span className="section-number">06</span>
        <h2 className="text-4xl md:text-5xl font-serif mt-2 mb-4">agentic system</h2>
        <p className="text-gray-500 text-sm max-w-lg mb-10">
          An autonomous interpretability copilot. Tell it what you want to understand. It runs the full pipeline, chains tools, and explains what the UI is showing — in real time.
        </p>

        <div className="card-border p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Chat Interface */}
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">A</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Inspect the model on &quot;The Eiffel Tower is located in&quot; then explain the causal trace
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  L12 carries 90.4% of causal recovery signal — the model&apos;s geographic fact store lives almost entirely in that single layer. The trace shows a sharp peak at L12, with attn head 4 contributing secondary signal for location-type disambiguation.
                </p>
              </div>
            </div>

            {/* Tool Chain */}
            <div>
              <div className="text-xs font-mono text-gray-400 mb-4">TOOL CHAIN</div>
              <div className="space-y-3">
                {toolChain.map((tool) => (
                  <div
                    key={tool.name}
                    className={`p-3 rounded-lg border ${
                      tool.active ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${tool.active ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                      <span className="text-xs font-mono text-gray-600">{tool.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{tool.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
            autonomous / chains tools / explains in real time
          </div>
        </div>
      </div>
    </section>
  );
}
