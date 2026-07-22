import type { ExperienceEntry } from "./types";
import ubcLogo from "../assets/logos/ubc.webp";
import ubcpssLogo from "../assets/logos/ubcpss.webp";
import feathersLogo from "../assets/logos/feathersjs.webp";

/** Render order = array order (most recent first). */
export const experience: ExperienceEntry[] = [
  {
    id: "ubcpss",
    role: "Software Developer & Designer",
    org: "UBC Project STEM Search (UBCPSS)",
    orgUrl: "https://www.ubcpss.ca",
    orgInitials: "PSS",
    logo: ubcpssLogo,
    type: "club",
    start: "Jan 2026",
    bullets: [
      "Designed and built the club's official website (ubcpss.ca) from scratch — design system, responsive layout, and animations included.",
      "Collaborated directly with the club president and representatives to gather requirements and iterate on the design.",
      "Own ongoing development of the site as the club's software developer.",
    ],
    tech: ["TypeScript", "React", "Vite", "Tailwind CSS", "Framer Motion"],
    accent: "violet",
  },
  {
    id: "feathersjs",
    role: "Open-Source Contributor",
    org: "FeathersJS — FeathersMCP",
    orgUrl: "https://feathersjs.com",
    orgInitials: "F",
    logo: feathersLogo,
    type: "open-source",
    start: "Jan 2026",
    end: "April 2026",
    bullets: [
      "Contributed to FeathersMCP, an MCP server that brings FeathersJS v6 documentation into AI assistants — published on npm as feathersjs-mcp.",
      "Worked in a team of five alongside the project maintainers through pull requests and code reviews.",
      "Helped ship live access to 47 documentation pages with source-linked citations and full-text search.",
    ],
    tech: ["TypeScript", "Node.js", "MCP", "SQLite", "Cloudflare"],
    accent: "gold",
  },
  {
    id: "ubc-ta",
    role: "Undergraduate Teaching Assistant",
    org: "UBC Computer Science",
    orgUrl: "https://www.cs.ubc.ca",
    orgInitials: "UBC",
    logo: ubcLogo,
    type: "teaching",
    start: "Sep 2024",
    end: "Dec 2025",
    bullets: [
      "Led weekly lab sessions with a team of 3 TAs, helping 30 students per week grasp foundational programming concepts in Racket — part of a 40-person teaching team supporting 1,300+ students.",
      "Coordinated the live class chat during online lectures and ran iClicker activities with the professor to keep interactive sessions running smoothly.",
      "Hosted office hours and answered questions on Piazza to build an inclusive, responsive learning environment.",
    ],
    tech: ["Racket", "Piazza", "iClicker"],
    accent: "cyan",
  },
];
