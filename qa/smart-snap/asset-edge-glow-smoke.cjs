const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader|WebGL|GL_INVALID/.test(m.text()))errors.push(m.text());});
 await page.route('https://fonts.googleapis.com/**',route=>route.abort());
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(async()=>{YPQuickSetupBridge.close();S.type='island';S.W=6;S.D=6;S.objects=[];S.stSize='none';S.lights=false;const a=makeCatalogObject('counter-standard',2,3),b=makeCatalogObject('counter-standard',4,3);mutateObjects(()=>S.objects.push(a,b),a.id);const r=await loadThreeRenderer();await r.waitForSceneAssets(15000,BoothSpec);closeDockPanel(false);openAssetSettings();});
 const state=()=>page.evaluate(()=>S.objects.map(o=>{const root=threeRenderer.objectMeshes.get(o.id),effects=[];root.traverse(n=>{if(n.userData.partEdgeGlow)effects.push({slot:n.userData.partSlot,color:n.material.uniforms.glowColor.value.getHexString(),intensity:n.material.uniforms.intensity.value});});return {appearance:o.appearance,effects};}));
 const original=await state();
 // A triangulated flat quad must yield 4 boundary edges, never its diagonal; material groups must remain isolated.
 await page.evaluate(()=>{const T=threeRenderer.THREE,g=new T.PlaneGeometry(1,1),m=new T.MeshBasicMaterial(),node=new T.Mesh(g,m),entry={node,slot:0};const edges=YPAssetEdgeGlow.edgesFor(T,entry);if(edges.attributes.position.count!==8)throw Error('flat triangulation leaked into edges');edges.dispose();g.dispose();m.dispose();
  const box=new T.BoxGeometry(1,1,1),materials=Array.from({length:6},()=>new T.MeshBasicMaterial()),part={node:new T.Mesh(box,materials),slot:0};const selected=YPAssetEdgeGlow.edgesFor(T,part);if(selected.attributes.position.count!==8)throw Error('unselected material-slot edges included');selected.dispose();box.dispose();materials.forEach(m=>m.dispose());});
 await page.evaluate(()=>openAssetSettings());await page.locator('.asset-parts-dialog canvas').waitFor();await page.locator('#assetPickMode').selectOption('part');
 await page.locator('#assetPartList').selectOption('1');await page.locator('#assetPartGlow').check();await page.locator('#assetPartGlowColor').fill('#00cfff');
 await page.locator('#assetPartGlowIntensity').fill('2');
 assert.equal(await page.locator('#assetPartMode').inputValue(),'inherit');assert.deepEqual(await state(),original);
 await page.locator('#assetPartGlow').scrollIntoViewIfNeeded();await page.screenshot({path:`qa/smart-snap/asset-edge-glow-${mobile?'mobile':'desktop'}.png`});
 await page.locator('[data-part-save]').click();await page.waitForFunction(()=>{let count=0;threeRenderer.objectMeshes.get(S.objects[0].id).traverse(n=>{if(n.userData.partEdgeGlow)count++;});return count===1;});
 const saved=await state();assert.equal(saved[0].effects[0].color,'00cfff');assert.equal(saved[0].effects[0].intensity,2);assert.deepEqual(saved[1],original[1]);
 const key=Object.keys(saved[0].appearance.parts)[0];assert.equal(saved[0].appearance.parts[key].mode,'inherit');
 await page.evaluate(async()=>{const snapshot=YPProjectBridge.capture(),p=YPProjectStore.create(snapshot);YPProjectStore.validate(p);YPProjectBridge.restore(JSON.parse(JSON.stringify(p.variants.A)));await threeRenderer.waitForSceneAssets(15000,BoothSpec);selectObject(S.objects[0].id);openAssetSettings();});
 assert.equal((await state())[0].effects.length,1,'persists through project file round-trip');
 await page.evaluate(()=>openAssetSettings());await page.locator('.asset-parts-dialog canvas').waitFor();await page.locator('#assetPickMode').selectOption('part');await page.locator('#assetPartList').selectOption('1');assert.equal(await page.locator('#assetPartGlow').isChecked(),true);
 await page.locator('#assetPartGlow').uncheck();await page.locator('.asset-parts-dialog footer [data-part-close]').click();assert.equal((await state())[0].effects.length,1,'cancel must not dispose live effect');
 await page.evaluate(()=>openAssetSettings());await page.locator('.asset-parts-dialog canvas').waitFor();await page.locator('#assetPickMode').selectOption('part');await page.locator('#assetPartList').selectOption('1');await page.locator('#assetPartGlow').uncheck();await page.locator('[data-part-save]').click();
 await page.waitForFunction(()=>{let count=0;threeRenderer.objectMeshes.get(S.objects[0].id).traverse(n=>{if(n.userData.partEdgeGlow)count++;});return count===0;});
 await page.evaluate(()=>{closeAssetSettings();undoObjectChange();});await page.waitForFunction(()=>Object.values(S.objects[0].appearance.parts).some(v=>v.edgeGlow?.enabled));
 if(!mobile){const exported=await page.evaluate(async()=>{const result=await threeRenderer.exportCleanScreenshot({download:false});return result.blob?.size||result.preflight?.bytes;});assert.ok(exported>1000,'effect survives clean image export');}
 assert.deepEqual(errors,[]);console.log('PASS',mobile?'mobile':'desktop','edge glow, geometry/material boundaries, draft/save/cancel, restore/undo, shader rendering');await context.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
