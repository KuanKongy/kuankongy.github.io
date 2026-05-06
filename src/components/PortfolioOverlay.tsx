import { useEffect } from "react";
import HeroSection from "./sections/HeroSection";
import AboutSection from "./sections/AboutSection";
import LanguagesSection from "./sections/LanguagesSection";
import ExperiencesSection from "./sections/ExperiencesSection";
import ProjectsSection from "./sections/ProjectsSection";
import ContactSection from "./sections/ContactSection";
import Footer from "./sections/Footer";
import { useGameStore } from "../store/gameStore";

export default function PortfolioOverlay() {
  const phase = useGameStore((s) => s.phase);
  const visible = phase === "PORTFOLIO";

  // Single source of truth for body scroll: we lock it whenever the portfolio
  // is NOT visible (game/overlay phases) and unlock it whenever we're back on
  // the portfolio. Always restore on cleanup so returning to the portfolio
  // always re-enables scrolling.
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "";
      return () => {};
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  return (
    <main
      className={`relative z-10 min-h-screen w-full transition-opacity duration-700 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-24 md:px-8 lg:px-12">
        <HeroSection />
        <AboutSection />
        <LanguagesSection />
        <ExperiencesSection />
        <ProjectsSection />
        <ContactSection />
      </div>
      {visible && <Footer />}
    </main>
  );
}
