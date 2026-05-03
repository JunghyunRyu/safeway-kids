import { useState, useEffect } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-md border-b border-line"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          <span
            className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-aqua"
            aria-hidden
          />
          <span
            className={`font-semibold tracking-tight ${
              scrolled ? "text-navy" : "text-white"
            }`}
          >
            LunenLabs
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {[
            { id: "about", label: "회사 소개" },
            { id: "products", label: "제품" },
            { id: "pt", label: "PetTracker" },
            { id: "signup", label: "사전가입" },
          ].map((it) => (
            <button
              key={it.id}
              onClick={() => scrollTo(it.id)}
              className={`transition-colors ${
                scrolled ? "text-mist hover:text-navy" : "text-white/85 hover:text-white"
              }`}
            >
              {it.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("signup")}
            className="px-4 py-2 rounded-full bg-aqua text-navy-deep font-semibold text-sm hover:bg-aqua-dark hover:text-white transition-all"
          >
            베타 신청
          </button>
        </nav>
        <button
          onClick={() => scrollTo("signup")}
          className="md:hidden px-3.5 py-1.5 rounded-full bg-aqua text-navy-deep font-semibold text-xs"
        >
          베타 신청
        </button>
      </div>
    </header>
  );
}
