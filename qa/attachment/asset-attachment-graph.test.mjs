import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('public/yp-web-ai/index.html');
const context={globalThis:{}};vm.createContext(context);
for(const file of ['public/yp-web-ai/js/scene-asset-registry.js','public/yp-web-ai/js/smart-snap-engine.js','public/yp-web-ai/js/asset-attachment-graph.js'])vm.runInContext(read(file),context);
const registryApi=context.globalThis.YPSceneAssetRegistry,snapApi=context.globalThis.YPSmartSnap,attachmentApi=context.globalThis.YPAssetAttachmentGraph;
const plain=value=>JSON.parse(JSON.stringify(value));
const asset=(id,assetType,category,bounds,position={x:0,y:0,z:0},extra={})=>({id,name:extra.name||id,assetType,category,object3DId:'scene.'+id,
  transform:{position:{...position},rotation:{x:extra.rx||0,y:extra.ry||0,z:extra.rz||0},scale:{x:1,y:1,z:1}},bounds:{...bounds},
  locked:extra.locked===true,selectable:true,movable:extra.movable!==false,snapEnabled:extra.snapEnabled!==false,metadata:{system:extra.system===true,status:extra.status||'Approved',installFreely:extra.installFreely===true}});
const createSetup=(records)=>{
  const registry=registryApi.createRegistry();records.forEach(record=>registry.registerAsset(record));
  const engine=snapApi.createEngine(registry),applied=[];
  const graph=attachmentApi.createGraph(registry,engine,{applyTransform:(id,transform)=>applied.push({id,transform:plain(transform)})});
  return{registry,engine,graph,applied};
};
const backWall=()=>asset('structure.wall.back','Back Wall','surface',{width:6,height:2.4,depth:.1},{x:3,y:1.2,z:.05},{system:true,locked:true,movable:false});
const logo=()=>asset('asset.logo','Logo','branding',{width:1,height:.5,depth:.05},{x:3,y:1.2,z:.126});
const attachLogo=setup=>{
  const surface=setup.engine.getWorldSurfaces('structure.wall.back').find(item=>item.surfaceType==='wall-inside');
  const anchor=setup.engine.getAnchors('asset.logo').find(item=>item.anchorType==='mount');
  const result=setup.graph.attachFromCurrent('asset.logo',{targetAssetId:'structure.wall.back',targetSurfaceId:surface.id,sourceAnchorId:anchor.id,snapMode:'surface'});
  assert.equal(result.ok,true);return{surface,anchor,result};
};

test('Attachment Schema และ SceneAsset relation fields ตรงตาม Task 3',()=>{
  assert.deepEqual(Array.from(attachmentApi.SNAP_MODES),['surface','edge','center','grid']);
  const normalized=attachmentApi.normalizeAttachment({targetAssetId:'p',targetSurfaceId:'s',sourceAnchorId:'a',localSurfacePosition:{u:1,v:2,normalOffset:.03},rotationOffset:{x:.1,y:.2,z:.3},snapMode:'edge'});
  for(const key of ['targetAssetId','targetSurfaceId','sourceAnchorId','localSurfacePosition','rotationOffset','snapMode','valid','validationWarnings'])assert.ok(Object.hasOwn(normalized,key),key);
  const sceneAsset=registryApi.normalizeSceneAsset({...logo(),attachment:normalized,parentAssetId:'p',childAssetIds:['x','x']});
  assert.equal(sceneAsset.parentAssetId,'p');assert.deepEqual(plain(sceneAsset.childAssetIds),['x']);assert.equal(sceneAsset.attachment.targetSurfaceId,'s');
});

test('Smart Snap commit สร้าง Parent/Child graph และ Serialize/Reload ได้ครบ',()=>{
  const setup=createSetup([backWall(),logo()]);const {result}=attachLogo(setup),saved=plain(setup.graph.serialize());
  assert.equal(result.valid,true);assert.equal(setup.graph.getParent('asset.logo'),'structure.wall.back');assert.deepEqual(plain(setup.graph.getChildren('structure.wall.back')),['asset.logo']);
  assert.equal(setup.registry.getAssetById('asset.logo').parentAssetId,'structure.wall.back');
  const restored=createSetup([backWall(),logo()]);restored.graph.load(saved,{resolve:true});
  assert.deepEqual(plain(restored.graph.serialize()),saved);assert.equal(restored.graph.validate().valid,true);
});

test('Free Install Attachment คง Valid แม้ Child ใหญ่กว่า Parent Surface',()=>{
  const parent=asset('display','Product Display','display',{width:.5,height:.5,depth:.4},{x:2,y:.25,z:1}),child=asset('large-copy','Furniture','furniture',{width:3,height:2,depth:1},{x:2,y:0,z:1.701},{installFreely:true}),setup=createSetup([parent,child]),
    surface=setup.engine.getWorldSurfaces(parent.id).find(item=>item.id.endsWith('.front')),anchor=setup.engine.getAnchors(child.id).find(item=>item.anchorType==='back');
  const result=setup.graph.attachFromCurrent(child.id,{targetAssetId:parent.id,targetSurfaceId:surface.id,sourceAnchorId:anchor.id,snapMode:'surface'});
  assert.equal(result.ok,true);assert.equal(result.valid,true);assert.equal(setup.graph.getParent(child.id),parent.id);
});

test('Move Parent ใช้ Local Surface Position คำนวณ Child ใหม่โดยไม่สะสม error',()=>{
  const setup=createSetup([backWall(),logo()]);attachLogo(setup);const original=plain(setup.registry.getAssetById('asset.logo').transform.position);
  const wall=setup.registry.getAssetById('structure.wall.back');setup.registry.updateAssetTransform(wall.id,{...wall.transform,position:{x:4,y:1.2,z:.55}},{applyToObject3D:false,notifyWorkflow:false});
  setup.graph.propagateFrom(wall.id,{apply:true});const first=plain(setup.registry.getAssetById('asset.logo').transform.position);
  for(let i=0;i<20;i++)setup.graph.propagateFrom(wall.id,{apply:true});const repeated=plain(setup.registry.getAssetById('asset.logo').transform.position);
  assert.ok(Math.abs((first.x-original.x)-1)<1e-9);assert.ok(Math.abs((first.z-original.z)-.5)<1e-9);assert.deepEqual(repeated,first);
});

test('Rotate Parent ทำให้ Child หมุนและเคลื่อนตาม Surface เดิม',()=>{
  const wall=backWall(),mark=logo();mark.transform.position.x=4;const setup=createSetup([wall,mark]);attachLogo(setup);
  setup.registry.updateAssetTransform(wall.id,{...wall.transform,rotation:{x:0,y:Math.PI/2,z:0}},{applyToObject3D:false,notifyWorkflow:false});
  const result=setup.graph.propagateFrom(wall.id,{apply:true})[0],child=setup.registry.getAssetById(mark.id);
  assert.equal(result.valid,true);assert.ok(Math.abs(Math.abs(child.transform.rotation.y)-Math.PI/2)<1e-9);assert.notEqual(child.transform.position.z,mark.transform.position.z);
});

test('Resize Parent ที่ทำให้ Child หลุดขอบ Mark Invalid และไม่ Clamp เงียบ',()=>{
  const mark=logo();mark.transform.position.x=5.25;const setup=createSetup([backWall(),mark]);attachLogo(setup);const before=plain(setup.registry.getAssetById(mark.id).transform.position);
  setup.registry.getAssetById('structure.wall.back').bounds.width=2;setup.engine.syncFromRegistry();const result=setup.graph.reconcile({apply:true})[0],attachment=setup.graph.getAttachment(mark.id);
  assert.equal(result.valid,false);assert.equal(attachment.valid,false);assert.ok(attachment.validationWarnings.includes(attachmentApi.OUT_OF_BOUNDS_WARNING));assert.deepEqual(plain(setup.registry.getAssetById(mark.id).transform.position),before);
});

test('Delete Parent Detach Child, รักษา World Transform และให้ Warning ที่กำหนด',()=>{
  const setup=createSetup([backWall(),logo()]);attachLogo(setup);const before=plain(setup.registry.getAssetById('asset.logo').transform);
  setup.graph.handleParentRemoved('structure.wall.back');setup.registry.unregisterAsset('structure.wall.back',{notifyWorkflow:false});const attachment=setup.graph.getAttachment('asset.logo');
  assert.equal(attachment.attached,false);assert.equal(attachment.valid,false);assert.ok(attachment.validationWarnings.includes(attachmentApi.PARENT_REMOVED_WARNING));assert.deepEqual(plain(setup.registry.getAssetById('asset.logo').transform),before);
});

test('Detach/Reattach, Change Target Surface และ Change Snap Anchor ทำงานเป็น explicit action',()=>{
  const second=asset('structure.wall.left','Left Wall','surface',{width:.1,height:2.4,depth:3},{x:.05,y:1.2,z:1.5},{system:true,locked:true,movable:false});
  const setup=createSetup([backWall(),second,logo()]);const {anchor}=attachLogo(setup);assert.equal(setup.graph.detach('asset.logo',{reason:'manual'}),true);assert.equal(setup.graph.getParent('asset.logo'),null);
  assert.equal(setup.graph.reattach('asset.logo').ok,true);
  const surface=setup.engine.getWorldSurfaces(second.id).find(item=>item.surfaceType==='wall-inside');const changed=setup.graph.changeTargetSurface('asset.logo',second.id,surface.id);
  assert.equal(changed.ok,true);assert.equal(setup.graph.getParent('asset.logo'),second.id);assert.equal(setup.graph.changeSnapAnchor('asset.logo',anchor.id).ok,true);
});

test('Project Migration ไม่เดา Attachment จากระยะใกล้ และ Geometry เดิมไม่เปลี่ยน',()=>{
  const records=[backWall(),logo()],before=plain(records.map(item=>item.transform));const setup=createSetup(records);setup.graph.load({version:1,attachments:[]},{resolve:true});
  assert.equal(setup.graph.listAttachments().length,0);assert.deepEqual(plain(setup.registry.listAssets().map(item=>item.transform)),before);
});

test('Booth Type Surface หาย Detach Child แต่ไม่ลบ Suggested/Approved Asset',()=>{
  const setup=createSetup([backWall(),logo()]);attachLogo(setup);setup.registry.unregisterAsset('structure.wall.back',{notifyWorkflow:false});setup.engine.syncFromRegistry();setup.graph.reconcile({apply:true});
  assert.ok(setup.registry.getAssetById('asset.logo'));assert.equal(setup.registry.getAssetById('asset.logo').metadata.status,'Approved');assert.equal(setup.graph.getAttachment('asset.logo').attached,false);
});

test('ป้องกัน Attachment cycle และ Validation รายงาน Registry inconsistency',()=>{
  const a=asset('a','Furniture','furniture',{width:1,height:1,depth:1},{x:0,y:0,z:0}),b=asset('b','Furniture','furniture',{width:1,height:1,depth:1},{x:1,y:0,z:0}),setup=createSetup([a,b]);
  const bSurface=setup.engine.getWorldSurfaces('b').find(item=>item.surfaceType==='vertical-face'),aAnchor=setup.engine.getAnchors('a')[0];
  assert.equal(setup.graph.attachFromCurrent('a',{targetAssetId:'b',targetSurfaceId:bSurface.id,sourceAnchorId:aAnchor.id}).ok,true);
  const aSurface=setup.engine.getWorldSurfaces('a').find(item=>item.surfaceType==='vertical-face'),bAnchor=setup.engine.getAnchors('b')[0];
  assert.equal(setup.graph.attachFromCurrent('b',{targetAssetId:'a',targetSurfaceId:aSurface.id,sourceAnchorId:bAnchor.id}).reason,'attachment-cycle');
});

test('Editor integration: Atomic history, UI commands, Clean Screenshot และ Render Package ครบ',()=>{
  for(const token of ['js/asset-attachment-graph.js','commitPersistentAttachmentFromSnap','recordObjectHistory(drag.before)','assetAttachmentGraph.reconcile','preparePersistentAttachmentDeletion',
    'assetAttachmentGraph:{version:1,attachments:[]}','sceneSnapData:{version:1,anchors:[],surfaces:[]}','Detach','Reattach','Change Target Surface','Change Snap Anchor',
    'parentAssetId','targetSurfaceId','sourceAnchorId','localSurfacePosition','validationStatus','legacyPortAttachment','window.AssetAttachmentGraphAPI'])assert.ok(html.includes(token),token);
  for(const helper of ['attachment-invalid-warning','attachment-surface-highlight','smart-snap-surface-highlight','smart-snap-ghost-preview'])assert.ok(html.includes(helper),helper);
  assert.match(html,/Project เก่าไม่ถูกเดาความสัมพันธ์จากระยะใกล้หรือ snapCandidate เดิม/);
  assert.match(html,/if\(member\.id===obj\.id&&member\.placement\?\.snapCandidate\?\.valid\)commitPersistentAttachmentFromSnap/);
});

test('Integration matrix ครบ Inline, Corner ซ้าย/ขวา, Peninsular, Island และชนิด Asset หลัก',()=>{
  for(const token of ["k:'inline'","k:'corner'","k:'penin'","k:'island'","cornerSide","structure.wall.left","structure.wall.right",
    "assetType:'Logo'","assetType:'Graphic'","assetType:'Lighting Fixture'","assetType:'Counter'","assetType:'Shelf'","assetType:'Screen/TV'"])assert.ok(html.includes(token),token);
});
