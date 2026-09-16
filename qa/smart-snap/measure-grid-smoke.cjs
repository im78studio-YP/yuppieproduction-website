const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  await page.evaluate(async()=>{YPQuickSetupBridge.close();S.type='island';S.W=6;S.D=6;S.H=3;S.raise=15;S.objects=[];S.stSize='none';S.lights=false;sync();const r=await loadThreeRenderer();await r.waitForSceneAssets(10000,BoothSpec);closeDockPanel(false);await r.setCameraView('orthographic_top',{animate:false});});
  await page.locator('#btnMeasureTape').click();
  if(mobile)await page.evaluate(()=>{threeRenderer.camera.zoom=.4;threeRenderer.camera.updateProjectionMatrix();});
  const before=await page.evaluate(()=>objectSnapshot());
  const screen=world=>page.evaluate(world=>{const r=threeRenderer,p=new r.THREE.Vector3(...world).project(r.camera),rect=r.renderer.domElement.getBoundingClientRect();return{x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};},world);
  const click=async world=>{const p=await screen(world);const target=await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.tagName,p);assert.equal(target,'CANVAS',JSON.stringify({mobile,p,target}));return mobile?page.touchscreen.tap(p.x,p.y):page.mouse.click(p.x,p.y);};
  for(const enabled of [true,false]){
   await page.evaluate(enabled=>{viewGridVisible=enabled;S.placementSnap=!enabled;threeRenderer.refreshEditingGrids();},enabled);
   await page.locator('[data-measure="clear"]').click();
   await click([.83,.15,.27]);
   if(!mobile){
    const p=await screen([1.97,.15,.27]);await page.mouse.move(p.x,p.y);
    assert.equal(await page.locator('.measure-overlay').getAttribute('data-axis'),'x','live free-mode preview detects X');
   }
   await click([1.97,.15,.27]);
   const result=await page.evaluate(()=>threeRenderer.measureTape.result);
   assert.ok(result,JSON.stringify(result));
   assert.ok(Math.abs(result.width-(enabled?1.2:1.14))<.006,JSON.stringify({enabled,result}));
   assert.ok(result.height<.001);assert.ok(result.depth<.001);
   assert.equal(await page.locator('.measure-line').evaluate(el=>getComputedStyle(el).stroke),'rgb(255, 82, 99)');
   assert.match(await page.locator('.measure-label').textContent(),/^X ·/);
  }
  if(!mobile){
   await page.locator('[data-measure-axis="free"]').click();
   let p=await screen([.83,.15,1.47]);await page.mouse.move(p.x,p.y);
   assert.equal(await page.locator('.measure-overlay').getAttribute('data-axis'),'y');
   assert.equal(await page.locator('.measure-line').evaluate(el=>getComputedStyle(el).stroke),'rgb(108, 219, 112)');
   p=await screen([1.97,.15,1.47]);await page.mouse.move(p.x,p.y);
   assert.equal(await page.locator('.measure-overlay').getAttribute('data-axis'),'free');
   assert.equal(await page.locator('.measure-line').evaluate(el=>getComputedStyle(el).stroke),'rgb(66, 237, 219)');
  }
  assert.equal(await page.evaluate(()=>objectSnapshot()),before);assert.deepEqual(errors,[]);
  console.log('PASS',mobile?'touch':'desktop','visible grid snaps to 10 cm; disabled grid remains free, independent of placement snap');
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
