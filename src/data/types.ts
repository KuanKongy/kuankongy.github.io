import type { IconType } from "react-icons";

export type AccentKey = "violet" | "fuchsia" | "cyan" | "gold" | "green";

export type ProjectCategory = "academic" | "personal" | "hackathon";

export interface ProjectLink {
  label: string;
  url: string;
  kind: "github" | "live" | "npm";
}

export interface Project {
  /** Folder key under src/assets/projects/<slug>/ — media auto-discovers from it. */
  slug: string;
  title: string;
  category: ProjectCategory;
  featured?: boolean;
  /** 1–2 lines for the card. */
  blurb: string;
  /** Full story for the details modal. */
  description: string;
  tech: string[];
  links: ProjectLink[];
  /** YouTube demo — plays first in the modal when there is no local video. */
  youtubeId?: string;
}

export type ExperienceType = "teaching" | "club" | "open-source";

export interface ExperienceEntry {
  id: string;
  role: string;
  org: string;
  orgUrl?: string;
  /** Fallback for the logo bubble when no logo image exists. */
  orgInitials: string;
  logo?: string;
  type: ExperienceType;
  start: string;
  /** Undefined = Present. */
  end?: string;
  /** Overrides "start – end" when a single label reads better. */
  dateLabel?: string;
  bullets: string[];
  tech: string[];
  accent: AccentKey;
}

export interface SkillItem {
  name: string;
  icon: IconType;
  /** Brand hex — drives the pill's hover glow and icon tint. */
  brandColor: string;
}

export interface SkillCategory {
  id: string;
  label: string;
  icon: IconType;
  accent: AccentKey;
  items: SkillItem[];
}
