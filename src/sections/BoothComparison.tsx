import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { boothComparisons } from "../data/boothComparisons";

export default function BoothComparison() {
  const [selected, setSelected] = useState(0), pair = boothComparisons[selected];
  return <section id="booth-online" className="booth-showcase" aria-labelledby="booth-online-title">
    <div className="booth-showcase-inner">
      <div className="booth-showcase-heading">
        <div><p className="booth-eyebrow">YOUR IDEA. NEXT LEVEL.</p><h2 id="booth-online-title">ออกแบบเองได้<br /><span>เห็นภาพได้มากกว่า</span></h2></div>
        <div className="booth-showcase-intro"><p>เริ่มจัดวางบูธในแบบ 3D แล้วดูตัวอย่างการต่อยอดเป็นภาพเรนเดอร์ ทั้งบรรยากาศ วัสดุ และรายละเอียดของแบรนด์คุณ</p><a className="booth-start" href="/yp-web-ai/" data-umami-event="comparison-start-design">เริ่มออกแบบบูธของคุณ <ArrowUpRight size={20} aria-hidden="true" /></a></div>
      </div>
      <div className="booth-example-bar"><div><span className="booth-eyebrow">BEFORE / AFTER</span><h3>{pair.name} <span>· {pair.subtitle}</span></h3></div><div className="booth-example-buttons" role="group" aria-label="เลือกตัวอย่างบูธ">{boothComparisons.map((item, i) => <button type="button" key={item.id} aria-pressed={selected === i} onClick={() => setSelected(i)}><span>0{i + 1}</span> {item.name}</button>)}</div></div>
      <div className="booth-comparison-pair" key={pair.id}>
        <figure className="booth-comparison-card">
          <figcaption><span>BEFORE</span><strong>{pair.beforeLabel}</strong></figcaption>
          <a href={pair.before} target="_blank" rel="noopener noreferrer" aria-label={`ดูภาพ Before ${pair.name} ขนาดเต็ม (เปิดแท็บใหม่)`}>
            <img className={pair.id === "island" ? "booth-comparison-before-island" : undefined} src={pair.before} alt={`${pair.name} — ${pair.beforeLabel}`} width="1448" height="1086" loading="lazy" decoding="async" />
          </a>
        </figure>
        <figure className="booth-comparison-card booth-comparison-card-after">
          <figcaption><span>AFTER</span><strong>ภาพเรนเดอร์ AI</strong></figcaption>
          <a href={pair.after} target="_blank" rel="noopener noreferrer" aria-label={`ดูภาพ After ${pair.name} ขนาดเต็ม (เปิดแท็บใหม่)`}>
            <img src={pair.after} alt={`${pair.name} — ภาพเรนเดอร์ AI พร้อมบรรยากาศและรายละเอียด`} width="1448" height="1086" loading="lazy" decoding="async" />
          </a>
        </figure>
      </div>
      <p className="booth-comparison-hint">คลิกภาพเพื่อดูขนาดเต็ม</p>
      <p className="booth-disclaimer">ภาพตัวอย่างก่อนและหลังการต่อยอดด้วย AI ไม่ใช่ภาพก่อสร้างจริง · มุมกล้อง สัดส่วน และรายละเอียดอาจแตกต่างกัน</p>
    </div>
  </section>;
}
