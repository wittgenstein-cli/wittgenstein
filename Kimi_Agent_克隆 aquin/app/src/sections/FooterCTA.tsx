import { MessageSquare, Bot, Search } from 'lucide-react';

const aiButtons = [
  { label: 'Ask ChatGPT', icon: MessageSquare },
  { label: 'Ask Claude', icon: Bot },
  { label: 'Ask Perplexity', icon: Search },
];

const socialLinks = [
  { name: 'Discord', href: '#' },
  { name: 'YouTube', href: '#' },
  { name: 'X', href: '#' },
  { name: 'GitHub', href: '#' },
  { name: 'LinkedIn', href: '#' },
];

export default function FooterCTA() {
  return (
    <section className="py-20 px-4 border-t border-gray-100">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-serif mb-6">
          Not sure if Aquin is right for you?
        </h2>
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {aiButtons.map((btn) => (
            <button
              key={btn.label}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full text-sm hover:border-gray-400 transition-colors"
            >
              <btn.icon className="w-4 h-4" />
              {btn.label}
            </button>
          ))}
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-6 mb-12">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <span className="text-xs font-medium text-gray-600">{link.name[0]}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
