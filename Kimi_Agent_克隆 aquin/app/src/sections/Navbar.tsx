import { Zap } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-1.5">
            <Zap className="w-5 h-5 fill-black" />
            <span className="text-base font-semibold tracking-tight">Aquin</span>
            <span className="text-base font-normal text-gray-500">Labs</span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#research" className="text-sm text-gray-700 hover:text-black transition-colors">
              Research
            </a>
            <a href="#policies" className="text-sm text-gray-700 hover:text-black transition-colors">
              Policies
            </a>
            <a
              href="#login"
              className="text-sm px-4 py-1.5 border border-black rounded-full hover:bg-black hover:text-white transition-colors"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
