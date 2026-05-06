import { useState } from "react";
import { Link } from "react-scroll";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import { PiMoonFill, PiSun } from "react-icons/pi";
import { useGameStore } from "../store/gameStore";

const navLinks = [
  { title: "About", path: "about", hover: "hover:text-tetra-z" },
  { title: "Languages", path: "languages", hover: "hover:text-tetra-s" },
  { title: "Experiences", path: "experiences", hover: "hover:text-tetra-l" },
  { title: "Projects", path: "projects", hover: "hover:text-tetra-t" },
  { title: "Contact", path: "contact", hover: "hover:text-tetra-j" },
];

interface LinkProps {
  path: string;
  title: string;
  hover: string;
  onClick?: () => void;
}

function NavLink({ path, title, hover, onClick }: LinkProps) {
  return (
    <Link
      to={path}
      spy={true}
      smooth={true}
      offset={-80}
      duration={400}
      onClick={onClick}
      className={`block cursor-pointer rounded-md px-4 py-2 text-base font-semibold text-white/85 transition hover:bg-white/10 ${hover}`}
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
      className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 hover:bg-white/10"
      aria-label="Toggle theme"
    >
      {isDark ? <PiSun size={22} /> : <PiMoonFill size={22} />}
    </button>
  );
}

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-30 frosted-soft border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          to="hero"
          smooth={true}
          duration={400}
          className="flex cursor-pointer items-center gap-2 font-arcade text-sm text-tetra-i"
        >
          <span className="inline-block h-3 w-3 rounded-sm bg-tetra-i" />
          <span className="inline-block h-3 w-3 rounded-sm bg-tetra-t" />
          <span className="inline-block h-3 w-3 rounded-sm bg-tetra-l" />
          <span className="ml-2 text-white">NAM·LE</span>
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
            className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
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
