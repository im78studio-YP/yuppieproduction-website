import Hero from "./sections/Hero";
import BoothComparison from "./sections/BoothComparison";
import About from "./sections/About";
import Services from "./sections/Services";
import Projects from "./sections/Projects";
import BackToTop from "./components/BackToTop";
import LineButton from "./components/LineButton";
import Popup from "./components/Popup";

export default function App() {
  return (
    <>
      <Hero />
      <BoothComparison />
      <About />
      <Services />
      <Projects />
      <LineButton />
      <BackToTop />
      <Popup />
    </>
  );
}
