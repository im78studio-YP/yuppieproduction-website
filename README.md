# Yuppie Production — Website

เว็บไซต์บริษัท Yuppie Production (ยัพพี โปรดักชั่น จำกัด)
ออกแบบและผลิตบูธนิทรรศการ · คีออส · งานตกแต่งอีเวนต์ — โดเมน **yuppieproduction.com**

Stack: **Vite + React + TypeScript**, ธีมมืด ฟอนต์ Kanit · CMS หลังบ้าน **Decap CMS** (Git-based)
· Login ผ่าน **GitHub OAuth** (Cloudflare Worker) · Deploy บน **Cloudflare Pages**

## รันในเครื่อง

```bash
npm install
npm run dev        # เปิด http://localhost:5173
npm run build      # สร้างไฟล์ production ในโฟลเดอร์ dist/
```

## โครงสร้าง

```
├── index.html
├── src/
│   ├── App.tsx                 รวม 5 sections
│   ├── index.css               สไตล์ทั้งหมด (ธีมมืด, Kanit)
│   ├── components/             FadeIn, Magnet, AnimatedText, Placeholder
│   ├── sections/               Hero, Marquee, About, Services, Projects
│   └── data/projects.ts        โหลดผลงานจาก content/projects/*.json
├── content/projects/           ← Decap แก้ไฟล์พวกนี้ (ผลงาน)
├── public/admin/               หน้า /admin (Decap CMS) + config.yml
├── public/images/uploads/      ที่เก็บรูปที่อัปผ่าน CMS
└── oauth-worker/               Cloudflare Worker สำหรับ login GitHub (ดู README ข้างใน)
```

## ระบบหลังบ้าน (แก้ผลงานเองที่ /admin)

1. Deploy OAuth Worker ก่อน — ดู `oauth-worker/README.md`
2. เอา URL ของ Worker ไปใส่ใน `public/admin/config.yml` → `base_url`
3. เข้า `yuppieproduction.com/admin` → Login with GitHub → เพิ่ม/แก้ผลงานได้เลย
   (กด Publish → commit เข้า repo → Cloudflare Pages build ใหม่อัตโนมัติ)

## Deploy บน Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → เชื่อม repo `im78studio-YP/yuppieproduction-website`
2. Build command: `npm run build` · Output directory: `dist`
3. หลัง deploy → Custom domains → เพิ่ม `yuppieproduction.com` (DNS ต้องย้ายมา Cloudflare ก่อน)

## รูปภาพ (ข้อควรระวัง)

รูปที่อัปผ่าน CMS จะถูก commit ลง repo → นานไป repo บวม/build ช้า
รูปบูธไฟล์หนัก **ต้องย่อ + แปลง WebP ก่อนอัป** (ใช้ booth-reel) หรือย้ายไปใช้ Cloudinary
(แก้ media_folder ใน config.yml) เมื่อรูปเริ่มเยอะ
