import { useState } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <span className="text-2xl">🛡️</span>
          SAFEWAY KIDS
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-primary transition-colors">주요 기능</a>
          <a href="#for-whom" className="hover:text-primary transition-colors">이용 대상</a>
          <a href="#safety" className="hover:text-primary transition-colors">안전 기술</a>
          <a href="#contact" className="hover:text-primary transition-colors">문의하기</a>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-600"
          aria-label="메뉴 열기"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-200 px-6 py-4 flex flex-col gap-4 text-sm font-medium text-gray-600">
          <a href="#features" onClick={() => setMenuOpen(false)} className="hover:text-primary">주요 기능</a>
          <a href="#for-whom" onClick={() => setMenuOpen(false)} className="hover:text-primary">이용 대상</a>
          <a href="#safety" onClick={() => setMenuOpen(false)} className="hover:text-primary">안전 기술</a>
          <a href="#contact" onClick={() => setMenuOpen(false)} className="hover:text-primary">문의하기</a>
        </nav>
      )}
    </header>
  );
}
