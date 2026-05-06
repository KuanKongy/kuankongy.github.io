interface Experience {
  place: string;
  titleData: string;
  description: string;
  pointF: string;
  pointS: string;
  pointT: string;
  result: string;
  color: string;
}

const experienceInfo: Experience[] = [
  {
    place: "UBC Computer Science",
    titleData: "Undergraduate Teaching Assistant, Sep 2024 – Dec 2025",
    description:
      "Had the incredible opportunity to contribute to UBC's Computer Science department as an undergraduate teaching assistant for a 1st-year introductory course, where I worked with a team of 40 teaching staff to support the learning of over 1,300 students.",
    pointF:
      "Collaborated with a team of 3 teaching assistants to prepare and lead engaging lab sessions, helping 30 students each week grasp foundational programming concepts through practical exercises in Racket.",
    pointS:
      "Worked closely with the professor, coordinating the live class chat in online lectures to address student questions in real-time and assisting with iClicker activities to ensure smooth interactive learning sessions.",
    pointT:
      "Supported students' academic success by hosting formal office hours after classes and actively answering questions on Piazza, creating an inclusive and responsive learning environment.",
    result:
      "This experience not only deepened my understanding of key computer science concepts but also honed my communication, collaboration, and mentorship skills. Grateful to have been part of a vibrant teaching community and to contribute to the success of so many students.",
    color: "text-tetra-j",
  },
];

function ExperienceCard(props: Experience) {
  return (
    <div className="frosted-soft mx-auto w-full max-w-4xl px-6 py-6 md:px-8">
      <h3 className={`text-2xl font-semibold ${props.color}`}>{props.place}</h3>
      <p className="mt-2 text-lg font-semibold text-white/90">{props.titleData}</p>
      <p className="mt-3 text-base text-white/80">{props.description}</p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-white/80">
        <li>{props.pointF}</li>
        <li>{props.pointS}</li>
        <li>{props.pointT}</li>
      </ul>
      <p className="mt-4 text-base text-white/75">{props.result}</p>
    </div>
  );
}

export default function ExperiencesSection() {
  return (
    <section id="experiences" className="scroll-mt-24">
      <div className="frosted px-4 py-10 md:px-8">
        <h2 className="mb-8 text-center text-3xl font-bold text-tetra-l md:text-4xl">
          Experiences
        </h2>
        <div className="grid grid-cols-1 gap-6">
          {experienceInfo.map((info, i) => (
            <ExperienceCard key={i} {...info} />
          ))}
        </div>
      </div>
    </section>
  );
}
