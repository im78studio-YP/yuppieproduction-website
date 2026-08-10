import Hero from "./sections/Hero";
import Marquee from "./sections/Marquee";
import About from "./sections/About";
import Services from "./sections/Services";
import Projects from "./sections/Projects";
import BackToTop from "./components/BackToTop";

export default function App() {
  return (
    <>
      <Hero />
      <Marquee />
      <About />
      <Services />
      <Projects />
      <BackToTop />
    </>
  );
}
