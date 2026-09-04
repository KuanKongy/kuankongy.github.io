import { useState } from "react";
import { Link } from "react-scroll";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import { PiMoonFill, PiSun } from "react-icons/pi";
import { useGameStore } from "../store/gameStore";
import SparkleStar from "./ui/SparkleStar";

const navLinks = [
  { title: "About", path: "about" },
  { title: "Projects", path: "projects" },
  { title: "Experience", path: "experience" },
  { title: "Skills", path: "skills" },
  { title: "Contact", path: "contact" },
];

interface LinkProps {
  path: string;
  title: string;
  onClick?: () => void;
}

function NavLink({ path, title, onClick }: LinkProps) {
  return (
    <Link
      to={path}
      spy={true}
      smooth={true}
      offset={-80}
      duration={400}
      onClick={onClick}
      className="hover-lift flex min-h-[44px] cursor-pointer items-center rounded-md px-4 font-mono text-xs font-medium uppercase tracking-widest text-ink/75 hover:text-[color:var(--accent-strong)]"
    >
      {title}
    </Link>
  );
}

function ThemeSwitcher() {
  const isDark = useGameStore((s) => s.isDark);
  const toggle = useGameStore((s) => s.toggleDark);
  return (
    <button
      type="button"
      onClick={toggle}
      className="hover-lift flex h-11 w-11 items-center justify-center rounded-md text-ink/80 hover:text-[color:var(--accent-strong)]"
      aria-label="Toggle theme"
    >
      {isDark ? <PiSun size={22} /> : <PiMoonFill size={22} />}
    </button>
  );
}

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="frosted-soft fixed inset-x-0 top-0 z-30 rounded-none border-x-0 border-t-0 border-b border-[color:var(--glass-border-soft)]">
      <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between px-5 py-2 md:px-10">
        <Link
          to="hero"
          smooth={true}
          duration={400}
          className="flex min-h-[44px] cursor-pointer items-center gap-2.5"
        >
          <SparkleStar
            size={38}
            color="gold"
            variant="emblemStarShortDiamondCore"
          />
          <span className="font-display text-lg font-bold">
            <span className="grad-text">Nam</span>{" "}
            <span className="text-ink">Le</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <NavLink key={l.path} {...l} />
          ))}
          <ThemeSwitcher />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeSwitcher />
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-md text-ink/80 hover:text-[color:var(--accent-strong)]"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <ul className="flex flex-col items-center gap-1 pb-4 md:hidden">
          {navLinks.map((l) => (
            <li key={l.path}>
              <NavLink {...l} onClick={() => setOpen(false)} />
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
