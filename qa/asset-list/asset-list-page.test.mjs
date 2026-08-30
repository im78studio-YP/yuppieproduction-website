import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');

test('Asset List มีปุ่ม Panel ค้นหา Filter และ Responsive shell',()=>{
  for(const token of ['id="btnAssetList"','id="assetListPanel"','id="assetListSearch"','data-asset-list-filter="all"','data-asset-list-filter="selected"','data-asset-list-filter="locked"','data-asset-list-filter="hidden"']){
    assert.ok(html.includes(token),`missing ${token}`);
  }
  assert.match(html,/\.asset-list-panel[^}]*position:fixed/);
  assert.match(html,/@media\(max-width:820px\)[\s\S]*\.asset-list-panel/);
});

test('Asset List ใช้ Selection กลางและ Project State เดิม',()=>{
  assert.match(html,/sceneItemState:\{\}/);
  assert.match(html,/const selectedSceneItemIds=/);
  assert.match(html,/const selectedObjectIds=\(\)=>selectedSceneItemIds\(\)\.filter/);
  assert.match(html,/objectSnapshot=\(\)=>JSON\.stringify\(\{objects:S\.objects,sceneItemState:S\.sceneItemState/);
  assert.doesNotMatch(html,/assetListSelectionState/);
});

test('System Geometry ป้องกันการลบและ Action สำคัญรองรับ History',()=>{
  assert.match(html,/พื้น ผนัง ห้อง และ Geometry หลักลบจาก Asset List ไม่ได้/);
  assert.match(html,/setSceneItemsVisibility[\s\S]*recordObjectHistory\(before\)/);
  assert.match(html,/setSceneItemsLocked[\s\S]*recordObjectHistory\(before\)/);
  assert.match(html,/renameSelectedSceneItem[\s\S]*recordObjectHistory\(before\)/);
  assert.match(html,/deleteSceneSelection[\s\S]*window\.confirm/);
});

test('Canvas และ Asset List sync selection พร้อม Focus',()=>{
  assert.match(html,/syncObjectControls\(\);if\(threeRenderer\)threeRenderer\.setSceneSelection/);
  assert.match(html,/renderAssetList\(\);/);
  assert.match(html,/focusSceneItem\(id\)/);
  assert.match(html,/ondblclick=.*focusSceneItem/);
});
