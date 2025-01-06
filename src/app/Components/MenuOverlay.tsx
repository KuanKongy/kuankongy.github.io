import React from "react";
import NavLink from "./NavLink";

const navLinks = [
  {
    title: "About",
    path: "about",
    hover: "hover:text-red-500",
  },
  {
    title: "Languages",
    path: "languages",
    hover: "hover:text-green-500",
  },
  {
    title: "Experiences",
    path: "experiences",
    hover: "hover:text-orange-500",
  },
  {
    title: "Projects",
    path: "projects",
    hover: "hover:text-purple-500",
  },
  {
    title: "Contact",
    path: "contact",
    hover: "hover:text-blue-500",
  },
];

export default function  MenuOverlay() {
  return (
    <ul className="flex flex-col pb-4 items-center md:hidden">
      {navLinks.map((link, index) => (
        <li key={index}>
          <NavLink href={link.path} title={link.title} hover={link.hover}/>
        </li>
      ))}
    </ul>
  );
};