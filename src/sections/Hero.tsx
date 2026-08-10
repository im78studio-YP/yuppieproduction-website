import FadeIn from "../components/FadeIn";
import Marquee from "./Marquee";
import LineContact from "../components/LineContact";
import { site } from "../data/site";

function toTop(e: React.MouseEvent) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function Hero() {
  return (
    <section style={{ position: "relative", overflowX: "clip" }}>
      <FadeIn as="nav" y={-20} delay={0} className="nav">
        <a href="#top" className="nav-logo" onClick={toTop} aria-label="กลับหน้าแรก">
          <img src="/logo-nav.png" alt="Yuppie Production" />
        </a>
        <div className="nav-links">
          <a href="#about">{site.menuAbout}</a>
          <a href="#services">{site.menuServices}</a>
          <a href="#projects">{site.menuProjects}</a>
          <a href="#contact">{site.menuContact}</a>
        </div>
      </FadeIn>

      {/* Marquee เป็นพระเอก อยู่ใต้เมนู เหนือหัวข้อ */}
      <Marquee />

      <div style={{ padding: "clamp(20px,4vw,52px) 24px clamp(28px,5vw,64px)" }}>
        <FadeIn as="h1" y={40} delay={0.15} className="hero-heading hero-title">
          {site.heroHeading}
        </FadeIn>

        <div className="hero-bottom" style={{ marginTop: "clamp(16px,3vw,34px)" }}>
          <FadeIn y={20} delay={0.35}>
            <p style={{ maxWidth: 340, fontWeight: 300, textTransform: "uppercase", letterSpacing: ".04em",
              lineHeight: 1.35, fontSize: "clamp(.75rem,1.4vw,1.5rem)", color: "#D7E2EA" }}>
              {site.heroTagline}
            </p>
          </FadeIn>
          <FadeIn y={20} delay={0.5}>
            <LineContact />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
