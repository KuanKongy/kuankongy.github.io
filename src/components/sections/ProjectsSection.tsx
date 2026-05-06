import TetrisDemo from "../../assets/images/tetrisDemo.png";
import BankDemo from "../../assets/images/bankDemo.png";
import SkribblDemo from "../../assets/images/skrib.png";
import MasterDemo from "../../assets/images/master.png";
import NationalDemo from "../../assets/images/national.png";

interface Project {
  title: string;
  stack: string;
  description: string;
  photo: string;
  repo: string;
  app: string;
  color: string;
  hover: string;
  link: string;
  media: "video" | "image" | "empty";
}

const projects: Project[] = [
  {
    title: "Course Finder (Academic)",
    stack: "TypeScript, Node.js, Express.js, React, Vite, Bootstrap, Mocha, Chai",
    description:
      "A full-stack web app with a RESTful API backend built using TypeScript, Node.js, and Express.js for preprocessing academic datasets and supporting complex SQL-like queries. Uses the Facade pattern to enable multiple frontend integrations with varied functionality. Developed a React, Vite, and Bootstrap frontend for analyzing course sections data. Tested backend logic and server using Mocha, Chai and Supertest. Deployed frontend on Github pages and backend on Heroku and AWS EKS via Terraform with monitoring.",
    photo: TetrisDemo,
    repo: "https://gitfront.io/r/KuanKongy/5hmgkWi4SLim/CourseInsights/",
    app: "https://kuankongy.github.io/CourseInsights/",
    color: "text-emerald-400",
    hover: "hover:text-emerald-400",
    link: "7ftauN3dMcQ",
    media: "video",
  },
  {
    title: "Video Summarizer (Hackathon)",
    stack: "Python, Flask, Whisper, GPT-4, Redis, PyTorch, CUDA, FFmpeg, Sentence Transformers, React, Vite, Tailwind",
    description:
      "An AI-powered tool with a Flask-based RESTful API that transforms lecture videos into searchable, summarized content. Uses FFmpeg to extract audio, Whisper for transcription, GPT-4 for summarization, and Sentence Transformers for semantic search. Developed Frontend with React, Vite, and Tailwind CSS. Optimized with Redis caching and GPU-accelerated PyTorch + CUDA for fast, high-performance inference. Deployed frontend on Github pages and backend on Heroku and AWS EC2. Redis is on Upstash.",
    photo: TetrisDemo,
    repo: "https://github.com/KuanKongy/DeepRecall.git",
    app: "https://kuankongy.github.io/DeepRecall/",
    color: "text-purple-400",
    hover: "hover:text-purple-400",
    link: "F3tVI8lyPAw",
    media: "video",
  },
  {
    title: "Multiplayer Tetris (Personal)",
    stack: "TypeScript, Node.js, Socket.io, Express.js, Firebase, React, Javascript, HTML, CSS, Styled Components",
    description:
      "A multiplayer version of Tetris built using Node.js, Socket.io, and Express.js for client-server communication to manage game sessions and real-time interactions, paired with Firebase Firestore for the game's data persistence. Developed a dynamic, intuitive user interface with React, TypeScript, and Styled Components, ensuring a seamless gaming experience. Deployed backend on Heroku and frontend on Github pages.",
    photo: TetrisDemo,
    repo: "https://github.com/KuanKongy/Multiplayer-Tetris.git",
    app: "https://KuanKongy.github.io/Multiplayer-Tetris",
    color: "text-violet-400",
    hover: "hover:text-violet-400",
    link: "",
    media: "image",
  },
  {
    title: "Bank Management App (Academic)",
    stack: "Java, JUnit, Swing",
    description:
      "A desktop application written in Java for managing banking operations, showcasing advanced programming concepts like object-oriented design, robust testing, data persistence, and event logging. Utilised Swing for building a graphical user-friendly interface and incorporated JUnit for data testing to ensure application reliability.",
    photo: BankDemo,
    repo: "https://github.com/KuanKongy/Bank-Management-App.git",
    app: "",
    color: "text-green-400",
    hover: "hover:text-green-400",
    link: "",
    media: "image",
  },
  {
    title: "Skribbl.io (Personal)",
    stack: "TypeScript, Node.js, Socket.io, Express.js, React, Vite, Tailwind CSS, ShadCN",
    description:
      "A multiplayer drawing and guessing game inspired by Skribbl.io, built using TypeScript, Node.js, Socket.io, and Express.js for real-time communication and session management. The frontend was developed with React, Vite, Tailwind CSS, and ShadCN. Deployed backend on Heroku and frontend on Github pages.",
    photo: SkribblDemo,
    repo: "https://github.com/KuanKongy/Skribbl.git",
    app: "https://kuankongy.github.io/Skribbl/",
    color: "text-blue-400",
    hover: "hover:text-blue-400",
    link: "",
    media: "image",
  },
  {
    title: "Master Pokedex (Personal)",
    stack: "TypeScript, React, Vite, Tailwind CSS, ShadCN, PokeAPI",
    description:
      "A social Pokédex web app that models real users as Trainers to showcase their Pokémon collections, progress, and locations for sharing, trading, and battling. Displays detailed Pokémon attributes, evolutions, and associations with game-world elements. Built a frontend using React, Vite, Tailwind CSS, and ShadCN. Deployed frontend on Github pages.",
    photo: MasterDemo,
    repo: "https://github.com/KuanKongy/MasterPokedex.git",
    app: "https://kuankongy.github.io/MasterPokedex/",
    color: "text-fuchsia-400",
    hover: "hover:text-fuchsia-400",
    link: "",
    media: "image",
  },
  {
    title: "National Pokedex (Academic)",
    stack: "JavaScript, Node.js, Express.js, OracleDB, React, Vite, HTML, CSS, Chakra-UI",
    description:
      "A full-stack web application centered around a custom-designed OracleDB schema modelling complex relationships between Pokémon, Trainers, and Regions. Built a RESTful API with JavaScript, Node.js and Express.js to query Pokémon attributes, evolutions, and their associations with game-world elements. Developed a frontend using React, Vite, HTML/CSS, and Chakra-UI. Not deployed due to Oracle license.",
    photo: NationalDemo,
    repo: "https://github.com/KuanKongy/NationalPokedex.git",
    app: "",
    color: "text-red-400",
    hover: "hover:text-red-400",
    link: "",
    media: "image",
  },
  {
    title: "Shopping Assistant Extension (Hackathon)",
    stack: "JavaScript, HTML, CSS, OpenAI API, WebScraperAPI, Chrome Extension (Manifest V3) and Storage",
    description:
      "A smart shopping assistant built as a Chrome Extension (Manifest V3) using JavaScript, HTML, and CSS, with Chrome Storage for user's preferences. Integrates WebScraperAPI to extract products and brand's data, and OpenAI API to verify brand's origins and suggest alternatives from the same website based on the user's selected country — all in real time while browsing or adding items to carts.",
    photo: TetrisDemo,
    repo: "https://github.com/KuanKongy/GeoShopper.git",
    app: "",
    color: "text-cyan-400",
    hover: "hover:text-cyan-400",
    link: "dKfQOmuVBZE",
    media: "video",
  },
  {
    title: "Heart Disease Predictor Model (Academic)",
    stack: "R, tidyverse, tidymodels, ggplot2, kknn, themis",
    description:
      "Built a classification model in R to predict the likelihood of coronary artery disease using clinical data. Applied tidymodels for preprocessing, training, and evaluation. Handled class imbalance with themis, explored feature importance using visualizations (ggplot2), and tested multiple models including k-NN (kknn). Evaluated performance using accuracy, precision, and recall to compare against a baseline classifier.",
    photo: TetrisDemo,
    repo: "https://github.com/KuanKongy/Heart-Disease-Predictor.git",
    app: "",
    color: "text-yellow-400",
    hover: "hover:text-yellow-400",
    link: "",
    media: "empty",
  },
  {
    title: "Under Construction…",
    stack: "Coming Soon!",
    description:
      "Stay tuned for my upcoming projects! Currently working on two projects: AI Onboarding Buddy (repository walkthrough), Chat Searcher (semantic search of all chats).",
    photo: TetrisDemo,
    repo: "https://github.com/KuanKongy",
    app: "",
    color: "text-white",
    hover: "hover:text-white",
    link: "",
    media: "empty",
  },
];

function VideoY({ embedId }: { embedId: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/15">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${embedId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded YouTube"
      />
    </div>
  );
}

function ProjectCard(p: Project) {
  return (
    <div className="frosted-soft flex w-full flex-col p-4 lg:w-[calc(50%-12px)]">
      <div className="flex-grow">
        {p.media === "video" ? (
          <VideoY embedId={p.link} />
        ) : p.media === "image" ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/15">
            <img src={p.photo} alt={p.title} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <h3 className={`mt-4 text-xl font-semibold ${p.color}`}>{p.title}</h3>
        <p className="mt-2 text-base font-medium text-white/85">{p.stack}</p>
        <p className="mt-2 text-sm text-white/75">{p.description}</p>
      </div>

      <div className={`mt-4 ${p.app && p.repo ? "flex gap-2" : ""}`}>
        {p.app && (
          <a
            href={p.app}
            target="_blank"
            rel="noreferrer"
            className={`${p.hover} ${p.repo ? "w-1/2" : "w-full"} flex justify-center rounded-xl bg-white/90 px-5 py-2 font-semibold text-black transition hover:bg-white`}
          >
            Web App
          </a>
        )}
        {p.repo && (
          <a
            href={p.repo}
            target="_blank"
            rel="noreferrer"
            className={`${p.hover} ${p.app ? "w-1/2" : "w-full"} flex justify-center rounded-xl bg-white/90 px-5 py-2 font-semibold text-black transition hover:bg-white`}
          >
            GitHub Repo
          </a>
        )}
      </div>
    </div>
  );
}

export default function ProjectsSection() {
  return (
    <section id="projects" className="scroll-mt-24">
      <div className="frosted px-4 py-10 md:px-8">
        <h2 className="mb-8 text-center text-3xl font-bold text-tetra-t md:text-4xl">
          Projects
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {projects.map((p, i) => (
            <ProjectCard key={i} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}
