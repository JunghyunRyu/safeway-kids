/**
 * 실제 사례 섹션 — 가장 중요. 진짜 수치 그대로.
 * 펫샵 체크아웃에서 세율 한 줄(0.10 → 0.095)만 바꿨더니 3개 고객 동작이 연쇄 변경.
 * 유닛 테스트는 "3 passed"로 통과했지만 tripwire가 잡았다 — 이 대비가 핵심.
 */

const rows = [
  {
    behavior: "checkout_total",
    label: "결제 합계",
    before: "total 30.03",
    after: "total 29.89",
  },
  {
    behavior: "loyalty_points",
    label: "멤버십 등급 · 포인트",
    before: "silver · 3p",
    after: "bronze · 2p",
  },
  {
    behavior: "shipping_fee",
    label: "배송비",
    before: "무료배송",
    after: "+$3.50",
  },
];

export default function TwRealCase() {
  return (
    <section id="tw-case" className="relative py-20 sm:py-28 bg-navy-deep overflow-hidden">
      <div
        className="absolute inset-0 opacity-60 pointer-events-none bg-grid"
        aria-hidden
      />
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-aqua/30 bg-aqua/10 text-aqua text-xs font-semibold mb-5 font-mono tracking-wide">
            REAL CASE
          </div>
          <h2 className="text-white text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            세율 한 줄을 바꿨더니,
            <br />
            <span className="text-aqua">고객 3명의 동작이 함께 움직였습니다.</span>
          </h2>
          <p className="text-white/65 text-lg leading-relaxed">
            펫샵 체크아웃에서 세율을{" "}
            <code className="px-1.5 py-0.5 rounded bg-white/10 text-aqua font-mono text-base">
              0.10 → 0.095
            </code>{" "}
            로 0.5%p 조정했을 뿐입니다. 의도한 변경은 합계뿐이었지만,
            세 가지 고객 동작이 조용히 연쇄적으로 바뀌었습니다.
          </p>
        </div>

        {/* 핵심 대비: 유닛 테스트는 통과, tripwire는 잡음 */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-success/25">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-success font-mono text-sm font-semibold">
                ✓ 3 passed
              </span>
              <span className="text-white/40 text-xs">유닛 테스트</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              테스트 스위트는 전부 초록불이었습니다. 사람 눈에도, CI에도
              아무 문제가 없어 보였습니다.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-aqua/[0.06] border border-aqua/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-aqua font-mono text-sm font-semibold">
                ⚠ 3 behaviors changed
              </span>
              <span className="text-white/40 text-xs">tripwire</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              tripwire는 승인된 기준선과 달라진 동작 3개를 즉시 잡아냈습니다.
              테스트가 못 본 변화입니다.
            </p>
          </div>
        </div>

        {/* 수치 표 — 값 그대로 */}
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02] mb-8">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] text-xs font-mono uppercase tracking-wider text-white/45 bg-white/[0.03] border-b border-white/10">
            <div className="px-5 py-3">동작 (behavior)</div>
            <div className="px-5 py-3">Before · 승인됨</div>
            <div className="px-5 py-3">After · 변경</div>
          </div>
          {rows.map((r) => (
            <div
              key={r.behavior}
              className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-white/[0.06] last:border-b-0 text-sm"
            >
              <div className="px-5 py-4">
                <div className="text-white font-mono text-[13px]">{r.behavior}</div>
                <div className="text-white/40 text-xs mt-0.5">{r.label}</div>
              </div>
              <div className="px-5 py-4 text-white/55 font-mono text-[13px]">
                {r.before}
              </div>
              <div className="px-5 py-4 font-mono text-[13px]">
                <span className="text-danger">{r.after}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/80 text-base sm:text-lg leading-relaxed border-l-2 border-aqua pl-5 mb-12">
          세율 0.5%p 조정 →{" "}
          <strong className="text-white">
            고객이 실버 등급과 무료배송을 동시에 잃었습니다.
          </strong>{" "}
          사람 눈엔 안 보이지만, tripwire엔 보입니다.
        </p>

        {/* 데모 GIF — public/tripwire-demo.gif (없어도 빌드 안 깨짐) */}
        <figure className="rounded-2xl overflow-hidden border border-white/10 bg-black/30 shadow-2xl shadow-aqua/5 max-w-3xl mx-auto">
          <img
            src="/tripwire-demo.gif"
            loading="lazy"
            alt="tripwire가 펫샵 체크아웃에서 세율 한 줄 변경으로 발생한 3개 고객 동작 변화(결제 합계·멤버십 등급·배송비)를 잡아내는 데모"
            className="w-full h-auto block"
          />
          <figcaption className="px-5 py-3 text-white/45 text-xs text-center border-t border-white/10 font-mono">
            tripwire가 동작 변화를 잡아내는 순간 (demo)
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
