import { createElement, useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

type FadeInProps = {
  children: ReactNode;
  delay?: number;
  x?: number;
  y?: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
};

export default function FadeIn({
  children, delay = 0, x = 0, y = 30, as = "div", className = "", style = {},
}: FadeInProps) {
  const ref = useRef<HTMLElement | null>(null);
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

  return createElement(
    as,
    {
      ref,
      className: `fade ${seen ? "in" : ""} ${className}`.trim(),
      style: {
        transform: seen ? "none" : `translate(${x}px, ${y}px)`,
        transitionDelay: `${delay}s`,
        ...style,
      },
    },
    children
  );
}
