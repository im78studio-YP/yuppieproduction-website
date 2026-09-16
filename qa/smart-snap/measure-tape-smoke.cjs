const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(async()=>{YPQuickSetupBridge.close();S.type='island';S.W=6;S.D=6;S.H=3;S.objects=[];S.stSize='none';S.lights=false;sync();const r=await loadThreeRenderer();await r.waitForSceneAssets(10000,BoothSpec);await r.setCameraView('orthographic_top',{animate:false});closeDockPanel(false);});
 await page.waitForFunction(()=>threeRenderer?.active&&threeRenderer.camera.isOrthographicCamera);
 await page.locator('#btnMeasureTape').click();assert.equal(await page.locator('#btnMeasureTape').getAttribute('aria-pressed'),'true');
 if(mobile)await page.evaluate(()=>{threeRenderer.camera.zoom=.4;threeRenderer.camera.updateProjectionMatrix();});
 const before=await page.evaluate(()=>objectSnapshot());
 const points=await page.evaluate(()=>{const r=threeRenderer,T=r.THREE,rect=r.renderer.domElement.getBoundingClientRect();r.camera.updateMatrixWorld();return [[0,3],[6,3]].map(([x,z])=>{const p=new T.Vector3(x,BoothSpec.raise/100,z).project(r.camera);return{x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};});});
 const click=async p=>mobile?page.touchscreen.tap(p.x,p.y):page.mouse.click(p.x,p.y);
 await click(points[0]);if(!mobile)await page.mouse.move(points[1].x,points[1].y);await click(points[1]);
 await page.waitForFunction(()=>threeRenderer.measureTape.result!==null);
 const result=await page.evaluate(()=>threeRenderer.measureTape.result);assert.ok(Math.abs(result.distance-6)<.01,JSON.stringify(result));assert.ok(Math.abs(result.width-6)<.01);assert.equal(result.height,0);
 assert.equal(await page.evaluate(()=>objectSnapshot()),before);assert.equal(await page.evaluate(()=>threeRenderer.pointerDrag),null);
 await page.locator('[data-metric="distance"]').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'6.000');
 assert.equal(await page.locator('.measure-overlay circle').first().getAttribute('r'),'5');
 const endpoint=await page.locator('.measure-a').evaluate(c=>{const p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(c.getScreenCTM());return{x:p.x,y:p.y};});
 assert.ok(Math.hypot(endpoint.x-points[0].x,endpoint.y-points[0].y)<2,'overlay must align with the actual 3D point');
 await page.screenshot({path:`qa/smart-snap/measure-tape-${mobile?'mobile':'desktop'}.png`});
 if(!mobile){
  const exportCheck=await page.evaluate(async()=>{const r=threeRenderer,render=r.renderer.render.bind(r.renderer);let renders=0,helpers=false;r.renderer.render=(scene,camera)=>{renders++;scene.traverse(n=>{if(/measure/i.test(n.name))helpers=true;});return render(scene,camera);};try{const out=await r.exportCleanScreenshot({longEdge:1536});return{renders,helpers,bytes:out.blob.size,result:r.measureTape.result};}finally{r.renderer.render=render;}});
  assert.ok(exportCheck.renders>0);assert.equal(exportCheck.helpers,false);assert.ok(exportCheck.bytes>1000);
  await page.evaluate(async()=>{const o=makeCatalogObject('panel-standard',3,3);o.size={w:2,d:.2,h:2};o.appearance={mode:'solid',color:'#ffffff'};mutateObjects(()=>S.objects.push(o),o.id);await threeRenderer.setCameraView('orthographic_front',{animate:false});});
  await page.waitForFunction(()=>threeRenderer.measureTape.result===null);
  const assetBefore=await page.evaluate(()=>objectSnapshot());
  for(const [name,world,expected] of [
   ['corners',[[2,2,3.1],[4,2,3.1]],2],
   ['edges',[[2,1.3,3.1],[4,1.3,3.1]],2],
   ['surface',[[2.65,.65,3.1],[3.35,1.35,3.1]],Math.hypot(.7,.7)]
  ]){
   await page.locator('[data-measure="clear"]').click();
   const coords=await page.evaluate(world=>{const r=threeRenderer,T=r.THREE,rect=r.renderer.domElement.getBoundingClientRect();return world.map(v=>{const p=new T.Vector3(v[0],v[1]+BoothSpec.raise/100,v[2]).project(r.camera);return{x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};});},world);
   await click(coords[0]);await click(coords[1]);const d=await page.evaluate(()=>threeRenderer.measureTape.result);
   assert.ok(d&&Math.abs(d.distance-expected)<.02,name+': '+JSON.stringify(d));
   assert.equal(await page.evaluate(()=>objectSnapshot()),assetBefore,'measurement must not move selected asset');
  }
  console.log('PASS asset corners, edges, actual surface, scene-change invalidation and no asset movement');
 }
 await page.locator('[data-measure="clear"]').click();assert.equal(await page.evaluate(()=>threeRenderer.measureTape.result),null);
 if(mobile)await page.locator('.measure-panel [data-measure="close"]').last().click();else await page.keyboard.press('Escape');
 assert.equal(await page.locator('.measure-panel').isVisible(),false);assert.equal(await page.locator('#btnMeasureTape').getAttribute('aria-pressed'),'false');
 await page.locator('#btnMeasureTape').click();await page.evaluate(()=>selectView('plan'));assert.equal(await page.evaluate(()=>threeRenderer.measureTape.enabled),false);
 assert.deepEqual(errors,[]);console.log('PASS',mobile?'mobile':'desktop','6m snap, axes, clipboard, no model mutation, clear/exit and view switch');await context.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
