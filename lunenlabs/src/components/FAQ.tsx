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
    q: "데이터 보안과 책임 구조는 어떻게 되나요?",
    a: "백엔드 95개 · 모바일 36개 · 웹 50개의 테스트가 매 빌드마다 자동 실행되어 안정성을 검증합니다. 위치정보보호법 · 개인정보보호법 · 정보통신망법 컴플라이언스가 코드 단계에서 내장되어 있고, 사고 · 결제 · 보안 같은 critical 영역은 변호사 · 세무사 · 도메인 전문가 자문을 받아 운영합니다. 개인정보 접근 권한은 운영 책임자만 가지도록 최소화 정책을 적용합니다.",
  },
  {
    q: "PetTracker 외 다른 제품들과는 어떤 관계인가요?",
    a: "루넨랩스의 안심 라인업(PetTracker · SafeWay Kids · CareConnect)은 인증 · 결제 · 위치 · 알림 인프라를 공유합니다. 한 제품의 검증이 다른 제품의 출시 비용을 줄이는 구조이며, 한 제품의 사용자 경험이 다른 제품의 신뢰로 이어집니다. 여기에 개발 도구 tripwire(오픈소스)가 이 제품들의 회귀를 막아 안정적인 출시를 떠받칩니다.",
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
