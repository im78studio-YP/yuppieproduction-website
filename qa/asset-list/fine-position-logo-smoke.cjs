const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  await page.evaluate(async()=>{
   YPQuickSetupBridge.close();S.type='corner';S.cornerSide='right';S.W=6;S.D=3;S.H=3;S.objects=[];S.stSize='none';S.lights=false;
   S.logoMount='wall';S.logoWall='back';S.logoWallU=3;S.logoWallY=1.5;S.logoScale=30;S.nameScale=0;S.placementSnap=true;
   document.getElementById('editorLevelToggle').click();sync();await loadThreeRenderer();await threeRenderer.waitForSceneAssets(20000,BoothSpec);
   selectLogoPlacement(true);closeDockPanel(false);document.getElementById('moveAdvanced').open=true;
  });
  const step=axis=>page.locator(`[data-fine-axis="${axis}"][data-fine-delta="0.05"]`);
  assert.equal(await page.locator('#finePositionX').isEnabled(),true);
  assert.equal(await page.locator('#finePositionY').isDisabled(),true);
  assert.equal(await page.locator('#finePositionZ').isEnabled(),true);
  const before=await page.evaluate(()=>({u:S.logoWallU,y:S.logoWallY,render:new threeRenderer.THREE.Box3().setFromObject(threeRenderer.brandingRoot).getCenter(new threeRenderer.THREE.Vector3()).toArray()}));
  await step('x').click();await step('z').click();
  const after=await page.evaluate(()=>({u:S.logoWallU,y:S.logoWallY,render:new threeRenderer.THREE.Box3().setFromObject(threeRenderer.brandingRoot).getCenter(new threeRenderer.THREE.Vector3()).toArray()}));
  assert.ok(Math.abs(after.u-before.u-.05)<1e-8);assert.ok(Math.abs(after.y-before.y-.05)<1e-8);
  assert.ok(Math.abs(after.render[0]-before.render[0]-.05)<1e-8);assert.ok(Math.abs(after.render[1]-before.render[1]-.05)<1e-8);
  await page.locator('#finePositionX').fill('3.17');await page.locator('#finePositionX').press('Enter');
  assert.equal(await page.locator('#finePositionX').inputValue(),'3.17','absolute input is not grid-rounded');
  const precise=await page.evaluate(()=>S.logoWallU);
  await page.evaluate(()=>undoObjectChange());assert.equal(await page.evaluate(()=>S.logoWallU),after.u);
  await page.evaluate(()=>redoObjectChange());assert.equal(await page.evaluate(()=>S.logoWallU),precise);
  await page.locator('#finePositionX').fill('999');await page.locator('#finePositionX').press('Enter');
  assert.equal(await page.evaluate(()=>S.logoWallU),precise);assert.equal(await page.locator('#finePositionX').getAttribute('aria-invalid'),'true');
  await page.locator('#finePositionX').press('Escape');assert.equal(await page.locator('#finePositionX').inputValue(),'3.17');
  const result=await page.evaluate(async()=>{
   const check=(ok,message)=>{if(!ok)throw Error(message);},near=(a,b)=>Math.abs(a-b)<.001;
   const step=axis=>document.querySelector(`[data-fine-axis="${axis}"][data-fine-delta="0.05"]`).click();
   for(const face of ['left','right']){
    S.cornerSide=CORNER_SIDES.find(side=>side.walls.includes(face)).k;S.logoWall=face;S.logoWallU=1.5;sync();selectLogoPlacement();
    check(finePositionInput('x').disabled&&!finePositionInput('y').disabled&&!finePositionInput('z').disabled,face+' wall axes');
    const u=S.logoWallU;step('y');check(near(S.logoWallU,u+.05),face+' wall horizontal movement');
   }
   S.logoMount='floor';S.logoFloorX=3;S.logoFloorZ=1.5;sync();selectLogoPlacement();
   check(!finePositionInput('x').disabled&&!finePositionInput('y').disabled&&finePositionInput('z').disabled,'floor axes');
   const x=S.logoFloorX,z=S.logoFloorZ;step('x');step('y');check(near(S.logoFloorX,x+.05)&&near(S.logoFloorZ,z+.05),'floor logo moves');
   S.type='photo360';S.logoMount='wall';S.logoWall='back';S.logoWallU=logoWallLength(S)/2;sync();selectLogoPlacement();
   const arc=S.logoWallU;step('x');check(near(S.logoWallU,arc+.05),'curved wall follows arc');
   check(document.getElementById('finePositionHelp').textContent.includes('ผนังโค้ง'),'curved axis is explained');
   const snapshot=YPProjectBridge.capture(),project=YPProjectStore.create(snapshot),loaded=YPProjectStore.fromText(await YPProjectStore.toText(project));
   const u=S.logoWallU,y=S.logoWallY;YPProjectBridge.restore(loaded.variants[loaded.active]);selectLogoPlacement();
   check(near(S.logoWallU,u)&&near(S.logoWallY,y),'project roundtrip');
   selectSceneItem(SCENE_ASSET_IDS.wallBack);check(finePositionInput('x').disabled,'fixed wall disabled');
   check(!document.getElementById('finePositionHelp').textContent.includes('เลือก Asset ที่ต้องการปรับ'),'wall recognized');
   check(finePositionInput('x').value!=='','wall coordinates visible');
   const obj=makeCatalogObject('counter-standard',3,2);mutateObjects(()=>S.objects.push(obj),obj.id);selectObject(obj.id);
   const start={...obj.position};step('x');check(near(obj.position.x,start.x+.05),'ordinary asset still moves');
   obj.locked=true;sync();check(finePositionInput('x').disabled,'locked asset disabled');obj.locked=false;
   setObjectSelection([obj.id,SCENE_ASSET_IDS.brand],SCENE_ASSET_IDS.brand);syncObjectControls();
   const mixedX=obj.position.x,mixedU=S.logoWallU;check(!fineMoveSelectedObjects('x',.05),'mixed constrained selection rejects movement');
   check(obj.position.x===mixedX&&S.logoWallU===mixedU,'mixed group is not partially moved');
   return{u,y};
  });
  await page.evaluate(()=>{selectLogoPlacement();closeDockPanel(false);document.getElementById('moveAdvanced').open=true;});
  await page.screenshot({path:'qa/asset-list/fine-position-logo-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{document.getElementById('moveAdvanced').open=true;});
  assert.equal(await page.locator('#finePositionX').isEnabled(),true);
  await page.screenshot({path:'qa/asset-list/fine-position-logo-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS logo DOM controls/rendering, wall sides/floor/curve, precision, Undo/Redo, save/reopen, fixed assets and mixed selection',result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
