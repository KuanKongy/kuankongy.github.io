import { useGameStore } from "../../store/gameStore";

function TetrisIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="2" y="6" width="6" height="6" rx="1" fill="#e53935" />
      <rect x="8" y="6" width="6" height="6" rx="1" fill="#1e88e5" />
      <rect x="14" y="6" width="6" height="6" rx="1" fill="#ffca28" />
      <rect x="8" y="12" width="6" height="6" rx="1" fill="#43a047" />
    </svg>
  );
}

export default function HeroSection() {
  const setPhase = useGameStore((s) => s.setPhase);

  return (
    <section
      id="hero"
      className="relative flex min-h-[80vh] flex-col items-start justify-center"
    >
      <div className="frosted w-full max-w-[31rem] px-6 py-10 md:px-10">
        <p className="mb-2 font-arcade text-xs tracking-widest text-tetra-i/90">
          // PORTFOLIO · TRICKY TOWERS 3D
        </p>
        <h1 className="animated text-4xl font-black leading-tight md:text-5xl">
          <span className="mb-4 block text-white">Hey, I&apos;m </span>
          <span className="animated-info">
            <span className="animated-item">Nam Khanh</span>
            <span className="animated-item">a Developer</span>
            <span className="animated-item">a Student</span>
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-base text-white/80 md:text-lg">
          I build systems, solve problems, and stack blocks (literally).
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="play-btn"
            onClick={() => {
              setPhase("LOBBY_TRANSITION");
              console.info("[Phase] PORTFOLIO -> LOBBY_TRANSITION (deferred to next slice)");
            }}
          >
            <span>Play Tricky Towers</span>
            <TetrisIcon />
          </button>

          <a
            href="https://drive.google.com/file/d/14oTBXBsqk1k9xeKrHCXZTeOLP-AtxBF4/view?usp=sharing"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/30 px-6 py-3 font-semibold text-white/90 transition hover:border-white/60 hover:bg-white/5"
          >
            View Resume
          </a>
        </div>
      </div>
    </section>
  );
}
