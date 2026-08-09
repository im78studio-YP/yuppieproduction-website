import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type LightboxProps = {
  images: string[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
};

export default function Lightbox({ images, index, onClose, onIndex }: LightboxProps) {
  const hasMany = images.length > 1;
  const prev = useCallback(
    () => onIndex((index - 1 + images.length) % images.length),
    [index, images.length, onIndex]
  );
  const next = useCallback(
    () => onIndex((index + 1) % images.length),
    [index, images.length, onIndex]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const roundBtn: React.CSSProperties = {
    position: "absolute", background: "rgba(215,226,234,.08)",
    border: "1px solid rgba(215,226,234,.25)", borderRadius: "50%",
    width: 48, height: 48, color: "#D7E2EA", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000, background: "rgba(12,12,12,.93)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <button onClick={onClose} aria-label="ปิด"
        style={{ ...roundBtn, top: 20, right: 20 }}>
        <X size={26} />
      </button>

      {hasMany && (
        <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="ก่อนหน้า"
          style={{ ...roundBtn, left: 16 }}>
          <ChevronLeft size={28} />
        </button>
      )}

      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "90vw", maxHeight: "86vh", objectFit: "contain",
          borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}
      />

      {hasMany && (
        <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="ถัดไป"
          style={{ ...roundBtn, right: 16 }}>
          <ChevronRight size={28} />
        </button>
      )}

      {hasMany && (
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          color: "#D7E2EA", fontSize: 14, letterSpacing: ".1em" }}>
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
