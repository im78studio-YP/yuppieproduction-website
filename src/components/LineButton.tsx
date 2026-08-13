import { site } from "../data/site";
import { MessageCircle } from "lucide-react";

export default function LineButton() {
  const link = site.lineLink?.trim();
  if (!link) return null; // ยังไม่ใส่ลิงก์ใน /admin -> ซ่อนปุ่ม (กันปุ่มกดแล้วไม่ไปไหน)
  return (
    <a
      className="line-btn"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="แชทกับเราทาง LINE"
      data-umami-event="line-float"
    >
      <MessageCircle size={26} />
      <span className="line-btn-label">แชทกับเรา</span>
    </a>
  );
}
