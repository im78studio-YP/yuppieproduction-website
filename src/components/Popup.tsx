import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { popup } from "../data/popup";

const KEY = "yp_popup_dismissed";
const sig = () =>
  [popup.image, popup.title, popup.body, popup.buttonLabel, popup.buttonLink].join("|");
const today = () => new Date().toISOString().slice(0, 10);
const stamp = () => `${sig()}|${today()}`;

export default function Popup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!popup.enabled) return;
    const hasContent = Boolean(popup.image || popup.title || popup.body);
    if (!hasContent) return;

    let dismissed = false;
    try {
      // เด้งครั้งเดียวต่อวัน + ถ้าเปลี่ยนเนื้อหา Pop-up จะเด้งใหม่
      dismissed = localStorage.getItem(KEY) === stamp();
    } catch {
      dismissed = false; // localStorage ใช้ไม่ได้ -> เด้งได้ (แค่ไม่จำ)
    }
    if (dismissed) return;

    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, stamp());
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  const hasText = Boolean(popup.title || popup.body);
  const hasBtn = Boolean(popup.buttonLabel && popup.buttonLink);

  return (
    <div className="popup-overlay" onClick={close}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={close} aria-label="ปิด">
          <X size={22} />
        </button>

        {popup.image && <img className="popup-img" src={popup.image} alt={popup.title || "ประกาศ"} />}

        {hasText && (
          <div className="popup-text">
            {popup.title && <h3 className="popup-title">{popup.title}</h3>}
            {popup.body && <p className="popup-body">{popup.body}</p>}
          </div>
        )}

        {hasBtn && (
          <div className="popup-cta">
            <a href={popup.buttonLink} target="_blank" rel="noopener noreferrer">
              <button className="btn-contact">{popup.buttonLabel}</button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
