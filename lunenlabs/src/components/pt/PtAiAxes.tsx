/**
 * PT가 강아지 일상에서 도와드리는 다섯 가지 — 보호자 톤으로 작성.
 * 청중 = 보호자(사람). internal term ("AI 5축", "LLM", "Vision LLM",
 * "OpenAI Moderation API", "severity") 노출 금지.
 */

const aiAxes = [
  {
    no: 1,
    title: "사고가 났을 때 같이 빠르게 움직여요",
    sub: "사고 자동 신고",
    desc: "산책 중에 다치거나 위급한 일이 생기면, 자연어로 상황을 입력하기만 해도 AI가 자동으로 분류해드려요. 119, 동물병원, 동물구조 중 어디로 연결할지 바로 안내드릴게요.",
    detail: "상황을 글로 적기만 하면 AI가 긴급 정도를 판단해서 119·동물병원 중 맞는 곳을 즉시 안내해드려요.",
    color: "danger",
  },
  {
    no: 2,
    title: "산책 경로에서 이상한 신호를 읽어드려요",
    sub: "실시간 GPS 안전",
    desc: "강아지가 평소와 다른 곳으로 갔거나, 한 자리에 너무 오래 멈춰 있거나, 위험 지역에 진입하면 보호자와 산책 메이트 양쪽에 바로 알림이 가요.",
    detail: "강아지 위치를 실시간으로 보여드리고, 평소 경로에서 벗어나면 폰으로 바로 알림을 보내드려요.",
    color: "info",
  },
  {
    no: 3,
    title: "오늘 우리 아이가 어땠는지 한 줄로 알려드려요",
    sub: "사진 자동 정리",
    desc: "산책 중에 찍힌 사진을 AI가 자동으로 분석해서 표정·행동·환경을 한 줄로 정리해드려요. 일하는 동안에도 우리 아이의 하루를 글로 받아볼 수 있어요.",
    detail: "사진을 보고 우리 아이 표정·기분·주변 환경을 한 줄로 풀어드려서, 일하는 중에도 하루가 생생하게 보여요.",
    color: "orange",
  },
  {
    no: 4,
    title: "컨디션이 평소와 다르면 살짝 알려드려요",
    sub: "컨디션 변화 감지",
    desc: "여러 회차 산책 데이터를 종합해서 우리 아이의 활동량·반응 변화 신호를 읽어드려요. 놓치기 쉬운 작은 컨디션 변화를 미리 캐치할 수 있게 도와드려요.",
    detail: "여러 번의 산책 기록을 모아서, 평소보다 활동량이 줄거나 반응이 느려졌을 때 가볍게 알려드려요.",
    color: "green",
  },
  {
    no: 5,
    title: "후기·소개도 믿을 수 있게 만들어드려요",
    sub: "후기 자동 검수",
    desc: "산책 메이트의 자기소개나 후기에 부적절한 내용이 들어가면 자동으로 걸러져요. 안심하고 매칭하실 수 있게 신뢰 환경을 받쳐드려요.",
    detail: "산책 메이트 자기소개·후기를 AI가 자동으로 검수해서, 보시기 전에 부적절한 내용을 걸러내요.",
    color: "purple",
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; chip: string }> = {
  danger: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    chip: "bg-red-100 text-red-700",
  },
  info: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    chip: "bg-blue-100 text-blue-700",
  },
  orange: {
    bg: "bg-pt-orange-light",
    text: "text-pt-orange-dark",
    border: "border-pt-orange/30",
    chip: "bg-pt-orange/20 text-pt-orange-dark",
  },
  green: {
    bg: "bg-pt-green-light",
    text: "text-pt-green-dark",
    border: "border-pt-green/30",
    chip: "bg-pt-green/20 text-pt-green-dark",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    chip: "bg-purple-100 text-purple-700",
  },
};

export default function PtAiAxes() {
  return (
    <section
      id="pt-ai"
      className="relative py-24 sm:py-32 bg-pt-cream overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(40% 40% at 80% 20%, rgba(45, 158, 107, 0.08) 0%, transparent 70%), radial-gradient(40% 40% at 20% 80%, rgba(244, 162, 45, 0.10) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pt-orange/30 bg-white text-pt-orange-dark text-xs font-semibold mb-5">
            PetTracker가 챙겨드리는 다섯 가지
          </div>
          <h2 className="font-pt-heading text-pt-ink text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            AI가 하는 일이
            <br />
            <span className="text-pt-orange-dark">친근해졌어요.</span>
          </h2>
          <p className="text-pt-ink-soft text-lg leading-relaxed">
            "AI"라고 하면 어렵게 들리지만, PT의 AI는 결국 우리 아이를 더 잘 챙겨드리기
            위한 다섯 가지 도우미예요. 혼자서는 알아채기 힘든 작은 신호들을
            같이 읽어드릴게요.
          </p>
        </div>

        <div className="space-y-5">
          {aiAxes.map((a) => {
            const c = colorMap[a.color];
            return (
              <div
                key={a.no}
                className={`grid md:grid-cols-[80px_1fr_320px] gap-5 md:gap-7 p-6 sm:p-7 rounded-2xl bg-white border ${c.border} hover:shadow-md transition-all`}
              >
                <div className="flex md:flex-col md:items-center gap-3">
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${c.bg} ${c.text} font-bold text-2xl md:text-3xl flex items-center justify-center`}
                  >
                    {a.no}
                  </div>
                  <div className="md:text-center">
                    <div className={`text-[11px] font-semibold uppercase tracking-wider ${c.text} hidden md:block`}>
                      도우미 {a.no}
                    </div>
                  </div>
                </div>

                <div>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${c.chip} mb-2`}>
                    {a.sub}
                  </div>
                  <h3 className="font-pt-heading text-pt-ink font-bold text-xl mb-2 leading-snug">
                    {a.title}
                  </h3>
                  <p className="text-pt-ink-soft text-sm leading-relaxed">
                    {a.desc}
                  </p>
                </div>

                <div className="md:border-l md:border-pt-border md:pl-6">
                  <div className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${c.text}`}>
                    직접 써보시면
                  </div>
                  <div className="text-sm text-pt-ink leading-relaxed">
                    {a.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-5 rounded-2xl bg-white border border-pt-border text-center">
          <p className="text-pt-ink-soft text-sm leading-relaxed">
            ※ AI 추천·분류 결과는 항상 사람이 확인하고 수정할 수 있어요. PT의 AI는
            <strong className="text-pt-ink"> 사람의 판단을 대체하지 않고 도와드리는
            역할</strong>이에요.
          </p>
        </div>
      </div>
    </section>
  );
}
