type ProductStatus = "출시 임박" | "개발 중" | "운영 중" | "샌드박스 심사";

const products: {
  name: string;
  tag: string;
  desc: string;
  status: ProductStatus;
  highlight?: boolean;
  bullets: string[];
}[] = [
  {
    name: "PetTracker",
    tag: "반려견 산책 매칭",
    desc: "보호자가 산책 시간이 부족할 때 신원 확인된 펫시터에게 안전하게 위탁할 수 있는 플랫폼. AI 5축 차별화로 사고 신고·GPS 이상 탐지·컨디션 추적까지 자동화.",
    status: "출시 임박",
    highlight: true,
    bullets: [
      "2026년 6월 V1.0 출시",
      "AI 5축: 사고 신고 LLM · GPS 이상 · 사진 캡션 · 컨디션 · 모더레이션",
      "신원조회 + 보험 + 실시간 추적 통합",
    ],
  },
  {
    name: "SafeWay Kids",
    tag: "어린이 학원 셔틀 안전",
    desc: "AI 기반 어린이 학원 셔틀버스 공유 플랫폼. 실시간 위치 추적과 전문 안전도우미 동승으로 안심 통학을 제공.",
    status: "샌드박스 심사",
    bullets: [
      "ICT 규제 샌드박스 심사 진행 중",
      "AI 최적 경로 + 실시간 GPS",
      "변호사 자문 의견서 확보",
    ],
  },
  {
    name: "CareConnect",
    tag: "돌봄 매칭 플랫폼",
    desc: "고령자 · 환자 돌봄이 필요한 가족과 검증된 돌봄 제공자를 연결합니다. PetTracker · SafeWay와 동일한 안전 코어를 공유.",
    status: "개발 중",
    bullets: [
      "PetTracker 인프라 90% 재사용",
      "공급자 신원·자격 검증",
      "보호자·돌봄자 양면 앱",
    ],
  },
  {
    name: "SDET Code",
    tag: "B2B 테스트 자동화",
    desc: "글로벌 클라이언트를 위한 SaaS 테스트 자동화 컨설팅. 안정적인 매출원이자 한국 B2C 사업의 R&D를 뒷받침합니다.",
    status: "운영 중",
    bullets: [
      "해외 클라이언트 다수 운영",
      "B2C 라인업 R&D 자금원",
      "1인 운영 multi-app 가능 기반",
    ],
  },
];

const statusStyle: Record<ProductStatus, string> = {
  "출시 임박": "bg-aqua text-navy-deep",
  "샌드박스 심사": "bg-warning/15 text-warning",
  "개발 중": "bg-navy/10 text-navy",
  "운영 중": "bg-success/15 text-success",
};

export default function ProductLineup() {
  return (
    <section id="products" className="py-24 sm:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-14">
          <div className="text-aqua-dark text-sm font-semibold tracking-wider uppercase mb-3">
            Products
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-navy mb-6 leading-tight">
            4개 라인업, <br className="hidden sm:block" />
            하나의 안전 코어를 공유합니다.
          </h2>
          <p className="text-mist text-lg leading-relaxed">
            각 제품은 인증 · 결제 · 위치 · 알림 인프라를 공유합니다. 한 제품의 검증이
            다음 제품의 출시 비용을 줄이는 구조입니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {products.map((p) => (
            <article
              key={p.name}
              className={`relative rounded-3xl p-7 sm:p-8 border transition-all ${
                p.highlight
                  ? "bg-gradient-to-br from-navy to-navy-soft border-aqua/30 hover:scale-[1.01]"
                  : "bg-cream border-line hover:border-aqua/40"
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3
                    className={`text-2xl font-bold mb-1.5 ${
                      p.highlight ? "text-white" : "text-navy"
                    }`}
                  >
                    {p.name}
                  </h3>
                  <div
                    className={`text-sm ${
                      p.highlight ? "text-aqua" : "text-mist"
                    }`}
                  >
                    {p.tag}
                  </div>
                </div>
                <span
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle[p.status]}`}
                >
                  {p.status}
                </span>
              </div>

              <p
                className={`text-sm leading-relaxed mb-5 ${
                  p.highlight ? "text-white/80" : "text-mist"
                }`}
              >
                {p.desc}
              </p>

              <ul className="space-y-2">
                {p.bullets.map((b, i) => (
                  <li
                    key={i}
                    className={`text-xs sm:text-sm flex items-start gap-2 ${
                      p.highlight ? "text-white/70" : "text-mist"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-1 h-1 rounded-full mt-2 ${
                        p.highlight ? "bg-aqua" : "bg-aqua-dark"
                      }`}
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
