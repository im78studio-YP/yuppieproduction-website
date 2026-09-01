# Wall/Floor Smart Snap — Task 2

วันที่: 2026-09-01  
ขอบเขต: Generic Smart Snap บน Universal Scene Asset Registry เท่านั้น ยังไม่มี Parent/Child Attachment Graph แบบถาวร

## Data flow

```text
Project State
  -> Universal Scene Asset Registry
  -> SnapAnchor + SnapSurface generation
  -> Registry-backed raycast
  -> Anchor/Surface compatibility
  -> 5 cm surface-plane quantization
  -> rotation + thickness offset
  -> surface boundary + 3D collision validation
  -> ghost preview
  -> commit world transform + Undo history
```

Asset Registry เป็นแหล่งข้อมูลเดียวสำหรับค้นหา owner ของ Mesh, Asset type, transform และ bounds ระหว่างการ Snap ส่วน Grid, Dimension, Selection, Transform และ Debug helpers ไม่ถูกสร้างเป็น Snap target

## SnapAnchor

```js
{
  id: string,
  ownerAssetId: string,
  anchorType: "bottom" | "back" | "front" | "left" | "right" | "top" | "center" | "mount",
  localPosition: { x, y, z },
  localNormal: { x, y, z },
  compatibleSurfaceTypes: string[],
  rotationPolicy: "preserve" | "align-normal" | "align-horizontal" | "align-vertical"
}
```

ค่าเริ่มต้นตามประเภท:

- Logo, Graphic, TV และ Screen ใช้ `mount`
- Arm/Wall Light ใช้ `mount`
- Clear Light/Downlight ใช้ `top`
- Counter และ Shelf ใช้ `bottom` และ `back`
- Furniture ทั่วไปใช้ `bottom`

## SnapSurface

```js
{
  id: string,
  ownerAssetId: string,
  surfaceType: "floor-top" | "wall-inside" | "wall-outside" |
    "vertical-face" | "horizontal-top" | "horizontal-bottom" |
    "edge" | "center-line",
  localOrigin: { x, y, z },
  localNormal: { x, y, z },
  width: number,
  height: number,
  allowedAssetTypes: string[],
  padding: number,
  enabled: boolean
}
```

- Floor: top face, perimeter edges และ center lines
- Wall: inside/outside faces, top/side edges และ center line
- Beam/Fascia/Structure/Physical Asset อื่น: faces จาก bounds รวม top/bottom และ center line
- Locked structure ยังคง Raycast และเป็น Snap target ได้ เพราะ `locked/movable` แยกจาก `snapEnabled`

## Smart Snap algorithm

1. Raycast เฉพาะ Physical Mesh ที่ Resolve ได้จาก Asset Registry
2. เลือก Surface ที่ตรงกับ normal ของหน้าที่โดน Raycast
3. เลือก Anchor ที่ compatible โดยไม่ใช้ Object origin เป็นจุดติดผิว
4. Project จุดเมาส์ลง local surface plane
5. Quantize แกนบน surface เป็นช่วง `0.05 m`
6. หมุน Asset ตาม `rotationPolicy` และ surface normal
7. หัก transformed anchor offset แล้วเพิ่ม surface padding เพื่อป้องกันการฝัง
8. ตรวจ Asset bounds ไม่ให้ล้น Surface
9. ตรวจ booth/system boundary และ 3D collision volumes
10. แสดง Surface/Anchor/Ghost สีเขียวเมื่อ valid และสีแดงเมื่อ invalid
11. Drop แล้วบันทึก world transform ผ่าน Project State เดิม พร้อม Undo/Redo

Priority: `Anchor -> Surface`, `Face -> Face`, `Edge -> Edge`, `Center -> Center`, แล้วจึง fallback ไป Grid Snap เดิม ระยะตรวจมาตรฐาน 0.14 ม., screen threshold 14 px และ release threshold 0.22 ม./22 px

## Persistence และ compatibility

- Transform ยังเก็บเป็น world position/rotation/scale แบบระบบเดิม
- Candidate ที่ใช้เตรียม Task 3 เก็บใน `object.placement.snapCandidate`
- Candidate มีเฉพาะ `anchorId`, `surfaceId`, `targetAssetId`, `snapType`, `offset`, `valid`
- ไม่มีการสร้าง parent, child หรือ attachment-follow ใน Task 2
- Save/Reload, Undo/Redo, Prompt Builder และ Render Package ใช้ Project State เดิม
- Helpers ทั้งหมดอยู่ในกลุ่ม `magnetic-snap-preview`/`object-anchor-guides` และถูกตัดออกจาก Clean Screenshot

## Selection

- Raycast เลือก Physical Asset ด้านหน้าก่อน System Wall/Floor
- Structure ที่ล็อกเลือกได้จาก Asset List และเป็น Snap target ได้ แต่ลากไม่ได้
- `Alt + click` ใช้ cycle ผ่าน Asset ที่ซ้อนกัน

## Development API

`window.SmartSnapEngineAPI` มี:

- `listAnchors(assetId?)`
- `listSurfaces(assetId?)`
- `getWorldSurfaces(assetId)`
- `solve(options)`
- `validate()`
- `config()`

เมื่อรันบน localhost จะมีข้อมูล validation บน `document.documentElement.dataset` ได้แก่ `smartSnapValid`, `smartSnapAnchors`, `smartSnapSurfaces` และ `smartSnapErrors`

## ข้อจำกัดของ Task 2

- หลัง Drop เป้าหมายไม่ติดตามกันเมื่อ Asset เป้าหมายถูกย้ายหรือหมุน
- ยังไม่มี Attachment Graph, dependency order หรือ cascading transform
- Geometry ซับซ้อนใช้ bounding-box surfaces เป็น fallback; ไม่มี mesh-topology surface authoring รายชิ้น
- Auto-attach/Detach และ Parent Follow เป็นขอบเขต Task 3

