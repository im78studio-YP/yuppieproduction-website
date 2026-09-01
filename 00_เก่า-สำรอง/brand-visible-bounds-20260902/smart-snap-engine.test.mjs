import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const registrySource=fs.readFileSync(path.join(root,'public/yp-web-ai/js/scene-asset-registry.js'),'utf8');
const snapSource=fs.readFileSync(path.join(root,'public/yp-web-ai/js/smart-snap-engine.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/yp-web-ai/index.html'),'utf8');
const context={globalThis:{}};vm.createContext(context);vm.runInContext(registrySource,context);vm.runInContext(snapSource,context);
const registryApi=context.globalThis.YPSceneAssetRegistry,snapApi=context.globalThis.YPSmartSnap;
const plain=value=>JSON.parse(JSON.stringify(value));
const asset=(id,assetType,category,bounds,position={x:0,y:0,z:0},extra={})=>({id,name:id,assetType,category,object3DId:'scene.'+id,
  transform:{position,rotation:{x:0,y:0,z:0},scale:{x:1,y:1,z:1}},bounds,locked:extra.locked===true,selectable:true,movable:extra.movable!==false,
  snapEnabled:extra.snapEnabled!==false,metadata:{system:extra.system===true,fixtureType:extra.fixtureType||''}});
const setup=(records)=>{const registry=registryApi.createRegistry();records.forEach(record=>registry.registerAsset(record));return{registry,engine:snapApi.createEngine(registry)};};

test('SnapAnchor และ SnapSurface schema/enums ตรงตาม Task 2',()=>{
  assert.deepEqual(Array.from(snapApi.ANCHOR_TYPES),['bottom','back','front','left','right','top','center','mount','corner']);
  assert.deepEqual(Array.from(snapApi.SURFACE_TYPES),['floor-top','wall-inside','wall-outside','vertical-face','horizontal-top','horizontal-bottom','edge','center-line']);
  assert.deepEqual(Array.from(snapApi.ROTATION_POLICIES),['preserve','align-normal','align-horizontal','align-vertical']);
  const anchor=snapApi.normalizeSnapAnchor({id:'a',ownerAssetId:'x',anchorType:'mount',localPosition:{x:0,y:1,z:-.1},localNormal:{x:0,y:0,z:-1},compatibleSurfaceTypes:['wall-inside'],rotationPolicy:'align-normal'});
  assert.deepEqual(Object.keys(anchor),['id','ownerAssetId','anchorType','localPosition','localNormal','compatibleSurfaceTypes','rotationPolicy']);
  const surface=snapApi.normalizeSnapSurface({id:'s',ownerAssetId:'wall',surfaceType:'wall-inside',localOrigin:{},localNormal:{z:1},width:6,height:2.4,allowedAssetTypes:[],padding:.001,enabled:true});
  assert.deepEqual(Object.keys(surface),['id','ownerAssetId','surfaceType','localOrigin','localNormal','width','height','allowedAssetTypes','padding','enabled']);
});

test('ทุก Physical Asset มี Corner Anchor แยกครบ 8 จุดตาม min/max ของ Bounding Box',()=>{
  const record=asset('box','Furniture','furniture',{width:2,height:1,depth:.8},{x:1,y:0,z:2}),anchors=snapApi.createAnchorsForAsset(record),corners=anchors.filter(item=>item.anchorType==='corner');
  assert.equal(corners.length,8);assert.equal(new Set(corners.map(item=>item.id)).size,8);
  assert.deepEqual([...new Set(corners.map(item=>item.localPosition.x))].sort((a,b)=>a-b),[-1,1]);
  assert.deepEqual([...new Set(corners.map(item=>item.localPosition.y))].sort((a,b)=>a-b),[0,1]);
  assert.deepEqual([...new Set(corners.map(item=>item.localPosition.z))].sort((a,b)=>a-b),[-.4,.4]);
  assert.ok(anchors.some(item=>item.anchorType==='bottom'));assert.ok(anchors.some(item=>item.anchorType==='center'));
});

test('Corner Anchor แปลงเป็น World Space ถูกต้องหลัง Move, Rotate และ Flip',()=>{
  const record=asset('box','Furniture','furniture',{width:2,height:1,depth:1},{x:10,y:2,z:20}),corner=snapApi.createAnchorsForAsset(record).find(item=>item.id.endsWith('min-x.min-y.min-z')),
    world=snapApi.worldAnchor(corner,record,{position:{x:10,y:2,z:20},rotation:{x:0,y:Math.PI/2,z:0},scale:{x:-1,y:1,z:1}});
  assert.ok(Math.abs(world.worldPosition.x-9.5)<1e-9);assert.equal(world.worldPosition.y,2);assert.ok(Math.abs(world.worldPosition.z-19)<1e-9);
  assert.ok(Math.abs(Math.hypot(world.worldNormal.x,world.worldNormal.y,world.worldNormal.z)-1)<1e-9);
  assert.equal(snapApi.anchorKindsCompatible('corner','corner'),true);assert.equal(snapApi.anchorKindsCompatible('corner','edge'),true);
  assert.equal(snapApi.anchorKindsCompatible('edge','corner'),true);assert.equal(snapApi.anchorKindsCompatible('corner','center'),false);
});

test('Corner → Corner ของ Asset สองชิ้นให้ตำแหน่งปลายตรงกันโดยไม่เปลี่ยน Rotation/Scale',()=>{
  const source=asset('source','Furniture','furniture',{width:1,height:1,depth:1},{x:0,y:0,z:0}),target=asset('target','Furniture','furniture',{width:2,height:2,depth:2},{x:4,y:0,z:3}),
    sourceAnchor=snapApi.createCornerAnchorsForAsset(source).find(item=>item.id.endsWith('max-x.max-y.max-z')),
    targetAnchor=snapApi.createCornerAnchorsForAsset(target).find(item=>item.id.endsWith('min-x.min-y.min-z')),
    rotation={x:0,y:Math.PI/4,z:0},scale={x:-1,y:1,z:1},beforeTransform={position:{...source.transform.position},rotation:{...rotation},scale:{...scale}},
    from=snapApi.worldAnchor(sourceAnchor,source,beforeTransform).worldPosition,to=snapApi.worldAnchor(targetAnchor,target).worldPosition,
    snappedTransform={...beforeTransform,position:{x:beforeTransform.position.x+to.x-from.x,y:beforeTransform.position.y+to.y-from.y,z:beforeTransform.position.z+to.z-from.z}},
    after=snapApi.worldAnchor(sourceAnchor,source,snappedTransform).worldPosition;
  assert.ok(Math.hypot(after.x-to.x,after.y-to.y,after.z-to.z)<1e-9);assert.deepEqual(snappedTransform.rotation,rotation);assert.deepEqual(snappedTransform.scale,scale);
});

test('สร้าง Anchor ตามประเภท Logo/TV, Counter/Shelf, Furniture และ Lighting',()=>{
  const logo=snapApi.createAnchorsForAsset(asset('logo','Logo','branding',{width:1,height:.5,depth:.05}));
  assert.equal(logo[0].anchorType,'mount');assert.equal(logo[0].rotationPolicy,'align-normal');
  const counter=snapApi.createAnchorsForAsset(asset('counter','Counter','furniture',{width:1.2,height:1,depth:.6}));
  assert.deepEqual(plain(counter.slice(0,2).map(item=>item.anchorType)),['bottom','back']);
  const chair=snapApi.createAnchorsForAsset(asset('chair','Furniture','furniture',{width:.5,height:.85,depth:.5}));assert.equal(chair[0].anchorType,'bottom');
  const arm=snapApi.createAnchorsForAsset(asset('arm','Lighting Fixture','lighting',{width:.2,height:.25,depth:.3},{},{fixtureType:'Arm Light'}));assert.equal(arm[0].anchorType,'mount');
  const clear=snapApi.createAnchorsForAsset(asset('clear','Lighting Fixture','lighting',{width:.2,height:.2,depth:.2},{},{fixtureType:'Clear Light'}));assert.equal(clear[0].anchorType,'top');
});

test('สร้าง Surface ให้ Floor, Wall และ Physical Asset จาก Registry',()=>{
  const floor=asset('structure.floor.main','Floor','surface',{width:6,height:.003,depth:3},{x:3,y:-.0015,z:1.5},{system:true,locked:true,movable:false});
  const wall=asset('structure.wall.back','Back Wall','surface',{width:6,height:2.4,depth:.1},{x:3,y:1.2,z:.05},{system:true,locked:true,movable:false});
  const beam=asset('beam','Beam','structure',{width:4,height:.2,depth:.3},{x:3,y:2.2,z:.3});
  const {engine}=setup([floor,wall,beam]);
  assert.deepEqual(plain(engine.getSurfaces(floor.id).map(item=>item.surfaceType)),['floor-top','edge','edge','edge','edge','center-line','center-line']);
  assert.ok(engine.getSurfaces(wall.id).some(item=>item.surfaceType==='wall-inside'));
  assert.ok(engine.getSurfaces(wall.id).some(item=>item.surfaceType==='wall-outside'));
  assert.ok(engine.getSurfaces(beam.id).some(item=>item.surfaceType==='horizontal-bottom'));
  assert.ok(engine.getSurfaces(beam.id).some(item=>item.surfaceType==='vertical-face'));
});

test('Furniture → Floor ใช้ Bottom Anchor, Grid 5 ซม. และไม่ลอย',()=>{
  const floor=asset('structure.floor.main','Floor','surface',{width:6,height:.003,depth:3},{x:3,y:-.0015,z:1.5},{system:true,locked:true,movable:false});
  const chair=asset('chair','Furniture','furniture',{width:.5,height:.85,depth:.5},{x:1,y:0,z:1});
  const {engine}=setup([floor,chair]),surface=engine.getWorldSurfaces(floor.id).find(item=>item.surfaceType==='floor-top'),result=engine.solve({sourceAssetId:chair.id,surface,targetAssetId:floor.id,surfacePoint:{x:2.13,y:0,z:1.27}});
  assert.equal(result.anchor.anchorType,'bottom');assert.equal(result.valid,true);
  assert.equal(result.transform.position.x,2.15);assert.equal(result.transform.position.z,1.25);assert.ok(result.transform.position.y>=0&&result.transform.position.y<=.002);
});

test('Logo/TV → Back/Left Wall แนบหน้าผิวและ Align Rotation ตาม Normal',()=>{
  const back=asset('structure.wall.back','Back Wall','surface',{width:6,height:2.4,depth:.1},{x:3,y:1.2,z:.05},{system:true,locked:true,movable:false});
  const left=asset('structure.wall.left','Left Wall','surface',{width:.1,height:2.4,depth:3},{x:.05,y:1.2,z:1.5},{system:true,locked:true,movable:false});
  const tv=asset('tv','Screen/TV','display',{width:.9,height:.6,depth:.08},{x:2,y:.8,z:1});
  const {engine}=setup([back,left,tv]),backSurface=engine.getWorldSurfaces(back.id).find(item=>item.surfaceType==='wall-inside'),leftSurface=engine.getWorldSurfaces(left.id).find(item=>item.surfaceType==='wall-inside');
  const rear=engine.solve({sourceAssetId:tv.id,surface:backSurface,targetAssetId:back.id,surfacePoint:{x:3,y:1.2,z:.1}});
  assert.equal(rear.anchor.anchorType,'mount');assert.equal(rear.valid,true);assert.ok(rear.transform.position.z>.1);
  const side=engine.solve({sourceAssetId:tv.id,surface:leftSurface,targetAssetId:left.id,surfacePoint:{x:.1,y:1.2,z:1.5}});
  assert.equal(side.valid,true);assert.ok(Math.abs(side.transform.rotation.y-Math.PI/2)<1e-9);assert.ok(side.transform.position.x>.1);
});

test('Counter/Shelf → Wall รักษา Floor Contact ระหว่าง Snap ผนัง',()=>{
  const wall=asset('structure.wall.back','Back Wall','surface',{width:6,height:2.4,depth:.1},{x:3,y:1.2,z:.05},{system:true,locked:true,movable:false});
  const counter=asset('counter','Counter','furniture',{width:1.2,height:1,depth:.6},{x:2,y:0,z:1});
  const {engine}=setup([wall,counter]),surface=engine.getWorldSurfaces(wall.id).find(item=>item.surfaceType==='wall-inside'),result=engine.solve({sourceAssetId:counter.id,surface,targetAssetId:wall.id,surfacePoint:{x:3,y:1.85,z:.1},currentTransform:counter.transform});
  assert.equal(result.anchor.anchorType,'back');assert.equal(result.valid,true);assert.equal(result.transform.position.y,0);assert.equal(result.surfacePoint.y,.5);
});

test('Clear Light → Beam Bottom และ Asset → Asset ใช้ Surface ของ Physical Object',()=>{
  const beam=asset('beam','Beam','structure',{width:4,height:.2,depth:.3},{x:3,y:2.2,z:.4});
  const light=asset('light','Lighting Fixture','lighting',{width:.2,height:.2,depth:.2},{x:2,y:2,z:.4},{fixtureType:'Clear Light'});
  const shelf=asset('shelf','Shelf','display',{width:1,height:1.8,depth:.4},{x:2,y:0,z:1});
  const graphic=asset('graphic','Graphic','branding',{width:.5,height:.5,depth:.02},{x:2,y:.5,z:1});
  const {engine}=setup([beam,light,shelf,graphic]),bottom=engine.getWorldSurfaces(beam.id).find(item=>item.surfaceType==='horizontal-bottom'),face=engine.getWorldSurfaces(shelf.id).find(item=>item.id.endsWith('.front'));
  assert.equal(engine.solve({sourceAssetId:light.id,surface:bottom,targetAssetId:beam.id,surfacePoint:{x:3,y:2.1,z:.4}}).anchor.anchorType,'top');
  const attached=engine.solve({sourceAssetId:graphic.id,surface:face,targetAssetId:shelf.id,surfacePoint:{x:2,y:1,z:1.2}});assert.equal(attached.valid,true);assert.equal(attached.targetAssetId,'shelf');
});

test('Locked Wall ยังเป็น Snap Target, Boundary และ Release Threshold ทำงาน',()=>{
  const wall=asset('structure.wall.back','Back Wall','surface',{width:6,height:2.4,depth:.1},{x:3,y:1.2,z:.05},{system:true,locked:true,movable:false});
  const tv=asset('tv','Screen/TV','display',{width:1,height:.7,depth:.08},{x:2,y:.8,z:1});
  const {engine}=setup([wall,tv]),surface=engine.getWorldSurfaces(wall.id).find(item=>item.surfaceType==='wall-inside');
  assert.equal(engine.solve({sourceAssetId:tv.id,surface,targetAssetId:wall.id,surfacePoint:{x:3,y:1.2,z:.1}}).valid,true);
  assert.equal(engine.solve({sourceAssetId:tv.id,surface,targetAssetId:wall.id,surfacePoint:{x:.05,y:2.35,z:.1}}).valid,false);
  assert.ok(engine.releaseDistance>engine.detectionDistance);assert.ok(engine.releaseScreenThreshold>engine.screenThreshold);
});

test('Priority และ Validation ไม่มี ID ซ้ำ',()=>{
  const floor=asset('floor','Floor','surface',{width:3,height:.003,depth:3},{x:1.5,y:-.0015,z:1.5},{system:true});
  const chair=asset('chair','Furniture','furniture',{width:.5,height:.8,depth:.5});const {engine}=setup([floor,chair]);
  assert.deepEqual(plain(engine.rankCandidates([{priority:5,id:'grid'},{priority:3,id:'edge'},{priority:1,id:'anchor'}]).map(item=>item.id)),['anchor','edge','grid']);
  const report=engine.validate();assert.equal(report.valid,true);assert.equal(report.stats.corners,16);assert.ok(report.stats.anchors>0);assert.ok(report.stats.surfaces>0);
});

test('หน้า Editor เชื่อม Registry, Raycast, Collision, Ghost Preview, Candidate และ Clean Screenshot cleanup',()=>{
  for(const token of ['js/smart-snap-engine.js','smartSnapEngine.syncFromRegistry()','sceneAssetRegistry.getAssetByObject3D(node)','smartSnapSurfaceFromHit(hit)',
    'smartSnapCandidateCollision','smart-snap-surface-highlight','smart-snap-ghost-preview','placement.snapCandidate','drag.invalidSnap','window.SmartSnapEngineAPI'])assert.ok(html.includes(token),token);
  assert.match(html,/name==='object-anchor-guides'\|\|name==='magnetic-snap-preview'/);
  assert.match(html,/recordObjectHistory\(drag\.before\)/);
  assert.match(html,/restoreObjectSnapshot\(drag\.before\)/);
  assert.match(html,/touchesLeft=surfaceTarget===SCENE_ASSET_IDS\.wallLeft/);
  assert.match(html,/touchesBack\?0:edge/);
  assert.match(html,/snapAnchorKindsCompatible\(source\.kind,target\.kind\)/);
  assert.match(html,/registrySceneObjectSnapAnchors\(proxy\)/);
  assert.match(html,/const source=registrySceneObjectSnapAnchors\(obj\)/);
  assert.match(html,/clearMagneticSnapPreview\(\)/);
  assert.match(html,/dataset\.smartSnapCorners=String\(snapReport\.stats\.corners\)/);
});

test('Selection ให้ Asset ด้านหน้าก่อน Structure และรองรับ Alt Cycle Selection',()=>{
  assert.match(html,/const front=unique\.filter\(entry=>entry\.asset\.metadata\?\.system!==true\),system=unique\.filter/);
  assert.match(html,/if\(!event\.altKey\)return ordered/);
  assert.match(html,/selectSceneItem\(hitAsset\.id\)/);
});
