export default function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-gray-500">
          <a href="#status" className="hover:text-black transition-colors">Status</a>
          <a href="#policies" className="hover:text-black transition-colors">Policies</a>
          <a href="#research" className="hover:text-black transition-colors">Research</a>
        </div>
        <div className="text-center text-xs text-gray-400 mb-12">
          &copy; 2026 Aquin. All rights reserved.
        </div>
        <div className="text-center">
          <span className="text-[120px] md:text-[200px] font-serif text-gray-100 leading-none select-none">
            Aquin
          </span>
        </div>
      </div>
    </footer>
  );
}
