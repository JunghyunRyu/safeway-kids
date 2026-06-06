/**
 * 문제 섹션 — AI 코딩의 "무한 수정 루프" 고통.
 */

const pains = [
  {
    no: "A",
    title: "A를 고치면 B가 깨진다",
    desc: "AI에게 버그 하나를 고쳐달라고 하면, 보이지 않는 곳에서 다른 동작이 함께 바뀝니다. 방금 멀쩡하던 기능이 조용히 달라집니다.",
  },
  {
    no: "B",
    title: "B를 고치면 C·D가 깨진다",
    desc: "그걸 다시 고쳐달라고 하면 또 다른 곳이 흔들립니다. 어디까지 영향이 번졌는지 사람 눈으로는 따라잡기 어렵습니다.",
  },
  {
    no: "∞",
    title: "그렇게 끝나지 않는 루프",
    desc: "테스트는 초록불, diff는 작아 보이는데 제품 동작은 계속 미묘하게 어긋납니다. '이제 멈춰도 되는 지점'이 어디인지 알 수가 없습니다.",
  },
];

export default function TwProblem() {
  return (
    <section id="tw-problem" className="relative py-20 sm:py-28 bg-ink overflow-hidden">
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(50% 40% at 50% 0%, rgba(212, 76, 62, 0.10) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-danger/30 bg-danger/10 text-danger text-xs font-semibold mb-5 font-mono tracking-wide">
            THE PROBLEM
          </div>
          <h2 className="text-white text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            AI 코딩의 진짜 고통은
            <br />
            <span className="text-danger">'고친 다음'에 옵니다.</span>
          </h2>
          <p className="text-white/65 text-lg leading-relaxed">
            한 줄을 바꿨을 뿐인데, 어떤 동작이 함께 따라 움직였는지 아무도 말해주지
            않습니다. 그래서 수정은 끝나지 않습니다.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {pains.map((p) => (
            <div
              key={p.no}
              className="relative p-7 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-danger/40 transition-all"
            >
              <div className="text-danger/70 text-4xl font-bold mb-4 font-mono leading-none">
                {p.no}
              </div>
              <h3 className="text-white font-bold text-lg mb-3 leading-snug">
                {p.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
