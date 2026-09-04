import { FaRegFileAlt } from "react-icons/fa";
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
      className="relative flex min-h-[calc(100svh-8rem)] flex-col items-start justify-center"
    >
      {/* Small glass intro card on the left — the castle stays visible. */}
      <div className="frosted w-full max-w-[34rem] px-6 py-10 md:px-10">
        <p className="mb-3 font-arcade text-[10px] tracking-widest text-[color:var(--accent-strong)] md:text-xs">
          // PORTFOLIO
        </p>
        <h1 className="font-display leading-tight">
          <span className="block text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Hey, I&apos;m
          </span>
          <span className="grad-text block pb-1 text-4xl font-extrabold tracking-tight md:text-5xl">
            Nam Khanh
          </span>
        </h1>
        <p className="animated mt-2 font-mono text-lg text-ink/90 md:text-xl">
          <span className="animated-info">
            <span className="animated-item">a Full-Stack Developer</span>
            <span className="animated-item">a CS Student @ UBC</span>
            <span className="animated-item">a DevOps Engineer</span>
          </span>
        </p>
        <p className="mt-5 max-w-2xl text-base text-ink/80 md:text-lg">
          I build systems, solve problems, and stack blocks (literally).
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="play-btn"
            onClick={() => setPhase("LOBBY_TRANSITION")}
          >
            <span className="font-arcade text-[11px]">PLAY</span>
            <span>Tricky Towers</span>
            <TetrisIcon />
          </button>

          <a
            href="https://drive.google.com/file/d/14oTBXBsqk1k9xeKrHCXZTeOLP-AtxBF4/view?usp=sharing"
            target="_blank"
            rel="noreferrer"
            className="hover-lift group relative inline-flex rounded-full bg-gradient-to-r from-accent-violet to-accent-fuchsia p-[2px] shadow-[0_0_16px_rgba(167,139,250,0.25)] hover:shadow-[0_0_26px_rgba(217,70,239,0.5)]"
          >
            <span className="flex items-center gap-2 rounded-full bg-[color:var(--page-bg)] px-6 py-2.5 font-mono text-sm font-semibold text-ink transition duration-200 group-hover:bg-transparent group-hover:text-white">
              <FaRegFileAlt size={15} aria-hidden />
              View Resume
            </span>
          </a>
        </div>
      </div>

      {/* On short viewports (small phones) the pinned indicator lands on the
          hero card, so it flows below the card instead; taller screens keep
          it pinned to the section bottom. */}
      <div
        aria-hidden
        className="pointer-events-none mt-10 flex flex-col items-center gap-1.5 self-center text-ink/60 [@media(min-height:750px)]:absolute [@media(min-height:750px)]:bottom-4 [@media(min-height:750px)]:left-1/2 [@media(min-height:750px)]:mt-0 [@media(min-height:750px)]:-translate-x-1/2 [@media(min-height:750px)]:self-auto"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.35em]">
          scroll
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="animate-bounce-slow"
        >
          <path
            d="M3 6l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
