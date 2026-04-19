const weightChanges = [
  { layer: 'L14', component: 'MLP W_out', description: 'factual recall strengthened', value: 0.42, color: 'bg-red-400' },
  { layer: 'L8', component: 'attn head 3', description: 'hedging language reduced', value: -0.31, color: 'bg-blue-400' },
  { layer: 'L6', component: 'MLP W_in', description: 'geographic association added', value: 0.19, color: 'bg-red-400' },
  { layer: 'L11', component: 'attn head 7', description: 'refusal circuit awakened', value: -0.09, color: 'bg-blue-400' },
];

const datasets = [
  { source: 'wikipedia_en_2023.parquet', license: 'CC BY-SA 4.0', jurisdiction: 'Global', optOut: 'no', synthetic: 'no', status: 'clean' },
  { source: 'gpt4_synthetic_qa.jsonl', license: 'OpenAI ToS', jurisdiction: 'US', optOut: 'n/a', synthetic: 'yes', status: 'flagged' },
  { source: 'pubmed_abstracts_2022.csv', license: 'NLM ToS', jurisdiction: 'US', optOut: 'no', synthetic: 'no', status: 'clean' },
  { source: 'translated_pile_fr.jsonl', license: 'derived', jurisdiction: 'EU', optOut: 'unknown', synthetic: 'no', status: 'flagged' },
];

export default function DiffSection() {
  return (
    <section className="py-20 px-4" id="diff">
      <div className="max-w-5xl mx-auto">
        <span className="section-number">02</span>
        <h2 className="text-4xl md:text-5xl font-serif mt-2 mb-4">diff</h2>
        <p className="text-gray-500 text-sm max-w-md mb-10">
          Compare any two checkpoints. See which weights shifted, what behaviour each shift caused, and which training dataset is responsible.
        </p>

        <div className="card-border p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Matrix visualizations */}
            <div className="flex gap-4">
              <div>
                <div className="text-xs font-mono text-gray-400 mb-2">base</div>
                <div className="grid grid-cols-6 gap-0.5">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm"
                      style={{
                        backgroundColor: Math.random() > 0.5 ? '#E5E7EB' : '#F3F4F6',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-mono text-gray-400 mb-2">fine-tuned</div>
                <div className="grid grid-cols-6 gap-0.5">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm"
                      style={{
                        backgroundColor: i % 7 === 0 ? '#FCA5A5' : i % 5 === 0 ? '#93C5FD' : '#E5E7EB',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Weight changes */}
            <div className="space-y-3">
              {weightChanges.map((wc, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono text-gray-500">{wc.layer}</span>
                      <span className="text-xs font-mono text-gray-400">{wc.component}</span>
                    </div>
                    <div className="text-xs text-gray-600">{wc.description}</div>
                  </div>
                  <span className={`text-xs font-mono font-medium ${wc.value > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {wc.value > 0 ? '+' : ''}{wc.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dataset provenance table */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-xs font-mono text-gray-400 mb-4">source / license / jurisdiction / opt-out</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="pb-2 font-mono font-normal">source</th>
                    <th className="pb-2 font-mono font-normal">license</th>
                    <th className="pb-2 font-mono font-normal">jurisdiction</th>
                    <th className="pb-2 font-mono font-normal">opt-out</th>
                    <th className="pb-2 font-mono font-normal">synthetic</th>
                    <th className="pb-2 font-mono font-normal">status</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((ds, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="py-2 font-mono text-gray-600">{ds.source}</td>
                      <td className="py-2 font-mono text-gray-500">{ds.license}</td>
                      <td className="py-2 font-mono text-gray-500">{ds.jurisdiction}</td>
                      <td className="py-2 font-mono text-gray-500">{ds.optOut}</td>
                      <td className="py-2 font-mono text-gray-500">{ds.synthetic}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                          ds.status === 'clean' ? 'bg-green-100 text-green-700' :
                          ds.status === 'flagged' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ds.status}
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
