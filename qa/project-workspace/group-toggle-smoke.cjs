const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPResizeSubmenu&&YPProjectWorkspace.state().ready);
 const ids=await page.evaluate(async()=>{YPQuickSetupBridge.close();const a=makeCatalogObject('counter-standard',1,1),b=makeCatalogObject('chair-standard',2,1);a.size={w:.6,d:.4,h:1};a.transform={...a.transform,uniformScale:1.5,scale:{x:1.5,y:1.5,z:1.5}};mutateObjects(()=>S.objects.push(a,b),a.id);await loadThreeRenderer();closeDockPanel(false);return[a.id,b.id];});
 const button=page.locator('#btnGroupObjects'),shape=()=>page.evaluate(ids=>ids.map(id=>{const o=objectById(id);return {position:o.position,size:o.size,transform:o.transform};}),ids);
 const before=await shape();assert.equal(await button.textContent(),'Group');assert.equal(await button.isDisabled(),true);
 for(const advanced of [false,true]){if(advanced)await page.locator('#editorLevelToggle').click();assert.equal(await page.locator('#btnScaleObject').isVisible(),false);assert.equal(await page.locator('#btnUngroupObjects').isVisible(),false);}
 await page.locator('#btnResizeObject').click();assert.equal(await page.locator('#resizeSubmenu').isVisible(),true);await page.locator('#resizeSubmenuDone').click();
  await page.evaluate(ids=>{setObjectSelection(ids,ids[0]);syncObjectControls();},ids);assert.equal(await button.isEnabled(),true);await button.click();assert.equal(await button.textContent(),'Ungroup');
 const groups=await page.evaluate(ids=>ids.map(id=>objectById(id).groupId),ids);assert.ok(groups[0]);assert.equal(groups[0],groups[1]);assert.deepEqual(await shape(),before);
 await page.screenshot({path:`qa/project-workspace/group-toggle-${mobile?'mobile':'desktop'}.png`});
 await button.click();assert.equal(await button.textContent(),'Group');assert.deepEqual(await page.evaluate(ids=>ids.map(id=>!!objectById(id).groupId),ids),[false,false]);assert.deepEqual(await shape(),before);
 await page.keyboard.press('Control+z');assert.equal(await button.textContent(),'Ungroup');await page.keyboard.press('Control+Shift+z');assert.equal(await button.textContent(),'Group');
 await button.click();await page.evaluate(id=>selectObject(id),ids[0]);assert.equal(await button.textContent(),'Ungroup');
 await page.evaluate(id=>{objectById(id).locked=true;sync();},ids[1]);assert.equal(await button.isDisabled(),true);
 await page.evaluate(id=>{objectById(id).locked=false;sync();},ids[1]);await button.click();assert.equal(await button.textContent(),'Group');
 assert.deepEqual(await shape(),before);assert.deepEqual(errors,[]);console.log(`PASS ${mobile?'mobile touch':'desktop'}: no Scale in either mode, one Group/Ungroup action, resize available, Undo/Redo, selected group, locked member protection, original dimensions and scale preserved`);await context.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
