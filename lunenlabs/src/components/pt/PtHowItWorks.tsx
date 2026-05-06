/**
 * 사용 흐름 3단계 — 친근 톤 + 보호자/산책 메이트 양면 narrative
 */

const steps = [
  {
    no: "01",
    title: "PT 앱에서 우리 아이 프로필을 만들어요",
    desc: "이름·견종·나이·산책 빈도 같은 기본 정보만 입력해도 PT가 우리 아이 성향에 맞는 산책 메이트를 추천해드려요.",
    side: "보호자",
  },
  {
    no: "02",
    title: "검증된 메이트와 매칭되고 함께 산책해요",
    desc: "신원·후기·이력이 검증된 메이트 중에서 직접 고를 수 있어요. 산책 동안 GPS·사진·컨디션 신호가 실시간으로 폰에 전달돼요.",
    side: "양면",
  },
  {
    no: "03",
    title: "산책이 끝나면 AI 리포트를 받아봐요",
    desc: "오늘 우리 아이가 어땠는지 한 줄 캡션 + 사진 + 컨디션 변화 신호가 정리돼서 도착해요. 매번 쌓이는 데이터는 우리 아이 일상 기록이 돼요.",
    side: "보호자",
  },
];

const sideStyle: Record<string, string> = {
  보호자: "bg-pt-orange/15 text-pt-orange-dark",
  산책메이트: "bg-pt-green/15 text-pt-green-dark",
  양면: "bg-pt-cream text-pt-ink",
};

export default function PtHowItWorks() {
  return (
    <section
      id="pt-how"
      className="relative py-14 sm:py-20 bg-white overflow-hidden"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pt-orange/30 bg-pt-orange-light text-pt-orange-dark text-xs font-semibold mb-5">
            사용 흐름
          </div>
          <h2 className="font-pt-heading text-pt-ink text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            처음 써보시는 분도
            <br />
            <span className="text-pt-green-dark">3분이면 시작할 수 있습니다.</span>
          </h2>
          <p className="text-pt-ink-soft text-lg leading-relaxed">
            복잡한 가입 절차나 설정은 없어요. 우리 아이 정보만 가볍게 입력하면 PT가
            나머지를 챙겨드릴게요.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.no}
              className="relative p-7 rounded-2xl bg-pt-cream border border-pt-border hover:border-pt-orange/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="text-pt-orange-dark text-3xl font-bold opacity-40">
                  {s.no}
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${sideStyle[s.side] || sideStyle["양면"]}`}
                >
                  {s.side === "양면" ? "보호자 + 메이트" : s.side}
                </div>
              </div>
              <h3 className="font-pt-heading text-pt-ink font-bold text-lg mb-3 leading-snug">
                {s.title}
              </h3>
              <p className="text-pt-ink-soft text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid sm:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl bg-pt-orange-light/70 border border-pt-orange/25">
            <div className="text-pt-orange-dark font-semibold text-sm mb-2">
              👤 보호자께
            </div>
            <p className="text-pt-ink text-sm leading-relaxed">
              출장·야근·외출 때문에 우리 아이가 혼자 있는 시간을 줄여드려요. 산책 메이트가
              누구인지·뭘 했는지 전부 투명하게 보여드릴게요.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-pt-green-light/70 border border-pt-green/25">
            <div className="text-pt-green-dark font-semibold text-sm mb-2">
              🐕 산책 메이트분께
            </div>
            <p className="text-pt-ink text-sm leading-relaxed">
              검증된 채널을 통해 안정적으로 강아지를 만날 수 있어요. AI 도우미가 옆에
              있어서 사고·이슈 대응 부담도 덜어드려요.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
