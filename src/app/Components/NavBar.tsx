"use client";
import React, { useState } from "react";
import NavLink from "./NavLink";
import MenuOverlay from "./MenuOverlay";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import ThemeSwitcher from './ThemeSwitcher'

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

export default function Header() {
  const [navbarOpen, setNavbarOpen] = useState(false);
  return (
    <nav className="fixed pb-0 top-0 left-0 right-0 z-999 bg-slate-200 dark:bg-[#121212] bg-opacity-90">
      <div className="flex flex-wrap items-center justify-end mx-auto py-4 pr-4 md:pr-0">
        <div className="mobile-menu flex flex-row items-center space-x-6 md:hidden">
          <ThemeSwitcher/>
          {navbarOpen ? (
            <button
              onClick={() => setNavbarOpen(false)}
              className="flex items-center px-3 pt-1.5 pb-2  rounded-md hover:bg-slate-600"
            >
              <XMarkIcon className="h-7 w-7" />
            </button>
          ) : (
            <button
              onClick={() => setNavbarOpen(true)}
              className="flex items-center px-3 pt-1.5 pb-2  rounded-md hover:bg-slate-600"
            >
              <Bars3Icon className="h-7 w-7" />
            </button>
          )}
        </div>
        <div className="menu hidden lg:pr-6 md:w-auto md:flex md:flex-row md:items-center md:space-x-2" id="navbar">
          <ul className="flex md:flex-row md:space-x-2 mt-0">
            {navLinks.map((link, index) => (
              <li key={index}>
                <NavLink href={link.path} title={link.title} hover={link.hover}/>
              </li>
            ))}
          </ul>
          <ThemeSwitcher/>
        </div>
      </div>
      {navbarOpen ? <MenuOverlay /> : null}
    </nav>
  );
};
