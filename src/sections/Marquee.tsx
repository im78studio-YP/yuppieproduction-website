import { useState } from "react";
import Lightbox from "../components/Lightbox";
import { projects, type Project } from "../data/projects";

export default function Marquee() {
  const [lb, setLb] = useState<{ images: string[]; index: number } | null>(null);
  const withImg = projects.filter((p) => (p.images?.length ?? 0) > 0);

  const Tile = ({ p }: { p: Project }) => (
    <button
      className="mq2-tile"
      onClick={() => setLb({ images: p.images ?? [], index: 0 })}
      aria-label={`ดูอัลบั้มผลงาน ${p.name}`}
    >
      <img src={(p.images ?? [])[0]} alt={p.name} loading="lazy" />
      <span className="mq2-cap">{p.name}</span>
    </button>
  );

  // เว็บยังไม่มีรูปผลงานเลย -> โชว์ placeholder ชั่วคราว
  if (withImg.length === 0) {
    const ph = Array.from({ length: 5 }, (_, i) => i);
    const row = (cls: string) => (
      <div className={`mq2-row ${cls}`}>
        {[...ph, ...ph].map((i) => (
          <div key={`${cls}-${i}`} className="mq2-tile mq2-empty">
            <span>เพิ่มรูปในเมนู “ผลงาน” แล้วภาพจะมาที่นี่อัตโนมัติ</span>
          </div>
        ))}
      </div>
    );
    return (
      <section className="mq2-section">
        {row("mq2-left")}
        {row("mq2-right")}
      </section>
    );
  }

  const rowA = [...withImg, ...withImg];              // 2 ชุด เพื่อวนต่อเนื่อง
  const rowB = [...withImg].reverse();
  const rowBx = [...rowB, ...rowB];

  return (
    <section className="mq2-section">
      <div className="mq2-row mq2-left">
        {rowA.map((p, i) => <Tile key={`a-${i}`} p={p} />)}
      </div>
      <div className="mq2-row mq2-right">
        {rowBx.map((p, i) => <Tile key={`b-${i}`} p={p} />)}
      </div>

      {lb && (
        <Lightbox
          images={lb.images}
          index={lb.index}
          onClose={() => setLb(null)}
          onIndex={(i) => setLb((s) => (s ? { ...s, index: i } : s))}
        />
      )}
    </section>
  );
}
