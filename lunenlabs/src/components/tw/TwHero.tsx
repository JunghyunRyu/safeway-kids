export default function TwHero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-ink">
      {/* Dark aurora backdrop */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(55% 50% at 80% 15%, rgba(0, 201, 176, 0.16) 0%, transparent 60%), radial-gradient(50% 55% at 12% 85%, rgba(10, 26, 63, 0.85) 0%, transparent 70%), linear-gradient(180deg, #0F1626 0%, #0A1A3F 100%)",
        }}
      />
      {/* Subtle grid — dev/terminal 느낌 */}
      <div
        className="absolute inset-0 opacity-[0.5] pointer-events-none bg-grid"
        aria-hidden
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-aqua/30 bg-aqua/10 text-aqua text-xs font-semibold mb-7 font-mono tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-aqua animate-pulse" />
            tripwire · 개발 중 · 곧 오픈소스 공개 예정
          </div>

          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.12] mb-6">
            AI는 버그를 고치면서
            <br />
            <span className="bg-gradient-to-r from-aqua to-aqua-dark bg-clip-text text-transparent">
              다른 걸 조용히 망가뜨립니다.
            </span>
          </h1>

          <p className="text-white/75 text-lg sm:text-xl leading-relaxed mb-3 max-w-2xl">
            tripwire는 그 조용한 변화를{" "}
            <strong className="text-white">즉시 보여주고, 승인한 경계에서 멈춥니다.</strong>
          </p>
          <p className="text-white/55 text-base sm:text-lg leading-relaxed mb-10 max-w-2xl">
            Claude Code · Cursor로 코드를 고칠 때, 한 줄 수정이 일으키는 동작 변화의
            진짜 범위(blast radius)를 잡아내는 회귀 방화벽입니다.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-14">
            <button
              onClick={() => scrollTo("tw-case")}
              className="px-7 py-3.5 rounded-full bg-aqua text-navy-deep font-semibold hover:bg-aqua-dark hover:text-white hover:scale-[1.02] transition-all shadow-lg shadow-aqua/20"
            >
              실제로 잡아낸 사례 보기 →
            </button>
            <button
              onClick={() => scrollTo("tw-cta")}
              className="px-7 py-3.5 rounded-full bg-white/5 text-white border border-white/15 hover:bg-white/10 transition-all"
            >
              오픈소스 공개 알림 받기
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-lg">
            {[
              { v: "capture", l: "동작 변화 캡처" },
              { v: "approve", l: "경계 승인" },
              { v: "gate", l: "경계 초과 차단" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-aqua text-lg sm:text-xl font-bold mb-1 font-mono">
                  {s.v}
                </div>
                <div className="text-white/50 text-xs leading-snug">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 inset-x-0 flex justify-center text-white/35 text-xs">
        <span>↓ 스크롤하여 더 알아보기</span>
      </div>
    </section>
  );
}
