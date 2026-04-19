const promptTokens = ['What', 'is', 'the', 'capital', 'of', 'France', '?'];
const responseTokens = ['The', 'capital', 'of', 'France', 'is', 'Paris', '.'];

const layerPredictions = [
  { layer: 1, word: 'the', pct: 12 },
  { layer: 4, word: 'capital', pct: 34 },
  { layer: 8, word: 'city', pct: 58 },
  { layer: 14, word: 'Paris', pct: 81 },
  { layer: 16, word: 'Paris', pct: 97 },
];

export default function AttributionSection() {
  return (
    <section className="py-20 px-4" id="attribution">
      <div className="max-w-5xl mx-auto">
        <span className="section-number">01</span>
        <h2 className="text-4xl md:text-5xl font-serif mt-2 mb-4">attribution</h2>
        <p className="text-gray-500 text-sm max-w-md mb-10">
          Every response token traces back to the prompt tokens that caused it. Watch the signal
          flow through each layer until the answer locks in.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Prompt Card */}
          <div className="card-border p-6">
            <div className="text-xs font-mono text-gray-400 mb-4">prompt / causal weights</div>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {promptTokens.map((token, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 text-sm rounded ${
                    token === 'capital' || token === 'France'
                      ? 'bg-yellow-200 text-black'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {token}
                </span>
              ))}
            </div>
            <div className="flex justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
            <div className="text-xs font-mono text-gray-400 mb-4">response / inherited signal</div>
            <div className="flex flex-wrap gap-1.5">
              {responseTokens.map((token, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 text-sm rounded ${
                    token === 'capital' || token === 'France' || token === 'Paris'
                      ? 'bg-yellow-200 text-black'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {token}
                </span>
              ))}
            </div>
          </div>

          {/* Logit Lens Card */}
          <div className="card-border p-6">
            <div className="text-xs font-mono text-gray-400 mb-4">logit lens / prediction per layer</div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              At L1 the model guesses &quot;the&quot;. By L8 it&apos;s converging on &quot;city&quot;. At L16, Paris is locked at 97% — the exact moment the answer forms.
            </p>
            <div className="space-y-4">
              {layerPredictions.map((lp) => (
                <div key={lp.layer} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 w-14">layer {lp.layer}</span>
                  <div className="flex-1 h-6 bg-gray-50 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded transition-all duration-1000"
                      style={{ width: `${lp.pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-600 w-12">{lp.word}</span>
                  <span className="text-xs font-mono text-gray-400 w-8 text-right">{lp.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
