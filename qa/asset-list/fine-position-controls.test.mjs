import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');

test('Fine Position แทนเมนูโหมดลากเดิมด้วยแกน X Y Z',()=>{
  for(const axis of ['x','y','z']){
    assert.ok(html.includes(`data-fine-axis="${axis}" data-fine-delta="-0.05"`));
    assert.ok(html.includes(`data-fine-axis="${axis}" data-fine-delta="0.05"`));
    assert.ok(html.includes(`id="finePosition${axis.toUpperCase()}"`));
    assert.match(html,new RegExp(`id="finePosition${axis.toUpperCase()}" type="text" inputmode="decimal"`));
  }
  for(const oldId of ['btnMovePlane','btnMoveHeight','btnMoveSurface'])assert.ok(!html.includes(`id="${oldId}"`));
});

test('Fine Position ใช้ระยะ 5 ซม. สะสมและ Selection กลาง',()=>{
  assert.match(html,/const FINE_POSITION_STEP=\.05/);
  assert.match(html,/delta=direction\*FINE_POSITION_STEP/);
  assert.match(html,/function fineMoveSelectedObjects\(axis,delta\)[\s\S]*const objects=selectedTransformObjects\(\)/);
  assert.match(html,/function finePositionSelectionKey\(objects=selectedObjects\(\)\)/);
  assert.doesNotMatch(html,/finePositionSelectionState|assetListSelectionState/);
});

test('Fine Position รองรับ Lock, Bounding Box และ History',()=>{
  assert.match(html,/objects\.some\(objectLocked\)/);
  assert.ok(html.includes('ปลดล็อก Asset ก่อนปรับตำแหน่ง'));
  assert.ok(html.includes('เลือก Asset ที่ต้องการปรับ'));
  assert.match(html,/selectedAlignmentBounds\(obj\)[\s\S]*finePositionAxisOverflow/);
  assert.ok(html.includes('Bounding Box ของ Asset จะอยู่นอกพื้นที่บูธ'));
  assert.match(html,/const before=objectSnapshot\(\)[\s\S]*recordObjectHistory\(before\);sync\(\)/);
});

test('Fine Position ใช้ Draft และยืนยัน Absolute เฉพาะเมื่อกด Enter',()=>{
  assert.match(html,/const finePositionDraft=/);
  assert.match(html,/function parseFinePositionDraft\(value\)[\s\S]*replace\(\/,\/g,'\.'\)/);
  assert.match(html,/function commitFinePositionInput\(axis\)/);
  assert.match(html,/input\.oninput=.*finePositionDraft\.dirty\.add\(axis\)/);
  assert.match(html,/event\.key==='Enter'[\s\S]*commitFinePositionInput\(axis\)/);
  assert.match(html,/event\.key==='Escape'[\s\S]*cancelFinePositionDraft\(axis\)/);
  assert.match(html,/input\.onblur=.*cancelFinePositionDraft\(axis\)/);
});

test('Fine Position แสดงสองตำแหน่ง แยกหน่วย และปิด Absolute เมื่อเลือกหลายชิ้น',()=>{
  assert.ok(html.includes('Number(primary.position?.[finePositionWorldAxis(axis)]||0).toFixed(2)'));
  assert.ok(html.includes('<span class="fine-position-unit">ม.</span>'));
  assert.match(html,/input\.disabled=!primary\|\|locked\|\|multi/);
  assert.match(html,/input\.placeholder=multi\?'—'/);
  assert.ok(html.includes('ค่า Absolute ปิดอยู่ ใช้ −/+ เพื่อเลื่อนทั้งกลุ่ม'));
});

test('Selection ว่างปิด Contextual Toolbar, Fine Position และ Asset List พร้อมกัน',()=>{
  assert.match(html,/function resetAssetContextOpenState\(\)[\s\S]*advanced\.open=false[\s\S]*closeAssetList\(false\)[\s\S]*resetFinePositionDraft\(\)/);
  assert.match(html,/if\(!valid\.length\)resetAssetContextOpenState\(\)/);
  assert.match(html,/toolbar\.hidden=!selectionCount/);
  assert.match(html,/if\(!selectedSceneItemIds\(\)\.length\)return false/);
  assert.match(html,/panel\.hidden=true/);
});

test('Fine Position ไม่เปลี่ยน Smart Move',()=>{
  assert.ok(html.includes('id="btnMoveSmart"'));
  assert.match(html,/document\.getElementById\('btnMoveSmart'\)\.onclick=\(\)=>setObjectMoveMode\('smart'\)/);
});

test('Z-up แปลงพิกัดเฉพาะ UI ทั้งปุ่ม ค่าแสดง และ Absolute โดยคง world Y-up',()=>{
  assert.ok(html.includes("function finePositionWorldAxis(axis){return {x:'x',y:'z',z:'y'}[axis];}"));
  assert.ok(html.includes('fineMoveSelectedObjects(finePositionWorldAxis(button.dataset.fineAxis),button.dataset.fineDelta)'));
  assert.ok(html.includes('obj.position[worldAxis]=+numeric.toFixed(3)'));
  assert.ok(html.includes('finePositionAxisOverflow(next,worldAxis)'));
  assert.ok(html.includes('title="Z+ ขึ้น 5 ซม."'));
  assert.ok(html.includes('title="Z− ลง 5 ซม."'));
  assert.ok(html.includes('title="Y+ ด้านหน้า 5 ซม."'));
  assert.ok(html.includes('title="Y− ด้านหลัง 5 ซม."'));
  // Internal movement remains world-coordinate based for existing callers.
  assert.ok(html.includes('obj.position[axis]=+(Number(obj.position?.[axis]||0)+delta).toFixed(objects.length>1?9:3)'));
});
