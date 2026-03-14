import { Link } from "react-router-dom";

export default function Terms() {
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
        <h1 className="text-3xl font-extrabold mb-2">이용약관</h1>
        <p className="text-gray-500 text-sm mb-12">시행일: 2026년 3월 14일</p>

        <div className="prose max-w-none text-gray-700 leading-relaxed space-y-8">
          <section>
            <h2 className="text-xl font-bold text-dark mb-3">제1조 (목적)</h2>
            <p className="text-sm">
              이 약관은 SAFEWAY KIDS(이하 "회사")가 제공하는 어린이 학원 셔틀버스 공유 플랫폼 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임 사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">제2조 (정의)</h2>
            <ul className="list-decimal pl-6 space-y-2 text-sm">
              <li>"서비스"란 회사가 제공하는 셔틀버스 배차, 실시간 위치 추적, 스케줄 관리, 요금 정산 등 일체의 서비스를 말합니다.</li>
              <li>"이용자"란 이 약관에 따라 회사와 이용 계약을 체결하고 서비스를 이용하는 자를 말합니다.</li>
              <li>"보호자"란 서비스를 통해 자녀의 통학을 관리하는 법정 대리인을 말합니다.</li>
              <li>"학원"이란 서비스에 등록하여 셔틀버스 운행 서비스를 이용하는 교육기관을 말합니다.</li>
              <li>"기사"란 회사의 관리 하에 셔틀버스를 운행하는 운전자를 말합니다.</li>
              <li>"안전도우미"란 셔틀버스에 동승하여 아동의 안전을 관리하는 자를 말합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">제3조 (약관의 효력 및 변경)</h2>
            <ul className="list-decimal pl-6 space-y-2 text-sm">
              <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 적용일자 7일 전부터 공지합니다.</li>
              <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">제4조 (이용 계약의 체결)</h2>
            <ul className="list-decimal pl-6 space-y-2 text-sm">
              <li>이용 계약은 이용자가 약관의 내용에 동의한 후 이용 신청을 하고, 회사가 이를 승낙함으로써 체결됩니다.</li>
              <li>회사는 다음 각 호에 해당하는 이용 신청에 대해서는 승낙하지 않을 수 있습니다.
                <ul className="list-disc pl-6 mt-1 space-y-1">
                  <li>실명이 아니거나 타인의 명의를 사용한 경우</li>
                  <li>허위 정보를 기재한 경우</li>
                  <li>관련 법령에 위반되는 경우</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">제5조 (서비스의 내용)</h2>
            <p className="text-sm">회사가 제공하는 서비스는 다음과 같습니다.</p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-sm">
              <li>셔틀버스 배차 및 운행 관리</li>
              <li>실시간 차량 위치 추적 및 알림</li>
              <li>탑승·하차 관리 및 기록</li>
              <li>스케줄 등록 및 변경</li>
              <li>요금 산정 및 청구</li>
              <li>안전 관련 AI 모니터링 (순차 도입)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">제6조 (이용자의 의무)</h2>
            <ul className="list-decimal pl-6 space-y-2 text-sm">
              <li>이용자는 정확한 정보를 제공해야 하며, 변경 사항이 있을 경우 즉시 갱신해야 합니다.</li>
              <li>이용자는 서비스를 본래의 목적에 맞게 이용해야 합니다.</li>
              <li>보호자는 자녀의 안전을 위해 정확한 탑승 정보를 등록해야 합니다.</li>
              <li>이용자는 타인의 개인정보를 침해해서는 안 됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">제7조 (회사의 의무)</h2>
            <ul className="list-decimal pl-6 space-y-2 text-sm">
              <li>회사는 관련 법령과 이 약관이 정하는 바에 따라 지속적이고 안정적으로 서비스를 제공합니다.</li>
              <li>회사는 이용자의 개인정보를 안전하게 관리합니다.</li>
              <li>회사는 차량 안전 점검, 기사 자격 확인, 안전도우미 배치 등 안전 관리에 최선을 다합니다.</li>
              <li>회사는 서비스 장애 발생 시 신속하게 복구하기 위해 노력합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">제8조 (요금 및 결제)</h2>
            <ul className="list-decimal pl-6 space-y-2 text-sm">
              <li>서비스 이용 요금은 거리, 이용 횟수, 이용 인원 등을 기준으로 산정됩니다.</li>
              <li>요금은 매월 정산되며, 상세 내역은 앱을 통해 확인할 수 있습니다.</li>
              <li>결제 방법 및 시기는 별도로 안내합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">제9조 (면책 조항)</h2>
            <ul className="list-decimal pl-6 space-y-2 text-sm">
              <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>회사는 이용자의 귀책 사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">제10조 (분쟁 해결)</h2>
            <ul className="list-decimal pl-6 space-y-2 text-sm">
              <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호 협의하여 해결합니다.</li>
              <li>협의가 이루어지지 않을 경우, 관할 법원은 회사 소재지를 관할하는 법원으로 합니다.</li>
            </ul>
          </section>

          <section className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              <strong>부칙</strong><br />
              이 약관은 2026년 3월 14일부터 시행합니다.
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
