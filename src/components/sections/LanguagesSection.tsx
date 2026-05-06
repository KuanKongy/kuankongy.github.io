import { IoLogoJavascript, IoLogoCss3, IoLogoHtml5 } from "react-icons/io5";
import {
  SiTypescript,
  SiNextdotjs,
  SiStyledcomponents,
  SiTailwindcss,
  SiExpress,
  SiFirebase,
  SiCplusplus,
  SiSocketdotio,
  SiHeroku,
  SiVite,
  SiBootstrap,
  SiChakraui,
  SiShadcnui,
  SiPostgresql,
  SiJunit5,
  SiMocha,
  SiChai,
  SiGithubactions,
  SiVitest,
  SiTerraform,
  SiKubernetes,
  SiDocker,
  SiGrafana,
  SiPrometheus,
  SiHelm,
  SiMysql,
  SiGraphql,
  SiPython,
  SiFlask,
  SiFastapi,
  SiAnsible,
  SiJenkins,
  SiMongodb,
  SiGooglecloud,
} from "react-icons/si";
import { FaReact, FaNode, FaJava, FaAws, FaDatabase } from "react-icons/fa";
import { BsFiletypeSql } from "react-icons/bs";
import { DiRedis } from "react-icons/di";
import { VscAzure } from "react-icons/vsc";
import type { IconType } from "react-icons";

interface Tech {
  name: string;
  icon: IconType;
  color: string;
  size?: number;
}

const techStack: Tech[] = [
  { name: "Typescript", icon: SiTypescript, color: "hover:border-blue-500 hover:bg-blue-500/30" },
  { name: "Javascript", icon: IoLogoJavascript, color: "hover:border-yellow-500 hover:bg-yellow-500/30" },
  { name: "Python", icon: SiPython, color: "hover:border-yellow-300 hover:bg-yellow-300/30" },
  { name: "Java", icon: FaJava, color: "hover:border-rose-900 hover:bg-rose-900/40" },
  { name: "C++", icon: SiCplusplus, color: "hover:border-blue-800 hover:bg-blue-800/40" },
  { name: "HTML5", icon: IoLogoHtml5, color: "hover:border-orange-600 hover:bg-orange-600/30" },
  { name: "CSS3", icon: IoLogoCss3, color: "hover:border-blue-600 hover:bg-blue-600/30" },
  { name: "SQL", icon: BsFiletypeSql, color: "hover:border-gray-500 hover:bg-gray-500/30" },

  { name: "Next.js", icon: SiNextdotjs, color: "hover:border-black hover:bg-black/40" },
  { name: "Node.js", icon: FaNode, color: "hover:border-green-600 hover:bg-green-600/30" },
  { name: "Express.js", icon: SiExpress, color: "hover:border-gray-500 hover:bg-gray-500/30" },
  { name: "Socket.io", icon: SiSocketdotio, color: "hover:border-gray-300 hover:bg-gray-300/30" },

  { name: "React", icon: FaReact, color: "hover:border-cyan-500 hover:bg-cyan-500/30" },
  { name: "Vite", icon: SiVite, color: "hover:border-indigo-700 hover:bg-indigo-700/30" },
  { name: "Tailwind", icon: SiTailwindcss, color: "hover:border-sky-500 hover:bg-sky-500/30" },
  { name: "Bootstrap", icon: SiBootstrap, color: "hover:border-violet-500 hover:bg-violet-500/30" },
  { name: "Chakra-UI", icon: SiChakraui, color: "hover:border-teal-600 hover:bg-teal-600/30" },
  { name: "ShadCN", icon: SiShadcnui, color: "hover:border-stone-700 hover:bg-stone-700/40" },
  { name: "Styled Components", icon: SiStyledcomponents, color: "hover:border-pink-500 hover:bg-pink-500/30" },

  { name: "Redis", icon: DiRedis, color: "hover:border-red-600 hover:bg-red-600/30" },
  { name: "MongoDB", icon: SiMongodb, color: "hover:border-green-600 hover:bg-green-600/30" },
  { name: "Firebase", icon: SiFirebase, color: "hover:border-yellow-400 hover:bg-yellow-400/30" },
  { name: "PostgreSQL", icon: SiPostgresql, color: "hover:border-sky-700 hover:bg-sky-700/30" },
  { name: "MySQL", icon: SiMysql, color: "hover:border-sky-700 hover:bg-sky-700/30" },
  { name: "Oracle DB", icon: FaDatabase, color: "hover:border-rose-500 hover:bg-rose-500/30" },

  { name: "Vitest", icon: SiVitest, color: "hover:border-lime-600 hover:bg-lime-600/30" },
  { name: "Mocha", icon: SiMocha, color: "hover:border-amber-800 hover:bg-amber-800/30" },
  { name: "Chai", icon: SiChai, color: "hover:border-orange-200 hover:bg-orange-200/30" },
  { name: "JUnit", icon: SiJunit5, color: "hover:border-emerald-700 hover:bg-emerald-700/30" },

  { name: "GraphQL", icon: SiGraphql, color: "hover:border-fuchsia-500 hover:bg-fuchsia-500/30" },
  { name: "Flask", icon: SiFlask, color: "hover:border-cyan-600 hover:bg-cyan-600/30" },
  { name: "FastAPI", icon: SiFastapi, color: "hover:border-teal-600 hover:bg-teal-600/30" },

  { name: "Github Actions", icon: SiGithubactions, color: "hover:border-sky-500 hover:bg-sky-500/30" },
  { name: "Jenkins", icon: SiJenkins, color: "hover:border-red-200 hover:bg-red-200/30" },
  { name: "Heroku", icon: SiHeroku, color: "hover:border-purple-900 hover:bg-purple-900/40" },
  { name: "AWS", icon: FaAws, color: "hover:border-orange-400 hover:bg-orange-400/30" },
  { name: "Azure", icon: VscAzure, color: "hover:border-blue-600 hover:bg-blue-600/30" },
  { name: "Google Cloud", icon: SiGooglecloud, color: "hover:border-blue-500 hover:bg-blue-500/30" },

  { name: "Helm", icon: SiHelm, color: "hover:border-sky-700 hover:bg-sky-700/30" },
  { name: "Terraform", icon: SiTerraform, color: "hover:border-indigo-700 hover:bg-indigo-700/30" },
  { name: "Kubernetes", icon: SiKubernetes, color: "hover:border-blue-600 hover:bg-blue-600/30" },
  { name: "Docker", icon: SiDocker, color: "hover:border-blue-500 hover:bg-blue-500/30" },
  { name: "Ansible", icon: SiAnsible, color: "hover:border-black hover:bg-black/40" },
  { name: "Grafana", icon: SiGrafana, color: "hover:border-amber-500 hover:bg-amber-500/30" },
  { name: "Prometheus", icon: SiPrometheus, color: "hover:border-orange-500 hover:bg-orange-500/30" },
];

function TechBadge({ icon: Icon, name, color, size = 22 }: Tech) {
  return (
    <div
      className={`flex flex-row items-center gap-2 rounded-xl border-2 border-white/25 bg-white/5 px-3 py-2 text-white/90 transition-colors duration-200 ${color}`}
    >
      <Icon size={size} />
      <span className="text-sm md:text-base">{name}</span>
    </div>
  );
}

export default function LanguagesSection() {
  return (
    <section id="languages" className="scroll-mt-24">
      <div className="frosted px-6 py-10 md:px-10">
        <h2 className="mb-8 text-center text-3xl font-bold text-tetra-s md:text-4xl">
          Languages &amp; Technologies
        </h2>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3">
          {techStack.map((t) => (
            <TechBadge key={t.name} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
