import * as THREE from "three";

export type HandleMode = "scale" | "move";

export interface TransformSnapshot {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export interface HandleDragState {
  object: THREE.Object3D;
  parent: THREE.Object3D | null;
  mode: HandleMode;

  // ตำแหน่ง Handle ภายใน Local Space ของ Asset
  handleLocal: THREE.Vector3;

  // ใช้เฉพาะ Scale: จุดตรงข้ามที่ต้องอยู่กับที่
  oppositeLocal?: THREE.Vector3;

  initial: TransformSnapshot;
  initialHandleWorld: THREE.Vector3;
  fixedPivotWorld?: THREE.Vector3;

  // ระยะจาก Pivot ไป Handle ตอนเริ่มลาก
  initialRadius?: number;

  // ทิศทางจาก Pivot ไป Handle ตอนเริ่มลาก
  scaleDirection?: THREE.Vector3;
}

const MIN_SCALE_FACTOR = 0.05;
const MAX_SCALE_FACTOR = 100;
const MATRIX_EPSILON = 1e-12;

function assertFiniteVector(label: string, value: THREE.Vector3): void {
  if (
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z)
  ) {
    throw new Error(`${label} ต้องเป็นพิกัดที่มีค่าจำกัด`);
  }
}

/**
 * Utility นี้แก้ position/quaternion/scale โดยตรง จึงต้องอัปเดต Local Matrix
 * เองด้วย เพื่อให้รองรับ Object ที่ตั้ง matrixAutoUpdate = false
 */
function updateObjectMatrices(object: THREE.Object3D): void {
  object.updateMatrix();
  object.updateWorldMatrix(true, false);
}

function assertSameParent(state: HandleDragState): void {
  if (state.object.parent !== state.parent) {
    throw new Error("ห้าม Re-parent Asset ระหว่างลาก Handle");
  }
}

export function snapshotTransform(
  object: THREE.Object3D,
): TransformSnapshot {
  return {
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
  };
}

export function restoreTransform(
  object: THREE.Object3D,
  snapshot: TransformSnapshot,
): void {
  object.position.copy(snapshot.position);
  object.quaternion.copy(snapshot.quaternion);
  object.scale.copy(snapshot.scale);
  updateObjectMatrices(object);
}

/**
 * เลื่อน Object ด้วยระยะ World Space
 * รองรับกรณี Object อยู่ภายใต้ Parent ที่มี Rotation/Scale
 */
function translateObjectInWorld(
  object: THREE.Object3D,
  deltaWorld: THREE.Vector3,
): void {
  assertFiniteVector("deltaWorld", deltaWorld);

  if (!object.parent) {
    object.position.add(deltaWorld);
    updateObjectMatrices(object);
    return;
  }

  // updateWorldMatrix(true, false) อัปเดต Ancestor ทุกระดับ ต่างจาก
  // updateMatrixWorld(true) ที่อาจใช้ matrixWorld ของ Parent เก่าอยู่
  object.parent.updateWorldMatrix(true, false);

  const parentLinear = new THREE.Matrix3().setFromMatrix4(
    object.parent.matrixWorld,
  );

  if (Math.abs(parentLinear.determinant()) <= MATRIX_EPSILON) {
    throw new Error(
      "ไม่สามารถลาก Asset ได้ เพราะ Parent มี Scale เป็นศูนย์หรือ Matrix กลับด้านไม่ได้",
    );
  }

  // Delta เป็น Vector ไม่ใช่ Point จึงใช้เฉพาะ Linear Transform
  // และไม่ให้ Translation ของ Parent ปะปนในการคำนวณ
  const deltaInParent = deltaWorld
    .clone()
    .applyMatrix3(parentLinear.invert());

  object.position.add(deltaInParent);
  updateObjectMatrices(object);
}

/**
 * เริ่มลาก Handle
 *
 * Corner Handle:
 *   mode = "scale"
 *   ต้องส่ง oppositeLocal
 *
 * Center Handle:
 *   mode = "move"
 */
export function beginHandleDrag(params: {
  object: THREE.Object3D;
  mode: HandleMode;
  handleLocal: THREE.Vector3;
  oppositeLocal?: THREE.Vector3;
}): HandleDragState {
  const { object, mode, handleLocal, oppositeLocal } = params;

  assertFiniteVector("handleLocal", handleLocal);
  updateObjectMatrices(object);

  const initial = snapshotTransform(object);
  const initialHandleWorld = object.localToWorld(handleLocal.clone());

  if (mode === "move") {
    return {
      object,
      parent: object.parent,
      mode,
      handleLocal: handleLocal.clone(),
      initial,
      initialHandleWorld,
    };
  }

  if (!oppositeLocal) {
    throw new Error(
      "Scale Handle ต้องมี oppositeLocal สำหรับใช้เป็น Fixed Pivot",
    );
  }

  assertFiniteVector("oppositeLocal", oppositeLocal);
  const fixedPivotWorld = object.localToWorld(oppositeLocal.clone());
  const startVector = initialHandleWorld.clone().sub(fixedPivotWorld);
  const initialRadius = startVector.length();

  if (!Number.isFinite(initialRadius) || initialRadius <= MATRIX_EPSILON) {
    throw new Error("Handle และ Pivot อยู่ตำแหน่งเดียวกันหรือมีพิกัดไม่ถูกต้อง");
  }

  return {
    object,
    parent: object.parent,
    mode,
    handleLocal: handleLocal.clone(),
    oppositeLocal: oppositeLocal.clone(),
    initial,
    initialHandleWorld,
    fixedPivotWorld,
    initialRadius,
    scaleDirection: startVector.normalize(),
  };
}

/**
 * อัปเดตการลาก
 *
 * pointerWorld:
 *   ตำแหน่งเมาส์ที่ Raycast ลงบน Drag Plane แล้ว
 *
 * snapTargetWorld:
 *   ถ้ามี Snap Target ให้ส่งตำแหน่ง World Space เข้ามา
 */
export function updateHandleDrag(
  state: HandleDragState,
  pointerWorld: THREE.Vector3,
  snapTargetWorld?: THREE.Vector3,
): void {
  assertSameParent(state);

  const targetWorld = snapTargetWorld ?? pointerWorld;
  assertFiniteVector("ตำแหน่ง Pointer/Snap Target", targetWorld);

  if (state.mode === "move") {
    updateMoveDrag(state, targetWorld);
    return;
  }

  updateUniformScaleDrag(state, targetWorld);
}

function updateMoveDrag(
  state: HandleDragState,
  targetWorld: THREE.Vector3,
): void {
  const { object, initial, handleLocal } = state;

  restoreTransform(object, initial);

  // คำนวณตำแหน่ง Handle ใหม่หลัง Restore เสมอ เพื่อไม่พึ่ง matrixWorld
  // ที่อาจเปลี่ยนจาก Ancestor ระหว่าง Event Frame
  const currentHandleWorld = object.localToWorld(handleLocal.clone());
  const deltaWorld = targetWorld.clone().sub(currentHandleWorld);

  translateObjectInWorld(object, deltaWorld);
}

function updateUniformScaleDrag(
  state: HandleDragState,
  targetWorld: THREE.Vector3,
): void {
  const {
    object,
    initial,
    oppositeLocal,
    fixedPivotWorld,
    initialRadius,
    scaleDirection,
  } = state;

  if (
    !oppositeLocal ||
    !fixedPivotWorld ||
    initialRadius === undefined ||
    !scaleDirection
  ) {
    throw new Error("Scale Drag State ไม่สมบูรณ์");
  }

  const pointerFromPivot = targetWorld.clone().sub(fixedPivotWorld);
  const projectedDistance = pointerFromPivot.dot(scaleDirection);
  const rawFactor = projectedDistance / initialRadius;

  if (!Number.isFinite(rawFactor)) {
    throw new Error("ไม่สามารถคำนวณ Scale Factor จากตำแหน่ง Pointer ได้");
  }

  const factor = THREE.MathUtils.clamp(
    rawFactor,
    MIN_SCALE_FACTOR,
    MAX_SCALE_FACTOR,
  );

  // เริ่มคำนวณจาก Initial Transform ทุก Frame
  // เพื่อไม่ให้เกิด Scale สะสมและค่าคลาดเคลื่อน
  restoreTransform(object, initial);

  object.scale.set(
    initial.scale.x * factor,
    initial.scale.y * factor,
    initial.scale.z * factor,
  );
  updateObjectMatrices(object);

  // หลัง Scale ตำแหน่ง Pivot อาจเลื่อน จึงชดเชย World Position
  // เพื่อให้มุมตรงข้ามอยู่ตำแหน่งเดิมอย่างแม่นยำ
  const pivotAfterScale = object.localToWorld(oppositeLocal.clone());
  const correctionWorld = fixedPivotWorld.clone().sub(pivotAfterScale);

  translateObjectInWorld(object, correctionWorld);
}

/** ยกเลิกการลาก เช่น Esc หรือ Pointer Cancel */
export function cancelHandleDrag(state: HandleDragState): void {
  assertSameParent(state);
  restoreTransform(state.object, state.initial);
}

/** สร้างมุม Local Space จาก Bounding Box */
export function getBoxCorner(
  bounds: THREE.Box3,
  x: "min" | "max",
  y: "min" | "max",
  z: "min" | "max",
): THREE.Vector3 {
  if (bounds.isEmpty()) {
    throw new Error("ไม่สามารถสร้าง Corner Handle จาก Bounding Box ว่างได้");
  }

  assertFiniteVector("Bounding Box min", bounds.min);
  assertFiniteVector("Bounding Box max", bounds.max);

  return new THREE.Vector3(
    x === "min" ? bounds.min.x : bounds.max.x,
    y === "min" ? bounds.min.y : bounds.max.y,
    z === "min" ? bounds.min.z : bounds.max.z,
  );
}
