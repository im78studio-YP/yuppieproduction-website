import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";

/* =========================================================================
   Yuppie Production — 3D-Creator-style landing page, adapted for a booth
   fabrication company. No external image hotlinks (placeholders labelled
   in Thai where real booth photos go). No framer-motion — all motion is
   hand-rolled with hooks so it runs self-contained in the artifact.
   ========================================================================= */

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap";

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
.yp-root{font-family:'Kanit',sans-serif;background:#0C0C0C;color:#D7E2EA;overflow-x:clip}
.yp-scroll{height:100%;overflow-y:auto;overflow-x:clip;background:#0C0C0C}
.hero-heading{
  background:linear-gradient(180deg,#646973 0%,#BBCCD7 100%);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;color:transparent;
}

/* --- reusable buttons --- */
.btn-contact{
  border:none;cursor:pointer;color:#fff;font-family:inherit;font-weight:500;
  text-transform:uppercase;letter-spacing:.18em;border-radius:9999px;
  padding:14px 40px;font-size:clamp(.72rem,1vw,1rem);
  background:linear-gradient(123deg,#18011F 7%,#B600A8 37%,#7621B0 72%,#BE4C00 100%);
  box-shadow:0 4px 4px rgba(181,1,167,.25),4px 4px 12px #7721B1 inset;
  outline:2px solid #fff;outline-offset:-3px;transition:transform .2s ease,filter .2s ease;
}
.btn-contact:hover{transform:translateY(-2px);filter:brightness(1.08)}
.btn-ghost{
  cursor:pointer;background:transparent;font-family:inherit;font-weight:500;
  text-transform:uppercase;letter-spacing:.18em;border-radius:9999px;
  border:2px solid #D7E2EA;color:#D7E2EA;padding:12px 34px;
  font-size:clamp(.72rem,1vw,1rem);transition:background .2s ease;
  display:inline-flex;align-items:center;gap:.4em;
}
.btn-ghost:hover{background:rgba(215,226,234,.10)}

/* --- fade-in --- */
.fade{opacity:0;transition:opacity .7s cubic-bezier(.25,.1,.25,1),transform .7s cubic-bezier(.25,.1,.25,1)}
.fade.in{opacity:1;transform:none!important}

/* --- placeholder tiles (where real booth photos go) --- */
.ph{
  position:relative;display:flex;align-items:center;justify-content:center;
  background:
    linear-gradient(135deg,rgba(215,226,234,.06),rgba(118,33,176,.10)),
    repeating-linear-gradient(45deg,rgba(215,226,234,.03) 0 12px,transparent 12px 24px);
  border:1px dashed rgba(215,226,234,.22);color:rgba(215,226,234,.55);
  font-weight:400;letter-spacing:.05em;text-align:center;padding:12px;overflow:hidden;
}
.ph span{font-size:clamp(.62rem,1vw,.85rem);line-height:1.4}

/* --- navbar --- */
.nav{display:flex;justify-content:space-between;padding:26px 24px 0;gap:16px}
.nav a{color:#D7E2EA;font-weight:500;text-transform:uppercase;letter-spacing:.08em;
  text-decoration:none;font-size:clamp(.78rem,1.2vw,1.4rem);transition:opacity .2s}
.nav a:hover{opacity:.7}

/* --- marquee --- */
.mq-row{display:flex;gap:12px;will-change:transform}
.mq-tile{flex:0 0 auto;width:420px;height:270px;border-radius:16px;overflow:hidden}
@media(max-width:640px){.mq-tile{width:280px;height:180px}}

/* --- services (white) --- */
.svc{background:#fff;border-top-left-radius:56px;border-top-right-radius:56px}
.svc-item{display:flex;gap:clamp(16px,3vw,48px);align-items:flex-start;
  border-top:1px solid rgba(12,12,12,.15);padding:clamp(28px,4vw,48px) 0}
.svc-num{font-weight:900;color:#0C0C0C;line-height:.8;font-size:clamp(2.6rem,9vw,140px)}
.svc-name{font-weight:500;text-transform:uppercase;color:#0C0C0C;
  font-size:clamp(1rem,2.2vw,2.1rem);line-height:1.05}
.svc-desc{font-weight:300;color:#0C0C0C;opacity:.6;line-height:1.6;max-width:640px;
  margin-top:8px;font-size:clamp(.85rem,1.6vw,1.25rem)}

/* --- projects sticky stack --- */
.proj-card{border:2px solid #D7E2EA;background:#0C0C0C;border-radius:48px;
  padding:clamp(16px,2.4vw,32px);will-change:transform}
.proj-top{display:flex;flex-wrap:wrap;align-items:center;gap:16px 24px;margin-bottom:clamp(16px,2vw,28px)}
.proj-grid{display:grid;grid-template-columns:40% 60%;gap:12px}
@media(max-width:640px){.proj-grid{grid-template-columns:1fr}}
.eyebrow{font-size:clamp(.66rem,1vw,.85rem);letter-spacing:.22em;text-transform:uppercase;color:#8A929B}

.corner{position:absolute;pointer-events:none}
`;

/* ---------- FadeIn wrapper (IntersectionObserver) ---------- */
function FadeIn({ children, delay = 0, x = 0, y = 30, as = "div", style = {}, className = "" }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0, rootMargin: "50px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={`fade ${seen ? "in" : ""} ${className}`}
      style={{
        transform: seen ? "none" : `translate(${x}px, ${y}px)`,
        transitionDelay: `${delay}s`,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/* ---------- Magnet (mouse-following) ---------- */
function Magnet({ children, padding = 150, strength = 3 }) {
  const ref = useRef(null);
  const [t, setT] = useState({ x: 0, y: 0, active: false });
  useEffect(() => {
    const onMove = (e) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const within =
        Math.abs(dx) < r.width / 2 + padding && Math.abs(dy) < r.height / 2 + padding;
      if (within) setT({ x: dx / strength, y: dy / strength, active: true });
      else setT({ x: 0, y: 0, active: false });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [padding, strength]);
  return (
    <div
      ref={ref}
      style={{
        transform: `translate3d(${t.x}px, ${t.y}px, 0)`,
        transition: t.active ? "transform .3s ease-out" : "transform .6s ease-in-out",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- AnimatedText (char-by-char scroll reveal) ---------- */
function AnimatedText({ text, style }) {
  const ref = useRef(null);
  const [p, setP] = useState(0);
  const scroller = useRef(null);
  useEffect(() => {
    scroller.current = document.querySelector(".yp-scroll");
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // start when top at 0.8*vh, end when bottom at 0.2*vh
      const start = vh * 0.8;
      const end = vh * 0.2;
      const prog = (start - r.top) / (start - end + r.height);
      setP(Math.min(1, Math.max(0, prog)));
    };
    const sc = scroller.current || window;
    sc.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => sc.removeEventListener("scroll", onScroll);
  }, []);
  const chars = text.split("");
  const total = chars.length;
  return (
    <p ref={ref} style={style}>
      {chars.map((c, i) => {
        const charProg = p * total - i;
        const op = Math.min(1, Math.max(0.2, charProg));
        return (
          <span key={i} style={{ opacity: op, transition: "opacity .1s linear" }}>
            {c}
          </span>
        );
      })}
    </p>
  );
}

/* ---------- placeholder ---------- */
const Ph = ({ label, style, className = "" }) => (
  <div className={`ph ${className}`} style={style}>
    <span>{label}</span>
  </div>
);

/* ========================= SECTIONS ========================= */

function Hero() {
  return (
    <section
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflowX: "clip" }}
    >
      <FadeIn as="nav" y={-20} delay={0} className="nav">
        <a href="#about">เกี่ยวกับเรา</a>
        <a href="#services">บริการ</a>
        <a href="#projects">ผลงาน</a>
        <a href="#contact">ติดต่อ</a>
      </FadeIn>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", padding: "0 24px" }}>
        {/* giant heading */}
        <div style={{ overflow: "hidden", width: "100%" }}>
          <FadeIn as="h1" y={40} delay={0.15}
            className="hero-heading"
            style={{
              fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.03em",
              lineHeight: .9, whiteSpace: "nowrap", width: "100%",
              fontSize: "16vw", marginBottom: "-1vw",
            }}>
            YUPPIE
          </FadeIn>
        </div>

        {/* hero portrait -> booth render placeholder, magnetic */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0, zIndex: 10, width: "min(46vw, 520px)" }}>
          <FadeIn y={30} delay={0.6}>
            <Magnet padding={150} strength={3}>
              <Ph label="ใส่ภาพเรนเดอร์บูธเด่นที่สุดตรงนี้ (PNG พื้นใส)"
                style={{ width: "100%", aspectRatio: "3/4", borderRadius: 24 }} />
            </Magnet>
          </FadeIn>
        </div>

        {/* bottom bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 40, position: "relative", zIndex: 20 }}>
          <FadeIn y={20} delay={0.35}>
            <p style={{ maxWidth: 260, fontWeight: 300, textTransform: "uppercase", letterSpacing: ".04em", lineHeight: 1.35, fontSize: "clamp(.75rem,1.4vw,1.5rem)", color: "#D7E2EA" }}>
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

function Marquee() {
  const wrapRef = useRef(null);
  const r1 = useRef(null);
  const r2 = useRef(null);
  useEffect(() => {
    const sc = document.querySelector(".yp-scroll");
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const offset = (window.innerHeight - top) * 0.3;
      if (r1.current) r1.current.style.transform = `translateX(${offset - 200}px)`;
      if (r2.current) r2.current.style.transform = `translateX(${-(offset - 200)}px)`;
    };
    (sc || window).addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => (sc || window).removeEventListener("scroll", onScroll);
  }, []);

  const row1 = Array.from({ length: 11 }, (_, i) => `เรนเดอร์ / ผลงานบูธ #${i + 1}`);
  const row2 = Array.from({ length: 10 }, (_, i) => `ภาพหน้างานติดตั้ง #${i + 1}`);
  const triple = (a) => [...a, ...a, ...a];

  return (
    <section ref={wrapRef} style={{ background: "#0C0C0C", padding: "120px 0 40px", overflow: "hidden" }}>
      <div className="mq-row" ref={r1}>
        {triple(row1).map((l, i) => <Ph key={i} className="mq-tile" label={l} />)}
      </div>
      <div className="mq-row" ref={r2} style={{ marginTop: 12 }}>
        {triple(row2).map((l, i) => <Ph key={i} className="mq-tile" label={l} />)}
      </div>
    </section>
  );
}

function CornerShape({ pos, delay, x, kind }) {
  // simple CSS 3D-ish decorations instead of hotlinked pngs
  const base = { position: "absolute", ...pos };
  return (
    <FadeIn className="corner" style={base} x={x} y={0} delay={delay} duration={0.9}>
      <div style={{ width: "clamp(80px,14vw,190px)", aspectRatio: "1", position: "relative" }}>
        {kind === "cube" && (
          <div style={{
            width: "70%", height: "70%", margin: "15%",
            background: "linear-gradient(135deg,#7621B0,#BE4C00)",
            borderRadius: 14, transform: "rotate(12deg)",
            boxShadow: "0 20px 40px rgba(118,33,176,.35)", opacity: .8,
          }} />
        )}
        {kind === "ring" && (
          <div style={{
            width: "80%", height: "80%", margin: "10%", borderRadius: "50%",
            border: "10px solid rgba(215,226,234,.25)",
            boxShadow: "inset 0 0 30px rgba(182,0,168,.35)", opacity: .85,
          }} />
        )}
        {kind === "frame" && (
          <div style={{
            width: "78%", height: "78%", margin: "11%",
            border: "3px solid #B600A8", borderRadius: 10,
            transform: "rotate(-10deg)", opacity: .7,
          }} />
        )}
        {kind === "bars" && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: "80%", justifyContent: "center" }}>
            {[.5, .8, .6, 1].map((h, i) => (
              <div key={i} style={{ width: "16%", height: `${h * 100}%`, borderRadius: 6,
                background: "linear-gradient(180deg,#BBCCD7,#646973)", opacity: .7 }} />
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}

function About() {
  return (
    <section id="about" style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", position: "relative", padding: "80px 20px" }}>
      <CornerShape pos={{ top: "4%", left: "3%" }} x={-80} delay={0.1} kind="ring" />
      <CornerShape pos={{ bottom: "8%", left: "6%" }} x={-80} delay={0.25} kind="cube" />
      <CornerShape pos={{ top: "4%", right: "3%" }} x={80} delay={0.15} kind="bars" />
      <CornerShape pos={{ bottom: "8%", right: "6%" }} x={80} delay={0.3} kind="frame" />

      <FadeIn as="h2" y={40} delay={0} className="hero-heading"
        style={{ fontWeight: 900, textTransform: "uppercase", lineHeight: .9,
          letterSpacing: "-.02em", textAlign: "center", fontSize: "clamp(3rem,12vw,160px)",
          marginBottom: "clamp(40px,6vw,64px)" }}>
        เกี่ยวกับเรา
      </FadeIn>

      <AnimatedText
        text="Yuppie Production ก่อตั้งจากพื้นฐานงานออกแบบ เราจึงรีวิวแบบ แก้แบบ และเขียน shop drawing เพื่อผลิตได้เองในทีม โดยไม่ต้องส่งผ่านดีไซเนอร์ภายนอก งานบูธจึงคุมได้ทั้งความสวยและความเป็นไปได้ในการผลิตตั้งแต่ต้นจนจบ"
        style={{ fontWeight: 500, textAlign: "center", lineHeight: 1.7, maxWidth: 620,
          color: "#D7E2EA", fontSize: "clamp(1rem,2vw,1.35rem)", marginBottom: "clamp(64px,8vw,96px)" }}
      />

      <FadeIn y={20} delay={0.2}>
        <a href="#contact"><button className="btn-contact">คุยกับเรา</button></a>
      </FadeIn>
    </section>
  );
}

const SERVICES = [
  ["01", "ออกแบบบูธ", "ออกแบบคอนเซ็ปต์และเรนเดอร์ 3D ให้เห็นภาพจริงก่อนผลิต ปรับได้จนกว่าจะตรงกับแบรนด์และงบประมาณ"],
  ["02", "เขียนแบบ SHOP DRAWING", "จุดแข็งของเรา — เขียนแบบผลิตเองในทีมจากพื้นฐานดีไซน์ ควบคุมรายละเอียดวัสดุและโครงสร้างได้ตั้งแต่ต้น"],
  ["03", "ผลิตและติดตั้ง", "งานโครงเหล็ก ตัด CNC งานพิมพ์ และประกอบติดตั้งหน้างาน ครบในทีมเดียว คุมคุณภาพและเวลาได้"],
  ["04", "คีออส / KIOSK", "ออกแบบและผลิตคีออสและจุดขายสำหรับพื้นที่รีเทลและอีเวนต์ ทั้งแบบถอดประกอบและติดตั้งถาวร"],
  ["05", "งานตกแต่งอีเวนต์", "งานตกแต่งและ installation เฉพาะกิจ เช่น งานไฟและงานตกแต่งกลางแจ้ง คิดราคาแบบแยกส่วนตามจริง"],
];

function Services() {
  return (
    <section id="services" className="svc" style={{ padding: "clamp(80px,10vw,128px) 20px", position: "relative", zIndex: 1 }}>
      <FadeIn as="h2" y={40}
        style={{ fontWeight: 900, textTransform: "uppercase", color: "#0C0C0C", textAlign: "center",
          lineHeight: .9, fontSize: "clamp(3rem,12vw,160px)", marginBottom: "clamp(64px,8vw,112px)" }}>
        บริการ
      </FadeIn>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        {SERVICES.map(([n, name, desc], i) => (
          <FadeIn key={n} y={30} delay={i * 0.1}>
            <div className="svc-item">
              <div className="svc-num">{n}</div>
              <div>
                <div className="svc-name">{name}</div>
                <div className="svc-desc">{desc}</div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

const PROJECTS = [
  ["01", "ลูกค้า", "SALANA — Health Food Brand"],
  ["02", "ลูกค้า", "Bangkok Life × TISCO Co-branded Booth"],
  ["03", "ลูกค้า", "AIA — Outdoor Light Installation"],
];

function ProjectCard({ data, index, total }) {
  const wrapRef = useRef(null);
  const cardRef = useRef(null);
  const stickyTop = 110;
  const targetScale = 1 - (total - 1 - index) * 0.03;
  useEffect(() => {
    const sc = document.querySelector(".yp-scroll");
    const onScroll = () => {
      const w = wrapRef.current, c = cardRef.current;
      if (!w || !c) return;
      const rectTop = w.getBoundingClientRect().top;
      const raw = (stickyTop - rectTop) / (w.offsetHeight * 0.7);
      const clamped = Math.min(1, Math.max(0, raw));
      const scale = 1 - clamped * (1 - targetScale);
      c.style.transform = `scale(${scale})`;
    };
    (sc || window).addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => (sc || window).removeEventListener("scroll", onScroll);
  }, [targetScale]);
  const [n, cat, name] = data;
  return (
    <div ref={wrapRef} style={{ height: "85vh", display: "flex", alignItems: "flex-start" }}>
      <div ref={cardRef} className="proj-card"
        style={{ position: "sticky", top: stickyTop + index * 28, width: "100%", transformOrigin: "top center" }}>
        <div className="proj-top">
          <div className="svc-num" style={{ color: "#D7E2EA" }}>{n}</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="eyebrow">{cat}</div>
            <div style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "clamp(1.1rem,2.4vw,2rem)", lineHeight: 1.1 }}>{name}</div>
          </div>
          <button className="btn-ghost">ดูผลงาน <ArrowUpRight size={16} /></button>
        </div>
        <div className="proj-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Ph label="ภาพบูธ 1" style={{ borderRadius: 40, height: "clamp(130px,16vw,230px)" }} />
            <Ph label="ภาพบูธ 2" style={{ borderRadius: 40, height: "clamp(160px,22vw,340px)" }} />
          </div>
          <Ph label="ภาพบูธหลัก (แนวตั้ง)" style={{ borderRadius: 40, height: "100%", minHeight: 300 }} />
        </div>
      </div>
    </div>
  );
}

function Projects() {
  return (
    <section id="projects" style={{ background: "#0C0C0C", borderTopLeftRadius: 56, borderTopRightRadius: 56,
      marginTop: -48, position: "relative", zIndex: 10, padding: "clamp(60px,8vw,100px) 20px 40px" }}>
      <FadeIn as="h2" y={40} className="hero-heading"
        style={{ fontWeight: 900, textTransform: "uppercase", lineHeight: .9, letterSpacing: "-.02em",
          textAlign: "center", fontSize: "clamp(3rem,12vw,160px)", marginBottom: "clamp(40px,6vw,64px)" }}>
        ผลงาน
      </FadeIn>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p[0]} data={p} index={i} total={PROJECTS.length} />
        ))}
      </div>
      <footer id="contact" style={{ textAlign: "center", padding: "clamp(80px,12vw,160px) 0 40px" }}>
        <FadeIn y={30}>
          <div className="hero-heading" style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "clamp(2rem,8vw,90px)", lineHeight: .95, marginBottom: 28 }}>
            สร้างบูธที่คนจำได้<br />ไปด้วยกัน
          </div>
          <a href="#"><button className="btn-contact">ติดต่อ Yuppie</button></a>
          <div style={{ marginTop: 40, color: "#5c636b", fontSize: 13, letterSpacing: ".05em" }}>
            Yuppie Production Co., Ltd. — ยัพพี โปรดักชั่น จำกัด
          </div>
        </FadeIn>
      </footer>
    </section>
  );
}

export default function YuppieSite() {
  useEffect(() => {
    document.title = "Yuppie Production — Booth Design & Fabrication";
    if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = FONT_HREF;
      document.head.appendChild(l);
    }
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);

  return (
    <div className="yp-root" style={{ height: "100vh" }}>
      <div className="yp-scroll">
        <Hero />
        <Marquee />
        <About />
        <Services />
        <Projects />
      </div>
    </div>
  );
}
