# YP_Website — บันทึกโปรเจกต์เว็บไซต์ Yuppie Production

> โดเมนเป้าหมาย: **yuppieproduction.com**
> สถานะ: **คอนเซ็ปต์ผ่านแล้ว — รอจัด hosting ก่อน deploy**

---

## 1. ภาพรวม

เว็บพอร์ตโฟลิโอ/เว็บบริษัทของ Yuppie Production (รับออกแบบ + ผลิตบูธนิทรรศการ คีออส งานตกแต่งอีเวนต์) ดัดแปลงธีมมาจาก template ของ Motionsites.ai แต่แปลงเนื้อหาเป็นของ Yuppie ทั้งหมด ใช้ภาษาไทย

**สถานะปัจจุบัน:** ทำ concept demo เสร็จแล้ว (ไฟล์ `YuppieSite.jsx`) เจ้าของอนุมัติธีมแล้ว — ยังไม่ deploy เพราะต้องจัด hosting + โดเมนก่อน

---

## 2. ดีไซน์ (อนุมัติแล้ว)

- **ธีม:** มืด พื้น `#0C0C0C` ตัวอักษร `#D7E2EA` หัวข้อไล่สี `#646973 → #BBCCD7` ปุ่มไล่สีม่วง-ส้ม
- **ฟอนต์:** Kanit (Google Fonts)
- **5 sections:** Hero → Marquee → About → Services → Projects
- **Effects:** ภาพขยับตามเมาส์ (Magnet), marquee เลื่อนสวนทางตอน scroll, การ์ดผลงานซ้อนย่อ (sticky stack), ตัวอักษร About สว่างทีละตัว, fade-in ทุก section
- **ข้อจำกัด environment:** artifact ใช้ framer-motion ไม่ได้ → เขียน animation เองด้วย React hooks (ได้ effect เดียวกัน)

## 3. เนื้อหา

- **USP หลัก:** ทีมเขียน shop drawing ผลิตเองได้ (ยกขึ้นเป็นบริการข้อ 02) — ใช้ภาษาตรงๆ ไม่โอเวอร์
- **บริการ 5 ข้อ:** ออกแบบบูธ / เขียนแบบ Shop Drawing / ผลิต+ติดตั้ง / คีออส / งานตกแต่งอีเวนต์
- **ผลงานตัวอย่าง (placeholder):** SALANA · Bangkok Life × TISCO · AIA Light Installation

## 4. รูปภาพ — จุดที่ต้องจัดการ

- **ไม่ hotlink รูปคนอื่น** — ทุกช่องภาพเป็น placeholder มีป้ายไทยกำกับว่าต้องใส่อะไร
- รูปจริงจะมาจาก assets ของ Yuppie เอง (เรนเดอร์บูธ + ภาพหน้างานติดตั้ง) — ต่อกับ pipeline `booth-reel` ได้
- **ข้อควรระวัง:** รูปบูธไฟล์หนัก → ต้องย่อ + แปลง WebP ก่อนใช้เสมอ (performance)

---

## 5. ระบบหลังบ้าน (Backend / CMS) — ตัดสินใจแล้ว

**เลือก: Decap CMS (Git-based) — ฟรี ไม่มีค่ารายเดือน อัปเดตเองคนเดียว**

หน้า admin อยู่ที่ `/admin` แก้อะไร → commit เข้า Git → เว็บ build ใหม่เอง ไม่ต้องแตะโค้ด

### เรื่อง Login (สำคัญ — วิธีเก่าใช้ไม่ได้แล้ว)
- **Netlify Identity ถูก deprecate แล้ว** → อย่าทำตามทิวทอเรียลเก่า
- **แผนหลัก (เหมาะกับเจ้าของคนเดียวที่เป็นคนเทคนิค):** GitHub backend + OAuth proxy เล็กๆ บน Cloudflare Worker → login ด้วยบัญชี GitHub ของตัวเอง ไม่พึ่งบริการ auth ภายนอก โค้ด proxy เขียนครั้งเดียว (~15 บรรทัด)
- **แผนสำรอง:** DecapBridge (บริการ auth ฟรีสำหรับ Decap, invite ทางอีเมล login Google/Microsoft) — ใช้ถ้าวันหน้าจะให้คนที่ไม่มีบัญชี GitHub เข้ามาแก้

### จุดอ่อนของ Git-based ที่รับรู้แล้ว
- รูปที่อัปจะถูก commit ลง repo → นานไป repo บวม/build ช้า
- **ทางแก้:** (ก) ย่อ WebP ก่อนอัปด้วย `booth-reel` หรือ (ข) ต่อ media library ภายนอก เช่น Cloudinary (free tier) ให้เก็บรูปนอก repo + ส่งผ่าน CDN — แนะนำ (ข) ถ้ารูปเยอะ

### ข่าวดี
- ข้อความไทยใน CMS ไม่มีปัญหา (เก็บเป็น UTF-8 ธรรมดา ไม่เหมือนงานวิดีโอที่ต้องสู้กับ libraqm)

---

## 6. ขั้นตอนต่อไป (รอฝั่งเจ้าของ)

1. **จัด hosting** — แนะนำ **Cloudflare Pages** (ได้ทั้ง host เว็บ + Worker สำหรับ OAuth ในที่เดียว ฟรี) ทางเลือกอื่น: Netlify / Vercel
2. **ชี้โดเมน** yuppieproduction.com มาที่ host
3. จากนั้น Claude แปลง concept → โปรเจกต์ **Vite + TypeScript** จริง พร้อมต่อ **Decap CMS + OAuth Worker + schema ผลงาน** ให้ครบ

---

## ไฟล์ที่เกี่ยวข้อง
- `YuppieSite.jsx` — concept demo (React, ดูได้ในแชท)
- `YP_Website.md` — เอกสารนี้
