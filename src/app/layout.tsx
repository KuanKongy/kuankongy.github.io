import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "./Components/NavBar";
import "./globals.css";
import { ThemeProvider } from 'next-themes'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nam's Portfolio",
  description: "My personal website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`}>
      <ThemeProvider 
          attribute="class"
          defaultTheme="system"
          enableSystem>
        <NavBar />
        <div className="absolute top-0 z-[-2] h-auto w-screen bg-white dark:bg-black dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
          {children}
        </div>
        </ThemeProvider>
      </body>
    </html>
  ); //dark:bg-neutral-950
}
