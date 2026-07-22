import type { Project } from "./types";

/**
 * Render order = array order (featured cards sort first in the grid).
 * Media lives in src/assets/projects/<slug>/ — see src/lib/projectMedia.ts.
 */
export const projects: Project[] = [
  {
    slug: "tricky-towers-3d",
    title: "Tricky Towers 3D",
    category: "personal",
    blurb:
      "A physics-driven 3D take on Tricky Towers — and the living night-sky world behind this very portfolio.",
    description:
      "A browser-based 3D recreation of Tricky Towers built with Three.js and the Rapier WASM physics engine: tetrominoes drop onto a floating castle platform and real physics decides whether the tower stands or topples. Includes Survival (three lives) and Endless modes, keyboard and mouse controls, a hand-built scene with mountains, clouds, and a wizard, plus bloom and vignette post-processing. It doubles as the animated background of this portfolio — the page you are reading is rendered over the live game scene. Click Play in the hero to try it.",
    tech: [
      "TypeScript",
      "React",
      "Three.js",
      "Rapier",
      "Zustand",
      "GSAP",
      "Vite",
      "Tailwind CSS",
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/KuanKongy/Tricky3DTowers",
        kind: "github",
      },
      {
        label: "Play Standalone",
        url: "https://kuankongy.github.io/Tricky3DTowers/",
        kind: "live",
      },
    ],
  },
  {
    slug: "onboardbuddy",
    title: "OnboardBuddy",
    category: "academic",
    featured: true,
    blurb:
      "AI + static-analysis platform that turns unfamiliar codebases into guided onboarding paths.",
    description:
      "A codebase onboarding platform that helps developers understand unfamiliar repositories faster. I owned the full-stack architecture: GitHub OAuth authentication via Supabase Auth, project management features, an analysis pipeline built on the TypeScript Compiler API that parses source code into an evidence model, and interactive dependency-graph visualizations with React Flow and D3.js. Onboarding content stays grounded in verified code references rather than pure AI generation, with BullMQ and Redis powering the background analysis queue.",
    tech: [
      "TypeScript",
      "React",
      "Node.js",
      "Express",
      "Supabase",
      "PostgreSQL",
      "Redis",
      "BullMQ",
      "React Flow",
      "D3.js",
      "Docker",
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/KuanKongy/OnboardBuddy",
        kind: "github",
      },
    ],
  },
  {
    slug: "studyflow",
    title: "StudyFlow",
    category: "hackathon",
    featured: true,
    blurb:
      "Collaborative study platform with AI-generated summaries and flashcards for group learning.",
    description:
      "A collaborative study platform built with React, Node.js, MongoDB, and Auth0, with Redis for caching and task queuing. I built the API server and parts of the frontend, and deployed the application with Docker Compose and Terraform on AWS. An asynchronous worker server integrates external AI APIs to turn uploaded study material into summaries and flashcards for study groups.",
    tech: [
      "TypeScript",
      "React",
      "Node.js",
      "MongoDB",
      "Auth0",
      "Redis",
      "OpenAI API",
      "Docker",
      "Terraform",
      "AWS",
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/KuanKongy/StudyFlow",
        kind: "github",
      },
      { label: "Live", url: "https://studyflow.biz", kind: "live" },
    ],
  },
  {
    slug: "floowforge",
    title: "FloowForge",
    category: "hackathon",
    featured: true,
    blurb:
      "No-code AI workflow builder — drag nodes on a canvas, run flows by webhook or schedule. Solo build, extended beyond the hackathon.",
    description:
      "A no-code AI workflow platform started solo at a hackathon and extended into an ongoing personal project. Users drag and drop nodes on a canvas to compose AI-powered pipelines, save flows to their account, and expose them via webhooks or schedules, with results streaming back to the canvas in real time. Supports subflows, prompt-template custom nodes, and multiple AI providers (OpenAI, Google Gemini, Cloudflare Workers AI) — built to help people learn automation concepts and to run automatic workflows for them.",
    tech: [
      "TypeScript",
      "Next.js",
      "React",
      "Python",
      "FastAPI",
      "Supabase",
      "PostgreSQL",
      "Redis Streams",
      "Tailwind CSS",
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/KuanKongy/FloowForge",
        kind: "github",
      },
      { label: "Live", url: "https://floowforge.vercel.app", kind: "live" },
    ],
  },
  {
    slug: "ubcpss",
    title: "UBCPSS Website",
    category: "personal",
    featured: true,
    blurb:
      "The official website of UBC Project STEM Search — designed and built from scratch for the club.",
    description:
      "The official website for UBC Project STEM Search (ubcpss.ca), a UBC AMS club bridging classroom learning and hands-on undergraduate research. I worked as the designer and developer, collaborating with the club president and representatives to deliver the site from scratch — design system, responsive layout, and animations included — with sections for member testimonials, event timelines, team profiles, and FAQs.",
    tech: [
      "TypeScript",
      "React",
      "Vite",
      "Tailwind CSS",
      "Framer Motion",
      "Radix UI",
      "Vercel",
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/KuanKongy/UBCPSS",
        kind: "github",
      },
      { label: "Live", url: "https://www.ubcpss.ca", kind: "live" },
    ],
  },
  {
    slug: "feathersmcp",
    title: "FeathersMCP",
    category: "academic",
    featured: true,
    blurb:
      "Open-source MCP server bringing FeathersJS v6 docs into AI assistants — published on npm.",
    description:
      "An MCP (Model Context Protocol) server under the FeathersJS ecosystem that integrates FeathersJS v6 documentation into AI assistants like Claude Desktop, Cursor, and VS Code — live access to 47 official documentation pages with source-linked citations, full-text search, and schema-inspection tools. I worked in a team of five alongside the project maintainers, contributing through pull requests and code reviews. Published on npm as feathersjs-mcp.",
    tech: ["TypeScript", "Node.js", "MCP", "FeathersJS", "SQLite", "Cloudflare"],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/feathersjs-ecosystem/FeathersMCP",
        kind: "github",
      },
      {
        label: "npm",
        url: "https://www.npmjs.com/package/feathersjs-mcp",
        kind: "npm",
      },
    ],
  },
  {
    slug: "courseinsights",
    title: "CourseInsights",
    category: "academic",
    blurb:
      "Full-stack course discovery platform for querying UBC course data, deployed on AWS EKS.",
    description:
      "A full-stack course discovery platform that lets users search and query UBC course sections data. I developed the RESTful API backend in TypeScript with Node.js and Express, using the Facade pattern to support multiple frontend integrations, and wrote integration and unit tests with Mocha, Chai, and Supertest. The React + Vite + Bootstrap frontend analyzes course sections data. Containerized with Docker and deployed to AWS EKS with Kubernetes and monitoring; frontend on GitHub Pages.",
    tech: [
      "TypeScript",
      "Node.js",
      "Express",
      "React",
      "Vite",
      "Bootstrap",
      "Mocha",
      "Chai",
      "Docker",
      "Kubernetes",
      "AWS EKS",
    ],
    links: [
      {
        label: "GitHub",
        url: "https://gitfront.io/r/KuanKongy/5hmgkWi4SLim/CourseInsights/",
        kind: "github",
      },
      {
        label: "Live",
        url: "https://kuankongy.github.io/CourseInsights/",
        kind: "live",
      },
    ],
    youtubeId: "7ftauN3dMcQ",
  },
  {
    slug: "deeprecall",
    title: "DeepRecall",
    category: "hackathon",
    blurb:
      "AI lecture-video summarizer — Whisper transcription, GPT-4 summaries, semantic search.",
    description:
      "An AI-powered tool that transforms lecture videos into searchable, summarized content. A Flask REST API extracts audio with FFmpeg, transcribes with Whisper, summarizes with GPT-4, and indexes with Sentence Transformers for semantic search. Redis caching and GPU-accelerated PyTorch + CUDA keep inference fast. Frontend built with React, Vite, and Tailwind CSS; backend deployed on Heroku and AWS EC2 with Redis on Upstash.",
    tech: [
      "Python",
      "Flask",
      "Whisper",
      "GPT-4",
      "Redis",
      "PyTorch",
      "React",
      "Vite",
      "Tailwind CSS",
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/KuanKongy/DeepRecall",
        kind: "github",
      },
      {
        label: "Live",
        url: "https://kuankongy.github.io/DeepRecall/",
        kind: "live",
      },
    ],
    youtubeId: "F3tVI8lyPAw",
  },
  {
    slug: "multiplayer-tetris",
    title: "Multiplayer Tetris",
    category: "personal",
    blurb:
      "Real-time multiplayer Tetris over Socket.io with Firebase persistence.",
    description:
      "A multiplayer version of Tetris using Node.js, Socket.io, and Express for client-server communication, managing game sessions and real-time interactions, with Firebase Firestore for data persistence. The dynamic frontend is built with React, TypeScript, and Styled Components. Backend on Heroku, frontend on GitHub Pages.",
    tech: [
      "TypeScript",
      "Node.js",
      "Socket.io",
      "Express",
      "Firebase",
      "React",
      "Styled Components",
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/KuanKongy/Multiplayer-Tetris",
        kind: "github",
      },
      {
        label: "Live",
        url: "https://KuanKongy.github.io/Multiplayer-Tetris",
        kind: "live",
      },
    ],
  },
  {
    slug: "skribbl",
    title: "Skribbl",
    category: "personal",
    blurb:
      "Multiplayer drawing-and-guessing game inspired by Skribbl.io, real-time over Socket.io.",
    description:
      "A multiplayer drawing and guessing game inspired by Skribbl.io, built with TypeScript, Node.js, Socket.io, and Express for real-time communication and session management. Frontend developed with React, Vite, Tailwind CSS, and ShadCN. Backend on Heroku, frontend on GitHub Pages.",
    tech: [
      "TypeScript",
      "Node.js",
      "Socket.io",
      "Express",
      "React",
      "Vite",
      "Tailwind CSS",
      "ShadCN",
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/KuanKongy/Skribbl",
        kind: "github",
      },
      {
        label: "Live",
        url: "https://kuankongy.github.io/Skribbl/",
        kind: "live",
      },
    ],
  },
  {
    slug: "geoshopper",
    title: "GeoShopper",
    category: "hackathon",
    blurb:
      "Chrome extension shopping assistant that verifies brand origins with AI while you browse.",
    description:
      "A smart shopping assistant built as a Chrome Extension (Manifest V3) with JavaScript, HTML, and CSS, using Chrome Storage for user preferences. Integrates WebScraperAPI to extract product and brand data, and the OpenAI API to verify brand origins and suggest alternatives from the same website based on the user's selected country — all in real time while browsing or adding items to carts.",
    tech: [
      "JavaScript",
      "Chrome Extension (MV3)",
      "OpenAI API",
      "WebScraper API",
      "HTML",
      "CSS",
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/KuanKongy/GeoShopper",
        kind: "github",
      },
    ],
    youtubeId: "dKfQOmuVBZE",
  },
  {
    // Merged entry: Master Pokédex (frontend) + National Pokédex
    // (backend architecture, academic).
    slug: "pokedex",
    title: "Pokédex",
    category: "academic",
    blurb:
      "A two-part Pokédex: social React frontend (Master) + OracleDB-backed REST API (National).",
    description:
      "One project in two halves. Master Pokédex is the frontend: a social Pokédex web app modelling real users as Trainers who showcase their collections, progress, and locations for sharing, trading, and battling — built with React, Vite, Tailwind CSS, and ShadCN on top of PokeAPI. National Pokédex is the backend architecture: a custom OracleDB schema modelling complex relationships between Pokémon, Trainers, and Regions, exposed through a Node.js + Express REST API for querying attributes, evolutions, and game-world associations, with a Chakra-UI React frontend.",
    tech: [
      "TypeScript",
      "React",
      "Vite",
      "Tailwind CSS",
      "ShadCN",
      "Node.js",
      "Express",
      "OracleDB",
      "Chakra UI",
      "PokeAPI",
    ],
    links: [
      {
        label: "Frontend (Master)",
        url: "https://github.com/KuanKongy/MasterPokedex",
        kind: "github",
      },
      {
        label: "Backend (National)",
        url: "https://github.com/KuanKongy/NationalPokedex",
        kind: "github",
      },
      {
        label: "Live",
        url: "https://kuankongy.github.io/MasterPokedex/",
        kind: "live",
      },
    ],
  },
  {
    slug: "portfolio",
    title: "Portfolio (v1)",
    category: "personal",
    blurb:
      "My previous portfolio site — a responsive Next.js build, the predecessor of the night-sky world you're in now.",
    description:
      "My first portfolio website, designed and built from scratch with Next.js, TypeScript, and Tailwind CSS. A responsive single-page site showcasing my skills, experience, and projects, with resume and social links. It served as the foundation this current 3D night-sky portfolio grew out of, and remains live at namkhanhle.dev.",
    tech: ["TypeScript", "Next.js", "React", "Tailwind CSS"],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/KuanKongy/Portfolio",
        kind: "github",
      },
      { label: "Live", url: "https://namkhanhle.dev", kind: "live" },
    ],
  },
];
