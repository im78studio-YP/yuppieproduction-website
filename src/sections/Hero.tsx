import FadeIn from "../components/FadeIn";
import Magnet from "../components/Magnet";
import Placeholder from "../components/Placeholder";

export default function Hero() {
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflowX: "clip" }}>
      <FadeIn as="nav" y={-20} delay={0} className="nav">
        <a href="#about">เกี่ยวกับเรา</a>
        <a href="#services">บริการ</a>
        <a href="#projects">ผลงาน</a>
        <a href="#contact">ติดต่อ</a>
      </FadeIn>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", padding: "0 24px" }}>
        <div style={{ overflow: "hidden", width: "100%" }}>
          <FadeIn as="h1" y={40} delay={0.15} className="hero-heading"
            style={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.03em",
              lineHeight: 0.9, whiteSpace: "nowrap", width: "100%", fontSize: "16vw", marginBottom: "-1vw" }}>
            YUPPIE
          </FadeIn>
        </div>

        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0, zIndex: 10, width: "min(46vw, 520px)" }}>
          <FadeIn y={30} delay={0.6}>
            <Magnet padding={150} strength={3}>
              <Placeholder label="ใส่ภาพเรนเดอร์บูธเด่นที่สุดตรงนี้ (PNG พื้นใส)"
                style={{ width: "100%", aspectRatio: "3 / 4", borderRadius: 24 }} />
            </Magnet>
          </FadeIn>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 40, position: "relative", zIndex: 20 }}>
          <FadeIn y={20} delay={0.35}>
            <p style={{ maxWidth: 260, fontWeight: 300, textTransform: "uppercase", letterSpacing: ".04em",
              lineHeight: 1.35, fontSize: "clamp(.75rem,1.4vw,1.5rem)", color: "#D7E2EA" }}>
              รับออกแบบและผลิตบูธนิทรรศการ คีออส และงานตกแต่งอีเวนต์ โดยทีมที่เขียนแบบผลิตเองได้ทั้งหมด
            </p>
          </FadeIn>
          <FadeIn y={20} delay={0.5}>
            <a href="#contact"><button className="btn-contact">ติดต่อเรา</button></a>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
