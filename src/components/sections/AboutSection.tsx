import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";
import photo from "../../assets/images/photo.jpg";

export default function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24">
      <div className="frosted grid grid-cols-1 gap-8 px-6 py-10 md:px-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="mb-4 text-3xl font-bold text-tetra-z md:text-4xl">About Me</h2>
          <p className="mb-4 text-base text-white/85 md:text-lg">
            I&apos;m a full-time student majoring in Computer Science at the University
            of British Columbia. I have an interest in software engineering and its
            applications, and I love bringing ideas to life with the right blend of
            backend, frontend, infrastructure, and a little bit of game dev whimsy.
          </p>
          <p className="text-base text-white/75 md:text-lg">
            Recent work has covered full-stack web apps, AI-powered tooling,
            multiplayer real-time games, and cloud-native deployments on AWS, Azure via Terraform/Helm/Kubernetes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="mailto:khanhpronam@gmail.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border-2 border-white/30 p-2 transition hover:border-rose-700 hover:bg-rose-900/40"
              aria-label="Email"
            >
              <FaEnvelope size={26} />
            </a>
            <a
              href="https://www.linkedin.com/in/kuankongy/"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border-2 border-white/30 p-2 transition hover:border-blue-700 hover:bg-blue-900/40"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={26} />
            </a>
            <a
              href="https://github.com/KuanKongy"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border-2 border-white/30 p-2 transition hover:border-zinc-500 hover:bg-zinc-700/40"
              aria-label="GitHub"
            >
              <FaGithub size={26} />
            </a>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="relative mx-auto aspect-square w-64 overflow-hidden rounded-full ring-2 ring-tetra-t/40 md:w-72">
            <img
              src={photo}
              alt="Photo of Nam Le"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
