import React, { ReactNode } from "react";
import Image, { StaticImageData } from "next/image";
import VideoY from "./VideoY";

interface Props {
  children?: ReactNode;
  title: string;
  stack: string;
  description: string;
  photo: StaticImageData;
  repo: string;
  app: string;
  color: string;
  hover: string;
  link: string;
  media: string;
}

export default function Project({
  title,
  stack,
  description,
  photo,
  repo,
  app,
  color,
  hover,
  link,
  media
}: Props) {
  return (
    <div className="lg:w-[570px] flex align-center flex-col rounded-2xl border-4 border-neutral-800 p-4 mb-11">
      <div className="flex-grow">
        {media == "video" ? 
          <VideoY embedId={link} />
        : (media == "image" ? 
          <div className="w-full aspect-video border border-neutral-600">
            <Image
              src={photo}
              alt="placeholder"
              className="w-full h-full object-cover"
            />
          </div>
        : null)}
        <h2 className={`text-2xl font-semibold my-4 ${color}`}>{title}</h2>
        <p className="text-xl mb-4 font-semibold text-opacity-80 text-black dark:text-opacity-80 dark:text-white">{stack}</p>
        <p className="text-lg text-opacity-80 text-black dark:text-opacity-80 dark:text-white">{description}</p>
      </div>
      
      <div className={`mt-4 ${app && repo ? "flex gap-2" : ""}`}>
        {app && (
          <a
            href={app}
            target="_blank"
            rel="noreferrer"
            className={`${hover} ${repo ? "w-1/2" : "w-full"} flex justify-center px-6 py-3 font-semibold rounded-xl bg-black dark:bg-white hover:bg-opacity-80 dark:hover:bg-slate-200 text-white dark:text-black`}
          >
            Web App
          </a>
        )}
        {repo && (
          <a
            href={repo}
            target="_blank"
            rel="noreferrer"
            className={`${hover} ${app ? "w-1/2" : "w-full"} flex justify-center px-6 py-3 font-semibold rounded-xl bg-black dark:bg-white hover:bg-opacity-80 dark:hover:bg-slate-200 text-white dark:text-black`}
          >
            GitHub Repo
          </a>
        )}
      </div>
    </div>
  );
};