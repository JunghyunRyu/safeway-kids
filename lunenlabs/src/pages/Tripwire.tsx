import { useEffect } from "react";
import TwHeader from "../components/tw/TwHeader";
import TwHero from "../components/tw/TwHero";
import TwProblem from "../components/tw/TwProblem";
import TwRealCase from "../components/tw/TwRealCase";
import TwHowItWorks from "../components/tw/TwHowItWorks";
import TwHonest from "../components/tw/TwHonest";
import TwCta from "../components/tw/TwCta";
import Footer from "../components/Footer";

export default function Tripwire() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "tripwire — AI 변경의 회귀 방화벽";

    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? "";
    if (meta) {
      meta.setAttribute(
        "content",
        "tripwire는 AI가 코드를 고칠 때 조용히 함께 움직이는 동작들(blast radius)을 즉시 보여주고, 승인한 경계를 넘는 변경을 막는 회귀 방화벽입니다. 테스트는 초록불이어도 동작 변화는 잡아냅니다. by LunenLabs."
      );
    }

    return () => {
      document.title = prevTitle;
      if (meta && prevDesc) meta.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <>
      <TwHeader />
      <main>
        <TwHero />
        <TwProblem />
        <TwRealCase />
        <TwHowItWorks />
        <TwHonest />
        <TwCta />
      </main>
      <Footer />
    </>
  );
}
