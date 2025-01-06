"use client";
import {useTheme} from "next-themes";
import {useEffect, useState} from "react";
import { PiMoonFill, PiSun } from "react-icons/pi";
const ThemeSwitcher = () => {
  const [mount, setMount] = useState(false);
  const {systemTheme, theme, setTheme} = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  useEffect(() => {
    setMount(true);
  }, []);
  return mount ? (
    <div >
      <button
        onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
        type="button"
        className="flex h-11 w-11 p-2 items-center justify-center rounded-md hover:bg-slate-600"
      >
        {currentTheme === "dark" ? <PiSun style={{ color: "white" }} size={50} /> : <PiMoonFill style={{ color: "black" }} size={50} />}
      </button>
    </div>
  ) : null;
};
export default ThemeSwitcher;