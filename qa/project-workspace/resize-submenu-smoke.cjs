const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPResizeSubmenu&&YPProjectWorkspace.state().ready,null,{timeout:60000});
  const id=await page.evaluate(async()=>{YPQuickSetupBridge.close();const o=makeCatalogObject('counter-standard',1,1);o.size={w:.5,d:.1,h:1};o.label='Numeric resize';mutateObjects(()=>S.objects.push(o),o.id);await loadThreeRenderer();return o.id;});
  const size=()=>page.evaluate(id=>({...objectById(id).size}),id),panel=page.locator('#resizeSubmenu');
  if(mobile)await page.evaluate(()=>closeDockPanel(false));
  await page.locator('#btnResizeObject').click();await panel.waitFor({state:'visible'});assert.match(await page.locator('#btnResizeObject').textContent(),/▾/);
  assert.equal(await page.locator('#resizeValuew').inputValue(),'0.5');assert.equal(await page.evaluate(()=>objectEditor.transformMode),'resize');
  assert.equal(await page.evaluate(()=>threeRenderer.resizeHandleGroup.children.length),8);
  const before=await page.evaluate(()=>({objects:JSON.stringify(S.objects),past:objectEditor.past.length}));
  await page.locator('#resizeSubmenuLock').uncheck();await page.locator('#resizeValuew').fill('0.8');assert.deepEqual(await size(),{w:.5,d:.1,h:1});await page.locator('#resizeValuew').press('Enter');assert.deepEqual(await size(),{w:.8,d:.1,h:1});
  assert.equal(await page.evaluate(()=>objectEditor.past.length),before.past+1);
  await page.evaluate(()=>undoObjectChange());assert.equal(await page.evaluate(()=>JSON.stringify(S.objects)),before.objects);assert.equal(await page.locator('#resizeValuew').inputValue(),'0.5');
  await page.locator('#resizeSubmenuLock').check();await page.locator('#resizeValuew').fill('1');await page.locator('[data-resize-apply="w"]').click();assert.deepEqual(await size(),{w:1,d:.2,h:2});
  await page.locator('#resizeValueh').fill('6');await page.locator('#resizeValueh').press('Enter');assert.equal(await page.locator('#resizeValueh').getAttribute('aria-invalid'),'true');assert.deepEqual(await size(),{w:1,d:.2,h:2});
  await page.locator('#resizeValued').fill('1');await page.locator('#resizeValued').press('Enter');assert.match(await page.locator('#resizeSubmenuStatus').textContent(),/ทุกด้าน/);assert.deepEqual(await size(),{w:1,d:.2,h:2});
  await page.locator('#resizeValueh').fill('');await page.locator('#resizeValueh').press('Enter');assert.equal(await page.locator('#resizeValueh').getAttribute('aria-invalid'),'true');
  await page.locator('#resizeValuew').fill('0.7');await page.locator('#resizeValuew').press('Escape');assert.equal(await panel.isVisible(),false);assert.deepEqual(await size(),{w:1,d:.2,h:2});
  await page.locator('#btnResizeObject').click();await page.locator('#resizeSubmenuLock').uncheck();await page.locator('#resizeValued').fill('0.3');await page.locator('#resizeValueh').fill('1.5');await page.locator('#resizeValued').press('Enter');assert.equal(await page.locator('#resizeValueh').inputValue(),'1.5');await page.locator('#resizeValueh').press('Enter');assert.deepEqual(await size(),{w:1,d:.3,h:1.5});
  assert.ok(await panel.evaluate(p=>{const r=p.getBoundingClientRect();return p.scrollWidth<=p.clientWidth+1&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}));
  await page.screenshot({path:`qa/project-workspace/resize-submenu-${mobile?'mobile':'desktop'}.png`});
  await page.locator('#resizeSubmenuDrag').click();assert.equal(await panel.isVisible(),false);assert.equal(await page.evaluate(()=>objectEditor.transformMode),'resize');
  await page.locator('#btnResizeObject').click();await page.evaluate(()=>selectObject(null));assert.equal(await panel.isVisible(),false);
  await page.evaluate(id=>{selectObject(id);objectById(id).locked=true;sync();},id);assert.equal(await page.locator('#btnResizeObject').isDisabled(),true);
  assert.deepEqual(errors,[]);console.log(`PASS ${mobile?'mobile touch':'desktop'}: popup, dimensions, Enter/check, ratio, invalid/range, pending values, cancel, Undo, drag mode, selection/lock, layout`);await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
