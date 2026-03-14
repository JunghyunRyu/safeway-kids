import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl mb-4">
              <span className="text-2xl">🛡️</span>
              SAFEWAY KIDS
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              AI 기반 어린이 학원 셔틀버스 공유 플랫폼.<br />
              아이들의 안전한 통학길을 만듭니다.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-gray-300">서비스</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">주요 기능</a></li>
              <li><a href="#for-whom" className="hover:text-white transition-colors">이용 대상</a></li>
              <li><a href="#safety" className="hover:text-white transition-colors">안전 기술</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">도입 문의</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-gray-300">법적 고지</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">이용약관</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; 2026 SAFEWAY KIDS. All rights reserved.</p>
          <p>사업자등록번호: 준비중 | 대표: 준비중</p>
        </div>
      </div>
    </footer>
  );
}
