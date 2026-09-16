const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',route=>route.abort());
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(async()=>{YPQuickSetupBridge.close();S.type='island';S.W=6;S.D=6;S.H=3;S.raise=15;S.objects=[];S.stSize='none';S.lights=false;const o=makeCatalogObject('panel-standard',3,3);o.size={w:2,d:.2,h:2.23};mutateObjects(()=>S.objects.push(o),o.id);const r=await loadThreeRenderer();await r.waitForSceneAssets(10000,BoothSpec);closeDockPanel(false);await r.setCameraView('perspective_front_right',{animate:false});});
 await page.locator('#btnMeasureTape').click();
 if(mobile)await page.evaluate(()=>{threeRenderer.camera.zoom=.6;threeRenderer.camera.updateProjectionMatrix();});
 const before=await page.evaluate(()=>objectSnapshot());
 const screen=world=>page.evaluate(world=>{const r=threeRenderer,p=new r.THREE.Vector3(...world).project(r.camera),rect=r.renderer.domElement.getBoundingClientRect();return{x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};},world);
 const click=async p=>mobile?page.touchscreen.tap(p.x,p.y):page.mouse.click(p.x,p.y);
 const top=[4,2.38,3.1],floor=[4,.15,3.1];
 await page.locator('[data-measure-axis="z"]').click();await click(await screen(top));
 assert.equal(await page.locator('.measure-floor').isEnabled(),true);
 await page.locator('.measure-floor').click();
 let result=await page.evaluate(()=>threeRenderer.measureTape.result);
 assert.ok(Math.abs(result.distance-2.23)<.005,JSON.stringify(result));assert.equal(result.width,0);assert.equal(result.depth,0);assert.equal(result.height,result.distance);
 assert.equal(await page.locator('.measure-overlay').getAttribute('data-axis'),'z');
 assert.equal(await page.locator('.measure-line').evaluate(el=>getComputedStyle(el).stroke),'rgb(96, 173, 255)');
 await page.screenshot({path:`qa/smart-snap/measure-axis-${mobile?'mobile':'desktop'}.png`});
 if(!mobile){
  // Move near the floor projection: exact floor snap, not a diagonal to nearby corners.
  await page.locator('[data-measure="clear"]').click();await click(await screen(top));const p=await screen(floor);await page.mouse.move(p.x+4,p.y-3);
  assert.match(await page.locator('.measure-status').textContent(),/Snap พื้นบูธ/);await click({x:p.x+4,y:p.y-3});
  result=await page.evaluate(()=>threeRenderer.measureTape.result);assert.ok(Math.abs(result.distance-2.23)<.005);assert.equal(result.width,0);assert.equal(result.depth,0);
  for(const [axis,target,component] of [['x',[2.8,2.38,3.1],'width'],['y',[4,2.38,4.3],'depth']]){
   await page.locator('[data-measure-axis="'+axis+'"]').click();await click(await screen(target));
   result=await page.evaluate(()=>threeRenderer.measureTape.result);assert.ok(result&&Math.abs(result.distance-1.2)<.025,axis+JSON.stringify(result));assert.equal(result.distance,result[component]);assert.equal(result.height,0);
   assert.equal(await page.locator('.measure-overlay').getAttribute('data-axis'),axis);
  }
  await page.keyboard.press('z');assert.equal(await page.locator('[data-measure-axis="z"]').getAttribute('aria-pressed'),'true');
  await page.evaluate(async()=>{await threeRenderer.setCameraView('orthographic_top',{animate:false});});await page.locator('.measure-floor').click();
  assert.ok(Math.abs((await page.evaluate(()=>threeRenderer.measureTape.result)).height-2.23)<.005,'floor button also works when looking down the Z axis');
 }
 assert.equal(await page.evaluate(()=>objectSnapshot()),before);assert.deepEqual(errors,[]);console.log('PASS',mobile?'touch':'desktop','axis lock, raised-floor height, no diagonal or scene mutation');await context.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
