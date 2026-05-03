import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-navy-deep text-white/70">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-navy to-aqua" />
              <span className="text-white font-semibold tracking-tight">
                LunenLabs
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/55">
              더 안전한 일상을 위한 소프트웨어 스튜디오
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">제품</h4>
            <ul className="space-y-2 text-sm">
              <li>PetTracker (출시 예정)</li>
              <li>SafeWay Kids (샌드박스)</li>
              <li>CareConnect (개발 중)</li>
              <li>SDET Code (운영 중)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">회사</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="hover:text-aqua transition-colors">
                  회사 소개
                </a>
              </li>
              <li>
                <a
                  href="mailto:jhryu115@gmail.com"
                  className="hover:text-aqua transition-colors"
                >
                  연락처: jhryu115@gmail.com
                </a>
              </li>
              <li className="text-white/45 text-xs">
                사업자등록 진행 중 (2026)
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">정책</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-aqua transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-aqua transition-colors">
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-7 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
          <div>© 2026 LunenLabs. All rights reserved.</div>
          <div>Made with care in Seoul, Korea.</div>
        </div>
      </div>
    </footer>
  );
}
