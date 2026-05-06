import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";

export default function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-24">
      <div className="frosted px-6 py-12 text-center md:px-10">
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
          Let&apos;s Stay in <span className="text-tetra-j">Touch</span>!
        </h2>
        <p className="text-base text-white/85 md:text-lg">
          Feel free to follow my socials, send a message, or just say hi.
        </p>
        <p className="mt-2 text-lg font-semibold text-tetra-i">
          khanhpronam@gmail.com
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <a
            href="mailto:khanhpronam@gmail.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border-2 border-white/30 p-3 transition hover:border-rose-700 hover:bg-rose-900/40"
            aria-label="Email"
          >
            <FaEnvelope size={36} />
          </a>
          <a
            href="https://www.linkedin.com/in/kuankongy/"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border-2 border-white/30 p-3 transition hover:border-blue-700 hover:bg-blue-900/40"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={36} />
          </a>
          <a
            href="https://github.com/KuanKongy"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border-2 border-white/30 p-3 transition hover:border-zinc-500 hover:bg-zinc-700/40"
            aria-label="GitHub"
          >
            <FaGithub size={36} />
          </a>
        </div>
      </div>
    </section>
  );
}
