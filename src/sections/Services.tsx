import FadeIn from "../components/FadeIn";

const SERVICES: [string, string, string][] = [
  ["01", "ออกแบบบูธ", "ออกแบบคอนเซ็ปต์และเรนเดอร์ 3D ให้เห็นภาพจริงก่อนผลิต ปรับได้จนกว่าจะตรงกับแบรนด์และงบประมาณ"],
  ["02", "เขียนแบบ SHOP DRAWING", "จุดแข็งของเรา — เขียนแบบผลิตเองในทีมจากพื้นฐานดีไซน์ ควบคุมรายละเอียดวัสดุและโครงสร้างได้ตั้งแต่ต้น"],
  ["03", "ผลิตและติดตั้ง", "งานโครงเหล็ก ตัด CNC งานพิมพ์ และประกอบติดตั้งหน้างาน ครบในทีมเดียว คุมคุณภาพและเวลาได้"],
  ["04", "คีออส / KIOSK", "ออกแบบและผลิตคีออสและจุดขายสำหรับพื้นที่รีเทลและอีเวนต์ ทั้งแบบถอดประกอบและติดตั้งถาวร"],
  ["05", "งานตกแต่งอีเวนต์", "งานตกแต่งและ installation เฉพาะกิจ เช่น งานไฟและงานตกแต่งกลางแจ้ง คิดราคาแบบแยกส่วนตามจริง"],
];

export default function Services() {
  return (
    <section id="services" className="svc" style={{ padding: "clamp(80px,10vw,128px) 20px", position: "relative", zIndex: 1 }}>
      <FadeIn as="h2" y={40}
        style={{ fontWeight: 900, textTransform: "uppercase", color: "#0C0C0C", textAlign: "center",
          lineHeight: 0.9, fontSize: "clamp(3rem,12vw,160px)", marginBottom: "clamp(64px,8vw,112px)" }}>
        บริการ
      </FadeIn>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        {SERVICES.map(([n, name, desc], i) => (
          <FadeIn key={n} y={30} delay={i * 0.1}>
            <div className="svc-item">
              <div className="svc-num">{n}</div>
              <div>
                <div className="svc-name">{name}</div>
                <div className="svc-desc">{desc}</div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
