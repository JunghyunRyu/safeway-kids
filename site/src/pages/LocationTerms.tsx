import Header from "../components/Header";
import Footer from "../components/Footer";

export default function LocationTerms() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <h1 className="text-3xl font-extrabold mb-8">위치정보 이용약관</h1>
        <p className="text-sm text-gray-500 mb-8">시행일: 2026년 3월 1일</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3">제1조 (목적)</h2>
            <p>
              이 약관은 세이프웨이키즈(이하 "회사")가 제공하는 위치기반서비스(이하 "서비스")의 이용과 관련하여
              회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제2조 (위치정보 수집 목적 및 이용 범위)</h2>
            <p>회사는 다음의 목적으로 위치정보를 수집 및 이용합니다:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>어린이 통학 차량의 실시간 위치 모니터링 및 안전 관리</li>
              <li>학부모에게 자녀 탑승 차량의 위치 정보 제공</li>
              <li>AI 기반 최적 경로 산출 및 운행 효율화</li>
              <li>운행 지연 감지 및 자동 알림 발송</li>
              <li>긴급 상황(SOS) 대응을 위한 차량 위치 확인</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제3조 (위치정보의 제3자 제공)</h2>
            <p>회사는 이용자의 동의를 받아 다음과 같이 위치정보를 제3자에게 제공합니다:</p>
            <table className="w-full border-collapse border border-gray-300 mt-3">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left">제공받는 자</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">제공 목적</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">제공 항목</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">학부모(법정대리인)</td>
                  <td className="border border-gray-300 px-3 py-2">자녀 탑승 차량 위치 확인</td>
                  <td className="border border-gray-300 px-3 py-2">차량 GPS 좌표, 이동 경로</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">학원 관리자</td>
                  <td className="border border-gray-300 px-3 py-2">운행 관리 및 안전 모니터링</td>
                  <td className="border border-gray-300 px-3 py-2">차량 GPS 좌표, 운행 상태</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제4조 (위치정보의 보유 및 파기)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>GPS 위치 데이터: 수집일로부터 <strong>180일간</strong> 보관 후 자동 파기</li>
              <li>위치정보 이용/제공 기록: <strong>6개월간</strong> 보관 후 파기 (위치정보법 제16조)</li>
              <li>동의 철회 시: 해당 이용자의 위치 데이터 <strong>즉시 파기</strong></li>
              <li>파기 방법: 전자적 파일은 복원 불가능한 방법으로 영구 삭제</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제5조 (이용자의 권리)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>이용자는 언제든지 위치정보 수집에 대한 동의를 철회할 수 있습니다.</li>
              <li>동의 철회 시 해당 이용자의 위치 데이터는 즉시 삭제됩니다.</li>
              <li>이용자는 위치정보의 이용 및 제공 현황을 열람할 수 있습니다.</li>
              <li>이용자는 위치정보의 이용 또는 제공에 대한 일시적 중지를 요청할 수 있습니다.</li>
              <li>동의 철회 및 일시 중지 요청은 앱 내 설정 또는 고객센터를 통해 가능합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제6조 (위치정보관리책임자)</h2>
            <p>회사는 위치정보의 관리 및 보호를 위해 다음과 같이 위치정보관리책임자를 지정합니다:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>직위: 개인정보보호 책임자 겸임</li>
              <li>이메일: privacy@safeway-kids.kr</li>
              <li>전화: 준비중</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제7조 (손해배상)</h2>
            <p>
              회사의 귀책사유로 이용자에게 손해가 발생한 경우, 회사는 이용자에게
              적정한 손해배상을 합니다. 다만, 회사의 고의 또는 과실이 없는 경우에는 그러하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제8조 (분쟁 해결)</h2>
            <p>
              위치정보와 관련된 분쟁은 개인정보분쟁조정위원회(www.kopico.go.kr, 1833-6972)에
              조정을 신청하거나, 회사 소재지의 관할법원에 소를 제기할 수 있습니다.
            </p>
          </section>

          <section className="bg-gray-50 rounded-xl p-6">
            <p className="text-gray-500">
              <strong>부칙</strong><br />
              이 약관은 2026년 3월 1일부터 시행합니다.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
