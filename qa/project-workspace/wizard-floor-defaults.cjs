const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.YPWizardV2&&YPProjectWorkspace.state().ready&&!YPProjectWorkspace.state().pendingDraft);
 let count=0;
 for(const type of ['inline','corner','penin','island']){
  await page.evaluate(type=>{YPWizardV2.begin('new');Object.assign(quickSetupDraft,{businessCategoryId:'food',boothType:type});YPWizardV2.show('template');},type);
  const ids=await page.locator('#wizard-template-cards [data-template]').evaluateAll(ns=>ns.map(n=>n.dataset.template));
  for(const id of ids){
   await page.locator('#wizard-template-cards [data-template="'+id+'"]').click();
   const s=await page.evaluate(()=>YPWizardV2.result().spec);
   assert.equal(s.floor,'carpet',id);assert.equal(s.carpet,'grey',id);assert.equal(s.raise,0,id);count++;
  }
 }
 console.log('PASS',count,'blank/template choices across all 4 booth types');
 await page.locator('#wizard-template-next').click();await page.locator('#wizard-floor-details summary').click();
 for(const [host,key] of [['quickRaiseOptions','0'],['quickFloorOptions','carpet'],['quickCarpetOptions','grey']])assert.equal(await page.locator('#'+host+' [data-value="'+key+'"]').getAttribute('aria-checked'),'true');
 assert.match(await page.locator('#quickFloorSummary').innerText(),/ไม่ยกพื้น.*เทาดำ/);
 await page.locator('#quickFloorOptions [data-value=tile]').click();await page.locator('#quickTileOptions [data-value=woodD]').click();await page.locator('#quickRaiseOptions [data-value="10"]').click();
 let s=await page.evaluate(()=>YPWizardV2.result().spec);assert.equal(s.floor,'tile');assert.equal(s.tile,'woodD');assert.equal(s.raise,10);
 await page.locator('#quickRaiseOptions [data-value="0"]').click();await page.locator('#quickFloorOptions [data-value=carpet]').click();
 await page.locator('#wizard-customize-next').click();await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});
 assert.match(await page.locator('#wizard-review-summary').innerText(),/พรม · เทาดำ · ไม่ยกพื้น/);
 const frame=page.frames().find(f=>f.url().includes('comparePreview=1'));
 assert.deepEqual(await frame.evaluate(()=>({floor:S.floor,carpet:S.carpet,raise:S.raise})),{floor:'carpet',carpet:'grey',raise:0});
 await page.locator('#wizard-finish').click();if(await page.locator('#projectConfirm').isVisible())await page.locator('#projectConfirm').click();
 await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open);
 assert.deepEqual(await page.evaluate(()=>({floor:S.floor,carpet:S.carpet,raise:S.raise})),{floor:'carpet',carpet:'grey',raise:0});
 const preserved=await page.evaluate(()=>{S.floor='tile';S.tile='woodD';S.raise=10;YPWizardV2.begin('current');return YPWizardV2.result().spec;});assert.equal(preserved.floor,'tile');assert.equal(preserved.raise,10);
 assert.deepEqual(errors,[]);console.log('PASS UI selections, overrides, preview, confirmed result and preservation of current work');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
