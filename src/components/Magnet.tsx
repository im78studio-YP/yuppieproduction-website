import { useEffect, useRef, useState, type ReactNode } from "react";

type MagnetProps = { children: ReactNode; padding?: number; strength?: number };

export default function Magnet({ children, padding = 150, strength = 3 }: MagnetProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState({ x: 0, y: 0, active: false });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const within = Math.abs(dx) < r.width / 2 + padding && Math.abs(dy) < r.height / 2 + padding;
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
