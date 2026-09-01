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

test('ผนังและโลโก้ใช้ Contextual Toolbar ชุดเดียวกับ Asset ทั่วไป',()=>{
  for(const token of ['id="btnMoveSmart"','id="btnResizeObject"','id="btnScaleObject"','id="moveAdvanced"','id="btnLockObject"','id="btnRotateObject"','id="btnFlipObjectX"','id="btnFlipObjectY"','id="btnOpenAssetSettings"','id="btnAssetList"','id="btnDuplicateObject"','id="btnDeleteObject"']){
    assert.ok(html.includes(token),`missing ${token}`);
  }
  assert.match(html,/systemAssetSelected=!!sceneItem\?\.system&&!obj/);
  assert.match(html,/toolbar\.classList\.toggle\('scene-asset-selected',systemAssetSelected\)/);
  assert.doesNotMatch(html,/scene-asset-selected \.btn[^}]*display:none/);
  assert.match(html,/brandSelected\?false:!obj\|\|locked/);
  assert.match(html,/function openAssetSettings\(\)[\s\S]*item\.id===SCENE_ASSET_IDS\.brand\?'signage'[\s\S]*'finish'/);
  assert.match(html,/function deleteSelectedObject\(\)[\s\S]*item\?\.system[\s\S]*setSceneItemsVisibility\(\[item\.id\],false\)/);
});

test('โลโก้หลักทำสำเนาเป็น Branding Asset อิสระได้โดยไม่ปลดล็อกผนัง',()=>{
  assert.match(html,/catalogId:'brand-artwork-copy'[\s\S]*hiddenFromCatalog:true/);
  assert.match(html,/catalogId:'brand-artwork-copy'[\s\S]*sceneAssetType:'Logo',sceneAssetCategory:'branding',sceneListGroup:'branding'/);
  assert.match(html,/catalogId:'brand-artwork-copy'[\s\S]*allowedTargets:\['wall','storage-room','structure','asset','free'\]/);
  assert.match(html,/catalogId:'brand-artwork-copy'[\s\S]*capabilities:\['wallMountable','free3DPlaceable','surfaceSnappable','attachable'/);
  assert.match(html,/function duplicateSelectedObject\(\)[\s\S]*selectedId===SCENE_ASSET_IDS\.brand[\s\S]*duplicateBrandSceneAsset/);
  assert.match(html,/function currentBrandArtworkDataURL\(\)[\s\S]*logoVisibleBounds[\s\S]*toDataURL\('image\/png'\)/);
  assert.match(html,/function duplicateBrandSceneAsset\(\)[\s\S]*catalogId:item\.catalogId[\s\S]*appearance:\{mode:'original'[\s\S]*mutateObjects\(\(\)=>S\.objects\.push\(copy\),copy\.id\)/);
  assert.match(html,/copyNumber=\(S\.objects\|\|\[\]\)\.filter\(obj=>obj\.catalogId==='brand-artwork-copy'\)\.length\+2,label='โลโก้ '\+copyNumber/);
  assert.match(html,/ลากจุด Mount สีเขียวไปติดผนังหรือ Asset อื่น/);
  assert.match(html,/brandSelected&&\['btnRotateObject','btnDuplicateObject'\]\.includes\(id\)/);
  assert.match(html,/copy\.placement=\{\.\.\.\(source\.placement\|\|\{\}\),mode:'free',surface:'free',targetId:null,anchorAttachment:null,snapCandidate:null,installFreely:true,duplicateSourceId:source\.id\}/);
  assert.doesNotMatch(html,/function duplicateBrandSceneAsset\(\)[\s\S]{0,1800}sideLogo\s*=\s*true/);
});

test('สำเนาโลโก้ใช้ Mount Anchor สีเขียวและ Attachment Graph เดียวกับ Asset อื่น',()=>{
  assert.match(html,/if\(item\?\.sceneAssetType\)return\{assetType:String\(item\.sceneAssetType\)/);
  assert.match(html,/anchor\.anchorType==='mount'\?0x46d79a/);
  assert.match(html,/marker\.userData\.snapAnchorType=anchor\.anchorType/);
  assert.match(html,/function commitPersistentAttachmentFromSnap[\s\S]*attachFromCurrent/);
  assert.match(html,/surfaceSnapTargets\(selectedRoot\)[\s\S]*asset\.id===selectedAssetId[\s\S]*targets\.push\(node\)/);
  assert.match(html,/if\(targetObject&&sceneObjectAllowsOutsideBooth\(targetItem,targetObject\)\)proxy\.placement\.allowOutsideBooth=true/);
  assert.match(html,/other\.id===obj\.id\|\|other\.id===mountTargetId/);
});

test('สำเนา Asset ทุกชนิดใช้ Free Install โดยไม่ติดขอบเขตหรือขนาด Surface',()=>{
  assert.match(html,/copy\.placement=\{\.\.\.\(source\.placement\|\|\{\}\)[\s\S]*installFreely:true,duplicateSourceId:source\.id/);
  assert.match(html,/catalogId:item\.catalogId[\s\S]*installFreely:true,duplicateSourceId:SCENE_ASSET_IDS\.brand/);
  assert.match(html,/installFreely:obj\.placement\?\.installFreely===true/);
  assert.match(html,/if\(obj\?\.placement\?\.installFreely===true\)return true/);
  assert.match(html,/if\(objectOverride\?\.placement\?\.installFreely===true\)return true/);
  assert.match(html,/if\(obj\.placement\?\.installFreely===true\)return\{valid:true,reason:''\}/);
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
  assert.match(html,/function deleteObjectIds[\s\S]*window\.confirm[\s\S]*preparePersistentAttachmentDeletion[\s\S]*mutateObjects/);
  assert.match(html,/function deleteSceneSelection[\s\S]*item\.system[\s\S]*deleteObjectIds/);
  assert.match(html,/function deleteSelectedObject\(\)[\s\S]*return deleteObjectIds\(selectedObjectIds\(\),\{confirm:false\}\)/);
  assert.match(html,/function deleteObjectIds\(ids=\[\],options=\{\}\)[\s\S]*options\.confirm!==false&&\!window\.confirm/);
});

test('Asset ใหม่และ Asset ที่เลือกใหม่เริ่มต้นด้วย Smart Move เสมอ',()=>{
  assert.match(html,/function mutateObjects[\s\S]*objectEditor\.moveMode='smart';objectEditor\.transformMode='move'/);
  assert.match(html,/function selectObject[\s\S]*previousPrimary!==id\)\{objectEditor\.moveMode='smart';objectEditor\.transformMode='move'/);
});

test('ปุ่มหมุน 45 องศาคงอยู่สำหรับ Asset ทุกชนิดรวมกรอบทางเข้า',()=>{
  assert.match(html,/id="btnRotateObject"[\s\S]*>↻ หมุน 45°<\/button>/);
  assert.match(html,/function rotateSelectedObject\(\)[\s\S]*const rotationY=\(obj\.rotationY\+45\)%360/);
  assert.doesNotMatch(html,/if\(isEntranceFrameObject\(obj\)\)\{moveEntranceFrameToSide/);
  assert.doesNotMatch(html,/rotateButton\.textContent=frame\?'⇄ สลับด้าน'/);
});

test('Canvas และ Asset List sync selection พร้อม Focus',()=>{
  assert.match(html,/syncObjectControls\(\);if\(threeRenderer\)threeRenderer\.setSceneSelection/);
  assert.match(html,/renderAssetList\(\);/);
  assert.match(html,/focusSceneItem\(id\)/);
  assert.match(html,/ondblclick=.*focusSceneItem/);
});
