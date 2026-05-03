export default function PTSpotlight() {
  const aiAxes = [
    {
      title: "사고 신고 LLM",
      desc: "산책 중 발생한 사고를 보호자가 자연어로 입력하면 LLM이 자동 분류하고 119/동물병원 경로를 안내합니다.",
    },
    {
      title: "GPS 이상 탐지",
      desc: "산책 경로 이탈, 비정상 정지, 경로 위험 지점을 실시간으로 감지하여 보호자·펫시터 양면에 알림을 전달합니다.",
    },
    {
      title: "사진 자동 캡션",
      desc: "산책 사진을 AI가 자동 분석하여 강아지의 표정·행동·환경을 한 줄로 요약. 보호자에게 감성 리포트로 전달됩니다.",
    },
    {
      title: "컨디션 추적",
      desc: "여러 회차의 산책 데이터를 종합하여 강아지의 컨디션 변화 신호를 보호자가 놓치지 않도록 알려줍니다.",
    },
    {
      title: "콘텐츠 모더레이션",
      desc: "후기·사진의 부적절한 콘텐츠를 자동 검열하여 양면 플랫폼의 신뢰를 유지합니다.",
    },
  ];

  return (
    <section
      id="pt"
      className="relative py-24 sm:py-32 bg-aurora overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-aqua/40 bg-aqua/10 text-aqua text-xs font-medium mb-5">
            첫 번째 라인업 · 가장 가까운 출시
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            PetTracker는
            <br />
            <span className="bg-gradient-to-r from-aqua to-aqua-light bg-clip-text text-transparent">
              산책 위탁의 신뢰 문제
            </span>
            를 풉니다.
          </h2>
          <p className="text-white/75 text-lg leading-relaxed">
            보호자가 모르는 사람에게 강아지를 맡기는 일은 쉽지 않습니다. PetTracker는
            신원조회 · 보험 · 실시간 GPS · 사고 자동 신고 · AI 기반 모니터링을 통합해
            "맡길 수 있는 사람"의 기준을 다시 정의합니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiAxes.map((a, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-aqua/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-aqua/15 text-aqua text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="text-white font-bold text-lg">{a.title}</h3>
              </div>
              <p className="text-white/65 text-sm leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 p-7 sm:p-8 rounded-2xl bg-aqua/10 border border-aqua/30 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="text-aqua text-xs font-semibold tracking-wider uppercase mb-2">
              베타 사전가입 진행 중
            </div>
            <h3 className="text-white text-xl sm:text-2xl font-bold mb-1.5">
              지금 신청하면 첫 3개월 완전 무료
            </h3>
            <p className="text-white/65 text-sm">
              2026년 6월 V1.0 출시 시 가장 먼저 알려드립니다.
            </p>
          </div>
          <a
            href="#signup"
            className="px-6 py-3 rounded-full bg-aqua text-navy-deep font-semibold hover:bg-aqua-light transition-colors"
          >
            사전가입 →
          </a>
        </div>
      </div>
    </section>
  );
}
