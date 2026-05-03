import { useState } from "react";

const faqs: { q: string; a: string }[] = [
  {
    q: "PetTracker는 언제 출시되나요?",
    a: "2026년 6월 9일 ±2일을 목표로 V1.0 출시를 준비하고 있습니다. 사전가입자께 출시일 1주일 전 우선 안내드립니다.",
  },
  {
    q: "베타 사전가입에 비용이 드나요?",
    a: "전혀 없습니다. 사전가입자는 출시 후 첫 3개월을 무료로 이용하실 수 있고, 이용 의사가 없으시면 그대로 종료하시면 됩니다. 법적 구속력은 없습니다.",
  },
  {
    q: "1인 창업가인데 안정성은 괜찮나요?",
    a: "제품의 안정성은 코드와 인프라로 검증됩니다. 백엔드 95개 테스트, 모바일 36개 테스트, 웹 50개 테스트가 매 빌드마다 자동 실행되며, 위치정보보호법 · 개인정보보호법 컴플라이언스가 코드 단계에서 내장되어 있습니다.",
  },
  {
    q: "PetTracker 외 다른 제품들과는 어떤 관계인가요?",
    a: "루넨랩스의 4개 제품은 인증 · 결제 · 위치 · 알림 인프라를 공유합니다. PetTracker의 검증이 SafeWay Kids · CareConnect의 출시 비용을 줄이는 구조이며, 한 제품의 사용자 경험이 다른 제품의 신뢰로 이어집니다.",
  },
  {
    q: "수집된 정보는 어떻게 처리되나요?",
    a: "본 사전가입에서 수집된 이메일과 강아지 정보는 출시 안내 · 베타 운영 외의 용도로 사용되지 않습니다. 자세한 내용은 개인정보처리방침을 확인해주세요.",
  },
  {
    q: "지방·해외에서도 사용할 수 있나요?",
    a: "V1.0은 서울 · 수도권을 중심으로 시작합니다. 해당 지역 외 사전가입자께도 V1.x · V2.0 단계 확장 시 우선 안내드립니다.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24 sm:py-32 bg-cream">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-12">
          <div className="text-aqua-dark text-sm font-semibold tracking-wider uppercase mb-3">
            FAQ
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-navy leading-tight">
            자주 묻는 질문
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="bg-white border border-line rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-aqua-light/40 transition-colors"
              >
                <span className="text-navy font-semibold text-base sm:text-lg">
                  {f.q}
                </span>
                <span
                  className={`shrink-0 ml-4 w-6 h-6 rounded-full bg-cream flex items-center justify-center text-aqua-dark transition-transform ${
                    open === i ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  open === i
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-mist leading-relaxed text-sm sm:text-base">
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
