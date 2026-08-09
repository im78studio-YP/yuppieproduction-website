import { useEffect, useRef } from "react";
import FadeIn from "../components/FadeIn";
import Placeholder from "../components/Placeholder";
import { ArrowUpRight } from "lucide-react";
import { projects, type Project } from "../data/projects";

function ProjectCard({ data, index, total }: { data: Project; index: number; total: number }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const stickyTop = 110;
  const targetScale = 1 - (total - 1 - index) * 0.03;

  useEffect(() => {
    const onScroll = () => {
      const w = wrapRef.current, c = cardRef.current;
      if (!w || !c) return;
      const rectTop = w.getBoundingClientRect().top;
      const raw = (stickyTop - rectTop) / (w.offsetHeight * 0.7);
      const clamped = Math.min(1, Math.max(0, raw));
      c.style.transform = `scale(${1 - clamped * (1 - targetScale)})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [targetScale]);

  const imgs = data.images ?? [];
  return (
    <div ref={wrapRef} style={{ height: "85vh", display: "flex", alignItems: "flex-start" }}>
      <div ref={cardRef} className="proj-card" style={{ position: "sticky", top: stickyTop + index * 28, width: "100%" }}>
        <div className="proj-top">
          <div className="svc-num" style={{ color: "#D7E2EA" }}>{data.number}</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="eyebrow">{data.category}</div>
            <div style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "clamp(1.1rem,2.4vw,2rem)", lineHeight: 1.1 }}>
              {data.name}
            </div>
          </div>
          <button className="btn-ghost">ดูผลงาน <ArrowUpRight size={16} /></button>
        </div>
        <div className="proj-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Placeholder label="ภาพบูธ 1" src={imgs[0]} style={{ borderRadius: 40, height: "clamp(130px,16vw,230px)" }} />
            <Placeholder label="ภาพบูธ 2" src={imgs[1]} style={{ borderRadius: 40, height: "clamp(160px,22vw,340px)" }} />
          </div>
          <Placeholder label="ภาพบูธหลัก (แนวตั้ง)" src={imgs[2]} style={{ borderRadius: 40, height: "100%", minHeight: 300 }} />
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" style={{ background: "#0C0C0C", borderTopLeftRadius: 56, borderTopRightRadius: 56,
      marginTop: -48, position: "relative", zIndex: 10, padding: "clamp(60px,8vw,100px) 20px 40px" }}>
      <FadeIn as="h2" y={40} className="hero-heading"
        style={{ fontWeight: 900, textTransform: "uppercase", lineHeight: 0.9, letterSpacing: "-.02em",
          textAlign: "center", fontSize: "clamp(3rem,12vw,160px)", marginBottom: "clamp(40px,6vw,64px)" }}>
        ผลงาน
      </FadeIn>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {projects.map((p, i) => (
          <ProjectCard key={p.number} data={p} index={i} total={projects.length} />
        ))}
      </div>
      <footer id="contact" style={{ textAlign: "center", padding: "clamp(80px,12vw,160px) 0 40px" }}>
        <FadeIn y={30}>
          <div className="hero-heading" style={{ fontWeight: 900, textTransform: "uppercase",
            fontSize: "clamp(2rem,8vw,90px)", lineHeight: 0.95, marginBottom: 28 }}>
            สร้างบูธที่คนจำได้<br />ไปด้วยกัน
          </div>
          <a href="mailto:hello@yuppieproduction.com"><button className="btn-contact">ติดต่อ Yuppie</button></a>
          <div style={{ marginTop: 40, color: "#5c636b", fontSize: 13, letterSpacing: ".05em" }}>
            Yuppie Production Co., Ltd. — ยัพพี โปรดักชั่น จำกัด
          </div>
        </FadeIn>
      </footer>
    </section>
  );
}
