const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1450,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
  await page.waitForFunction(()=>YPProjectWorkspace?.state().ready);
  await page.evaluate(async()=>{
   const r=await loadThreeRenderer();await r.waitForSceneAssets(15000);YPQuickSetupBridge.close();
   Object.assign(S,{W:6,D:3,H:2.4,raise:0,type:'inline',stSize:'custom',stW:1.2,stD:1.2,stHmode:2.4,stPos:'right',objects:[]});
   sync();const o=makeCatalogObject('fascia-curved',3,2.45);o.id='drag-fascia';o.size={w:5.8,d:1.8,h:.35};o.position.y=1.85;S.objects=[o];
   sync();closeDockPanel(false);r.update(S);selectObject(o.id);setObjectMoveMode('smart');
   cancelAnimationFrame(r.cameraTransitionRaf);r.camera.position.set(-6,7,11);r.controls.target.set(3,1,1.5);r.controls.update();r.renderer.render(r.scene,r.camera);
  });
  await page.waitForTimeout(400);
  const coords=await page.evaluate(()=>{
   const r=threeRenderer,o=objectById('drag-fascia'),anchors=registrySceneObjectSnapAnchors(o),a=anchors.find(a=>a.id.endsWith('min-x.max-y.max-z')),
    target=boothSnapAnchors(S,o.id).find(a=>a.targetId===SCENE_ASSET_IDS.wallLeft&&a.id.endsWith('min-x.max-y.max-z')),
    rect=r.renderer.domElement.getBoundingClientRect(),project=p=>{const v=new r.THREE.Vector3(p.x,p.y+S.raise/100,p.z).project(r.camera);return{x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2};};
   return{source:a,target,from:project(a.position),to:project(target.position),before:{...o.position},room:S.stSize,roomGeometry:storeGeom(boothWallThickness(S)),collision:storageRoomPlacementCollision(objectCatalogDef(o.catalogId),worldCollisionVolumes(objectCatalogDef(o.catalogId),o.size,o.position.x,o.position.z,0,o),o,S)};
  });
  assert.notEqual(coords.room,'none');
  await page.mouse.move(coords.from.x,coords.from.y);await page.mouse.down();
  assert.equal(await page.evaluate(()=>threeRenderer.pointerDrag?.sourceAnchorId),coords.source.id);
  await page.mouse.move(coords.to.x,coords.to.y,{steps:12});
  const during=await page.evaluate(()=>({position:{...objectById('drag-fascia').position},invalid:threeRenderer.pointerDrag?.invalidSnap}));
  assert.equal(during.invalid,false);assert.notDeepEqual(during.position,coords.before);
  await page.screenshot({path:'qa/smart-snap/structure-drag-during.png'});
  await page.mouse.up();await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(()=>objectById('drag-fascia').position),during.position,'pointerup must not bounce a green snap');
  await page.screenshot({path:'qa/smart-snap/structure-drag-after.png'});
  await page.evaluate(()=>undoObjectChange());assert.deepEqual(await page.evaluate(()=>objectById('drag-fascia').position),coords.before);
  await page.evaluate(()=>redoObjectChange());assert.deepEqual(await page.evaluate(()=>objectById('drag-fascia').position),during.position);
  await page.evaluate(()=>{const saved=YPProjectBridge.capture();YPProjectBridge.restore(saved);});
  assert.deepEqual(await page.evaluate(()=>objectById('drag-fascia').position),during.position,'restore keeps the connection');
  const geometry=await page.evaluate(()=>{
   const o=objectById('drag-fascia'),item=objectCatalogDef(o.catalogId),volumes=worldCollisionVolumes(item,o.size,o.position.x,o.position.z,0,o),
    testBox=(x,z)=>({shape:placementShape({w:.1,d:.1},x,z,0),minY:2.1,maxY:2.2}),
    overlaps=box=>volumes.some(v=>collisionVolumesOverlap(v,box));
   const collisionWithoutSnap=storageRoomPlacementCollision(item,volumes,{...o,placement:{...o.placement,anchorAttachment:null}},S),
    joint=structuralTopJoint(o,item),roomWall=storageRoomCollisionVolumes(S).find(v=>v.id==='storage-front'),
    deep={shape:placementShape({w:1,d:1},5.2,1.2,0),minY:2.05,maxY:2.4},
    deepAllowed=allowsStructuralTopJoint(joint,deep,roomWall);
   return{parts:volumes.length,hole:overlaps(testBox(3,2)),solid:overlaps(testBox(3,2.92)),collisionWithoutSnap:!!collisionWithoutSnap,deepAllowed};
  });
  assert.equal(geometry.parts,26);assert.equal(geometry.hole,false);assert.equal(geometry.solid,true);
  assert.equal(geometry.collisionWithoutSnap,true,'joint exception requires a current exact point connection');
  assert.equal(geometry.deepAllowed,false,'deep crossings are still collisions');
  // Repeat the physical pointer gesture with an obstruction at the destination.
  await page.evaluate(()=>{
   const o=objectById('drag-fascia');o.position={x:3,y:1.85,z:2.45};o.placement.anchorAttachment=null;
   const block=makeCatalogObject('panel-standard',3,2.9);block.id='blocked-drop';block.position.y=2.1;block.size={w:1,d:.15,h:.15};S.objects.push(block);
   sync();selectObject(o.id);setObjectMoveMode('smart');cancelAnimationFrame(threeRenderer.cameraTransitionRaf);
   threeRenderer.camera.position.set(-6,7,11);threeRenderer.controls.target.set(3,1,1.5);threeRenderer.controls.update();
  });
  await page.waitForTimeout(100);
  const blockedCoords=await page.evaluate(()=>{
   const r=threeRenderer,rect=r.renderer.domElement.getBoundingClientRect(),o=objectById('drag-fascia'),
    project=p=>{const v=new r.THREE.Vector3(p.x,p.y,p.z).project(r.camera);return{x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2};},
    a=registrySceneObjectSnapAnchors(o).find(a=>a.id.endsWith('min-x.max-y.max-z')),
    target=boothSnapAnchors(S,o.id).find(a=>a.targetId===SCENE_ASSET_IDS.wallLeft&&a.id.endsWith('min-x.max-y.max-z'));
   return{from:project(a.position),to:project(target.position),before:{...o.position}};
  });
  await page.mouse.move(blockedCoords.from.x,blockedCoords.from.y);await page.mouse.down();
  await page.mouse.move(blockedCoords.to.x,blockedCoords.to.y,{steps:12});
  assert.equal(await page.evaluate(()=>threeRenderer.pointerDrag?.invalidSnap),false,'intentional overlap does not veto Snap');
  const blockedDisplay=await page.evaluate(()=>{
   const r=threeRenderer,o=objectById('drag-fascia'),root=r.objectMeshes.get(o.id);
   return{position:{...o.position},mesh:{x:root.position.x,y:root.position.y-S.raise/100-sceneObjectOrientationLift(o),z:root.position.z}};
  });
  assert.deepEqual(blockedDisplay.mesh,blockedDisplay.position,'accepted overlap matches the displayed mesh');
  await page.mouse.up();assert.deepEqual(await page.evaluate(()=>objectById('drag-fascia').position),blockedDisplay.position,'release keeps the user-chosen overlap');
  // Right-hand Point: dock halfway along the wall crown, away from all corner points.
  await page.evaluate(()=>{
   S.objects=S.objects.filter(o=>o.id==='drag-fascia');const o=objectById('drag-fascia');o.position={x:3.25,y:1.85,z:2.45};o.placement.anchorAttachment=null;
   sync();closeDockPanel(false);selectObject(o.id);setObjectMoveMode('smart');cancelAnimationFrame(threeRenderer.cameraTransitionRaf);
   threeRenderer.camera.position.set(11,7,11);threeRenderer.controls.target.set(3,1,1.5);threeRenderer.controls.update();
  });
  await page.waitForTimeout(100);
  const right=await page.evaluate(()=>{
   const r=threeRenderer,o=objectById('drag-fascia'),rect=r.renderer.domElement.getBoundingClientRect(),
    a=registrySceneObjectSnapAnchors(o).find(a=>a.id.endsWith('max-x.max-y.max-z')),
    project=p=>{const v=new r.THREE.Vector3(p.x,p.y,p.z).project(r.camera);return{x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2};};
   return{from:project(a.position),to:project({x:6,y:2.4,z:2.5}),id:a.id,before:{...o.position}};
  });
  await page.mouse.move(right.from.x,right.from.y);await page.mouse.down();
  assert.equal(await page.evaluate(()=>threeRenderer.pointerDrag?.sourceAnchorId),right.id);
  // Candidate calculation must not move a single vertex before validation.
  assert.equal(await page.evaluate(()=>{
   const r=threeRenderer,o=objectById('drag-fascia'),root=r.objectMeshes.get(o.id),before=root.matrixWorld.toArray();
   r.resolveTransformHandleMove(r.pointerDrag,{x:20,y:7,z:9},root,o);
   return JSON.stringify(before)===JSON.stringify(root.matrixWorld.toArray());
  }),true);
  await page.mouse.move(right.to.x,right.to.y,{steps:16});
  const rightDuring=await page.evaluate(p=>({position:{...objectById('drag-fascia').position},invalid:threeRenderer.pointerDrag?.invalidSnap,attachment:objectById('drag-fascia').placement.anchorAttachment,reason:threeRenderer.pointerDrag?.rejectionReason,
   candidate:threeRenderer.screenAnchorSnap({clientX:p.x,clientY:p.y,pointerType:'mouse'},objectById('drag-fascia'),threeRenderer.pointerDrag)}),right.to);
  assert.equal(rightDuring.invalid,false,JSON.stringify(rightDuring));
  assert.equal(rightDuring.attachment?.contact?.type,'edge',JSON.stringify(rightDuring));
  assert.ok(Math.abs(rightDuring.position.x-3.1)<.005&&Math.abs(rightDuring.position.y-2.05)<.005,JSON.stringify(rightDuring));
  await page.screenshot({path:'qa/smart-snap/structure-right-edge-during.png'});
  await page.mouse.up();assert.deepEqual(await page.evaluate(()=>objectById('drag-fascia').position),rightDuring.position);
  await page.evaluate(()=>undoObjectChange());assert.deepEqual(await page.evaluate(()=>objectById('drag-fascia').position),right.before);
  await page.evaluate(()=>redoObjectChange());assert.deepEqual(await page.evaluate(()=>objectById('drag-fascia').position),rightDuring.position);
  await page.evaluate(()=>{const saved=YPProjectBridge.capture();YPProjectBridge.restore(saved);});
  assert.deepEqual(await page.evaluate(()=>objectById('drag-fascia').position),rightDuring.position,'edge contact survives save/restore');
  const freeMove=await page.evaluate(()=>{
   Object.assign(S,{objects:[],stSize:'none',magneticSnap:false,placementSnap:false});sync();
   const a=makeCatalogObject('panel-standard',1,2),b=makeCatalogObject('panel-standard',2.2,2);
   a.id='free-source';b.id='free-block';a.size={w:.4,d:.4,h:.4};b.size={...a.size};a.position.y=b.position.y=.3;
   a.placement.surfaceSnap=false;a.placement.anchorSnap=false;S.objects=[a,b];sync();selectObject(a.id);
   const r=threeRenderer,before=objectSnapshot(),history=objectEditor.past.length,oldFloorPoint=r.floorPoint;
   const begin=()=>{const o=objectById(a.id);r.pointerDrag={kind:'asset',pointerId:77,id:o.id,memberIds:[o.id],memberStarts:{[o.id]:{...o.position,rotationY:0}},
    mode:'plane',before:objectSnapshot(),startX:o.position.x,startY:o.position.y,startZ:o.position.z,startRotationY:0,offsetX:0,offsetZ:0,moved:false};r.controls.enabled=false;};
   const move=x=>{r.floorPoint=()=>({x,y:0,z:2});r.moveObjectDrag({pointerId:77,preventDefault(){}});};
   begin();move(1.5);const accepted={...objectById(a.id).position};move(2.2);
   const invalid=r.pointerDrag.invalidSnap,rejected={...objectById(a.id).position},mesh=r.objectMeshes.get(a.id).position.clone(),reason=r.pointerDrag.rejectionReason;
   r.finishObjectDrag({pointerId:77,type:'pointerup'});const released={...objectById(a.id).position},historyDelta=objectEditor.past.length-history;
   begin();move(1);r.finishObjectDrag({pointerId:77,type:'pointercancel'});const cancelled={...objectById(a.id).position};
   r.floorPoint=oldFloorPoint;
   return{accepted,invalid,rejected,mesh:{x:mesh.x,y:mesh.y-S.raise/100,z:mesh.z},released,historyDelta,cancelled,reason};
  });
  assert.equal(freeMove.invalid,false);assert.equal(freeMove.accepted.x,1.5);
  assert.equal(freeMove.released.x,2.2,'move into the blocker is permitted');
  for(const value of [freeMove.rejected,freeMove.mesh,freeMove.cancelled])assert.deepEqual(value,freeMove.released);
  assert.equal(freeMove.historyDelta,1);
  const surface=await page.evaluate(()=>{
   S.magneticSnap=true;S.raise=12;const o=objectById('free-source');o.placement.anchorSnap=true;o.placement.surfaceSnap=true;sync();
   const r=threeRenderer,a=registrySceneObjectSnapAnchors(o).find(a=>a.id.endsWith('min-x.max-y.min-z')),
    offset={x:a.position.x-o.position.x,y:a.position.y-o.position.y,z:a.position.z-o.position.z},rect=r.renderer.domElement.getBoundingClientRect(),
    target=new r.THREE.Vector3(3.7,1.65+S.raise/100,boothWallThickness(S)).project(r.camera),
    event={clientX:rect.left+(target.x+1)*rect.width/2,clientY:rect.top+(1-target.y)*rect.height/2,pointerType:'mouse'},
    drag={sourceAnchorId:a.id,sourceAnchorOffset:offset,memberIds:[o.id],memberStarts:{[o.id]:{...o.position}},id:o.id,startX:o.position.x,startY:o.position.y,startZ:o.position.z},
    match=r.pointSurfaceSnap(event,o,r.objectMeshes.get(o.id),drag);
   if(!match)return null;
   const check=r.dragPlacementCheck(o,match.position,drag,match),proxy={...o,position:match.position,placement:{...o.placement,anchorAttachment:pointSnapAttachment(match)}};
   normalizeSceneObjectModel(proxy);const restored=JSON.parse(JSON.stringify(proxy)),resolved=pointSnapTarget(restored.placement.anchorAttachment);
   return{check,type:restored.placement.anchorAttachment.contact.type,resolved,target:match.previewTo,rotation:proxy.rotationY};
  });
  assert.ok(surface);assert.equal(surface.type,'surface');assert.equal(surface.check.valid,true,JSON.stringify(surface));
  assert.deepEqual(surface.resolved,surface.target);assert.equal(surface.rotation,0);
  assert.deepEqual(errors,[]);
  console.log('PASS: real 3D left/right Point, wall edge/surface, pure candidate transform, intentional overlaps, exact release, Undo/Redo/restore and cancellation');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
