import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

export type ImageReference = { renderPackageId: string; stateHash: string; cameraSnapshotId?: string; sceneRevision?: number };
type Props = {
  beforeImage?: string; afterImage?: string; beforeLabel?: string; afterLabel?: string;
  initialPosition?: number; aspectRatio?: number; disabledReason?: string;
  beforeReference?: ImageReference; afterReference?: ImageReference;
  /** Explicit editorial examples, never presented as camera-verified render results. */
  illustrative?: boolean;
};
export function comparisonReason(p: Props): string {
  if (p.disabledReason) return p.disabledReason;
  if (!p.beforeImage || !p.afterImage) return "ยังมีภาพไม่ครบทั้งสองภาพ เลือกดูภาพที่มีได้";
  const a = p.beforeReference, b = p.afterReference;
  if (p.illustrative && !a && !b) return "";
  if (!a?.renderPackageId || !b?.renderPackageId || !a.stateHash || !b.stateHash) return "ยังยืนยันข้อมูลชุดเรนเดอร์ไม่ได้ จึงปิดการลากเปรียบเทียบ";
  if (a.renderPackageId !== b.renderPackageId || a.stateHash !== b.stateHash ||
    ((a.cameraSnapshotId || b.cameraSnapshotId) && a.cameraSnapshotId !== b.cameraSnapshotId) ||
    ((a.sceneRevision !== undefined || b.sceneRevision !== undefined) && a.sceneRevision !== b.sceneRevision)) {
    return "ภาพมาจากคนละชุดเรนเดอร์หรือข้อมูลกล้องไม่ตรงกัน จึงปิดการลากเปรียบเทียบ";
  }
  return "";
}
export const clampPosition = (n: number) => Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 50;

// Remount only when the image pair changes; position and errors cannot leak between pairs.
export default function BeforeAfterCompare(props: Props) {
  return <Comparison key={`${props.beforeImage}|${props.afterImage}`} {...props} />;
}
function Comparison(props: Props) {
  const { beforeImage, afterImage, beforeLabel = "แบบ 3D", afterLabel = "ภาพเรนเดอร์ AI", initialPosition = 50, aspectRatio = 4 / 3 } = props;
  const [position, setPosition] = useState(clampPosition(initialPosition));
  const [mode, setMode] = useState<"compare" | "after" | "before">("compare");
  const [failed, setFailed] = useState({ before: false, after: false });
  const [loaded, setLoaded] = useState({ before: false, after: false });
  const activePointer = useRef<number | null>(null), hintId = useId();
  const beforeOK = !!beforeImage && !failed.before, afterOK = !!afterImage && !failed.after;
  const reason = failed.before || failed.after ? "โหลดภาพบางภาพไม่สำเร็จ เลือกดูภาพที่โหลดได้" : comparisonReason(props);
  const ready = beforeOK && afterOK && loaded.before && loaded.after;
  const effectiveMode = mode === "compare" && reason ? (afterOK ? "after" : "before") : mode === "after" && !afterOK ? "before" : mode === "before" && !beforeOK ? "after" : mode;
  const comparing = effectiveMode === "compare" && !reason;
  const update = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0) setPosition(clampPosition((e.clientX - rect.left) / rect.width * 100));
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (!ready || e.button !== 0 || !e.isPrimary) return;
    activePointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.focus(); update(e);
  };
  const end = (e: PointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== e.pointerId) return;
    activePointer.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const keyboard = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!ready) return;
    const next = { ArrowLeft: position - 5, ArrowDown: position - 5, ArrowRight: position + 5, ArrowUp: position + 5, Home: 0, End: 100, PageDown: position - 10, PageUp: position + 10 }[e.key];
    if (next !== undefined) { e.preventDefault(); setPosition(clampPosition(next)); }
  };
  const value = effectiveMode === "after" ? 0 : effectiveMode === "before" ? 100 : position;
  const style = { "--compare-position": `${value}%`, aspectRatio: Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 4 / 3 } as CSSProperties;
  return <div className="ba-compare">
    <div className="ba-modes" role="group" aria-label="รูปแบบการดูภาพ">
      <button type="button" disabled={!!reason} aria-pressed={comparing} onClick={() => setMode("compare")}>เปรียบเทียบ</button>
      <button type="button" disabled={!beforeOK} aria-pressed={effectiveMode === "before"} onClick={() => setMode("before")}>{beforeLabel}</button>
      <button type="button" disabled={!afterOK} aria-pressed={effectiveMode === "after"} onClick={() => setMode("after")}>{afterLabel}</button>
    </div>
    <div className="ba-stage" style={style}>
      {beforeOK && <img className="ba-image ba-before" src={beforeImage} alt={beforeLabel} width="1536" height="1152" loading="lazy" decoding="async" draggable={false}
        style={{ visibility: effectiveMode === "after" ? "hidden" : "visible" }} onLoad={() => setLoaded(s => ({ ...s, before: true }))} onError={() => setFailed(s => ({ ...s, before: true }))} />}
      {afterOK && <img className="ba-image ba-after" src={afterImage} alt={afterLabel} width="1448" height="1086" loading="lazy" decoding="async" draggable={false}
        onLoad={() => setLoaded(s => ({ ...s, after: true }))} onError={() => setFailed(s => ({ ...s, after: true }))} />}
      {!beforeOK && !afterOK && <p className="ba-empty">ไม่มีภาพตัวอย่างที่แสดงได้</p>}
      {(comparing || effectiveMode === "before") && beforeOK && <span className="ba-label ba-label-left">BEFORE<span>{beforeLabel}</span></span>}
      {(comparing || effectiveMode === "after") && afterOK && <span className="ba-label ba-label-right">AFTER · AI RENDER<span>{afterLabel}</span></span>}
      {comparing && <div className="ba-slider" role="slider" tabIndex={0} aria-label={`สัดส่วน${beforeLabel}ด้านซ้ายที่เปิดแสดง`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(position)} aria-valuetext={`${Math.round(position)}% ${beforeLabel}ด้านซ้าย · ${100 - Math.round(position)}% ${afterLabel}ด้านขวา`} aria-orientation="horizontal" aria-disabled={!ready} aria-describedby={hintId}
        onKeyDown={keyboard} onPointerDown={down} onPointerMove={e => { if (activePointer.current === e.pointerId) update(e); }} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={() => { activePointer.current = null; }}>
        <span className="ba-divider"><span className="ba-handle" aria-hidden="true">‹ ›</span></span>
      </div>}
    </div>
    <p className="ba-hint" id={hintId} role="status">{reason || (!ready && comparing ? "กำลังโหลดภาพตัวอย่าง…" : comparing ? "ลากซ้าย–ขวาเพื่อเปรียบเทียบ · ใช้ปุ่มลูกศรบนคีย์บอร์ดได้" : "เลือกเปรียบเทียบเพื่อกลับไปลากดูทั้งสองภาพ")}</p>
  </div>;
}
