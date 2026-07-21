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
      <div className="flex flex-col gap-4 border-l-2 border-accent-violet/30 pl-4 md:pl-8">
        {experience.map((e, i) => (
          <Reveal key={e.id} delay={i * 80}>
            <ExperienceRow entry={e} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
