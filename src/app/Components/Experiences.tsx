import React from "react";
import Experience from "./Experience";

const experienceInfo = [
  {
    place: "UBC Computer Science 📚",
    titleData: "Undergraduate Teaching Assistant, Sep 2024 - April 2025",
    description: "Had the incredible opportunity to contribute to UBC's Computer Science department as an undergraduate teaching assistant for a 1st-year introductory course, where I worked with a team of 40 teaching staff to support the learning of over 1,300 students.",
    pointF: "Collaborated with a team of 3 teaching assistants to prepare and lead engaging lab sessions, helping 30 students each week grasp foundational programming concepts through practical exercises in Racket.",
    pointS: "Worked closely with the professor, coordinating the live class chat in online lectures to address student questions in real-time and assisting with iClicker activities to ensure smooth interactive learning sessions",
    pointT: "Supported students’ academic success by hosting formal office hours after classes and actively answering questions on Piazza, creating an inclusive and responsive learning environment.",
    result: "This experience not only deepened my understanding of key computer science concepts but also honed my communication, collaboration, and mentorship skills. Grateful to have been part of a vibrant teaching community and to contribute to the success of so many students.",
    color: "text-blue-600",
  },
];

export default function MyExperiences() {
  return (
    <section className="pb-8 mb-20" id="experiences">
      <h2 className="mt-10 mb-28 text-center text-4xl text-orange-500">Experiences</h2>
      <div className="grid grid-cols-1 gap-4 lg:justify-items-center ">
        {experienceInfo.map((info, index) => (
          <Experience
            key={index}
            place={info.place}
            titleData={info.titleData}
            description={info.description}
            pointF={info.pointF}
            pointS={info.pointS}
            pointT={info.pointT}
            result={info.result}
            color={info.color}
          />
        ))}
      </div>
    </section>
  );
};
