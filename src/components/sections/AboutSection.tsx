import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";
import photo from "../../assets/images/photo.jpg";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import Tag from "../ui/Tag";
import type { TagAccent } from "../ui/Tag";

const facts: { label: string; accent: TagAccent }[] = [
  { label: "UBC Computer Science", accent: "cyan" },
  { label: "Vancouver, BC", accent: "green" },
  { label: "Full-Stack", accent: "violet" },
  { label: "Cloud & DevOps", accent: "fuchsia" },
  { label: "Game Dev", accent: "gold" },
];

const socials = [
  {
    href: "mailto:khanhpronam@gmail.com",
    label: "Email",
    Icon: FaEnvelope,
  },
  {
    href: "https://www.linkedin.com/in/kuankongy/",
    label: "LinkedIn",
    Icon: FaLinkedin,
  },
  {
    href: "https://github.com/KuanKongy",
    label: "GitHub",
    Icon: FaGithub,
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24">
      <SectionHeading kicker="// who I am" title="About Me" />
      <Reveal>
        <div className="frosted grid grid-cols-1 gap-8 px-6 py-10 md:px-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mb-4 text-base text-ink/85 md:text-lg">
              I&apos;m a third-year Computer Science student at the University
              of British Columbia. I love bringing ideas to life with the right
              blend of backend, frontend, infrastructure.
            </p>
            <p className="text-base text-ink/75 md:text-lg">
              Recent work spans full-stack web apps, AI-powered tooling,
              multiplayer real-time games, and cloud-native deployments on AWS
              and Azure with Terraform, Helm, and Kubernetes.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {facts.map((f) => (
                <Tag key={f.label} accent={f.accent}>
                  {f.label}
                </Tag>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="hover-lift rounded-2xl border border-[color:var(--line-strong)] p-3 text-ink/85 hover:border-[color:var(--accent-strong)] hover:text-[color:var(--accent-strong)]"
                >
                  <Icon size={26} />
                </a>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="mx-auto w-64 rounded-full bg-gradient-to-br from-accent-violet to-accent-fuchsia p-[3px] md:w-72">
              <div className="aspect-square w-full overflow-hidden rounded-full">
                <img
                  src={photo}
                  alt="Photo of Nam Le"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
