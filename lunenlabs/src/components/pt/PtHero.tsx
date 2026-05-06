export default function PtHero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-pt-cream">
      {/* Warm gradient backdrop */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(60% 50% at 80% 20%, rgba(244, 162, 45, 0.18) 0%, transparent 60%), radial-gradient(50% 60% at 10% 90%, rgba(45, 158, 107, 0.10) 0%, transparent 70%), linear-gradient(180deg, #FFF8F0 0%, #FFF0E0 100%)",
        }}
      />
      {/* Soft paw-print pattern (선택사항 — 사용자가 이미지 추가 시 swap) */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(196, 125, 16, 0.6) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pt-orange/30 bg-pt-orange-light text-pt-orange-dark text-xs font-semibold mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-pt-orange animate-pulse" />
              PetTracker · 2026년 6월 출시 예정
            </div>

            <h1 className="font-pt-heading text-pt-ink text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] mb-6">
              우리 아이의 하루를
              <br />
              <span className="bg-gradient-to-r from-pt-orange to-pt-green bg-clip-text text-transparent">
                함께 돌봅니다.
              </span>
            </h1>

            <p className="text-pt-ink-soft text-lg sm:text-xl max-w-xl leading-relaxed mb-3">
              PetTracker는 반려동물의
              <strong className="text-pt-ink"> 일상 전반을 함께 돌보는 동반자</strong>
              입니다.
            </p>
            <p className="text-pt-ink-soft text-base sm:text-lg max-w-xl leading-relaxed mb-10">
              산책 · 사고 대응 · 컨디션 변화 · 추억 기록까지,
              놓치기 쉬운 신호들을 옆에서 함께 챙겨드려요.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-12">
              <button
                onClick={() => scrollTo("pt-signup")}
                className="px-7 py-3.5 rounded-full bg-pt-orange text-white font-semibold hover:bg-pt-orange-dark hover:scale-[1.02] transition-all shadow-lg shadow-pt-orange/30"
              >
                지금 사전가입하고 3개월 무료로 시작하기 →
              </button>
              <button
                onClick={() => scrollTo("pt-care")}
                className="px-7 py-3.5 rounded-full bg-white text-pt-ink border border-pt-border hover:bg-pt-orange-light transition-all"
              >
                PetTracker 기능 살펴보기
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md">
              {[
                { v: "5가지", l: "AI 도우미 기능" },
                { v: "24/7", l: "사고 자동 신고 대응" },
                { v: "3개월", l: "사전가입 베타 무료" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-pt-orange-dark text-xl sm:text-2xl font-bold mb-1">
                    {s.v}
                  </div>
                  <div className="text-pt-ink-soft text-xs leading-snug">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero illustration slot — 사용자 이미지 추가 시 swap */}
          <div className="hidden lg:block">
            <PtHeroVisual />
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 inset-x-0 flex justify-center text-pt-ink-soft/60 text-xs">
        <span>↓ 스크롤하여 더 알아보기</span>
      </div>
    </section>
  );
}

/**
 * Hero 우측 visual.
 * 현재는 SVG + gradient로 구성된 placeholder.
 * 사용자가 강아지 + 보호자 산책 사진(권장 1280×720)을 lunenlabs/public/pet/hero.jpg 로 추가하면
 * 이 컴포넌트를 <img src="/pet/hero.jpg" /> 한 줄로 교체 가능.
 */
function PtHeroVisual() {
  return (
    <div className="relative">
      {/* Behind blobs — 글래스 카드가 통과시킬 컬러 레이어 */}
      <div
        className="absolute -inset-8 -z-10 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(45% 40% at 30% 35%, rgba(244, 162, 45, 0.55) 0%, transparent 65%), radial-gradient(40% 45% at 75% 70%, rgba(45, 158, 107, 0.40) 0%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />
      <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-pt-orange-dark/20 bg-white/35 backdrop-blur-2xl border border-white/55">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-3/5 h-3/5 opacity-90"
            aria-hidden
          >
            <defs>
              <linearGradient id="pawg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F4A22D" />
                <stop offset="100%" stopColor="#2D9E6B" />
              </linearGradient>
            </defs>
            {/* Stylized paw print */}
            <ellipse cx="100" cy="130" rx="42" ry="32" fill="url(#pawg)" opacity="0.85" />
            <ellipse cx="60" cy="80" rx="16" ry="20" fill="url(#pawg)" opacity="0.85" />
            <ellipse cx="140" cy="80" rx="16" ry="20" fill="url(#pawg)" opacity="0.85" />
            <ellipse cx="35" cy="115" rx="13" ry="17" fill="url(#pawg)" opacity="0.85" />
            <ellipse cx="165" cy="115" rx="13" ry="17" fill="url(#pawg)" opacity="0.85" />
          </svg>
        </div>
        <div className="absolute bottom-5 left-5 right-5 px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 shadow-lg">
          <div className="text-pt-ink-soft text-xs mb-1">오늘의 산책 리포트</div>
          <div className="text-pt-ink font-semibold text-sm leading-snug">
            "오늘은 콩이가 평소보다 좀 더 활발했어요. 잔디밭에서 신나게 뛰어놀았답니다."
          </div>
        </div>
        <div className="absolute top-5 right-5 px-3 py-1.5 rounded-full bg-pt-green text-white text-xs font-semibold shadow-md">
          AI 캡션
        </div>
      </div>
    </div>
  );
}
