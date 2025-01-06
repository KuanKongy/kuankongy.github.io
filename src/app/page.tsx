
import AboutMe from "./Components/AboutMe";
import MyLanguages from "./Components/Languages";
import MyExperiences from "./Components/Experiences";
import MyProjects from "./Components/Projects";
import Contact from "./Components/Contact";
import Footer from "./Components/Footer";


export default function Home() {
  return (
    <div>
      <div className="flex min-h-screen flex-col container mx-auto py-0 px-10 lg:px-44 overscroll-none">
        <AboutMe />
        <MyLanguages />
        <MyExperiences />
        <MyProjects />
        <Contact />
      </div>
      <Footer />
    </div>
  );
}
