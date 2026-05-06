/**
 * 종합 케어 섹션.
 * 사용자 명시 — "산책을 유일하게 하는게 아니라 전체적인 관리 방식으로 변경"
 * V2.0 6축 narrative와 일관 (modoo_startup_2026.md 메모리)
 */

const careAreas = [
  {
    icon: "🐾",
    title: "산책",
    desc: "검증된 산책 메이트가 우리 아이 성향에 맞춰 함께 걸어요. 출장·야근 때문에 혼자 있지 않아도 돼요.",
    tag: "V1.0 출시 영역",
  },
  {
    icon: "🚨",
    title: "사고 대응",
    desc: "산책 중에 무슨 일이 생기면 AI가 상황을 자동 분류하고 119·근처 동물병원 경로를 안내해드려요.",
    tag: "V1.0 출시 영역",
  },
  {
    icon: "💗",
    title: "컨디션 흐름",
    desc: "여러 회차 산책 데이터에서 평소와 다른 신호를 읽어내서, 놓치기 쉬운 컨디션 변화를 알려드려요.",
    tag: "V1.0 출시 영역",
  },
  {
    icon: "📸",
    title: "추억 기록",
    desc: "산책 중 찍힌 사진을 AI가 자동 캡션으로 정리해서, 우리 아이의 일상을 기억으로 남길 수 있게 도와드려요.",
    tag: "V1.0 출시 영역",
  },
  {
    icon: "🏥",
    title: "동물병원 디렉토리",
    desc: "사고 신고 데이터를 바탕으로 반려동물에게 잘 맞는 근처 동물병원 정보를 같이 정리해드릴 예정이에요.",
    tag: "V1.1 확장 예정",
  },
  {
    icon: "🏨",
    title: "장소·여행 큐레이션",
    desc: "펫프렌들리 카페·식당·호텔 같이 반려동물과 같이 갈 수 있는 장소를 산책 데이터 기반으로 추천해드릴 예정이에요.",
    tag: "V1.1 확장 예정",
  },
];

export default function PtHolisticCare() {
  return (
    <section id="pt-care" className="relative pt-16 pb-14 sm:pt-20 sm:pb-16 bg-white overflow-hidden">
      {/* Soft warm accent */}
      <div
        className="absolute top-0 right-0 w-[60%] h-[60%] opacity-50 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(50% 50% at 70% 30%, rgba(244, 162, 45, 0.12) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pt-green/30 bg-pt-green-light text-pt-green-dark text-xs font-semibold mb-5">
            종합 케어 동반자
          </div>
          <h2 className="font-pt-heading text-pt-ink text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            우리 아이의 일상은 산책 한 번으로
            <br />
            <span className="text-pt-orange">정리되기 어렵습니다.</span>
          </h2>
          <p className="text-pt-ink-soft text-lg leading-relaxed">
            그래서 PetTracker는 <strong className="text-pt-ink">우리 아이의
            하루 전체</strong>를 함께 들여다봐요. 일하는 동안에도, 외출 중에도,
            잠든 밤에도 PT가 옆에서 돌봐드릴 수 있게요.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {careAreas.map((c) => {
            const isV1 = c.tag.startsWith("V1.0");
            return (
              <div
                key={c.title}
                className={`relative rounded-2xl p-6 border transition-all hover:shadow-lg ${
                  isV1
                    ? "bg-pt-cream border-pt-border hover:border-pt-orange/50"
                    : "bg-white border-line hover:border-pt-green/40"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl ${
                      isV1 ? "bg-white" : "bg-pt-green-light"
                    }`}
                  >
                    {c.icon}
                  </div>
                  <h3 className="font-pt-heading text-pt-ink font-bold text-lg">{c.title}</h3>
                </div>
                <p className="text-pt-ink-soft text-sm leading-relaxed mb-4">
                  {c.desc}
                </p>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    isV1
                      ? "bg-pt-orange/15 text-pt-orange-dark"
                      : "bg-pt-green/15 text-pt-green-dark"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isV1 ? "bg-pt-orange" : "bg-pt-green"
                    }`}
                  />
                  {c.tag}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-pt-orange-light via-pt-cream to-pt-green-light border border-pt-border">
          <p className="text-pt-ink text-center text-base sm:text-lg leading-relaxed">
            반려동물의 일상을 함께 만들어가는{" "}
            <strong className="text-pt-green-dark">종합 케어 플랫폼</strong> — 그것이
            PetTracker가 그리고 있는 그림입니다.
          </p>
        </div>
      </div>
    </section>
  );
}
