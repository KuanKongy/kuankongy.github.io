import { useEffect } from "react";
import HeroSection from "./sections/HeroSection";
import AboutSection from "./sections/AboutSection";
import SkillsSection from "./sections/SkillsSection";
import ExperienceSection from "./sections/ExperienceSection";
import ProjectsSection from "./sections/ProjectsSection";
import ContactSection from "./sections/ContactSection";
import Footer from "./sections/Footer";
import { useGameStore } from "../store/gameStore";
import { lockBodyScroll } from "../lib/scrollLock";
import { useSceneDirector } from "../hooks/useSceneDirector";

export default function PortfolioOverlay() {
  const phase = useGameStore((s) => s.phase);
  const visible = phase === "PORTFOLIO";

  useSceneDirector();

  // Body scroll is locked whenever the portfolio is NOT visible (game/overlay
  // phases). The refcounted lock composes with the project modal's lock.
  useEffect(() => {
    if (visible) return;
    return lockBodyScroll();
  }, [visible]);

  return (
    <main
      className={`relative z-10 min-h-screen w-full transition-opacity duration-700 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-24 px-5 pb-20 pt-24 md:gap-32 md:px-10 lg:px-14">
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <ExperienceSection />
        <SkillsSection />
        <ContactSection />
      </div>
      {visible && <Footer />}
    </main>
  );
}
