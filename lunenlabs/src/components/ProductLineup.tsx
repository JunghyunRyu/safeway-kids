import { Link } from "react-router-dom";

type ProductStatus = "출시 임박" | "개발 중" | "운영 중" | "샌드박스 심사" | "점진 축소";

const products: {
  name: string;
  tag: string;
  desc: string;
  status: ProductStatus;
  highlight?: boolean;
  href?: string;
  bullets: string[];
  ctaLabel?: string;
  /** B2C 안전 라인업과 구분되는 개발 인프라 / 오픈소스 도구 */
  devTool?: boolean;
}[] = [
  {
    name: "PetTracker",
    tag: "강아지 일상 종합 케어",
    desc: "반려동물의 산책 매칭 · 사고 자동 대응 · GPS 이상 탐지 · 컨디션 추적 · 추억 기록까지, 일상 전반을 같이 봐드리는 종합 케어 동반자입니다.",
    status: "출시 임박",
    highlight: true,
    href: "/pet",
    bullets: [
      "2026년 6월 V1.0 출시",
      "AI 5축: 사고 신고 LLM · GPS 이상 · 사진 캡션 · 컨디션 · 모더레이션",
      "산책 + 사고 대응 + 컨디션 + 추억 기록 통합",
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
    tag: "B2B 테스트 자동화 (점진 축소)",
    desc: "글로벌 클라이언트를 위한 SaaS 테스트 자동화 컨설팅으로 B2C 라인업의 R&D를 뒷받침해 왔습니다. 신규 수임은 점차 줄이고, 여기서 쌓인 회귀 검증 노하우를 후속 도구 tripwire로 옮기는 중입니다.",
    status: "점진 축소",
    bullets: [
      "기존 클라이언트 유지보수 중심으로 전환",
      "축적한 회귀 검증 노하우 → tripwire로 이전",
      "신규 컨설팅 수임은 점진적으로 축소",
    ],
  },
  {
    name: "tripwire",
    tag: "AI 변경의 회귀 방화벽",
    desc: "AI가 코드를 고칠 때 조용히 함께 움직이는 동작들(blast radius)을 즉시 보여주고, 승인한 경계를 넘는 변경을 막아 끝없는 수정 루프에 '멈춰도 되는 지점'을 줍니다.",
    status: "개발 중",
    href: "/tripwire",
    ctaLabel: "tripwire 자세히 보기 →",
    devTool: true,
    bullets: [
      "AI가 건드린 진짜 범위를 즉시 가시화",
      "승인한 경계를 넘으면 자동 차단(gate)",
      "테스트는 초록불이어도 동작 변화는 잡아냄",
    ],
  },
];

const statusStyle: Record<ProductStatus, string> = {
  "출시 임박": "bg-aqua text-navy-deep",
  "샌드박스 심사": "bg-warning/15 text-warning",
  "개발 중": "bg-navy/10 text-navy",
  "운영 중": "bg-success/15 text-success",
  "점진 축소": "bg-mist/15 text-mist",
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
            안전 라인업 4종, <br className="hidden sm:block" />
            그리고 그걸 떠받치는 개발 도구.
          </h2>
          <p className="text-mist text-lg leading-relaxed">
            네 개의 B2C 제품은 인증 · 결제 · 위치 · 알림 인프라를 공유합니다. 한 제품의
            검증이 다음 제품의 출시 비용을 줄이죠. 그리고 이 제품들을 안정적으로
            만들기 위해 태어난 개발 도구 <strong className="text-navy">tripwire</strong>가
            그 아래를 받칩니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {products.map((p) => (
            <article
              key={p.name}
              className={`relative rounded-3xl p-7 sm:p-8 border transition-all ${
                p.highlight
                  ? "bg-gradient-to-br from-navy to-navy-soft border-aqua/30 hover:scale-[1.01]"
                  : p.devTool
                    ? "bg-ink text-white border-aqua/25 hover:border-aqua/50 md:col-span-2"
                    : "bg-cream border-line hover:border-aqua/40"
              }`}
            >
              {p.devTool && (
                <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-aqua text-[11px] font-semibold tracking-wide uppercase font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-aqua" aria-hidden />
                  Dev tooling · OSS
                </div>
              )}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3
                    className={`text-2xl font-bold mb-1.5 ${
                      p.highlight || p.devTool ? "text-white" : "text-navy"
                    }`}
                  >
                    {p.name}
                  </h3>
                  <div
                    className={`text-sm ${
                      p.highlight || p.devTool ? "text-aqua" : "text-mist"
                    }`}
                  >
                    {p.tag}
                  </div>
                </div>
                <span
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                    p.devTool
                      ? "bg-aqua/15 text-aqua"
                      : statusStyle[p.status]
                  }`}
                >
                  {p.status}
                </span>
              </div>

              <p
                className={`text-sm leading-relaxed mb-5 ${
                  p.highlight || p.devTool ? "text-white/80" : "text-mist"
                }`}
              >
                {p.desc}
              </p>

              <ul className="space-y-2">
                {p.bullets.map((b, i) => (
                  <li
                    key={i}
                    className={`text-xs sm:text-sm flex items-start gap-2 ${
                      p.highlight || p.devTool ? "text-white/70" : "text-mist"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-1 h-1 rounded-full mt-2 ${
                        p.highlight || p.devTool ? "bg-aqua" : "bg-aqua-dark"
                      }`}
                    />
                    {b}
                  </li>
                ))}
              </ul>

              {p.href && (
                <Link
                  to={p.href}
                  className={`inline-flex items-center gap-1.5 mt-6 text-sm font-semibold transition-colors ${
                    p.highlight || p.devTool
                      ? "text-aqua hover:text-aqua-light"
                      : "text-aqua-dark hover:text-aqua"
                  }`}
                >
                  {p.ctaLabel ?? `${p.name} 자세히 보기 →`}
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
