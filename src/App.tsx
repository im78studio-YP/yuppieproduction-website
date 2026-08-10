import Hero from "./sections/Hero";
import About from "./sections/About";
import Services from "./sections/Services";
import Projects from "./sections/Projects";
import BackToTop from "./components/BackToTop";

export default function App() {
  return (
    <>
      <Hero />
      <About />
      <Services />
      <Projects />
      <BackToTop />
    </>
  );
}
