import type { ProjectCategory } from "../data/types";
import type { TagAccent } from "../components/ui/Tag";

/**
 * Lives outside the component files so Vite Fast Refresh works — component
 * modules must only export components.
 */
export const CATEGORY_META: Record<
  ProjectCategory,
  { label: string; accent: TagAccent }
> = {
  academic: { label: "Academic", accent: "cyan" },
  personal: { label: "Personal", accent: "violet" },
  hackathon: { label: "Hackathon", accent: "gold" },
};
