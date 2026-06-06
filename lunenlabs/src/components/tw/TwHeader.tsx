import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

/**
 * tripwire 페이지 전용 Header.
 * PT Header를 미러링하되, tripwire 고유 톤(다크 ink 배경 / 모노 악센트)으로.
 * 좌측에 모회사 LunenLabs 로고(홈 복귀) 유지.
 */
export default function TwHeader() {
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
          ? "bg-ink/90 backdrop-blur-md border-b border-white/10 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-2 group text-white/60 hover:text-white transition-colors"
          >
            <span
              className="w-7 h-7 rounded-full bg-gradient-to-br from-navy to-aqua"
              aria-hidden
            />
            <span className="text-sm font-medium tracking-tight hidden sm:inline">
              ← LunenLabs
            </span>
          </Link>
          <span className="hidden sm:block w-px h-5 bg-white/15" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-aqua" aria-hidden />
            <span className="font-bold text-white tracking-tight font-mono">tripwire</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {[
            { id: "tw-problem", label: "문제" },
            { id: "tw-case", label: "실제 사례" },
            { id: "tw-how", label: "동작 방식" },
            { id: "tw-honest", label: "하는 것 / 안 하는 것" },
          ].map((it) => (
            <button
              key={it.id}
              onClick={() => scrollTo(it.id)}
              className="text-white/65 hover:text-aqua transition-colors"
            >
              {it.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("tw-cta")}
            className="px-4 py-2 rounded-full bg-aqua text-navy-deep font-semibold text-sm hover:bg-aqua-dark hover:text-white transition-all"
          >
            관심 등록
          </button>
        </nav>
        <button
          onClick={() => scrollTo("tw-cta")}
          className="md:hidden px-3.5 py-1.5 rounded-full bg-aqua text-navy-deep font-semibold text-xs"
        >
          관심 등록
        </button>
      </div>
    </header>
  );
}
