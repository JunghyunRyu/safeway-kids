import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const FeatureIcons = {
  location: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ai: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  bell: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  calendar: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  money: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  shield: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

const FEATURES = [
  {
    icon: FeatureIcons.location,
    title: "실시간 위치 추적",
    desc: "GPS 기반으로 셔틀버스 위치를 실시간 확인. 아이가 탑승하는 순간부터 하차까지, 부모님 스마트폰으로 안심하세요.",
  },
  {
    icon: FeatureIcons.ai,
    title: "AI 최적 경로",
    desc: "AI가 교통 상황과 정류장을 분석해 가장 빠르고 안전한 경로를 자동 생성합니다. 운행 시간을 단축합니다.",
  },
  {
    icon: FeatureIcons.bell,
    title: "실시간 알림",
    desc: "탑승·하차·도착 예정 알림을 즉시 받아보세요. 아이의 상태 변화를 놓치지 않습니다.",
  },
  {
    icon: FeatureIcons.calendar,
    title: "스케줄 관리",
    desc: "주간 스케줄 등록, 원터치 결석 처리, 학원별 시간표 연동까지. 복잡한 통학 일정을 한 눈에.",
  },
  {
    icon: FeatureIcons.money,
    title: "투명한 요금제",
    desc: "거리·이용 횟수 기반 합리적 요금 산정. 자동 청구서 발행으로 정산 고민 없이.",
  },
  {
    icon: FeatureIcons.shield,
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
      "셔틀버스 운영비 절감 효과",
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
    desc: "AI 영상분석으로 차량 내 위험 상황을 실시간 감지하여 알릴 예정입니다.",
    comingSoon: true,
  },
  {
    icon: "👤",
    title: "안면인식 탑승 확인",
    desc: "등록된 아이만 탑승할 수 있도록 안면인식으로 본인 확인할 예정입니다.",
    comingSoon: true,
  },
  {
    icon: "🚨",
    title: "사각지대 안전 감시",
    desc: "차량 주변 사각지대를 AI가 감시하여 아이 안전사고를 예방할 예정입니다.",
    comingSoon: true,
  },
  {
    icon: "🔍",
    title: "하차 후 잔류 아동 감지",
    desc: "모든 아이가 하차했는지 AI가 확인하여 차량 내 잔류 아동 사고를 예방할 예정입니다.",
    comingSoon: true,
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

          {/* App Mockup Placeholder */}
          <div className="mt-12 flex justify-center">
            <div className="relative w-64 h-[480px] bg-gray-900 rounded-[3rem] border-4 border-gray-800 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
              <div className="w-full h-full bg-gradient-to-b from-primary-light to-white flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
                  <span className="text-white font-bold text-lg">SK</span>
                </div>
                <p className="text-sm font-bold text-gray-800 mb-1">SAFEWAY KIDS</p>
                <p className="text-xs text-gray-500 mb-4">실시간 위치 추적 중</p>
                <div className="w-full h-32 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div className="w-full space-y-2">
                  <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: "효율적", label: "운영비 절감" },
              { value: "실시간", label: "위치 추적" },
              { value: "24/7", label: "안전 모니터링" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</div>
                <div className="text-xs md:text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            현재 베타 서비스 운영 중입니다
          </p>
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
                <div className="text-primary mb-5 group-hover:scale-110 transition-transform">{f.icon}</div>
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
              Safety AI 로드맵
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              하드웨어 파트너십 확정 후 순차 적용 예정입니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SAFETY_FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold">{f.title}</h3>
                  {f.comingSoon && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full font-medium">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">요금 안내</h2>
            <p className="text-gray-500 text-lg">합리적인 건별 과금제로 부담 없이 이용하세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-primary/30 transition-colors">
              <h3 className="text-lg font-bold mb-2">기본 요금제</h3>
              <div className="text-3xl font-extrabold text-primary mb-1">5,000원</div>
              <p className="text-sm text-gray-500 mb-6">1회 탑승당</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 실시간 위치 추적</li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 탑승/하차 알림</li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 스케줄 관리</li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 월 15만원 상한</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-primary shadow-lg shadow-primary/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                추천
              </div>
              <h3 className="text-lg font-bold mb-2">프리미엄 요금제</h3>
              <div className="text-3xl font-extrabold text-primary mb-1">7,000원</div>
              <p className="text-sm text-gray-500 mb-6">1회 탑승당</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 기본 요금제 전체 포함</li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 안전도우미 동승</li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 학원 도착 확인 알림</li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 월 20만원 상한</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-primary/30 transition-colors">
              <h3 className="text-lg font-bold mb-2">학원 도입 요금</h3>
              <div className="text-3xl font-extrabold text-primary mb-1">별도 협의</div>
              <p className="text-sm text-gray-500 mb-6">학원 규모별 맞춤</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 관리자 대시보드</li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 차량/기사 관리</li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 자동 청구서 발행</li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span> 전담 CS 지원</li>
              </ul>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            * 요금은 베타 서비스 기준이며, 정식 출시 시 변경될 수 있습니다
          </p>
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
