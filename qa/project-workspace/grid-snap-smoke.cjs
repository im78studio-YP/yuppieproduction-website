const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const close=(a,b)=>assert.ok(Math.abs(a-b)<.00001,`${a} != ${b}`),aligned=n=>close(n/.1,Math.round(n/.1));
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(async()=>{YPQuickSetupBridge.close();YPProjectBridge.restore(YPIslandTemplateBridge.snapshot('island-canopy-garden'));S.objects=[];S.magneticSnap=false;S.placementSnap=true;
  const a=makeCatalogObject('panel-standard',1.23,2.31),b=makeCatalogObject('panel-standard',3.19,3.13);a.id='grid-a';b.id='grid-b';a.size=b.size={w:.8,d:.6,h:.4};a.rotationY=30;b.rotationY=15;S.objects=[a,b];sync();closeDockPanel(false);const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);r.setCameraView('orthographic_top');
 });
 const math=await page.evaluate(()=>({center:snapDragToGrid({x:1.237,y:.315,z:2.263}),corner:snapDragToGrid({x:1.237,y:.315,z:2.263},{sourceAnchorOffset:{x:.273,z:-.184}}),fine:FINE_POSITION_STEP}));
 aligned(math.center.x);aligned(math.center.z);aligned(math.corner.x+.273);aligned(math.corner.z-.184);close(math.corner.y,.315);close(math.fine,.05);
 // Exercise the real 3D pointer drag path.
 const start=await page.evaluate(()=>{selectObject('grid-a');setObjectMoveMode('plane');const r=threeRenderer,T=r.THREE,o=objectById('grid-a'),v=new T.Vector3(o.position.x+.12,S.raise/100+.4,o.position.z+.07).project(r.camera),rect=r.renderer.domElement.getBoundingClientRect();return{x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2};});
 await page.mouse.move(start.x,start.y);await page.mouse.down();assert.equal(await page.evaluate(()=>threeRenderer.pointerDrag?.kind),'asset');
 await page.mouse.move(start.x+39,start.y+23,{steps:6});await page.mouse.up();
 const moved=await page.evaluate(()=>({...objectById('grid-a').position}));aligned(moved.x);aligned(moved.z);
 // Corner-to-floor uses world grid, not surface-centre-relative 5 cm rounding.
 const corner=await page.evaluate(()=>{const r=threeRenderer,T=r.THREE,o=objectById('grid-a'),anchor=registrySceneObjectSnapAnchors(o).find(a=>a.kind==='corner');
  const rect=r.renderer.domElement.getBoundingClientRect(),v=new T.Vector3(4.237,S.raise/100,1.263).project(r.camera),event={clientX:rect.left+(v.x+1)*rect.width/2,clientY:rect.top+(1-v.y)*rect.height/2,pointerType:'mouse'},drag={sourceAnchorId:anchor.id,lastSmartSnap:null};
  const result=r.smartSurfacePlacement(event,o,r.objectMeshes.get(o.id),drag);return{point:result?.preview?.previewTo,valid:result?.snapValid,anchor:anchor.id,hits:r.raycaster.intersectObjects(r.surfaceSnapTargets(r.objectMeshes.get(o.id)),false).map(h=>h.object.name)};});
 assert.equal(corner.valid,true,JSON.stringify(corner));aligned(corner.point.x);aligned(corner.point.z);
 await page.evaluate(()=>{setObjectSelection(['grid-a','grid-b'],'grid-a');groupSelectedObjects();selectView('plan');});
 const positions=()=>page.evaluate(()=>S.objects.map(o=>({id:o.id,position:{...o.position},rotationY:o.rotationY,groupId:o.groupId})));
 const before=await positions(),history=await page.evaluate(()=>objectEditor.past.length);
 const dragPlan=async(dx,dy)=>{const box=await page.locator('.plan-object[data-object-id="grid-a"]').boundingBox();assert.ok(box);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+dx,box.y+box.height/2+dy,{steps:8});await page.mouse.up();};
 await dragPlan(41,27);const after=await positions();aligned(after[0].position.x);aligned(after[0].position.z);
 close(after[1].position.x-after[0].position.x,before[1].position.x-before[0].position.x);close(after[1].position.z-after[0].position.z,before[1].position.z-before[0].position.z);
 assert.deepEqual(after.map(o=>o.rotationY),before.map(o=>o.rotationY));assert.equal(await page.evaluate(()=>objectEditor.past.length),history+1);
 await page.evaluate(()=>undoObjectChange());assert.deepEqual(await positions(),before);await page.evaluate(()=>redoObjectChange());assert.deepEqual(await positions(),after);
 await page.evaluate(()=>{S.placementSnap=false;sync();});await dragPlan(13,7);const free=await positions();assert.ok(Math.abs(free[0].position.x/.1-Math.round(free[0].position.x/.1))>.001);
 await page.evaluate(()=>{objectById('grid-a').locked=true;sync();});const locked=await positions();await dragPlan(30,20);assert.deepEqual(await positions(),locked);
 assert.deepEqual(errors,[]);console.log('PASS: 10 cm body/corner snap, real 3D drag, floor surface, plan drag, group offsets, Undo/Redo, snap off, locked object, fine 5 cm unchanged');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
