"use client";
import React from "react";
import { IoLogoJavascript, IoLogoCss3, IoLogoHtml5 } from "react-icons/io5";
import { SiTypescript, SiNextdotjs, SiStyledcomponents, SiTailwindcss, SiExpress, SiFirebase, SiCplusplus, SiSocketdotio } from "react-icons/si";
import { FaReact, FaNode, FaJava } from "react-icons/fa";
import { FaGitAlt } from "react-icons/fa6";
import { BsFiletypeSql } from "react-icons/bs";

export default function MyLanguages() {
  return (
    <section className="pb-8 mb-28 md:mb-30" id="languages">
      <h2 className="mt-10 mb-28 md:mb-30 text-center text-4xl text-green-500">Languages & Technologies</h2>
      <div className="flex flex-wrap items-center justify-center gap-4 md:w-9/12 mx-auto">
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-rose-900 hover:bg-opacity-20 hover:border-rose-900">
          <FaJava className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">Java</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-blue-600 hover:bg-opacity-20 hover:border-blue-600">
          <SiCplusplus className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">C++</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-blue-500 hover:bg-opacity-20 hover:border-blue-500">
          <SiTypescript className="black dark:white" size={22} />
          <text className="text-lg text-black dark:text-white">Typescript</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-yellow-500 hover:bg-opacity-20 hover:border-yellow-500">
          <IoLogoJavascript className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">Javascript</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-orange-600 hover:bg-opacity-20 hover:border-orange-600">
          <IoLogoHtml5 className="black dark:white" size={23} />
          <text className="text-lg text-black dark:text-white">HTML5</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-blue-600 hover:bg-opacity-20 hover:border-blue-600">
          <IoLogoCss3 className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">CSS3</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-gray-600 hover:bg-opacity-20 hover:border-gray-600">
          <BsFiletypeSql className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">SQL</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-cyan-500 hover:bg-opacity-20 hover:border-cyan-500">
          <FaReact className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">React</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-black hover:bg-opacity-20 hover:border-black">
          <SiNextdotjs className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">Next.js</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-green-600 hover:bg-opacity-20 hover:border-green-600">
          <FaNode className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">Node.js</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-pink-500 hover:bg-opacity-20 hover:border-pink-500">
          <SiStyledcomponents className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">Styled Components</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-sky-500 hover:bg-opacity-20 hover:border-sky-500">
          <SiTailwindcss className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">Tailwind CSS</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-yellow-400 hover:bg-opacity-20 hover:border-yellow-400">
          <SiFirebase className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">Firebase</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-gray-800 hover:bg-opacity-20 hover:border-gray-800">
          <SiExpress className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">Express</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-gray-400 hover:bg-opacity-20 hover:border-gray-400">
          <SiSocketdotio className="black dark:white" size={25} />
          <text className="text-lg text-black dark:text-white">Socket.io</text>
        </a>
        <a className="flex flex-row items-center justify-center gap-2 border-2 border-gray-500 rounded-xl px-4 py-3 hover:bg-orange-500 hover:bg-opacity-20 hover:border-orange-500">
          <FaGitAlt className="black dark:white" size={23} />
          <text className="text-lg text-black dark:text-white">Git</text>
        </a>
      </div>
    </section>
  );
};