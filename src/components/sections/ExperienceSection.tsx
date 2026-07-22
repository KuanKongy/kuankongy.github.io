import { experience } from "../../data/experience";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import ExperienceRow from "../ExperienceRow";

export default function ExperienceSection() {
  return (
    <section id="experience" className="scroll-mt-24">
      {/* Legacy anchor — old /#experiences links still land here. */}
      <span id="experiences" aria-hidden />
      <SectionHeading kicker="// where I've worked" title="Experience" />
      <div className="relative flex flex-col gap-6">
        {/* Timeline spine — bubbles (at left-6 centers) sit on this line. */}
        <span
          aria-hidden
          className="absolute bottom-8 left-6 top-8 w-[3px] -translate-x-1/2 rounded-full bg-accent-violetDeep dark:bg-accent-violet"
        />
        {experience.map((e, i) => (
          <Reveal key={e.id} delay={i * 80}>
            <ExperienceRow entry={e} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
