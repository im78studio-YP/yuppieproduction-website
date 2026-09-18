const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(async()=>{
  YPQuickSetupBridge.close();Object.assign(S,{type:'island',W:6,D:6,H:3,raise:0,stSize:'none',objects:[],lights:false,placementSnap:true,magneticSnap:true});
  for(const [id,x] of [['snap-source',1.5],['snap-target',3.173]]){const o=makeCatalogObject('panel-standard',x,3);o.id=id;o.size={w:.8,d:.4,h:1};S.objects.push(o);}
  sync();await loadThreeRenderer();await threeRenderer.waitForSceneAssets(15000,BoothSpec);closeDockPanel(false);selectObject('snap-source');setObjectMoveMode('smart');
  const r=threeRenderer;cancelAnimationFrame(r.cameraTransitionRaf);r.camera.position.set(7,6,10);r.controls.target.set(2.5,.5,3);r.controls.update();r.renderer.render(r.scene,r.camera);
 });
 const config=await page.evaluate(()=>{const before=objectSnapshot(),on=placementValue(1.073),offset=snapDragToGrid({x:1.073,y:.77,z:2.128},{sourceAnchorOffset:{x:.123,z:.016}});S.placementSnap=false;const off=placementValue(1.073);S.placementSnap=true;return{step:VIEW_GRID_STEP,engine:smartSnapEngine.gridStep,on,off,offset,lines:viewGridLines(1),same:before===objectSnapshot(),label:document.getElementById('placementSnapSummary').textContent};});
 assert.equal(config.step,.05);assert.equal(config.engine,.05);assert.ok(Math.abs(config.on-1.05)<1e-9);assert.equal(config.off,1.073);assert.equal(config.lines.length,21);assert.ok(config.same);assert.match(config.label,/5 ซม/);
 assert.ok(Math.abs((config.offset.x+.123)/.05-Math.round((config.offset.x+.123)/.05))<1e-8);assert.equal(config.offset.y,.77);
 const coords=await page.evaluate(()=>{const r=threeRenderer,rect=r.renderer.domElement.getBoundingClientRect(),source=registrySceneObjectSnapAnchors(objectById('snap-source')).find(a=>a.id.endsWith('max-x.max-y.max-z')),target=registrySceneObjectSnapAnchors(objectById('snap-target')).find(a=>a.id.endsWith('min-x.max-y.max-z'));
  const project=p=>{const v=new r.THREE.Vector3(p.x,p.y,p.z).project(r.camera);return{x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2};};return{source,target,from:project(source.position),to:project(target.position),before:{...objectById('snap-source').position}};
 });
 await page.mouse.move(coords.from.x,coords.from.y);await page.mouse.down();assert.equal(await page.evaluate(()=>threeRenderer.pointerDrag?.sourceAnchorId),coords.source.id);
 await page.mouse.move(coords.to.x,coords.to.y,{steps:15});
 const during=await page.evaluate(()=>({position:{...objectById('snap-source').position},match:objectById('snap-source').placement.anchorAttachment,invalid:threeRenderer.pointerDrag?.invalidSnap,feedback:document.getElementById('smartMoveFeedback')?.textContent}));
 assert.equal(during.invalid,false);assert.equal(during.match?.targetId,'snap-target');
 const residual=await page.evaluate(id=>{const a=registrySceneObjectSnapAnchors(objectById('snap-source')).find(a=>a.id===id),b=registrySceneObjectSnapAnchors(objectById('snap-target')).find(a=>a.id.endsWith('min-x.max-y.max-z'));return Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y,a.position.z-b.position.z);},coords.source.id);
 assert.ok(residual<.001,JSON.stringify({residual,during}));await page.mouse.up();assert.deepEqual(await page.evaluate(()=>objectById('snap-source').position),during.position);
 await page.evaluate(()=>undoObjectChange());assert.deepEqual(await page.evaluate(()=>objectById('snap-source').position),coords.before);
 await page.evaluate(()=>redoObjectChange());assert.deepEqual(await page.evaluate(()=>objectById('snap-source').position),during.position);
 const diagnostics=await page.evaluate(()=>{
  const source=objectById('snap-source'),target=objectById('snap-target'),candidate={...source.position};
  S.magneticSnap=false;const off=magneticSnapPlacement(source,candidate,'smart');S.magneticSnap=true;
  target.visible=false;sync();const hiddenTargetIncluded=boothSnapAnchors(S,source.id).some(a=>a.targetId===target.id),hiddenMatch=magneticSnapPlacement(source,candidate,'plane')?.targetId;
  target.visible=true;source.groupId=target.groupId='snap-audit-group';sync();const sameGroupIncluded=boothSnapAnchors(S,source.id).some(a=>a.targetId===target.id),groupMatch=magneticSnapPlacement(source,candidate,'plane')?.targetId;
  source.groupId=target.groupId=null;sync();return{off,hiddenTargetIncluded,sameGroupIncluded,hiddenMatch,groupMatch};
 });assert.equal(diagnostics.off,null);
 assert.deepEqual(errors,[]);console.log('PASS 5 cm grid, offset anchor, object-to-object pointer snap, off-grid target precision, release and Undo/Redo');console.log('SNAP AUDIT',JSON.stringify(diagnostics));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
