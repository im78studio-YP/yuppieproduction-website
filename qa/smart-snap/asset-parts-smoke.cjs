const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  await page.evaluate(async()=>{YPQuickSetupBridge.close();S.type='island';S.W=6;S.D=6;S.objects=[];S.stSize='none';S.lights=false;const a=makeCatalogObject('counter-standard',2,3),b=makeCatalogObject('counter-standard',4,3);a.appearance={mode:'tint',color:'#dd1111'};mutateObjects(()=>S.objects.push(a,b),a.id);const r=await loadThreeRenderer();await r.waitForSceneAssets(15000,BoothSpec);closeDockPanel(false);openAssetSettings();});
  const state=()=>page.evaluate(()=>{const r=threeRenderer;return S.objects.map(o=>({id:o.id,appearance:o.appearance,materials:YPAssetParts.entries(r.objectMeshes.get(o.id)).map(e=>{const m=(Array.isArray(e.node.material)?e.node.material:[e.node.material])[e.slot];return {key:e.key,color:m.color?.getHexString(),roughness:m.roughness,metalness:m.metalness};})}));});
  const original=await state();assert.ok(original[0].materials.length>1,'GLB has selectable mesh/material parts');
  await page.evaluate(()=>{
   const T=threeRenderer.THREE,root=new T.Group(),shared=new T.MeshStandardMaterial({color:'#123456'}),geometry=new T.BoxGeometry(1,1,1);
   const a=new T.Mesh(geometry,[shared,shared]),b=new T.Mesh(geometry,shared);a.name=b.name='duplicate-name';root.add(a,b);YPAssetParts.capture(root);
   a.material=a.material.map(m=>m.clone());b.material=b.material.clone();YPAssetParts.seal(root);
   YPAssetParts.apply(root,{'p.0:m1':{mode:'solid',color:'#aa5500',finish:'matte'}},T);
   if(a.material[0].color.getHexString()!=='123456'||a.material[1].color.getHexString()!=='aa5500'||b.material.color.getHexString()!=='123456'||shared.color.getHexString()!=='123456')throw Error('material-slot isolation failed');
   if(new Set(YPAssetParts.entries(root).map(e=>e.key)).size!==3)throw Error('duplicate names must have unique keys');
   root.userData.disposeResources();a.material.forEach(m=>m.dispose());b.material.dispose();shared.dispose();geometry.dispose();
  });
  await page.evaluate(()=>openAssetSettings());await page.locator('.asset-parts-dialog canvas').waitFor();await page.locator('#assetPickMode').selectOption('part');
  assert.equal(await page.locator('#assetPartList option').count(),original[0].materials.length);
  await page.locator('#assetPartList').selectOption('1');
  const box=await page.locator('.asset-parts-dialog canvas').boundingBox();
  if(mobile)await page.touchscreen.tap(box.x+box.width*.5,box.y+box.height*.26);else await page.mouse.click(box.x+box.width*.5,box.y+box.height*.26);
  assert.notEqual(await page.locator('#assetPartList').inputValue(),'1','clicking model selects another visible part');
  await page.locator('#assetPartMode').selectOption('solid');await page.locator('#assetPartColor').fill('#22aa55');await page.locator('#assetPartFinish').selectOption('metal');
  assert.deepEqual(await state(),original,'draft never mutates live scene');
  await page.locator('.asset-parts-dialog footer [data-part-close]').click();assert.deepEqual(await state(),original,'cancel discards');
  await page.evaluate(()=>openAssetSettings());await page.locator('.asset-parts-dialog canvas').waitFor();await page.locator('#assetPickMode').selectOption('part');await page.keyboard.press('Escape');
  assert.equal(await page.locator('.asset-parts-dialog').count(),0);assert.deepEqual(await state(),original,'Escape discards without changing the scene');
  await page.evaluate(()=>openAssetSettings());await page.locator('.asset-parts-dialog canvas').waitFor();await page.locator('#assetPickMode').selectOption('part');
  await page.locator('#assetPartList').selectOption('1');await page.locator('#assetPartMode').selectOption('solid');await page.locator('#assetPartColor').fill('#22aa55');await page.locator('#assetPartFinish').selectOption('metal');
  await page.screenshot({path:`qa/smart-snap/asset-parts-${mobile?'mobile':'desktop'}.png`});
  await page.locator('[data-part-save]').click();
  const key=original[0].materials[1].key;
  await page.waitForFunction(key=>{const root=threeRenderer.objectMeshes.get(S.objects[0].id),e=YPAssetParts.entries(root).find(e=>e.key===key);return (Array.isArray(e?.node.material)?e.node.material[e.slot]:e?.node.material)?.color?.getHexString()==='22aa55';},key);
  const saved=await state();assert.equal(saved[0].appearance.parts[key].finish,'metal');assert.equal(saved[0].materials[1].metalness,.9);
  assert.deepEqual(saved[1],original[1],'second instance untouched');
  saved[0].materials.forEach((m,i)=>{if(i!==1)assert.deepEqual(m,original[0].materials[i],'unselected part untouched');});
  // Data-only portable project round-trip, followed by actual rebuild.
  await page.evaluate(()=>{const snapshot=YPProjectBridge.capture(),project=YPProjectStore.create(snapshot);YPProjectStore.validate(project);YPProjectBridge.restore(JSON.parse(JSON.stringify(project.variants.A)));});
  await page.waitForFunction(key=>S.objects[0].appearance.parts?.[key]?.color==='#22aa55',key);
  await page.evaluate(async()=>{await threeRenderer.waitForSceneAssets(15000,BoothSpec);selectObject(S.objects[0].id);openAssetSettings();});
  assert.equal((await state())[0].materials[1].color,'22aa55','persisted part is rendered after import');
  await page.evaluate(()=>openAssetSettings());await page.locator('.asset-parts-dialog canvas').waitFor();await page.locator('#assetPickMode').selectOption('part');await page.locator('#assetPartList').selectOption('1');
  await page.locator('[data-part-reset]').click();await page.locator('[data-part-save]').click();
  await page.waitForFunction(key=>S.objects[0].appearance.parts[key].mode==='original',key);
  await page.evaluate(()=>{closeAssetSettings();undoObjectChange();});
  assert.equal((await state())[0].appearance.parts[key].color,'#22aa55','one Undo reverses one save');
  assert.deepEqual(errors,[]);console.log('PASS',mobile?'mobile':'desktop','parts draft/cancel/save, isolated material, project round-trip, reset/undo');await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
