# Persistent Attachment Graph (Task 3)

เอกสารนี้อธิบายความสัมพันธ์แบบถาวรระหว่าง Asset ที่ Snap แล้วใน YUPPIE BOOTH AI โดยต่อยอดจาก Universal Asset Registry และ Smart Snap Engine เดิม ระบบไม่เปลี่ยน Geometry ขณะ Migration และไม่เดา Attachment จากระยะใกล้

## Data flow

1. Smart Snap คำนวณ `SnapAnchor` และ `SnapSurface` ตาม Task 2
2. เมื่อ Drop สำเร็จ `commitPersistentAttachmentFromSnap()` สร้าง Attachment จาก World Transform ปัจจุบัน
3. `AssetAttachmentGraph` แปลงจุดติดตั้งเป็น Local Surface Coordinates (`u`, `v`, `normalOffset`)
4. Graph อัปเดต `parentAssetId` และ `childAssetIds` ใน Universal Registry
5. Project State บันทึก Registry, Anchor, Surface และ Attachment Graph ใน History Transaction เดียวกัน
6. เมื่อ Parent เปลี่ยน Transform ระบบคำนวณ Child ใหม่จาก Local Surface Coordinates ไม่ใช้ World Delta สะสม

## Attachment schema

```js
{
  targetAssetId: string,
  targetSurfaceId: string,
  sourceAnchorId: string,
  localSurfacePosition: {
    u: number,
    v: number,
    normalOffset: number
  },
  rotationOffset: {
    x: number,
    y: number,
    z: number
  },
  snapMode: "surface" | "edge" | "center" | "grid",
  valid: boolean,
  validationWarnings: string[],

  // Persistence state used by the workflow
  attached: boolean,
  detachedReason: string
}
```

`SceneAsset` เพิ่มฟิลด์:

```js
{
  attachment: Attachment | null,
  parentAssetId: string | null,
  childAssetIds: string[]
}
```

Project State บันทึกข้อมูลต่อไปนี้:

```js
sceneAssetRegistry: { version: 2, assets: SceneAsset[] }
sceneSnapData: { version: 1, anchors: SnapAnchor[], surfaces: SnapSurface[] }
assetAttachmentGraph: {
  version: 1,
  attachments: Array<{ childAssetId: string, attachment: Attachment }>
}
```

## Parent/Child behavior

- Move/Rotate Parent: resolve Child จาก `surface origin + u/v/normalOffset` ทุกครั้ง จึงไม่สะสม floating-point drift
- Nested Parent: propagate ลง Child และ Grandchild ตาม graph โดยมี cycle guard
- Resize Parent: ตรวจ Bounding Box ของ Child กับขอบ Surface ใหม่ ถ้าหลุดขอบให้ `valid=false` และไม่ clamp ตำแหน่งเงียบ ๆ
- Delete Parent: Child ถูก Detach แต่คง World Transform เดิม และแสดงข้อความ `พื้นผิวที่ Asset เคยติดตั้งถูกลบ กรุณาจัดตำแหน่งใหม่`
- Booth Type เปลี่ยนจน Surface หาย: ใช้กฎเดียวกับ Delete Parent; Child, Suggested/Approved status และ Geometry ยังอยู่
- Manual Move/Fine Position/Align: Detach ก่อน Commit เพื่อให้การย้ายโดยผู้ใช้เป็นความตั้งใจชัดเจน

## Commands

ใน `ตั้งค่า Asset > Persistent Attachment` มีคำสั่ง:

- Detach — ปลดความสัมพันธ์และรักษา World Transform
- Reattach — ติดกลับด้วย Surface/Anchor และ Local Coordinates เดิม
- Change Target Surface — คำนวณ Local Surface Position ใหม่จากตำแหน่งปัจจุบัน
- Change Snap Anchor — คำนวณความสัมพันธ์ใหม่โดยใช้ Anchor ที่เลือก
- ย้ายใหม่ด้วย Smart Move — Detach แล้วเข้าสู่ Smart Move
- ลบ Asset — ใช้ Workflow ลบและ Undo/Redo เดิม

ทุกคำสั่งใช้ `objectSnapshot()` และบันทึกเป็น History Transaction เดียว

## Migration and compatibility

- Project เก่าที่ไม่มี `assetAttachmentGraph` ได้ Graph ว่าง
- Existing Asset ID และ Stable Structure ID เดิมไม่เปลี่ยน
- Position, Rotation, Scale, Material และ Camera ไม่ถูกแก้ระหว่าง Migration
- Anchor/Surface สร้างจาก Registry ปัจจุบัน
- ไม่เดาความสัมพันธ์จากระยะใกล้, `snapCandidate` เก่า หรือ Legacy Port Attachment
- Legacy `obj.attachment` ของกรอบทางเข้ายังคงแยกเป็น `legacyPortAttachment` เพื่อไม่ทำให้ Workflow เดิมเสีย

## Clean Screenshot

ระหว่าง Capture ระบบซ่อน Helper ต่อไปนี้และคืนสถานะหลัง Capture:

- Grid และ Dimension
- Smart Snap Surface/Ghost/Anchor Guide
- Bounding Box และ Selection Outline
- Magnetic Snap Preview
- Attachment Surface Highlight และ Invalid Warning Helper

## Render package

Asset ใน Geometry Manifest/Render Package ส่ง:

- Asset ID และ Asset Type
- Parent Asset ID
- Target Surface ID
- Source Anchor ID
- Local Surface Position
- World Transform และ Dimensions
- Approval Status (Approved/Suggested)
- Attachment Validation Status และ Warning

Approved Attached Asset ถูกจัดเป็น Locked Geometry ส่วน Suggested Attached Asset เป็น `AI Suggested / Render Staging` และไม่รวม BOQ/Production Scope จนกว่าจะยืนยัน

## Validation and tests

ชุดทดสอบ `qa/attachment/asset-attachment-graph.test.mjs` ครอบคลุม:

- Schema และ Registry relation fields
- Smart Snap → Attachment Graph
- Parent Move/Rotate และ drift regression
- Parent Resize/Boundary warning
- Parent Delete/Detach
- Manual Detach/Reattach/Change Surface/Change Anchor
- Save/Reload serialization
- Legacy project migration
- Booth Type Surface removal
- Cycle detection
- Editor, Clean Screenshot และ Render Package integration
- Booth/Asset matrix: Inline, Corner ซ้าย/ขวา, Peninsular, Island, Logo, TV, Graphic, Light, Counter และ Shelf

## Known limitations

- Graph บันทึกความสัมพันธ์แบบ Logical Parent/Child โดยไม่ re-parent Three.js `Object3D`; วิธีนี้รักษา Project State และ Undo/Redo เดิมได้ปลอดภัยกว่า
- Collision ตอน Snap ยังเป็นหน้าที่ของ Smart Snap Engine Task 2; Attachment Graph ตรวจความพร้อมของ Anchor/Surface และ Surface Boundary
- Asset ที่ Attachment invalid ไม่ถูกย้ายหรือลบอัตโนมัติ ผู้ใช้ต้องเลือก Smart Move, Detach, เปลี่ยน Surface หรือ Delete
