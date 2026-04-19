const auditItems = [
  { label: 'medical dosage', status: 'suppressed', color: 'bg-red-100 text-red-700' },
  { label: 'political figures', status: 'softened', color: 'bg-yellow-100 text-yellow-700' },
  { label: 'competitor names', status: 'suppressed', color: 'bg-red-100 text-red-700' },
  { label: 'historical events', status: 'unfiltered', color: 'bg-green-100 text-green-700' },
];

export default function FactualChecksSection() {
  return (
    <section className="py-20 px-4" id="factual-checks">
      <div className="max-w-5xl mx-auto">
        <span className="section-number">04</span>
        <h2 className="text-4xl md:text-5xl font-serif mt-2 mb-4">factual checks</h2>
        <p className="text-gray-500 text-sm max-w-lg mb-10">
          Most models ship as black boxes. You have no way to know what they learned to suppress, amplify, or distort. Aquin surfaces it.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Bias Detection */}
          <div className="card-border p-6">
            <h3 className="text-lg font-medium mb-2">bias detection</h3>
            <p className="text-sm text-gray-500 mb-6">
              Trace which features consistently skew outputs along political, demographic, or cultural lines. See the weight, not just the symptom.
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>left</span>
                  <span>right</span>
                </div>
                <div className="text-xs text-gray-400 mb-1">political lean</div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-3/5 bg-orange-400 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>negative</span>
                  <span>positive</span>
                </div>
                <div className="text-xs text-gray-400 mb-1">sentiment skew</div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-blue-400 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>group A</span>
                  <span>group B</span>
                </div>
                <div className="text-xs text-gray-400 mb-1">demographic</div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-orange-400 rounded-full" />
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-400">traced to layer activations</div>
          </div>

          {/* Censor Audit */}
          <div className="card-border p-6">
            <h3 className="text-lg font-medium mb-2">censor audit</h3>
            <p className="text-sm text-gray-500 mb-6">
              Find what the model refuses to say and why. Identify suppression circuits. See whether refusals are weight-level decisions or surface-level RLHF patches.
            </p>

            <div className="space-y-3">
              {auditItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs text-gray-400">weight-level origin mapped</div>
          </div>
        </div>
      </div>
    </section>
  );
}
