# Scene Object & Attachment Architecture

## เป้าหมาย

ระบบจัดวางต้องรองรับทั้ง Asset ในคลังและไฟล์ GLB ที่ผู้ใช้นำเข้า โดยไม่ผูกกฎการวางกับชื่อวัตถุเฉพาะ ระบบเดิมยังคงเป็นแหล่งข้อมูลหลัก และเพิ่ม Scene Object schema เป็นชั้นความเข้ากันได้ด้านบน

## Data flow

```text
Catalog / My Asset GLB
        ↓
Asset Definition
        ↓
Scene Object Instance
        ↓
Placement + Snap + Attachment
        ↓
Compound Collision Validation
        ↓
3D Renderer / Geometry Manifest / Prompt
```

## Scene Object Instance

วัตถุใน `BoothSpec.objects` มีข้อมูลเพิ่มดังนี้:

- `sceneSchemaVersion` — เวอร์ชันข้อมูล Scene Object
- `capabilities` — ความสามารถ เช่น วางพื้น ติดผนัง ติดเพดาน ปรับขนาด เชื่อมต่อ และเป็นชิ้นประกอบ
- `placement` — โหมดวางอิสระ/ยึดผิว/เชื่อมวัตถุ พื้นผิวติดตั้ง และระยะ Snap
- `attachment` — `targetId`, `sourcePort`, `targetPort`, ขนาดที่ติดตาม และ offset
- `collision` — layer, shape mode และ tolerance ของรอยต่อ
- `ports` — จุดเชื่อมพิกัด local ของวัตถุ

ฟังก์ชัน `normalizeSceneObjectModel()` ทำหน้าที่ migrate วัตถุเดิมโดยอัตโนมัติ จึงไม่ต้องแก้ข้อมูลบูธเก่าทั้งหมดพร้อมกัน

## Attachment ports

Foundation รุ่นแรกเปิดใช้กับกรอบทางเข้าและห้องเก็บของ:

- กรอบ: `frame-left-front`, `frame-right-front`
- ห้อง: `storage-left-front`, `storage-right-front`

เมื่อเชื่อมกรอบกับห้อง ระบบจะ:

1. จัดตำแหน่ง source port ให้ตรง target port
2. ตั้งความลึกกรอบตามความลึกห้อง
3. ขยับกรอบตามเมื่อขนาดหรือตำแหน่งห้องเปลี่ยน
4. ส่งความสัมพันธ์ไปพร้อม Geometry Manifest และ Prompt
5. ปลดการเชื่อมเมื่อผู้ใช้ลากกรอบออกจากตำแหน่ง

## Collision

กรอบทางเข้าใช้ `compound` collision แทนกล่องเต็มชิ้น:

- กล่องคานบน (`canopy`)
- กล่องเสาด้านหน้า (`front-pier`)

การตรวจชนคำนึงถึงช่วงความสูง จึงสามารถใช้พื้นที่ว่างใต้คานได้ และอนุญาตให้ผิวของชิ้นงานที่เชื่อมกันสัมผัสกันภายใน tolerance โดยไม่ปิด Collision ของโครงสร้างทั้งหมด

## การรองรับ My Asset ในระยะต่อไป

ขั้นตอนสำหรับ GLB ที่ผู้ใช้นำเข้า:

1. อ่านขนาดและวาง pivot ไว้กึ่งกลางฐาน
2. สร้าง Box collision เริ่มต้น
3. ให้ผู้ใช้เลือกความสามารถและพื้นผิวติดตั้ง
4. ให้เพิ่ม port แบบซ้าย/ขวา/หน้า/หลัง/บน/ล่าง
5. บันทึก Definition พร้อม GLB ใน My Asset
6. รองรับ Compound collision หลาย Box สำหรับรูปทรง L/U หรือโครงสร้างเปิดโล่ง

หลีกเลี่ยงการตรวจชนจาก mesh จริงทุกเฟรม เพราะไม่จำเป็นสำหรับ Web Sketch และมีต้นทุนสูงกว่า Compound Box มาก

## แนวทางทดสอบ

- สร้างห้องด้านขวา แล้วเชื่อมกรอบด้านซ้ายของห้อง
- เปลี่ยนความลึกห้อง และยืนยันว่ากรอบตามแนวหน้าห้อง
- ย้ายห้องซ้าย/กลาง/ขวา และยืนยันว่ากรอบตามพิกัดใหม่
- ทดลองเชื่อมด้านที่ไม่มีพื้นที่ ระบบต้องปฏิเสธโดยไม่ทำข้อมูลเดิมหาย
- ปลดการเชื่อมและลากกรอบอิสระ
- ตรวจ `window.getGeometryManifest()` ว่ามี capabilities, ports, collision และ attachment
- ตรวจ Prompt ว่าระบุความสัมพันธ์โครงสร้าง

## สิ่งที่จะขยายภายหลัง

- ตัวแก้ไข Port สำหรับ My Asset
- Assembly และการเลือก/ย้ายทั้งกลุ่ม
- Surface attachment สำหรับผนังและเพดาน
- Collision matrix แยกตาม layer
- Port compatibility ตามชนิดและทิศทาง

