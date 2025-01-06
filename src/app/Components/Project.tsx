import React, { ReactNode } from "react";
import Image, { StaticImageData } from "next/image";

interface Props {
  children?: ReactNode;
  title: string;
  stack: string;
  description: string;
  photo: StaticImageData;
  repo: string;
  color: string;
  hover: string;
  empty: boolean;
}

export default function Project({
  title,
  stack,
  description,
  photo,
  repo,
  color,
  hover,
  empty
}: Props) {
  return (
    <div className="lg:w-2/3 flex align-center flex-col rounded-2xl border-4 border-neutral-800 p-4 mb-11">
      {empty ? null : 
        <Image
          src={photo}
          alt="placeholder"
          className="mx-auto w-full h-auto"
        />}
      <h2 className={`text-2xl font-semibold my-4 ${color}`}>{title}</h2>
      <p className="text-xl mb-4 font-semibold text-opacity-80 text-black dark:text-opacity-80 dark:text-white">{stack}</p>
      <p className="text-lg text-opacity-80 text-black dark:text-opacity-80 dark:text-white">{description}</p>
      <a
        href={repo}
        target="_blank"
        rel="noreferrer"
        className={`${hover} flex justify-center px-6 py-3 mt-8 font-semibold rounded-xl mr-4 bg-black dark:bg-white hover:bg-opacity-80 dark:hover:bg-slate-200 text-white dark:text-black`}
      >
        Visit Github Repo
      </a>
    </div>
  );
};