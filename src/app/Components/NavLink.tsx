import React, { ReactNode } from "react";
import {Link} from "react-scroll";
interface Props {
  children?: ReactNode;
  href: string;
  title: string;
  hover: string;
}

export default function NavLink({ href, title, hover }: Props) {
  return (
    <Link
      to={href}
      spy={true}
      smooth={true}
      offset={-75}
      duration={0}
      className={`block py-2 pl-3 pr-4 text-xl dark:text-gray-300 text-black font-semibold rounded-md md:py-2 md:px-4 hover:bg-slate-600 ${hover}`}
    >
      {title}
    </Link>
  );
};