import { useEffect, useRef } from "react";
import Placeholder from "../components/Placeholder";
import { media } from "../data/media";

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

  const triple = <T,>(a: T[]) => [...a, ...a, ...a];
  const imgs = media.marqueeImages ?? [];
  const has = imgs.length > 0;

  let row1: JSX.Element[];
  let row2: JSX.Element[];
  if (has) {
    const mid = Math.ceil(imgs.length / 2);
    const a = imgs.slice(0, mid);
    const bRaw = imgs.slice(mid);
    const b = bRaw.length ? bRaw : a;
    row1 = triple(a).map((s, i) => <Placeholder key={i} className="mq-tile" label="" src={s} />);
    row2 = triple(b).map((s, i) => <Placeholder key={i} className="mq-tile" label="" src={s} />);
  } else {
    const p1 = Array.from({ length: 8 }, (_, i) => `เรนเดอร์ / ผลงานบูธ #${i + 1}`);
    const p2 = Array.from({ length: 8 }, (_, i) => `ภาพหน้างานติดตั้ง #${i + 1}`);
    row1 = triple(p1).map((l, i) => <Placeholder key={i} className="mq-tile" label={l} />);
    row2 = triple(p2).map((l, i) => <Placeholder key={i} className="mq-tile" label={l} />);
  }

  return (
    <section ref={wrapRef} className="mq-section">
      <div className="mq-row" ref={r1}>{row1}</div>
      <div className="mq-row" ref={r2} style={{ marginTop: 12 }}>{row2}</div>
    </section>
  );
}
