import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const FEATURES = [
  {
    icon: "📍",
    title: "실시간 위치 추적",
    desc: "GPS 기반으로 셔틀버스 위치를 실시간 확인. 아이가 탑승하는 순간부터 하차까지, 부모님 스마트폰으로 안심하세요.",
  },
  {
    icon: "🤖",
    title: "AI 최적 경로",
    desc: "AI가 교통 상황과 정류장을 분석해 가장 빠르고 안전한 경로를 자동 생성합니다. 운행 시간 최대 30% 단축.",
  },
  {
    icon: "🔔",
    title: "실시간 알림",
    desc: "탑승·하차·도착 예정 알림을 즉시 받아보세요. 아이의 상태 변화를 놓치지 않습니다.",
  },
  {
    icon: "📋",
    title: "스케줄 관리",
    desc: "주간 스케줄 등록, 원터치 결석 처리, 학원별 시간표 연동까지. 복잡한 통학 일정을 한 눈에.",
  },
  {
    icon: "💰",
    title: "투명한 요금제",
    desc: "거리·이용 횟수 기반 합리적 요금 산정. 자동 청구서 발행으로 정산 고민 없이.",
  },
  {
    icon: "👥",
    title: "안전도우미 동승",
    desc: "전문 안전도우미가 차량에 동승하여 아이들을 관리합니다. 자격 검증된 인력만 배치.",
  },
];

const TARGETS = [
  {
    emoji: "👨‍👩‍👧",
    title: "학부모",
    color: "bg-blue-50 border-blue-200",
    accent: "text-primary",
    points: [
      "스마트폰으로 실시간 위치 확인",
      "탑승·하차 즉시 알림 수신",
      "원터치 스케줄 관리 및 결석 처리",
      "투명한 청구서 확인",
    ],
  },
  {
    emoji: "🏫",
    title: "학원",
    color: "bg-green-50 border-green-200",
    accent: "text-accent",
    points: [
      "셔틀버스 운영비 최대 30% 절감",
      "차량·기사 관리 부담 제거",
      "학원 경쟁력 향상 (셔틀 서비스 유지)",
      "관리자 대시보드로 운영 현황 파악",
    ],
  },
  {
    emoji: "🚐",
    title: "기사·안전도우미",
    color: "bg-orange-50 border-orange-200",
    accent: "text-warning",
    points: [
      "AI 최적 경로로 효율적 운행",
      "정규직 전환 기회 (플랫폼 직접 고용)",
      "체계적 안전 교육 제공",
      "공정한 보수 체계",
    ],
  },
];

const SAFETY_FEATURES = [
  {
    icon: "🎥",
    title: "차내 이상행동 감지",
    desc: "AI 영상분석으로 차량 내 위험 상황을 실시간 감지하고 즉시 알립니다.",
  },
  {
    icon: "👤",
    title: "안면인식 탑승 확인",
    desc: "등록된 아이만 탑승할 수 있도록 안면인식으로 본인 확인합니다.",
  },
  {
    icon: "🚨",
    title: "사각지대 안전 감시",
    desc: "차량 주변 사각지대를 AI가 감시하여 아이 안전사고를 예방합니다.",
  },
  {
    icon: "🔍",
    title: "하차 후 잔류 아동 감지",
    desc: "모든 아이가 하차했는지 AI가 확인. 차량 내 잔류 아동 사고를 원천 차단합니다.",
  },
];

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function Landing() {
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [formError, setFormError] = useState('');

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-white to-green-50 -z-10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 text-sm font-medium text-primary border border-primary/20 mb-8">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            AI 기반 어린이 통학 안전 플랫폼
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            아이들의
            <span className="text-primary"> 안전한 통학길</span>을<br />
            만듭니다
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            실시간 위치 추적, AI 최적 경로, 전문 안전도우미 동승까지.<br className="hidden md:block" />
            학원 셔틀버스를 공유하는 새로운 방식으로<br className="hidden md:block" />
            부모님의 걱정을 덜어드립니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-2xl transition shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              도입 문의하기
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl transition border border-gray-200 hover:-translate-y-0.5"
            >
              더 알아보기 ↓
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: "30%", label: "운영비 절감" },
              { value: "실시간", label: "위치 추적" },
              { value: "24/7", label: "안전 모니터링" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</div>
                <div className="text-xs md:text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              왜 <span className="text-primary">SAFEWAY KIDS</span>인가요?
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              기술과 사람이 함께 만드는, 어린이 통학의 새로운 기준
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-100"
              >
                <div className="text-4xl mb-5 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-lg font-bold mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">이용 방법</h2>
            <p className="text-gray-500 text-lg">간단한 4단계로 시작하세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "앱 설치", desc: "App Store 또는 Google Play에서 SAFEWAY KIDS 앱을 다운로드하세요." },
              { step: "02", title: "자녀 등록", desc: "자녀 정보와 이용할 학원을 등록합니다." },
              { step: "03", title: "스케줄 설정", desc: "요일별 등·하원 스케줄을 설정합니다." },
              { step: "04", title: "안심 통학", desc: "실시간 추적과 알림으로 안심하고 통학을 맡기세요." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary text-white flex items-center justify-center font-extrabold text-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target audience */}
      <section id="for-whom" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">누구를 위한 서비스인가요?</h2>
            <p className="text-gray-500 text-lg">모든 이해관계자에게 가치를 제공합니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TARGETS.map((t) => (
              <div key={t.title} className={`p-8 rounded-2xl border-2 ${t.color}`}>
                <div className="text-5xl mb-4">{t.emoji}</div>
                <h3 className={`text-xl font-bold mb-5 ${t.accent}`}>{t.title}</h3>
                <ul className="space-y-3">
                  {t.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="mt-0.5 text-accent">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety AI */}
      <section id="safety" className="py-20 md:py-28 bg-gradient-to-b from-dark to-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm font-medium text-primary-light mb-6">
              Edge AI Technology
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              AI가 지키는 아이들의 안전
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              차량 내 엣지 컴퓨팅 기반 AI가 실시간으로 안전을 감시합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SAFETY_FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            도입 문의
          </h2>
          <p className="text-gray-500 text-lg mb-12">
            SAFEWAY KIDS 서비스 도입에 관심이 있으시면 연락주세요
          </p>

          {formStatus === 'success' && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
              문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.
            </div>
          )}
          {formStatus === 'error' && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
              {formError || '문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.'}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setFormStatus('loading');
              setFormError('');
              const fd = new FormData(e.currentTarget);
              try {
                const res = await fetch('/api/v1/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: fd.get('name'),
                    phone: (fd.get('phone') as string).replace(/-/g, ''),
                    inquiry_type: fd.get('type'),
                    message: fd.get('message'),
                  }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  throw new Error(data.detail || '문의 접수에 실패했습니다');
                }
                setFormStatus('success');
                (e.target as HTMLFormElement).reset();
              } catch (err) {
                setFormStatus('error');
                setFormError(err instanceof Error ? err.message : '문의 접수에 실패했습니다');
              }
            }}
            className="text-left space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="홍길동…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">연락처</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="010-1234-5678…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">구분</label>
              <select
                id="type"
                name="type"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white"
              >
                <option value="">선택해주세요</option>
                <option value="academy">학원 도입 문의</option>
                <option value="parent">학부모 이용 문의</option>
                <option value="driver">기사 지원 문의</option>
                <option value="escort">안전도우미 지원 문의</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">문의 내용</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                placeholder="문의하실 내용을 입력해주세요…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="text-center pt-4">
              <button
                type="submit"
                disabled={formStatus === 'loading'}
                className="px-10 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-2xl transition shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formStatus === 'loading' ? '접수 중...' : '문의 접수하기'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
