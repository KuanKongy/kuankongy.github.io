import React from "react";
import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";

export default function Contact() {
  return (
    <section className="pb-8 mb-20" id="contact">
      <div className="text-center">
        <h2 className="mt-10 mb-6 text-center text-4xl text-black dark:text-white">Let&apos;s Stay in Touch!</h2>
        <p className="my-4 text-xl text-opacity-80 text-black dark:text-opacity-80 dark:text-white">Feel free to follow my socials!</p>
        <p className="font-semibold text-xl text-blue-500">khanhpronam@gmail.com</p>
        <div className="mt-8 flex justify-center gap-4">
            <a
              href="mailto:khanhpronam@gmail.com"
              target="_blank"
              rel="noreferrer"
              className="border-2 border-gray-500 rounded-2xl p-2 hover:bg-rose-900 hover:border-rose-900"
            >
              <FaEnvelope className="black dark:white" size={50} />
            </a>
            <a
              href="https://www.linkedin.com/in/kuankongy/"
              target="_blank"
              rel="noreferrer"
              className="border-2 border-gray-500 rounded-2xl p-2 hover:bg-blue-900 hover:border-blue-900"
            >
              <FaLinkedin className="black dark:white" size={50} />
            </a>
            <a
              href="https://github.com/KuanKongy"
              target="_blank"
              rel="noreferrer"
              className="border-2 border-gray-500 rounded-2xl p-2 hover:bg-gray-700 hover:border-gray-700"
            >
              <FaGithub className="black dark:white" size={50} />
            </a>
        </div>
      </div>
    </section>
  );
};
