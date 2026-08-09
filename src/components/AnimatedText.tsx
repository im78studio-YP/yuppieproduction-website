import { useEffect, useRef, useState, type CSSProperties } from "react";

export default function AnimatedText({ text, style }: { text: string; style?: CSSProperties }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.8;
      const end = vh * 0.2;
      const prog = (start - r.top) / (start - end + r.height);
      setP(Math.min(1, Math.max(0, prog)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const chars = text.split("");
  const total = chars.length;
  return (
    <p ref={ref} style={style}>
      {chars.map((c, i) => {
        const op = Math.min(1, Math.max(0.2, p * total - i));
        return (
          <span key={i} style={{ opacity: op, transition: "opacity .1s linear" }}>
            {c}
          </span>
        );
      })}
    </p>
  );
}
