import { type CSSProperties } from "react";

type PhProps = {
  label: string;
  src?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

export default function Placeholder({ label, src, className = "", style, onClick }: PhProps) {
  const clickable = Boolean(onClick && src);
  return (
    <div
      className={`ph ${className}`.trim()}
      style={{ ...style, cursor: clickable ? "pointer" : undefined }}
      onClick={clickable ? onClick : undefined}
    >
      {src ? <img src={src} alt={label} loading="lazy" /> : <span>{label}</span>}
    </div>
  );
}
