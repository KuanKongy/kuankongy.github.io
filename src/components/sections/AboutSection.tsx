import { useEffect, useRef, useState } from "react";
import { FaLinkedin, FaGithub, FaEnvelope, FaCheck } from "react-icons/fa";
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

const EMAIL = "khanhpronam@gmail.com";

const socials = [
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

const SOCIAL_BTN =
  "hover-lift rounded-2xl border border-[color:var(--line-strong)] p-3 text-ink/85 hover:border-[color:var(--accent-strong)] hover:text-[color:var(--accent-strong)]";

export default function AboutSection() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  }

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
              <div className="relative">
                {/* Floating "Copied!" pill — eases up and fades in/out. */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--page-bg)] px-2.5 py-1 font-mono text-xs text-ink transition-[opacity,transform] duration-300 ${
                    copied ? "-translate-y-0.5 opacity-100" : "opacity-0"
                  }`}
                >
                  Copied!
                </span>
                <button
                  type="button"
                  onClick={copyEmail}
                  aria-label="Copy email address"
                  className={SOCIAL_BTN}
                >
                  {/* Envelope crossfades into a check while copied. */}
                  <span className="grid">
                    <FaEnvelope
                      size={26}
                      className={`col-start-1 row-start-1 transition-[opacity,transform] duration-300 ${
                        copied ? "scale-50 opacity-0" : "scale-100 opacity-100"
                      }`}
                    />
                    <FaCheck
                      size={26}
                      className={`col-start-1 row-start-1 text-emerald-600 transition-[opacity,transform] duration-300 dark:text-accent-green ${
                        copied ? "scale-100 opacity-100" : "scale-50 opacity-0"
                      }`}
                    />
                  </span>
                </button>
              </div>
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className={SOCIAL_BTN}
                >
                  <Icon size={26} />
                </a>
              ))}
              <span aria-live="polite" className="sr-only">
                {copied ? "Email address copied to clipboard" : ""}
              </span>
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
