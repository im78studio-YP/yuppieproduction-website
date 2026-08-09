import FadeIn from "../components/FadeIn";
import { site } from "../data/site";
import { services } from "../data/services";

export default function Services() {
  return (
    <section id="services" className="svc" style={{ padding: "clamp(80px,10vw,128px) 20px", position: "relative", zIndex: 1 }}>
      <FadeIn as="h2" y={40}
        style={{ fontWeight: 900, textTransform: "uppercase", color: "#0C0C0C", textAlign: "center",
          lineHeight: 0.9, fontSize: "clamp(3rem,12vw,160px)", marginBottom: "clamp(64px,8vw,112px)" }}>
        {site.servicesHeading}
      </FadeIn>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        {services.map((s, i) => (
          <FadeIn key={s.number} y={30} delay={i * 0.1}>
            <div className="svc-item">
              <div className="svc-num">{s.number}</div>
              <div>
                <div className="svc-name">{s.name}</div>
                <div className="svc-desc">{s.description}</div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
