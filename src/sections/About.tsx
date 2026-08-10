import FadeIn from "../components/FadeIn";
import AnimatedText from "../components/AnimatedText";
import { site } from "../data/site";
import type { CSSProperties } from "react";

type CornerKind = "cube" | "ring" | "frame" | "bars";
function CornerShape({ pos, delay, x, kind }: { pos: CSSProperties; delay: number; x: number; kind: CornerKind }) {
  return (
    <FadeIn className="corner" style={{ position: "absolute", ...pos }} x={x} y={0} delay={delay}>
      <div style={{ width: "clamp(80px,14vw,190px)", aspectRatio: "1", position: "relative" }}>
        {kind === "cube" && (
          <div style={{ width: "70%", height: "70%", margin: "15%",
            background: "linear-gradient(135deg,#C2186F,#FF7EB3)", borderRadius: 14, transform: "rotate(12deg)",
            boxShadow: "0 20px 40px rgba(194,24,111,.35)", opacity: 0.8 }} />
        )}
        {kind === "ring" && (
          <div style={{ width: "80%", height: "80%", margin: "10%", borderRadius: "50%",
            border: "10px solid rgba(215,226,234,.25)", boxShadow: "inset 0 0 30px rgba(255,46,136,.35)", opacity: 0.85 }} />
        )}
        {kind === "frame" && (
          <div style={{ width: "78%", height: "78%", margin: "11%", border: "3px solid #FF2E88",
            borderRadius: 10, transform: "rotate(-10deg)", opacity: 0.7 }} />
        )}
        {kind === "bars" && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: "80%", justifyContent: "center" }}>
            {[0.5, 0.8, 0.6, 1].map((h, i) => (
              <div key={i} style={{ width: "16%", height: `${h * 100}%`, borderRadius: 6,
                background: "linear-gradient(180deg,#BBCCD7,#646973)", opacity: 0.7 }} />
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}

export default function About() {
  return (
    <section id="about" style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", position: "relative", padding: "80px 20px" }}>
      <CornerShape pos={{ top: "4%", left: "3%" }} x={-80} delay={0.1} kind="ring" />
      <CornerShape pos={{ bottom: "8%", left: "6%" }} x={-80} delay={0.25} kind="cube" />
      <CornerShape pos={{ top: "4%", right: "3%" }} x={80} delay={0.15} kind="bars" />
      <CornerShape pos={{ bottom: "8%", right: "6%" }} x={80} delay={0.3} kind="frame" />

      <FadeIn as="h2" y={40} delay={0} className="hero-heading"
        style={{ fontWeight: 900, textTransform: "uppercase", lineHeight: 1.12, letterSpacing: 0,
          textAlign: "center", fontSize: "clamp(2.6rem,11vw,150px)", paddingTop: ".05em",
          marginBottom: "clamp(32px,5vw,56px)", position: "relative", zIndex: 1 }}>
        {site.aboutHeading}
      </FadeIn>

      <AnimatedText
        text={site.aboutText}
        style={{ fontWeight: 500, textAlign: "center", lineHeight: 1.7, maxWidth: 620, color: "#D7E2EA",
          fontSize: "clamp(1rem,2vw,1.35rem)", marginBottom: "clamp(56px,7vw,88px)", position: "relative", zIndex: 1 }}
      />

      <FadeIn y={20} delay={0.2} style={{ position: "relative", zIndex: 1 }}>
        <a href="#contact"><button className="btn-contact">{site.aboutButton}</button></a>
      </FadeIn>
    </section>
  );
}
