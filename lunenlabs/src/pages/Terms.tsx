import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-aqua text-sm mb-6 hover:underline"
          >
            ← 홈으로
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">사전가입 이용약관</h1>
          <p className="text-white/65 text-sm">
            시행일자: 2026년 5월 3일 · 사업자: 루넨랩스 (등록 진행 중)
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
        <div className="bg-white rounded-3xl border border-line p-7 sm:p-10 space-y-8 text-sm sm:text-base leading-relaxed text-mist">
          <Section title="제1조 (목적)">
            본 약관은 루넨랩스(이하 "회사")가 lunenlabs.com을 통해 제공하는
            PetTracker 베타 사전가입 서비스(이하 "사전가입")의 이용 조건과 절차를
            규정함을 목적으로 합니다.
          </Section>

          <Section title="제2조 (사전가입의 효력)">
            <ul className="list-disc pl-6 space-y-2">
              <li>
                사전가입은 PetTracker V1.0의 출시 안내 및 베타 운영 안내를 받기 위한
                의사 표명이며, 법적 구속력 있는 계약이 아닙니다.
              </li>
              <li>
                회사 또는 이용자는 언제든지 사전가입을 철회할 수 있으며, 철회로 인한
                불이익은 발생하지 않습니다.
              </li>
            </ul>
          </Section>

          <Section title="제3조 (사전가입자의 혜택)">
            <ul className="list-disc pl-6 space-y-2">
              <li>PetTracker V1.0 출시일 1주일 전 이메일로 우선 안내</li>
              <li>출시 후 첫 3개월 무료 이용 (단, 별도 결제수단 등록 필요 시 사전 고지)</li>
              <li>사전가입자 한정 베타 피드백 채널 제공</li>
            </ul>
            <p className="mt-3">
              혜택의 구체적 조건은 출시 시점에 회사가 별도로 안내하며, 사전가입자에게
              불리한 변경이 있을 경우 사전가입을 철회할 권리가 보장됩니다.
            </p>
          </Section>

          <Section title="제4조 (서비스의 변경 · 출시 지연)">
            회사는 기술적 · 사업적 사유로 서비스의 내용 또는 출시 일정을 변경할 수
            있으며, 중요한 변경 사항은 사전가입자에게 이메일 등으로 사전 안내합니다.
            출시 지연 또는 출시 취소가 발생할 경우, 사전가입자는 즉시 사전가입을
            철회할 수 있으며 회사에 대해 어떠한 의무도 부담하지 않습니다.
          </Section>

          <Section title="제5조 (책임의 제한)">
            본 사전가입 단계에서는 회사가 별도의 서비스를 제공하지 않으므로,
            회사는 사전가입과 관련하여 이용자에게 발생한 손해에 대해 고의 또는
            중대한 과실이 있는 경우를 제외하고 책임을 부담하지 않습니다.
          </Section>

          <Section title="제6조 (개인정보의 처리)">
            <p>
              사전가입과 관련된 개인정보의 수집 · 이용 · 보관 · 파기에 관한 사항은
              별도의{" "}
              <Link to="/privacy" className="text-aqua-dark underline">
                개인정보처리방침
              </Link>
              에 따릅니다.
            </p>
          </Section>

          <Section title="제7조 (분쟁의 해결)">
            본 약관에 관한 분쟁은 대한민국 법령에 따라 해결하며, 관할 법원은
            민사소송법에 의한 관할 법원으로 합니다.
          </Section>

          <Section title="제8조 (약관의 변경)">
            회사는 본 약관을 개정할 수 있으며, 개정 시 시행일자 7일 전부터
            lunenlabs.com을 통해 공지합니다. 사전가입자에게 불리한 개정의 경우
            30일 전부터 공지하며, 이메일이 등록된 사전가입자에게는 이메일로 별도
            안내합니다.
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-navy text-lg sm:text-xl font-bold mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
