import FadeIn from "../components/FadeIn";
import Magnet from "../components/Magnet";
import Placeholder from "../components/Placeholder";
import { site } from "../data/site";

export default function Hero() {
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflowX: "clip" }}>
      <FadeIn as="nav" y={-20} delay={0} className="nav">
        <a href="#about">{site.menuAbout}</a>
        <a href="#services">{site.menuServices}</a>
        <a href="#projects">{site.menuProjects}</a>
        <a href="#contact">{site.menuContact}</a>
      </FadeIn>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", padding: "0 24px" }}>
        <div style={{ width: "100%" }}>
          <FadeIn as="h1" y={40} delay={0.15} className="hero-heading hero-title">
            {site.heroHeading}
          </FadeIn>
        </div>

        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0, zIndex: 10, width: "min(46vw, 520px)" }}>
          <FadeIn y={30} delay={0.6}>
            <Magnet padding={150} strength={3}>
              {site.heroImage ? (
                <img src={site.heroImage} alt="Yuppie Production booth render"
                  style={{ width: "100%", height: "auto", display: "block", borderRadius: 24 }} />
              ) : (
                <Placeholder label="ใส่ภาพเรนเดอร์บูธเด่นที่สุดตรงนี้ (PNG พื้นใส) — อัปได้ที่ /admin"
                  style={{ width: "100%", aspectRatio: "3 / 4", borderRadius: 24 }} />
              )}
            </Magnet>
          </FadeIn>
        </div>

        <div className="hero-bottom">
          <FadeIn y={20} delay={0.35}>
            <p style={{ maxWidth: 260, fontWeight: 300, textTransform: "uppercase", letterSpacing: ".04em",
              lineHeight: 1.35, fontSize: "clamp(.75rem,1.4vw,1.5rem)", color: "#D7E2EA" }}>
              {site.heroTagline}
            </p>
          </FadeIn>
          <FadeIn y={20} delay={0.5}>
            <a href="#contact"><button className="btn-contact">{site.heroButton}</button></a>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
