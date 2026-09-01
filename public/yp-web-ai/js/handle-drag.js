import * as THREE from 'three';

const MIN_SCALE_FACTOR=.05;
const MAX_SCALE_FACTOR=100;
const MATRIX_EPSILON=1e-12;

function assertFiniteVector(label,value){
  if(!value||!Number.isFinite(value.x)||!Number.isFinite(value.y)||!Number.isFinite(value.z)){
    throw new Error(label+' ต้องเป็นพิกัดที่มีค่าจำกัด');
  }
}

function updateObjectMatrices(object){
  object.updateMatrix();
  object.updateWorldMatrix(true,false);
}

function assertSameParent(state){
  if(state.object.parent!==state.parent)throw new Error('ห้าม Re-parent Asset ระหว่างลาก Handle');
}

export function snapshotTransform(object){
  return{position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()};
}

export function restoreTransform(object,snapshot){
  object.position.copy(snapshot.position);
  object.quaternion.copy(snapshot.quaternion);
  object.scale.copy(snapshot.scale);
  updateObjectMatrices(object);
}

function translateObjectInWorld(object,deltaWorld){
  assertFiniteVector('deltaWorld',deltaWorld);
  if(!object.parent){
    object.position.add(deltaWorld);updateObjectMatrices(object);return;
  }
  object.parent.updateWorldMatrix(true,false);
  const parentLinear=new THREE.Matrix3().setFromMatrix4(object.parent.matrixWorld);
  if(Math.abs(parentLinear.determinant())<=MATRIX_EPSILON){
    throw new Error('ไม่สามารถลาก Asset ได้ เพราะ Parent มี Scale เป็นศูนย์หรือ Matrix กลับด้านไม่ได้');
  }
  object.position.add(deltaWorld.clone().applyMatrix3(parentLinear.invert()));
  updateObjectMatrices(object);
}

export function beginHandleDrag({object,mode,handleLocal,oppositeLocal}){
  if(mode!=='move'&&mode!=='scale')throw new Error('Handle mode ต้องเป็น move หรือ scale');
  assertFiniteVector('handleLocal',handleLocal);updateObjectMatrices(object);
  const initial=snapshotTransform(object),initialHandleWorld=object.localToWorld(handleLocal.clone()),parent=object.parent;
  if(mode==='move')return{object,parent,mode,handleLocal:handleLocal.clone(),initial,initialHandleWorld};
  if(!oppositeLocal)throw new Error('Scale Handle ต้องมี oppositeLocal สำหรับใช้เป็น Fixed Pivot');
  assertFiniteVector('oppositeLocal',oppositeLocal);
  const fixedPivotWorld=object.localToWorld(oppositeLocal.clone()),startVector=initialHandleWorld.clone().sub(fixedPivotWorld),initialRadius=startVector.length();
  if(!Number.isFinite(initialRadius)||initialRadius<=MATRIX_EPSILON)throw new Error('Handle และ Pivot อยู่ตำแหน่งเดียวกันหรือมีพิกัดไม่ถูกต้อง');
  return{object,parent,mode,handleLocal:handleLocal.clone(),oppositeLocal:oppositeLocal.clone(),initial,initialHandleWorld,
    fixedPivotWorld,initialRadius,scaleDirection:startVector.normalize()};
}

export function updateHandleDrag(state,pointerWorld,snapTargetWorld){
  assertSameParent(state);const targetWorld=snapTargetWorld??pointerWorld;assertFiniteVector('ตำแหน่ง Pointer/Snap Target',targetWorld);
  if(state.mode==='move'){updateMoveDrag(state,targetWorld);return;}
  updateUniformScaleDrag(state,targetWorld);
}

function updateMoveDrag(state,targetWorld){
  const{object,initial,handleLocal}=state;restoreTransform(object,initial);
  const currentHandleWorld=object.localToWorld(handleLocal.clone()),deltaWorld=targetWorld.clone().sub(currentHandleWorld);
  translateObjectInWorld(object,deltaWorld);
}

function updateUniformScaleDrag(state,targetWorld){
  const{object,initial,oppositeLocal,fixedPivotWorld,initialRadius,scaleDirection}=state;
  if(!oppositeLocal||!fixedPivotWorld||initialRadius===undefined||!scaleDirection)throw new Error('Scale Drag State ไม่สมบูรณ์');
  const rawFactor=targetWorld.clone().sub(fixedPivotWorld).dot(scaleDirection)/initialRadius;
  if(!Number.isFinite(rawFactor))throw new Error('ไม่สามารถคำนวณ Scale Factor จากตำแหน่ง Pointer ได้');
  const factor=THREE.MathUtils.clamp(rawFactor,MIN_SCALE_FACTOR,MAX_SCALE_FACTOR);restoreTransform(object,initial);
  object.scale.set(initial.scale.x*factor,initial.scale.y*factor,initial.scale.z*factor);updateObjectMatrices(object);
  const pivotAfterScale=object.localToWorld(oppositeLocal.clone()),correctionWorld=fixedPivotWorld.clone().sub(pivotAfterScale);
  translateObjectInWorld(object,correctionWorld);
}

export function cancelHandleDrag(state){
  assertSameParent(state);restoreTransform(state.object,state.initial);
}

export function getBoxCorner(bounds,x,y,z){
  if(bounds.isEmpty())throw new Error('ไม่สามารถสร้าง Corner Handle จาก Bounding Box ว่างได้');
  assertFiniteVector('Bounding Box min',bounds.min);assertFiniteVector('Bounding Box max',bounds.max);
  return new THREE.Vector3(x==='min'?bounds.min.x:bounds.max.x,y==='min'?bounds.min.y:bounds.max.y,z==='min'?bounds.min.z:bounds.max.z);
}

export function getBoxCorners(bounds){
  const corners=[];['min','max'].forEach(x=>['min','max'].forEach(y=>['min','max'].forEach(z=>corners.push(getBoxCorner(bounds,x,y,z)))));
  return corners;
}
