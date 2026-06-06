import TwInterestForm from "./TwInterestForm";

/**
 * CTA 섹션.
 * ⚠️ tripwire 레포는 비공개(법무 검토 전 보류). 라이브 GitHub 링크 절대 없음.
 * "곧 오픈소스 공개 예정" + 관심 등록(TwInterestForm)만.
 */
export default function TwCta() {
  return (
    <section
      id="tw-cta"
      className="relative py-20 sm:py-28 bg-ink overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(45% 40% at 50% 30%, rgba(0, 201, 176, 0.14) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-aqua/30 bg-aqua/10 text-aqua text-xs font-semibold mb-5 font-mono tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-aqua animate-pulse" />
            COMING SOON · OPEN SOURCE
          </div>
          <h2 className="text-white text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            곧 오픈소스로
            <br />
            공개할 예정입니다.
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            tripwire는 아직 공개 준비 중이에요. 공개되는 순간 가장 먼저 알려드릴게요.
          </p>
        </div>

        <TwInterestForm />

        <p className="mt-8 text-center text-white/35 text-xs leading-relaxed">
          공개 레포 링크는 준비가 끝나는 대로 이 페이지에 안내드릴 예정입니다.
          그때까지는 위 알림 등록으로 소식을 받아보실 수 있어요.
        </p>
      </div>
    </section>
  );
}
