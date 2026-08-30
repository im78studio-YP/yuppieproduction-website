import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');

test('Fine Position แทนเมนูโหมดลากเดิมด้วยแกน X Y Z',()=>{
  for(const axis of ['x','y','z']){
    assert.ok(html.includes(`data-fine-axis="${axis}" data-fine-delta="-0.05"`));
    assert.ok(html.includes(`data-fine-axis="${axis}" data-fine-delta="0.05"`));
    assert.ok(html.includes(`id="finePosition${axis.toUpperCase()}"`));
  }
  for(const oldId of ['btnMovePlane','btnMoveHeight','btnMoveSurface'])assert.ok(!html.includes(`id="${oldId}"`));
});

test('Fine Position ใช้ระยะ 5 ซม. สะสมและ Selection กลาง',()=>{
  assert.match(html,/const FINE_POSITION_STEP=\.05/);
  assert.match(html,/delta=direction\*FINE_POSITION_STEP/);
  assert.match(html,/function fineMoveSelectedObjects\(axis,delta\)[\s\S]*const objects=selectedObjects\(\)/);
  assert.doesNotMatch(html,/finePositionSelectionState/);
});

test('Fine Position รองรับ Lock, Bounding Box และ History',()=>{
  assert.match(html,/objects\.some\(objectLocked\)/);
  assert.ok(html.includes('ปลดล็อก Asset ก่อนปรับตำแหน่ง'));
  assert.ok(html.includes('เลือก Asset ที่ต้องการปรับ'));
  assert.match(html,/selectedAlignmentBounds\(obj\)[\s\S]*finePositionAxisOverflow/);
  assert.ok(html.includes('Bounding Box ของ Asset จะอยู่นอกพื้นที่บูธ'));
  assert.match(html,/const before=objectSnapshot\(\)[\s\S]*recordObjectHistory\(before\);sync\(\)/);
});

test('Fine Position แสดงพิกัด real-time สองตำแหน่งและไม่เปลี่ยน Smart Move',()=>{
  assert.match(html,/Number\(primary\.position\?\.\[axis\]\|\|0\)\.toFixed\(2\)\+' ม\.'/);
  assert.ok(html.includes('id="btnMoveSmart"'));
  assert.match(html,/document\.getElementById\('btnMoveSmart'\)\.onclick=\(\)=>setObjectMoveMode\('smart'\)/);
});
