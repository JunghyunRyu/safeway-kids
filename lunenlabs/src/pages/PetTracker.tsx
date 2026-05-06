import { useEffect } from "react";
import PtHeader from "../components/pt/PtHeader";
import PtHero from "../components/pt/PtHero";
import PtHolisticCare from "../components/pt/PtHolisticCare";
import PtAiAxes from "../components/pt/PtAiAxes";
import PtHowItWorks from "../components/pt/PtHowItWorks";
import PtWhy from "../components/pt/PtWhy";
import PtSignupForm from "../components/pt/PtSignupForm";
import PtFaq from "../components/pt/PtFaq";
import Footer from "../components/Footer";

export default function PetTracker() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "PetTracker — 반려동물 일상 전반을 함께 돌보는 동반자";

    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? "";
    if (meta) {
      meta.setAttribute(
        "content",
        "PetTracker는 반려동물의 산책 · 사고 대응 · 컨디션 변화 · 추억 기록까지 일상 전반을 함께 챙겨드리는 종합 케어 동반자입니다. 2026년 6월 V1.0 출시 예정."
      );
    }

    return () => {
      document.title = prevTitle;
      if (meta && prevDesc) meta.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <>
      <PtHeader />
      <main>
        <PtHero />
        <PtHolisticCare />
        <PtAiAxes />
        <PtHowItWorks />
        <PtWhy />

        <section
          id="pt-signup"
          className="relative py-14 sm:py-20 bg-gradient-to-b from-pt-cream via-white to-pt-orange-light overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-60 pointer-events-none"
            aria-hidden
            style={{
              background:
                "radial-gradient(45% 35% at 50% 45%, rgba(244, 162, 45, 0.14) 0%, transparent 70%), radial-gradient(40% 30% at 50% 70%, rgba(45, 158, 107, 0.10) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pt-orange/30 bg-white text-pt-orange-dark text-xs font-semibold mb-5">
                Beta Pre-signup
              </div>
              <h2 className="font-pt-heading text-pt-ink text-4xl sm:text-5xl font-bold mb-5 leading-tight">
                지금 신청하시면
                <br />
                <span className="text-pt-orange-dark">첫 3개월 완전 무료입니다.</span>
              </h2>
              <p className="text-pt-ink-soft text-lg leading-relaxed">
                2026년 6월 V1.0이 출시되면 가장 먼저 안내드립니다.
                <br />약 1분이면 신청이 끝나요.
              </p>
            </div>
            <PtSignupForm />
          </div>
        </section>

        <PtFaq />
      </main>
      <Footer />
    </>
  );
}
