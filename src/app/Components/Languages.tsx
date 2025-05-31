"use client";
import React from "react";
import { IoLogoJavascript, IoLogoCss3, IoLogoHtml5 } from "react-icons/io5";
import { SiTypescript, SiNextdotjs, SiStyledcomponents, SiTailwindcss, SiExpress, SiFirebase, SiCplusplus, SiSocketdotio, 
  SiHeroku, SiVite, SiOracle, SiBootstrap, SiChakraui, SiShadcnui, SiPostgresql, SiJunit5, SiMocha, SiChai, SiGithubactions, 
  SiVitest, SiTerraform, SiKubernetes, SiDocker, SiGrafana, SiPrometheus, SiHelm, SiMysql, SiGraphql, SiPython, SiFlask,
  SiFastapi, SiAnsible, SiJenkins, SiMongodb, SiGooglecloud } from "react-icons/si";
import { FaReact, FaNode, FaJava, FaAws } from "react-icons/fa";
import { BsFiletypeSql } from "react-icons/bs";
import { DiRedis } from "react-icons/di";
import { VscAzure } from "react-icons/vsc";
import type { IconType } from "react-icons";

interface TechBadgeProps {
  icon: IconType;
  name: string;
  color: string;
  size: number;
}

const techStack = [

  { name: "Typescript", icon: SiTypescript, color: "hover:border-blue-500 hover:bg-blue-500", size: 22 },
  { name: "Javascript", icon: IoLogoJavascript, color: "hover:border-yellow-500 hover:bg-yellow-500", size: 25 },
  { name: "Python", icon: SiPython, color: "hover:border-yellow-300 hover:bg-yellow-300", size: 25 },
  { name: "Java", icon: FaJava, color: "hover:border-rose-900 hover:bg-rose-900", size: 25 },
  { name: "C++", icon: SiCplusplus, color: "hover:border-blue-800 hover:bg-blue-800", size: 25 },
  { name: "HTML5", icon: IoLogoHtml5, color: "hover:border-orange-600 hover:bg-orange-600", size: 23 },
  { name: "CSS3", icon: IoLogoCss3, color: "hover:border-blue-600 hover:bg-blue-600", size: 25 },
  { name: "SQL", icon: BsFiletypeSql, color: "hover:border-gray-600 hover:bg-gray-600", size: 25 },
  
  { name: "Next.js", icon: SiNextdotjs, color: "hover:border-black hover:bg-black", size: 25 },
  { name: "Node.js", icon: FaNode, color: "hover:border-green-600 hover:bg-green-600", size: 25 },
  { name: "Express.js", icon: SiExpress, color: "hover:border-gray-800 hover:bg-gray-800", size: 25 },
  { name: "Socket.io", icon: SiSocketdotio, color: "hover:border-gray-400 hover:bg-gray-400", size: 25 },

  { name: "React", icon: FaReact, color: "hover:border-cyan-500 hover:bg-cyan-500", size: 25 },
  { name: "Vite", icon: SiVite, color: "hover:border-indigo-700 hover:bg-indigo-700", size: 25 },
  { name: "Tailwind", icon: SiTailwindcss, color: "hover:border-sky-500 hover:bg-sky-500", size: 25 },
  { name: "BootStrap", icon: SiBootstrap, color: "hover:border-violet-500 hover:bg-violet-500", size: 25 },
  { name: "Chakra-UI", icon: SiChakraui, color: "hover:border-teal-600 hover:bg-teal-600", size: 25 },
  { name: "ShadCN", icon: SiShadcnui, color: "hover:border-stone-950 hover:bg-stone-950", size: 25 },
  { name: "Styled Components", icon: SiStyledcomponents, color: "hover:border-pink-500 hover:bg-pink-500", size: 25 },

  { name: "Redis", icon: DiRedis, color: "hover:border-red-600 hover:bg-red-600", size: 25 },
  { name: "MongoDB", icon: SiMongodb, color: "hover:border-green-600 hover:bg-green-600", size: 25 },
  { name: "Firebase", icon: SiFirebase, color: "hover:border-yellow-400 hover:bg-yellow-400", size: 25 },
  { name: "PostgreSQL", icon: SiPostgresql, color: "hover:border-sky-700 hover:bg-sky-700", size: 25 },
  { name: "MySQL", icon: SiMysql, color: "hover:border-sky-700 hover:bg-sky-700", size: 25 },
  { name: "Oracle DB", icon: SiOracle, color: "hover:border-rose-500 hover:bg-rose-500", size: 25 },

  { name: "Vitest", icon: SiVitest, color: "hover:border-lime-600 hover:bg-lime-600", size: 23 },
  { name: "Mocha", icon: SiMocha, color: "hover:border-amber-800 hover:bg-amber-800", size: 25 },
  { name: "Chai", icon: SiChai, color: "hover:border-orange-200 hover:bg-orange-200 ", size: 25 },
  { name: "JUnit", icon: SiJunit5, color: "hover:border-emerald-700 hover:bg-emerald-700", size: 25 },

  { name: "GraphQL", icon: SiGraphql, color: "hover:border-fuchsia-500 hover:bg-fuchsia-500", size: 25 },
  { name: "Flask", icon: SiFlask, color: "hover:border-cyan-600 hover:bg-cyan-600", size: 25 },
  { name: "FastAPI", icon: SiFastapi, color: "hover:border-teal-600 hover:bg-teal-600", size: 25 },

  { name: "Github Actions", icon: SiGithubactions, color: "hover:border-sky-500 hover:bg-sky-500", size: 25 },
  { name: "Jenkins", icon: SiJenkins, color: "hover:border-red-200 hover:bg-red-200", size: 25 },
  { name: "Heroku", icon: SiHeroku, color: "hover:border-purple-900 hover:bg-purple-900", size: 25 },
  { name: "AWS", icon: FaAws, color: "hover:border-orange-400 hover:bg-orange-400", size: 25 },
  { name: "Azure", icon: VscAzure, color: "hover:border-blue-600 hover:bg-blue-600", size: 25 },
  { name: "Google Cloud", icon: SiGooglecloud, color: "hover:border-blue-500 hover:bg-blue-500", size: 25 },

  { name: "Helm", icon: SiHelm, color: "hover:border-sky-700 hover:bg-sky-700", size: 25 },
  { name: "Terraform", icon: SiTerraform, color: "hover:border-indigo-700 hover:bg-indigo-700", size: 25 },
  { name: "Kubernetes", icon: SiKubernetes, color: "hover:border-blue-600 hover:bg-blue-600", size: 25 },
  { name: "Docker", icon: SiDocker, color: "hover:border-blue-500 hover:bg-blue-500", size: 25 },
  { name: "Ansible", icon: SiAnsible, color: "hover:border-black hover:bg-black", size: 25 },
  { name: "Grafana", icon: SiGrafana, color: "hover:border-amber-500 hover:bg-amber-500", size: 25 },
  { name: "Prometheus", icon: SiPrometheus, color: "hover:border-orange-500 hover:bg-orange-500", size: 25 },
  
  
];

function TechBadge({ icon: Icon, name, color, size }: TechBadgeProps) {
  return (
    <div
      className={`flex flex-row items-center justify-center gap-2 border-2 rounded-xl px-4 py-3 transition-colors duration-200 dark:text-white text-black border-gray-500 hover:bg-opacity-20 ${color}`}
    >
      <Icon size={size} />
      <span className="text-lg">{name}</span>
    </div>
  );
}

export default function MyLanguages() {
  return (
    <section className="pb-8 mb-28 md:mb-30" id="languages">
      <h2 className="mt-10 mb-28 md:mb-30 text-center text-4xl text-green-500">Languages & Technologies</h2>
      <div className="flex flex-wrap items-center justify-center gap-4 md:w-9/12 mx-auto">
        {techStack.map(({ icon, name, color, size }) => (
          <TechBadge key={name} icon={icon} name={name} color={color} size={size} />
        ))}
      </div>
    </section>
  );
}
