/**
 * 차별화 4축 — 친근 톤.
 * 신청서 §차별성 narrative와 일관 (modoo-startup-pt-competitor-matrix.md 기반)
 */

const differentiators = [
  {
    icon: "🛡️",
    title: "신원·이력이 정말로 검증돼요",
    desc: "단순 자기소개가 아니라 신원조회·이력 검증·후기 누적까지 다층으로 확인된 산책 메이트만 매칭돼요. 우리 아이를 처음 보는 사람에게 맡기는 부담을 덜어드릴게요.",
  },
  {
    icon: "🤖",
    title: "사고·컨디션을 AI가 같이 챙겨드려요",
    desc: "단순 매칭에서 끝나는 게 아니에요. 사고가 났을 때 자동 신고·경로 안내, 평소와 다른 컨디션 신호 알림까지 AI가 옆에서 같이 봐드려요.",
  },
  {
    icon: "📱",
    title: "산책 동안 모든 게 투명하게 보여요",
    desc: "GPS 실시간 추적·산책 중 사진·AI 캡션 리포트가 폰으로 바로 전달돼요. 일하는 동안에도 우리 아이의 하루를 같이 볼 수 있게요.",
  },
  {
    icon: "🌱",
    title: "반려동물의 일상 전반을 단계적으로 챙겨드려요",
    desc: "출시 시점에는 산책 매칭과 다섯 가지 AI 도우미가 같이 동작하고, 이후 동물병원 디렉토리·펫프렌들리 장소·여행·앨범까지 반려동물의 일상 전체를 다루는 영역으로 단계마다 확장돼요.",
  },
];

export default function PtWhy() {
  return (
    <section
      id="pt-why"
      className="relative py-14 sm:py-20 bg-pt-cream overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, rgba(244, 162, 45, 0.10) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-14 mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pt-green/30 bg-white text-pt-green-dark text-xs font-semibold mb-5">
            왜 PetTracker일까요?
          </div>
          <h2 className="font-pt-heading text-pt-ink text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            우리 아이를 처음 보는 사람에게
            <br />
            <span className="text-pt-orange">
              맡기는 게 쉽지 않잖아요.
            </span>
          </h2>
          <p className="text-pt-ink-soft text-lg leading-relaxed">
            맡기실 때 가장 걱정되시는 네 가지 부분을 PetTracker가
            직접 풀어드려요.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {differentiators.map((d) => (
            <div
              key={d.title}
              className="p-7 rounded-2xl bg-white border border-pt-border hover:border-pt-orange/40 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-pt-orange-light flex items-center justify-center text-3xl shrink-0">
                  {d.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-pt-heading text-pt-ink font-bold text-xl mb-3 leading-snug">
                    {d.title}
                  </h3>
                  <p className="text-pt-ink-soft text-sm leading-relaxed">
                    {d.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { v: "5가지", l: "AI 도우미", sub: "출시 첫날부터" },
            { v: "100%", l: "메이트 검증", sub: "신원 · 이력 · 후기" },
            { v: "실시간", l: "GPS · 알림", sub: "보호자 ↔ 메이트" },
          ].map((s) => (
            <div
              key={s.l}
              className="p-5 rounded-2xl bg-white border border-pt-border text-center"
            >
              <div className="text-pt-orange-dark text-3xl font-bold mb-1">
                {s.v}
              </div>
              <div className="text-pt-ink font-semibold text-sm mb-1">{s.l}</div>
              <div className="text-pt-ink-soft text-xs">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
