const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPRotateSubmenu&&YPProjectWorkspace.state().ready,null,{timeout:60000});
  const id=await page.evaluate(async()=>{YPQuickSetupBridge.close();const o=makeCatalogObject('counter-standard',1,1);o.size={w:.6,d:.4,h:1};mutateObjects(()=>S.objects.push(o),o.id);await loadThreeRenderer();closeDockPanel(false);return o.id;});
  const trigger=page.locator('#btnRotateMenu'),menu=page.locator('#rotateSubmenu');
  assert.match(await trigger.textContent(),/หมุน ▾/);assert.equal(await page.locator('#objectToolbar #btnRotateObject,#objectToolbar #btnFlipObjectX,#objectToolbar #btnFlipObjectY').count(),0);
  for(const [action,key] of [['btnRotateObject','rotationY'],['btnFlipObjectX','flipX'],['btnFlipObjectY','flipY'],['btnFlipObjectZ','flipZ']]){
   const before=await page.evaluate(id=>({snapshot:JSON.stringify(S.objects),past:objectEditor.past.length,rotation:objectById(id).rotationY,transform:{...objectById(id).transform}}),id);
   await trigger.click();await menu.waitFor({state:'visible'});assert.equal(await menu.getByRole('menuitem').count(),4);
   await page.locator('#'+action).click();assert.equal(await menu.isVisible(),false);
   const after=await page.evaluate(id=>({rotation:objectById(id).rotationY,transform:objectById(id).transform,past:objectEditor.past.length}),id);
   if(key==='rotationY')assert.equal(after.rotation,(before.rotation+45)%360);else assert.equal(after.transform[key],!before.transform[key]);
   assert.equal(after.past,before.past+1);await page.keyboard.press('Control+z');assert.equal(await page.evaluate(()=>JSON.stringify(S.objects)),before.snapshot);
  }
  await trigger.focus();await trigger.press('ArrowDown');assert.equal(await page.locator('#btnRotateObject').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#btnFlipObjectX').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('End');assert.equal(await page.locator('#btnFlipObjectZ').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Escape');assert.equal(await menu.isVisible(),false);assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
  await trigger.click();assert.ok(await menu.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth+1;}));
  await page.screenshot({path:`qa/project-workspace/rotate-submenu-${mobile?'mobile':'desktop'}.png`});
  await page.locator('#btnResizeObject').click();assert.equal(await menu.isVisible(),false);assert.equal(await page.locator('#resizeSubmenu').isVisible(),true);
  await trigger.click();assert.equal(await menu.isVisible(),true);assert.equal(await page.locator('#resizeSubmenu').isVisible(),false);
  await page.evaluate(()=>selectObject(null));assert.equal(await menu.isVisible(),false);
  await page.evaluate(id=>{objectById(id).locked=true;selectObject(id);sync();},id);assert.equal(await trigger.isDisabled(),true);
  assert.deepEqual(errors,[]);console.log(`PASS ${mobile?'mobile touch':'desktop'}: grouped menu, all original actions, Undo, keyboard, selection/lock guard, resize coexistence, viewport`);await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
