import { useEffect, useRef, useState } from "react";
import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";

const EMAIL = "khanhpronam@gmail.com";

export default function ContactSection() {
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
    <section id="contact" className="scroll-mt-24">
      <SectionHeading
        kicker="// say hi"
        title="Let's Stay in Touch"
        align="center"
        kickerClassName="text-sm font-bold md:text-base"
      />
      <Reveal>
        <div className="relative mx-auto w-full max-w-2xl">
          <div
            aria-hidden
            className="absolute inset-x-8 -top-10 h-40 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(217,70,239,0.28),transparent_65%)] blur-2xl"
          />
          <div className="frosted relative px-6 py-12 text-center md:px-12">
            <p className="text-base text-ink/85 md:text-lg">
              Open to co-op roles, collaborations, and good conversations about
              building things. Feel free to reach out, or just say hi.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={copyEmail} className="btn-primary">
                <FaEnvelope size={16} className="shrink-0" />
                {/* Both labels share one grid cell so the button keeps the
                    width of the longer one (the email) while "Copied!" shows. */}
                <span className="grid">
                  <span
                    aria-hidden={copied}
                    className={`col-start-1 row-start-1 transition-opacity duration-300 ${
                      copied ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    {EMAIL}
                  </span>
                  <span
                    aria-hidden={!copied}
                    className={`col-start-1 row-start-1 text-center transition-[opacity,transform] duration-300 ${
                      copied
                        ? "translate-y-0 opacity-100"
                        : "translate-y-1 opacity-0"
                    }`}
                  >
                    Copied!
                  </span>
                </span>
              </button>
              <a
                href="https://www.linkedin.com/in/kuankongy/"
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                <FaLinkedin size={16} />
                LinkedIn
              </a>
              <a
                href="https://github.com/KuanKongy"
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                <FaGithub size={16} />
                GitHub
              </a>
            </div>
            <span aria-live="polite" className="sr-only">
              {copied ? "Email address copied to clipboard" : ""}
            </span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
