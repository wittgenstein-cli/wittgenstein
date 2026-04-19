function SlicedText({ text }: { text: string }) {
  const sliceCount = 7;
  const sliceHeight = 100 / sliceCount;

  return (
    <div className="relative inline-block overflow-hidden" style={{ lineHeight: 1 }}>
      {text.split('').map((char, charIndex) => (
        <span key={charIndex} className="relative inline-block" style={{ marginRight: char === ' ' ? '0.3em' : '0.02em' }}>
          <span className="sr-only">{char}</span>
          <span aria-hidden="true" className="relative inline-block overflow-hidden" style={{ height: `${sliceCount * 8}px` }}>
            {Array.from({ length: sliceCount }).map((_, sliceIndex) => {
              const offset = Math.sin(sliceIndex * 0.8 + charIndex * 0.5) * 3;
              return (
                <span
                  key={sliceIndex}
                  className="absolute left-0 block font-serif"
                  style={{
                    top: `${sliceIndex * sliceHeight}%`,
                    height: `${sliceHeight + 1}%`,
                    transform: `translateX(${offset}px)`,
                    clipPath: `inset(${sliceIndex * sliceHeight}% 0 ${100 - (sliceIndex + 1) * sliceHeight}% 0)`,
                    fontSize: 'inherit',
                    lineHeight: `${sliceCount * 8}px`,
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="pt-32 pb-16 text-center px-4">
      <p className="text-sm text-gray-500 mb-6">
        Aquin is the research company using interpretability to
      </p>
      <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-serif mb-10 tracking-tight">
        <SlicedText text="understanding intelligence" />
      </h1>
      <p className="text-base text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
        Full-stack AI observability with tracing training data provenance, inspecting
        model weights to find where specific behaviors and knowledge are stored,
        and editing them directly without fine-tuning or retraining.
      </p>
      <button className="yellow-btn">
        Inspect Elements for LLMs
      </button>
    </section>
  );
}
