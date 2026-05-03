import Header from "../components/Header";
import Hero from "../components/Hero";
import AboutLunenLabs from "../components/AboutLunenLabs";
import ProductLineup from "../components/ProductLineup";
import PTSpotlight from "../components/PTSpotlight";
import SignupForm from "../components/SignupForm";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <AboutLunenLabs />
        <ProductLineup />
        <PTSpotlight />

        <section
          id="signup"
          className="py-24 sm:py-32 bg-gradient-to-b from-cream to-white"
        >
          <div className="max-w-2xl mx-auto px-5 sm:px-8">
            <div className="text-center mb-10">
              <div className="text-aqua-dark text-sm font-semibold tracking-wider uppercase mb-3">
                Beta Pre-signup
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-navy mb-5 leading-tight">
                지금 신청하면
                <br />
                첫 3개월 완전 무료
              </h2>
              <p className="text-mist text-lg leading-relaxed">
                2026년 6월 V1.0 출시 시 가장 먼저 안내드립니다.
                <br />
                약 1분이면 신청이 완료됩니다.
              </p>
            </div>
            <SignupForm />
          </div>
        </section>

        <FAQ />
      </main>
      <Footer />
    </>
  );
}
