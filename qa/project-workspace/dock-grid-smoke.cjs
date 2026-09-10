const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(async()=>{YPQuickSetupBridge.close();YPProjectBridge.restore(YPPeninsularTemplateBridge.snapshot('penin-connect'));const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);});
 assert.deepEqual(await page.locator('.dock-rail > button').evaluateAll(bs=>bs.map(b=>b.dataset.dockPage||b.id)),['business','booth','finish','catalog','storage','signage','dockGridMenu','prompt','brand','lighting']);
 const toggle=require('./grid-menu-test-helper.cjs')(page,'dockGridToggle');assert.equal(await toggle.getAttribute('aria-pressed'),'false');
 const before=await page.evaluate(()=>JSON.stringify(getBoothSpec()));
 const dockBefore=await page.evaluate(()=>({active:document.querySelector('.dock-page.on').dataset.dockPage,collapsed:workspace.classList.contains('dock-collapsed')}));
 await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'true');
 assert.equal(await page.evaluate(()=>JSON.stringify(getBoothSpec())),before);
 assert.deepEqual(await page.evaluate(()=>({active:document.querySelector('.dock-page.on').dataset.dockPage,collapsed:workspace.classList.contains('dock-collapsed')})),dockBefore);
 assert.equal(await page.evaluate(()=>threeRenderer.boothGroup.getObjectByName('booth-editing-grid').visible),true);
 const spacing=await page.evaluate(()=>({lines:viewGridLines(3),partial:viewGridLines(1.25),minor:threeRenderer.boothGroup.getObjectByName('editing-grid-minor').geometry.attributes.position.count,major:threeRenderer.boothGroup.getObjectByName('editing-grid-major').geometry.attributes.position.count}));
 assert.equal(spacing.lines.length,31);assert.deepEqual(spacing.lines.filter(l=>l.major).map(l=>l.position),[0,1,2,3]);
 spacing.lines.slice(1).forEach((l,i)=>assert.ok(Math.abs(l.position-spacing.lines[i].position-.1)<1e-8));
 assert.equal(spacing.partial.at(-1).position,1.2);assert.equal(spacing.minor,81*2);assert.equal(spacing.major,11*6);
 const exportCheck=await page.evaluate(async()=>{
  const r=threeRenderer,original=r.renderer.render.bind(r.renderer),samples=[];
  r.renderer.render=(scene,camera)=>{const size=r.renderer.getSize(new r.THREE.Vector2());if(Math.max(size.x,size.y)>=1536)samples.push(r.boothGroup.getObjectByName('booth-editing-grid').visible);return original(scene,camera);};
  try{await exportCleanScreenshot({download:false,minLongEdge:1536,maxLongEdge:1536,assetTimeoutMs:20000});}finally{r.renderer.render=original;}
  return{samples,restored:r.boothGroup.getObjectByName('booth-editing-grid').visible};
 });assert.ok(exportCheck.samples.length);assert.ok(exportCheck.samples.every(v=>!v));assert.equal(exportCheck.restored,true);
 await page.evaluate(()=>{closeDockPanel(false);selectView('plan');});await page.waitForSelector('#plan-editing-grid');
 assert.equal(await page.locator('[data-grid-level="major"] path').count(),11);assert.equal(await page.locator('[data-grid-level="minor"] path').count(),81);
 assert.ok(Number(await page.locator('[data-grid-level="major"]').getAttribute('stroke-width'))>Number(await page.locator('[data-grid-level="minor"]').getAttribute('stroke-width')));
 await toggle.click();assert.equal(await page.locator('#plan-editing-grid').count(),0);
 await toggle.focus();await page.keyboard.press('Space');assert.equal(await page.locator('#plan-editing-grid').count(),1);
 await page.evaluate(()=>selectView('three'));await page.waitForFunction(()=>threeRenderer.boothGroup.getObjectByName('booth-editing-grid').visible);
 await page.screenshot({path:path.join(__dirname,'dock-grid-desktop.png')});
 for(const [w,h] of [[390,844],[768,1024],[844,390]]){
  await page.setViewportSize({width:w,height:h});await page.locator('.dock-tool[data-dock-page="finish"]').click();
  assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('.dock-page.on').getAttribute('data-dock-page'),'finish');
  await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  await page.locator('.dock-tool[data-dock-page="lighting"]').click();assert.equal(await page.locator('.dock-page.on').getAttribute('data-dock-page'),'lighting');
  assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  await page.screenshot({path:path.join(__dirname,'dock-grid-'+w+'.png')});
 }
 assert.deepEqual(errors,[]);console.log('PASS: menu order, independent grid toggle, unchanged spec/snap, 3D/plan, keyboard, clean export/restoration, mobile/tablet/landscape');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
