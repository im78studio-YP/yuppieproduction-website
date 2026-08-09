import { type CSSProperties } from "react";

type PhProps = { label: string; src?: string; className?: string; style?: CSSProperties };

export default function Placeholder({ label, src, className = "", style }: PhProps) {
  return (
    <div className={`ph ${className}`.trim()} style={style}>
      {src ? <img src={src} alt={label} loading="lazy" /> : <span>{label}</span>}
    </div>
  );
}
