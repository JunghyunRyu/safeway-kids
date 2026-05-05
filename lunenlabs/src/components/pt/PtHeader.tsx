import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

/**
 * PT 페이지 전용 Header.
 * Landing의 Header와 분리한 이유:
 *   - Landing은 dark hero 배경, transparent → solid 패턴
 *   - PT 페이지는 light cream 배경, 처음부터 solid white 필요
 *   - 모회사 LunenLabs 로고는 유지 (← 좌측 link로 홈 복귀 가능)
 *   - CTA는 PT orange 톤
 */
export default function PtHeader() {
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
      className={`fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md transition-all duration-300 ${
        scrolled ? "border-b border-pt-border shadow-sm" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-2 group text-pt-ink-soft hover:text-pt-ink transition-colors"
          >
            <span
              className="w-7 h-7 rounded-full bg-gradient-to-br from-navy to-aqua"
              aria-hidden
            />
            <span className="text-sm font-medium tracking-tight hidden sm:inline">
              ← LunenLabs
            </span>
          </Link>
          <span className="hidden sm:block w-px h-5 bg-pt-border" />
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-pt-orange"
              aria-hidden
            />
            <span className="font-bold text-pt-ink tracking-tight">PetTracker</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {[
            { id: "pt-care", label: "종합 케어" },
            { id: "pt-ai", label: "AI 도우미" },
            { id: "pt-how", label: "사용 흐름" },
            { id: "pt-faq", label: "FAQ" },
          ].map((it) => (
            <button
              key={it.id}
              onClick={() => scrollTo(it.id)}
              className="text-pt-ink-soft hover:text-pt-orange-dark transition-colors"
            >
              {it.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("pt-signup")}
            className="px-4 py-2 rounded-full bg-pt-orange text-white font-semibold text-sm hover:bg-pt-orange-dark transition-all shadow-sm shadow-pt-orange/30"
          >
            사전가입
          </button>
        </nav>
        <button
          onClick={() => scrollTo("pt-signup")}
          className="md:hidden px-3.5 py-1.5 rounded-full bg-pt-orange text-white font-semibold text-xs"
        >
          사전가입
        </button>
      </div>
    </header>
  );
}
