import { Link } from "react-router-dom";

export default function Privacy() {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            개인정보처리방침
          </h1>
          <p className="text-white/65 text-sm">
            시행일자: 2026년 5월 3일 · 사업자: 루넨랩스 (등록 진행 중)
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
        <div className="bg-white rounded-3xl border border-line p-7 sm:p-10 space-y-10 text-sm sm:text-base leading-relaxed">
          <Intro />
          <Section title="1. 수집하는 개인정보 항목 및 수집 방법">
            <p>
              루넨랩스(이하 '회사')는 lunenlabs.com을 통한 사전가입 신청 시 다음 항목을
              수집합니다.
            </p>
            <Table
              rows={[
                ["필수", "이름, 이메일 주소"],
                ["선택", "강아지 이름, 견종 · 나이, 거주 지역, 산책 빈도, 관심 영역"],
                ["수집 방법", "이용자가 직접 입력 (웹 폼)"],
              ]}
            />
          </Section>

          <Section title="2. 개인정보의 수집 및 이용 목적 (개인정보보호법 §15)">
            <ul className="list-disc pl-6 space-y-2">
              <li>PetTracker V1.0 출시 안내 및 베타 운영 안내</li>
              <li>사전가입자 우대 혜택 (첫 3개월 무료 등) 적용</li>
              <li>사용자 의향 분석 및 베타 기능 우선순위 결정</li>
              <li>(동의 시) 마케팅 및 신규 제품 정보 제공</li>
            </ul>
          </Section>

          <Section title="3. 개인정보의 보유 및 이용 기간">
            <ul className="list-disc pl-6 space-y-2">
              <li>
                보유 기간: PetTracker V1.0 출시 후 12개월 또는 이용자의 동의 철회 시까지
              </li>
              <li>
                보유 기간 경과 또는 처리 목적 달성 후 지체 없이 파기합니다.
              </li>
            </ul>
          </Section>

          <Section title="4. 개인정보의 제3자 제공 (개인정보보호법 §17)">
            <p>
              회사는 이용자의 사전 동의 없이 개인정보를 외부에 제공하지 않습니다.
              다만, 다음의 경우는 예외로 합니다.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </Section>

          <Section title="5. 개인정보처리의 위탁">
            <p>
              회사는 현재 개인정보 처리 업무를 외부에 위탁하고 있지 않습니다. 향후 위탁이
              필요한 경우 본 방침을 통해 사전 고지하고, 필요 시 별도 동의를 받겠습니다.
            </p>
          </Section>

          <Section title="6. 정보주체의 권리 · 의무 및 행사 방법 (개인정보보호법 §22)">
            <p>이용자는 언제든지 다음 권리를 행사하실 수 있습니다.</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
              <li>동의 철회</li>
            </ul>
            <p className="mt-3">
              상기 권리 행사는{" "}
              <a
                href="mailto:jhryu115@gmail.com"
                className="text-aqua-dark underline"
              >
                jhryu115@gmail.com
              </a>
              으로 서면 또는 이메일로 연락해 주시면 지체 없이 조치하겠습니다.
            </p>
          </Section>

          <Section title="7. 개인정보의 안전성 확보 조치">
            <ul className="list-disc pl-6 space-y-2">
              <li>전송 구간 암호화 (HTTPS · TLS 1.2 이상)</li>
              <li>접근 권한의 최소화 (1인 운영자 단독 접근, 공동 접근 없음)</li>
              <li>저장 데이터의 백업 시 암호화</li>
              <li>침해 사고 발생 시 72시간 이내 통지</li>
            </ul>
          </Section>

          <Section title="8. 개인정보 보호책임자">
            <Table
              rows={[
                ["성명", "류진형"],
                ["직책", "루넨랩스 대표예정자 · 개인정보 보호책임자"],
                ["이메일", "jhryu115@gmail.com"],
              ]}
            />
          </Section>

          <Section title="9. 본 방침의 변경">
            <p>
              본 개인정보처리방침은 법령 · 정책 또는 보안기술의 변경에 따라 내용이
              추가 · 삭제 및 수정될 수 있으며, 변경 시 lunenlabs.com을 통해 사전 고지합니다.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Intro() {
  return (
    <p className="text-mist">
      루넨랩스(LunenLabs, 이하 "회사")는 「개인정보보호법」을 준수하며, 정보주체의
      개인정보 보호 및 권익 보호를 위해 본 개인정보처리방침을 수립 · 공개합니다.
    </p>
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
      <h2 className="text-navy text-xl sm:text-2xl font-bold mb-4">{title}</h2>
      <div className="text-mist space-y-2">{children}</div>
    </section>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full mt-3 border-collapse text-sm">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i} className="border-b border-line last:border-0">
            <td className="py-3 pr-4 text-navy font-semibold align-top w-32 shrink-0">
              {k}
            </td>
            <td className="py-3 text-mist">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
