# Yuppie Production — Website

เว็บไซต์บริษัท Yuppie Production (ยัพพี โปรดักชั่น จำกัด)
รับออกแบบและผลิตบูธนิทรรศการ คีออส และงานตกแต่งอีเวนต์

โดเมนเป้าหมาย: **yuppieproduction.com**

## สถานะ

คอนเซ็ปต์ผ่านแล้ว — รอจัด hosting ก่อน deploy
รายละเอียดการตัดสินใจทั้งหมดอยู่ใน [`docs/YP_Website.md`](docs/YP_Website.md)

## โครงสร้าง

- `concept/YuppieSite.jsx` — คอนเซ็ปต์เดโม (React) ธีมมืด Kanit 5 sections
- `docs/YP_Website.md` — บันทึกโปรเจกต์: ดีไซน์ / ระบบหลังบ้าน / ขั้นตอนต่อไป

## แผนงาน

1. จัด hosting (แนะนำ Cloudflare Pages) + ชี้โดเมน
2. แปลง concept เป็นโปรเจกต์ Vite + TypeScript
3. ต่อ Decap CMS (Git-based) + OAuth Worker + schema ผลงาน

## Backend / CMS

Decap CMS (Git-based, ฟรี) — auth ผ่าน GitHub backend + Cloudflare Worker OAuth proxy
รูปบูธต้องย่อ/แปลง WebP ก่อน commit หรือ offload ไป Cloudinary เพื่อกัน repo บวม
