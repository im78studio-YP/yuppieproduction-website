import { useEffect, useRef } from "react";
import Placeholder from "../components/Placeholder";

export default function Marquee() {
  const wrapRef = useRef<HTMLElement | null>(null);
  const r1 = useRef<HTMLDivElement | null>(null);
  const r2 = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const offset = (window.innerHeight - top) * 0.3;
      if (r1.current) r1.current.style.transform = `translateX(${offset - 200}px)`;
      if (r2.current) r2.current.style.transform = `translateX(${-(offset - 200)}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const row1 = Array.from({ length: 11 }, (_, i) => `เรนเดอร์ / ผลงานบูธ #${i + 1}`);
  const row2 = Array.from({ length: 10 }, (_, i) => `ภาพหน้างานติดตั้ง #${i + 1}`);
  const triple = (a: string[]) => [...a, ...a, ...a];

  return (
    <section ref={wrapRef} style={{ background: "#0C0C0C", padding: "120px 0 40px", overflow: "hidden" }}>
      <div className="mq-row" ref={r1}>
        {triple(row1).map((l, i) => <Placeholder key={i} className="mq-tile" label={l} />)}
      </div>
      <div className="mq-row" ref={r2} style={{ marginTop: 12 }}>
        {triple(row2).map((l, i) => <Placeholder key={i} className="mq-tile" label={l} />)}
      </div>
    </section>
  );
}
