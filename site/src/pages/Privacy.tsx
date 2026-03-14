import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <span className="text-xl">🛡️</span>
            SAFEWAY KIDS
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-extrabold mb-2">개인정보처리방침</h1>
        <p className="text-gray-500 text-sm mb-12">시행일: 2026년 3월 14일</p>

        <div className="prose max-w-none text-gray-700 leading-relaxed space-y-8">
          <section>
            <h2 className="text-xl font-bold text-dark mb-3">1. 개인정보의 수집 및 이용 목적</h2>
            <p>SAFEWAY KIDS(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-sm">
              <li>회원 가입 및 관리: 본인 확인, 서비스 이용 자격 확인</li>
              <li>서비스 제공: 셔틀버스 운행 스케줄 관리, 실시간 위치 추적, 탑승·하차 알림</li>
              <li>안전 관리: 자녀 안전 확인, 비상 연락, 보호자 인증</li>
              <li>요금 정산: 이용 요금 계산, 청구서 발행, 결제 처리</li>
              <li>서비스 개선: 이용 통계 분석, 서비스 품질 향상</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">2. 수집하는 개인정보 항목</h2>
            <h3 className="font-semibold mt-4 mb-2">필수 항목</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>보호자: 이름, 연락처(휴대전화번호), 카카오 계정 정보</li>
              <li>자녀: 이름, 생년월일, 학년, 등록 학원 정보</li>
              <li>기사: 이름, 연락처, 운전면허 정보, 차량 정보</li>
              <li>안전도우미: 이름, 연락처, 자격증 정보</li>
            </ul>
            <h3 className="font-semibold mt-4 mb-2">선택 항목</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>자녀 사진 (안면인식 탑승 확인용, 별도 동의 시)</li>
              <li>특이사항 메모 (알레르기, 건강 관련 주의사항)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">3. 개인정보의 보유 및 이용 기간</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>회원 탈퇴 시까지 보유하며, 탈퇴 후 지체 없이 파기합니다.</li>
              <li>관계 법령에 의한 보존 의무가 있는 경우 해당 기간 동안 보관합니다.
                <ul className="list-disc pl-6 mt-1 space-y-1">
                  <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                  <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                  <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">4. 개인정보의 제3자 제공</h2>
            <p className="text-sm">
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-sm">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              <li>서비스 제공을 위해 필요한 경우 (탑승 학원, 배정 기사에 한하여 최소 정보 공유)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">5. 개인정보의 안전성 확보 조치</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>개인정보의 암호화 (AES-256)</li>
              <li>접근 통제 및 접근 권한 관리</li>
              <li>개인정보 접근 기록의 보관 및 위·변조 방지</li>
              <li>보안 프로그램의 설치 및 갱신</li>
              <li>아동 생체정보(안면 데이터)는 엣지 디바이스에서만 처리, 서버 미전송</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">6. 이용자의 권리</h2>
            <p className="text-sm">이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-sm">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">7. 개인정보 보호책임자</h2>
            <ul className="list-none space-y-1 text-sm">
              <li>담당부서: 개인정보보호팀</li>
              <li>이메일: privacy@safeway-kids.kr</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">8. 개인정보처리방침 변경</h2>
            <p className="text-sm">
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-xs text-gray-400">
        <Link to="/" className="hover:text-primary transition-colors">&larr; SAFEWAY KIDS 홈으로</Link>
      </footer>
    </div>
  );
}
