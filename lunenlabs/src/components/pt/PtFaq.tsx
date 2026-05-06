import { useState } from "react";

const faqs = [
  {
    q: "PetTracker는 어떤 부분을 도와주나요?",
    a: "우리 아이의 일상 전반을 같이 봐드려요. 출시 시점부터 산책 매칭, 사고 자동 신고, GPS 이상 탐지, 사진 자동 정리, 컨디션 변화 감지, 후기 자동 검수까지 다섯 가지 AI 도우미가 같이 동작해요. 이후 동물병원 디렉토리·펫프렌들리 장소·여행·앨범 같은 영역도 단계마다 추가될 예정이에요.",
  },
  {
    q: "지금 사전가입하면 어떤 혜택이 있나요?",
    a: "2026년 6월 V1.0 출시 시점에 첫 3개월 완전 무료로 사용하실 수 있어요. 그리고 출시일·기능 변경 안내도 가장 먼저 받아보실 수 있어요. 베타 회원이 가장 먼저 PT를 경험하시는 분들이라 후기·피드백을 많이 들어볼 예정이에요.",
  },
  {
    q: "사고가 생기면 자동 신고가 어디까지 되나요?",
    a: "사고 상황을 글로 적어주시면 AI가 상황의 긴급 정도와 종류, 필요한 조치를 자동으로 정리해드려요. 응급 상황이면 119, 가벼운 경우엔 근처 동물병원, 분실이면 동물구조 채널 같은 식으로 경로를 안내드려요. 자동 신고가 사람의 판단을 대체하지는 않아요 — 최종 결정은 항상 직접 확인하실 수 있게 만들었어요.",
  },
  {
    q: "우리 아이 GPS 정보가 어디까지 공유되나요?",
    a: "산책 중에만 매칭된 산책 메이트와의 사이에서만 공유돼요. 산책이 끝나면 정보 공유도 자동으로 종료돼요. 위치 데이터는 위치정보법에 따라 안전하게 처리되고, 언제든 삭제 요청하실 수 있어요.",
  },
  {
    q: "사고가 생겼을 때 책임 구조는 어떻게 되나요?",
    a: "가장 걱정되실 부분이라 별도 안전 인프라를 마련하고 있어요. (1) 산책 메이트 가입 시 신원조회·이력 검증·자기소개 자동 검수가 사전에 작동해요. (2) 산책 중에는 GPS 실시간 추적과 사고 자동 신고 AI가 즉시 알림을 보내드려요. (3) 사고·결제·보안처럼 중요한 영역은 변호사·세무사·도메인 전문가의 자문을 받아 운영해요. (4) 보험 가맹·약관 차원의 책임 구조는 V1.0 출시 시점에 별도로 안내드릴 예정이에요. 우리 아이를 처음 보는 사람에게 맡기는 부담을 최대한 낮추는 게 PT 운영의 1순위예요.",
  },
  {
    q: "결제는 언제부터 시작되나요?",
    a: "V1.0 출시 시점인 2026년 6월에는 매칭만 운영되고 결제는 활성화되지 않아요. 사전가입하신 분들은 7월 결제 시작 시점에 베타 혜택(첫 3개월 무료 + 출시 후 N% 할인)이 자동 적용돼요. 약속드린 혜택은 약관 수준으로 보장돼요.",
  },
  {
    q: "산책 메이트는 어떻게 검증되나요?",
    a: "신원조회 + 이력 검증 + 후기 누적이라는 3단계 검증을 거쳐요. 추가로 AI 자동 검수가 자기소개·후기에 부적절한 내용이 들어가면 자동으로 걸러드려요. 직접 메이트를 선택하실 수 있게 충분한 정보를 보여드릴게요.",
  },
];

export default function PtFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="pt-faq"
      className="relative pt-14 pb-20 sm:pt-20 sm:pb-28 bg-white overflow-hidden"
    >
      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pt-orange/30 bg-pt-orange-light text-pt-orange-dark text-xs font-semibold mb-5">
            자주 묻는 질문
          </div>
          <h2 className="font-pt-heading text-pt-ink text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            궁금하신 점이 있으세요?
          </h2>
          <p className="text-pt-ink-soft text-lg leading-relaxed">
            여기에 없는 질문은 언제든{" "}
            <a
              href="mailto:jhryu115@gmail.com"
              className="text-pt-orange-dark font-semibold underline underline-offset-2"
            >
              jhryu115@gmail.com
            </a>
            으로 보내주세요.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-2xl bg-pt-cream border border-pt-border overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-pt-orange-light/40 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-pt-ink font-semibold text-base sm:text-lg leading-snug">
                    {f.q}
                  </span>
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full bg-white border border-pt-border flex items-center justify-center text-pt-orange-dark transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 -mt-1">
                    <p className="text-pt-ink-soft text-sm sm:text-base leading-relaxed">
                      {f.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
