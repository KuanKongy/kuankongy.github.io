import React from "react";
import Image from "next/image";
import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";
import { Photo } from "./images";

export default function AboutMe() {
  return (
    <section className="my-28" id="about">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="col-span-7 place-self-center">
          <h1 className="animated">
            <span className="mb-4 text-black dark:text-white">Hey, I'm </span>
            <div className="animated-info">
              <span className="animated-item">Nam Khanh</span>
              <span className="animated-item">a Developer</span>
              <span className="animated-item">a Student</span>
            </div>
          </h1>
          <p className="text-lg mb-6 lg:text-xl text-opacity-80 text-black dark:text-opacity-80 dark:text-white">
            Full-time student majoring in Computer Science
            at the University of British Columbia. I have an interest in
            software engineering and its applications.
          </p>
          <div className="grid grid-cols-1 lg:flex lg:flex-row lg:items-center lg:justify-start">
              <a
                href="https://drive.google.com/file/d/1adUD8dqCr1OtIxhiMNAi3U5YiLH2G9t0/view?usp=sharing"
                target="_blank"
                rel="noreferrer"
                className="flex justify-center px-6 py-3 my-2 font-semibold rounded-xl lg:mr-4 bg-black dark:bg-white
                hover:bg-gradient-to-r hover:from-red-600 hover:via-purple-500 hover:to-blue-400 
                hover:inline-block text-white dark:text-black hover:text-white text-center"
              >
                View my Resume
              </a>
              <div className="flex flex-row justify-center gap-4 items-center">
                <a
                  href="mailto:khanhpronam@gmail.com"
                  target="_blank"
                  rel="noreferrer"
                  className="border-2 border-gray-500 rounded-2xl p-2 hover:bg-rose-900 hover:border-rose-900"
                >
                  <FaEnvelope className="black dark:white" size={30} />
                </a>
                <a
                  href="https://www.linkedin.com/in/kuankongy/"
                  target="_blank"
                  rel="noreferrer"
                  className="border-2 border-gray-500 rounded-2xl p-2 hover:bg-blue-900 hover:border-blue-900"
                >
                  <FaLinkedin className="black dark:white" size={30} />
                </a>
                <a
                  href="https://github.com/KuanKongy"
                  target="_blank"
                  rel="noreferrer"
                  className="border-2 border-gray-500 rounded-2xl p-2 hover:bg-gray-700 hover:border-gray-700"
                >
                  <FaGithub className="black dark:white" size={30} />
                </a>
              </div>
          </div>
        </div>
        <div className="col-span-5 lace-self-center lg:place-self-end mt-8 lg:mt-0">
          <Image
            src={Photo}
            alt="Photo of Nam Le"
            className="mx-auto rounded-full"
            width={300}
            height={300}
            priority
          />
        </div>
      </div>
    </section>
  );
};
