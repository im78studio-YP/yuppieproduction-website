import { projects, type Project } from "../data/projects";

export default function Marquee() {
  const withImg = projects.filter((p) => (p.images?.length ?? 0) > 0);

  const goToProject = (p: Project) => {
    const el = document.getElementById(`project-${p.number}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // imgIndex: แถวบน = 0 (รูปแรก), แถวล่าง = 1 (รูปที่สอง)
  // ถ้าอัลบั้มมีรูปไม่ถึง index ที่ขอ ให้ fallback กลับไปรูปแรกกันภาพหาย
  const Tile = ({ p, imgIndex = 0 }: { p: Project; imgIndex?: number }) => {
    const imgs = p.images ?? [];
    const src = imgs[imgIndex] ?? imgs[0];
    return (
      <button
        className="mq2-tile"
        onClick={() => goToProject(p)}
        aria-label={`ไปที่ผลงาน ${p.name}`}
        data-umami-event="project-click"
        data-umami-event-project={p.name}
      >
        <img src={src} alt={p.name} loading="lazy" />
        <span className="mq2-cap">{p.name}</span>
      </button>
    );
  };

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

  const rowA = [...withImg, ...withImg];
  const rowBx = [...[...withImg].reverse(), ...[...withImg].reverse()];

  return (
    <section className="mq2-section">
      <div className="mq2-row mq2-left">
        {rowA.map((p, i) => <Tile key={`a-${i}`} p={p} imgIndex={0} />)}
      </div>
      <div className="mq2-row mq2-right">
        {rowBx.map((p, i) => <Tile key={`b-${i}`} p={p} imgIndex={1} />)}
      </div>
    </section>
  );
}
