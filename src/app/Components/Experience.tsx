import React, { ReactNode } from "react";

interface Props {
  children?: ReactNode;
  place: string;
  titleData: string;
  description: string;
  pointF: string;
  pointS: string;
  pointT: string;
  result: string;
  color: string;
}

export default function Experience({
  place,
  titleData,
  description,
  pointF,
  pointS,
  pointT,
  result,
  color
}: Props) {
  return (
    <div className="lg:w-2/3 flex align-center flex-col rounded-2xl border-4 border-neutral-800 p-4 mb-11">
      <h2 className={`text-2xl font-semibold my-4 ${color}`}>{place}</h2>
      <p className="text-xl mb-4 font-semibold text-opacity-80 text-black dark:text-opacity-80 dark:text-white">{titleData}</p>
      <div className="flex flex-col gap-4">
        <p className="text-lg text-opacity-80 text-black dark:text-opacity-80 dark:text-white">{description}</p>
        <ul className="list-disc pl-5 text-lg font-light text-opacity-80 text-black dark:text-opacity-80 dark:text-white">
          <li>{pointF}</li>
          <li>{pointS}</li>
          <li>{pointT}</li>
        </ul>
        <p className="text-lg text-opacity-80 text-black dark:text-opacity-80 dark:text-white">{result}</p>
      </div>
    </div>
  );
};
