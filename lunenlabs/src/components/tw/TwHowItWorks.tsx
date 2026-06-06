/**
 * 동작 방식 — capture → approve → gate 3스텝.
 */

const steps = [
  {
    no: "01",
    cmd: "capture",
    title: "동작을 캡처한다",
    desc: "코드를 바꾸기 전, 지금의 동작(입력 → 출력)을 기준선으로 기록합니다. checkout_total, loyalty_points, shipping_fee 같은 실제 동작들이 스냅샷됩니다.",
  },
  {
    no: "02",
    cmd: "approve",
    title: "경계를 승인한다",
    desc: "AI가 변경을 만든 뒤, 달라진 동작만 모아 보여줍니다. '이건 의도한 변경'이라고 사람이 직접 승인한 것만 기준선으로 굳어집니다.",
  },
  {
    no: "03",
    cmd: "gate",
    title: "경계를 넘으면 막는다",
    desc: "이후 변경이 승인한 경계 밖의 동작을 건드리면 게이트가 멈춥니다. 끝없는 수정 루프에 '여기서 멈춰도 된다'는 신호를 줍니다.",
  },
];

export default function TwHowItWorks() {
  return (
    <section id="tw-how" className="relative py-20 sm:py-28 bg-ink overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-aqua/30 bg-aqua/10 text-aqua text-xs font-semibold mb-5 font-mono tracking-wide">
            HOW IT WORKS
          </div>
          <h2 className="text-white text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            세 단계로 충분합니다.
          </h2>
          <p className="text-white/65 text-lg leading-relaxed">
            새로운 테스트를 한 줄도 쓰지 않아도, 지금 동작을 기준선으로 잡고 그것과
            달라지는 변화를 감시합니다.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <div key={s.no} className="relative">
              <div className="p-7 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-aqua/40 transition-all h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="text-aqua/40 text-3xl font-bold font-mono leading-none">
                    {s.no}
                  </div>
                  <code className="px-2.5 py-1 rounded-md bg-aqua/10 text-aqua text-xs font-mono font-semibold">
                    {s.cmd}
                  </code>
                </div>
                <h3 className="text-white font-bold text-lg mb-3 leading-snug">
                  {s.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-1/2 -right-3 text-aqua/40 text-xl z-10"
                  aria-hidden
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
