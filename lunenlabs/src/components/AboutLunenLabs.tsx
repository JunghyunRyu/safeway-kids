export default function AboutLunenLabs() {
  const principles = [
    {
      title: "책임이 추적되는 운영",
      desc: "설계 · 개발 · 배포 · 고객 응대가 한 곳에서 책임지는 구조입니다. 의사결정 속도가 빠르고, 문제가 생겼을 때 책임 소재가 명확합니다.",
    },
    {
      title: "공유된 코어",
      desc: "안심 라인업 제품이 인증 · 결제 · 위치 · 알림 인프라를 공유합니다. 한 제품의 검증이 다른 제품의 출시 비용을 줄입니다.",
    },
    {
      title: "안전이 기능이 아닌 기본",
      desc: "위치정보보호법 · 개인정보보호법 · 아동복지법까지 코드 단계에서 컴플라이언스가 내장됩니다.",
    },
    {
      title: "실측 가능한 검증",
      desc: "각 기능은 단위 · 통합 · 회귀 테스트와 실제 사용자 데이터로 검증됩니다. 마케팅 문구가 아닌 실측 신호로 말합니다.",
    },
  ];

  return (
    <section id="about" className="py-24 sm:py-32 bg-cream">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-16">
          <div className="text-aqua-dark text-sm font-semibold tracking-wider uppercase mb-3">
            About LunenLabs
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-navy mb-6 leading-tight">
            달빛처럼 조용히, 일상의 안전을 지킵니다.
          </h2>
          <p className="text-mist text-lg leading-relaxed">
            루넨랩스라는 이름은 "달의 빛(Lunen)"에서 시작했습니다. 화려한 스포트라이트가
            아니라, 사람들이 잠든 시간에도 자리를 지키는 빛처럼 — 일상의 가장자리에서
            묵묵히 작동하는 소프트웨어를 만듭니다.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-px bg-line rounded-3xl overflow-hidden">
          {principles.map((p, i) => (
            <div
              key={i}
              className="bg-white p-8 sm:p-10 hover:bg-aqua-light/40 transition-colors"
            >
              <div className="text-aqua-dark text-sm font-semibold mb-3">
                0{i + 1}
              </div>
              <h3 className="text-navy text-xl font-bold mb-3">{p.title}</h3>
              <p className="text-mist leading-relaxed text-sm">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid sm:grid-cols-2 gap-6">
          {[
            {
              k: "B2C 안심 앱",
              v: "PetTracker · SafeWay · CareConnect",
              note: "한국 안심 일상 플랫폼",
            },
            {
              k: "B2B 사업",
              v: "SDET Code",
              note: "글로벌 SaaS 테스트 자동화 (점진 축소)",
            },
            {
              k: "개발 도구 · OSS",
              v: "tripwire",
              note: "AI 변경의 회귀 방화벽",
            },
            {
              k: "법인 상태",
              v: "사업자등록 진행 중",
              note: "2026년 출시 정렬",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white border border-line rounded-2xl p-6"
            >
              <div className="text-mist text-xs uppercase tracking-wider mb-2">
                {item.k}
              </div>
              <div className="text-navy font-bold text-lg mb-1">{item.v}</div>
              <div className="text-mist text-sm">{item.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
