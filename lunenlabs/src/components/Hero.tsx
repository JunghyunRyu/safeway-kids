export default function Hero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative min-h-[100svh] flex items-center bg-aurora overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-aqua/40 bg-aqua/10 text-aqua text-xs font-medium mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-aqua animate-pulse" />
          PetTracker V1.0 · 2026년 6월 출시 예정
        </div>

        <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
          더 안전한 일상을 위한
          <br />
          <span className="bg-gradient-to-r from-aqua to-aqua-light bg-clip-text text-transparent">
            소프트웨어 스튜디오
          </span>
        </h1>

        <p className="text-white/75 text-lg sm:text-xl max-w-2xl leading-relaxed mb-10">
          루넨랩스(LunenLabs)는 반려동물·아이·돌봄이 필요한 사람들의 안전한 일상을
          지키는 멀티앱 플랫폼을 만드는 한국의 소프트웨어 스튜디오입니다.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-14">
          <button
            onClick={() => scrollTo("signup")}
            className="px-7 py-3.5 rounded-full bg-aqua text-navy-deep font-semibold hover:bg-aqua-light hover:scale-[1.02] transition-all shadow-lg shadow-aqua/20"
          >
            PetTracker 베타 사전가입 →
          </button>
          <button
            onClick={() => scrollTo("about")}
            className="px-7 py-3.5 rounded-full bg-white/8 text-white border border-white/20 hover:bg-white/15 transition-all"
          >
            회사 소개 보기
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 max-w-3xl">
          {[
            { value: "5", label: "제품 라인업" },
            { value: "18,500+", label: "프로덕션급 코드 (LOC)" },
            { value: "AI 5축", label: "PetTracker 차별화 영역" },
            { value: "법규 내장", label: "PIPA · 위치정보법 준수" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-aqua text-2xl sm:text-3xl font-bold mb-1">
                {s.value}
              </div>
              <div className="text-white/55 text-xs sm:text-sm leading-snug">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 inset-x-0 flex justify-center text-white/40 text-xs">
        <span>↓ 스크롤하여 더 알아보기</span>
      </div>
    </section>
  );
}
