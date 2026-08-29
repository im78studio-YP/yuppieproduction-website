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
- `capabilities` — ความสามารถ เช่น วางพื้น ติดผนัง ติดเพดาน ย้าย 3 แกน Snap ผิว ปรับขนาด เชื่อมต่อ และเป็นชิ้นประกอบ
- `placement` — โหมดวางอิสระ/ยึดผิว/เชื่อมวัตถุ แกนที่ย้ายได้ พื้นผิวและวัตถุเป้าหมาย และระยะ Snap
- `attachment` — `targetId`, `sourcePort`, `targetPort`, ขนาดที่ติดตาม และ offset
- `collision` — layer, shape mode และ tolerance ของรอยต่อ
- `ports` — จุดเชื่อมพิกัด local ของวัตถุ

ฟังก์ชัน `normalizeSceneObjectModel()` ทำหน้าที่ migrate วัตถุเดิมโดยอัตโนมัติ จึงไม่ต้องแก้ข้อมูลบูธเก่าทั้งหมดพร้อมกัน

Asset ที่วางบนพื้นมี `placement.allowOutsideBooth = true` เป็นค่าเริ่มต้น จึงใช้พื้นที่รอบบูธเป็น staging area ได้ โดยยังคง Snap, Lock, Attachment และการตรวจชนโครงสร้างหลัก ส่วนวัตถุติดผนัง/เพดานยังยึดขอบเขตของพื้นผิวติดตั้งเดิม

## การย้าย 3 แกนและ Surface Snap

Asset ในคลังและ My Asset GLB ใช้ interaction ชุดเดียวกัน 3 โหมด:

- `smart` — โหมดเริ่มต้น ลากตัววัตถุบนระดับ Y เดิม หรือลาก Anchor เพื่อจัด X/Y/Z จาก Anchor/พื้นผิวเป้าหมายโดยอัตโนมัติ
- `plane` — ย้ายบนระนาบ X/Z
- `height` — ยกหรือลดระดับบนแกน Y พร้อม Snap ระดับพื้น ยอดโครงสร้าง และใต้เพดาน
- `surface` — Raycast ไปยังพื้น ผนัง โครงสร้าง และ Asset อื่น แล้ววาง bounding envelope ให้สัมผัสผิวโดยไม่จมเข้า mesh

โหมด `plane`, `height` และ `surface` เป็นเครื่องมือ “ปรับละเอียด” ส่วนการใช้งานทั่วไปไม่ต้องเลือกแกนก่อนลาก ใน Smart Move การลากจากตัว Asset จะรักษาระดับเดิมเพื่อลดการกระโดดของวัตถุ แต่การลากจาก Anchor จะใช้ตำแหน่ง Pointer บนหน้าจอเลือก Anchor เป้าหมาย หรือ Raycast ไปยังผิวจริง แล้วคำนวณพิกัด X/Y/Z ของฐานวัตถุกลับให้อัตโนมัติ

ตำแหน่งที่ Snap สำเร็จจะบันทึก `placement.mode = "surface"`, `placement.surface` และ `placement.targetId` เพื่อให้ Geometry Manifest และ Prompt ทราบความสัมพันธ์จริง ส่วนการลากออกจากผิวหรือ Attachment เดิมจะเปลี่ยนกลับเป็นโหมดอิสระโดยอัตโนมัติ

## Magnetic Anchor Snap

Asset ในคลังและ My Asset GLB ใช้ Anchor schema ชุดเดียวกัน โดยคำนวณจากขนาด ตำแหน่ง และการหมุนจริงของวัตถุ:

- มุมฐานและมุมบน (`corner`)
- กึ่งกลางขอบฐานและขอบบน (`edge`)
- กึ่งกลางฐานและกึ่งกลางด้านบน (`center`)

ระหว่างลาก ระบบยังวางอิสระหรือ Snap กริด 5 ซม. ได้ตามเดิม แต่เมื่อ Anchor ชนิดเดียวกันอยู่ใกล้กันไม่เกิน 15 ซม. จะดูดเข้าหากันและแสดง Preview สีเขียวก่อนปล่อย ผู้ใช้สามารถลากจากตัว Asset เพื่อให้ระบบเลือก Anchor ที่ใกล้ที่สุด หรือจับจุด Anchor โดยตรงเพื่อบังคับจุดต้นทาง เหมาะกับมือถือและงานที่มีวัตถุหลายชิ้น

ผลการ Snap บันทึกไว้ที่ `placement.anchorAttachment` ประกอบด้วย `sourceAnchorId`, `targetId`, `targetAnchorId` และ `kind` ข้อมูลนี้ส่งต่อใน Geometry Manifest และ Prompt แต่ไม่ทำให้เกิด parent-child attachment ถาวร จึงลากออกจากจุดเดิมได้ทันที จุดช่วยและเส้น Preview ไม่ถูกส่งออกใน Clean Screenshot

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
- ลากมุม Asset ชนมุม Asset อีกชิ้นภายใน 15 ซม. และยืนยันว่า Preview แสดงก่อนตำแหน่งถูกดูด
- ปิด Magnetic Snap แล้วยืนยันว่าลากผ่านตำแหน่งเดิมได้อย่างอิสระ
- ทดสอบทั้ง Asset ในคลังและ My Asset GLB รวมถึงการลากด้วย Pointer/Touch
- ตรวจ Clean Screenshot ว่าไม่มีจุด Anchor หรือเส้น Preview

## สิ่งที่จะขยายภายหลัง

- ตัวแก้ไข Port สำหรับ My Asset
- Assembly และการเลือก/ย้ายทั้งกลุ่ม
- Gizmo ลูกศร X/Y/Z สำหรับงานละเอียดระดับมืออาชีพ
- Collision matrix แยกตาม layer
- Port compatibility ตามชนิดและทิศทาง
