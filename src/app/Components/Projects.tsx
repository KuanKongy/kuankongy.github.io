import React from "react";
import Project from "./Project";
import { TetrisDemo, BankDemo } from "./images";

const projectInfo = [
  {
    title: "Multiplayer Tetris",
    stack: "Typescript, React, Node.js, Socket.io, Express.js, Firebase, Heroku Javascript, HTML, CSS, Styled Components",
    description: "A multiplayer version of Tetris built using Node.js, Socket.io, and Express.js for client-server communication to manage game sessions and real-time interactions, paired with Firebase Firestore for the game's data persistence. Developed a dynamic, intuitive user interface with React, TypeScript, and Styled Components, ensuring a seamless gaming experience. Deployed on Heroku and Github pages.",
    photo: TetrisDemo,
    repo: "https://github.com/KuanKongy/Multiplayer-Tetris.git",
    color: "text-purple-600",
    hover: "hover:text-purple-600",
    empty: false
  },
  {
    title: "Bank Management App",
    stack: "Java, JUnit, Swing",
    description: "A desktop application written in Java for managing banking operations, showcasing advanced programming concepts like object-oriented design, robust testing, data persistence, and event logging. Utilised Swing for building a graphical user-friendly interface and incorporated JUnit for data testing to ensure application reliability.",
    photo: BankDemo,
    repo: "https://github.com/KuanKongy/Bank-Management-App.git",
    color: "text-green-600",
    hover: "hover:text-green-600",
    empty: false
  },
  {
    title: "Skribbl.io (unpublished)",
    stack: "Typescript, React, Node.js, Socket.io, Express.js, AWS, Javascript, HTML, CSS",
    description:
      "A multiplayer drawing and guessing game clone of 'Skribbl.io.' Developed using React and TypeScript for a responsive and dynamic front-end. Integrated Socket.io for real-time communication between players and Node.js with Express.js for the server-side logic. The application supports multiplayer lobbies, word generation, and live score tracking, offering an engaging and competitive user experience. Deployed on AWS.",
    photo: TetrisDemo,
    repo: "https://github.com/KuanKongy",
    color: "text-blue-600",
    hover: "hover:text-blue-600",
    empty: true
  },
  {
    title: "Under Construction...",
    stack: "Coming Soon!",
    description: "Stay tuned for my upcoming projects! Currently learning databases and making a capstone project.",
    photo: TetrisDemo,
    repo: "https://github.com/KuanKongy",
    color: "text-black dark:text-white",
    hover: "hover:text-white",
    empty: true
  }
];

export default function  MyProjects() {
  return (
    <section className="pb-8 mb-20" id="projects">
      <h2 className="mt-10 mb-28 text-center text-4xl text-purple-500">Projects</h2>
      <div className="grid grid-cols-1 gap-4 lg:justify-items-center ">
        {projectInfo.map((info, index) => (
          <Project
            key={index}
            title={info.title}
            stack={info.stack}
            description={info.description}
            photo={info.photo}
            repo={info.repo}
            color={info.color}
            hover={info.hover}
            empty={info.empty}
          />
        ))}
      </div>
    </section>
  );
};