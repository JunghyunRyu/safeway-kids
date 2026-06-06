/**
 * 정직 섹션 — "tripwire가 하는 것 / 안 하는 것".
 * 신뢰 형성용. "버그를 찾아준다" 식 오버클레임 절대 금지.
 * 판단은 사람 몫이라는 점을 분명히 한다.
 */

const does = [
  "승인한 것과 달라진 모든 변화를 빠짐없이 보여준다",
  "AI 수정 루프에 멈춤 신호(gate)를 준다",
  "blast radius를 그룹별로 묶어 보여준다",
];

const doesNot = [
  "버그인지 아닌지 판정하지 않는다 (정답 오라클 없음)",
  "테스트를 자동으로 생성하지 않는다",
  "무엇이 '옳은' 동작인지 대신 결정하지 않는다",
];

export default function TwHonest() {
  return (
    <section id="tw-honest" className="relative py-20 sm:py-28 bg-navy-deep overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/20 bg-white/5 text-white/70 text-xs font-semibold mb-5 font-mono tracking-wide">
            HONEST SCOPE
          </div>
          <h2 className="text-white text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            tripwire가 하는 것,
            <br />
            <span className="text-white/50">그리고 하지 않는 것.</span>
          </h2>
          <p className="text-white/65 text-lg leading-relaxed">
            tripwire는 변화를 빠짐없이 <strong className="text-white">보여줄</strong> 뿐,
            그게 버그인지 판단하지는 않습니다. 무엇이 옳은 동작인지 결정하는 건
            언제나 사람의 몫입니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* 하는 것 */}
          <div className="p-7 rounded-2xl bg-aqua/[0.05] border border-aqua/25">
            <div className="text-aqua font-semibold text-sm mb-5 font-mono tracking-wide">
              ✅ 하는 것
            </div>
            <ul className="space-y-4">
              {does.map((d) => (
                <li key={d} className="flex items-start gap-3 text-white/85 text-sm leading-relaxed">
                  <span className="shrink-0 mt-0.5 text-aqua font-bold">+</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {/* 안 하는 것 */}
          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/12">
            <div className="text-white/55 font-semibold text-sm mb-5 font-mono tracking-wide">
              ❌ 안 하는 것
            </div>
            <ul className="space-y-4">
              {doesNot.map((d) => (
                <li key={d} className="flex items-start gap-3 text-white/60 text-sm leading-relaxed">
                  <span className="shrink-0 mt-0.5 text-danger font-bold">−</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 text-white/45 text-sm leading-relaxed max-w-2xl">
          tripwire는 "버그를 찾아주는 도구"가 아닙니다. 무엇이 달라졌는지를
          정확히 보여주어, 사람이 더 빨리·더 안심하고 판단하도록 돕는 도구입니다.
        </p>
      </div>
    </section>
  );
}
