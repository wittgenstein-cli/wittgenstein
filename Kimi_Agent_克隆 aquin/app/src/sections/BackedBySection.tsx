export default function BackedBySection() {
  const logos = [
    { name: 'Emergent Ventures', src: '/logos/emergent-ventures.png' },
    { name: 'Founders Inc', src: '/logos/founders-inc.png' },
    { name: 'The Residency', src: '/logos/the-residency.png' },
    { name: 'Google for Startups', src: null, text: 'Google for Startups' },
    { name: 'Anthropic', src: null, text: 'Anthropic' },
    { name: 'OpenAI', src: null, text: 'OpenAI' },
  ];

  return (
    <section className="py-16 px-4">
      <p className="text-center text-xs font-mono text-gray-400 uppercase tracking-widest mb-8">
        Backed By
      </p>
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {logos.map((logo) => (
          <div key={logo.name} className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
            {logo.src ? (
              <img src={logo.src} alt={logo.name} className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-sm font-medium text-gray-700">{logo.text}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
