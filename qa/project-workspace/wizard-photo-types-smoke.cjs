const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPWizardV2&&YPProjectWorkspace.state().ready);
 for(const type of ['backdrop','photo360']){
  await page.evaluate(()=>YPQuickSetupBridge.open({start:'business'}));await page.locator('#quickBusinessGroups [data-value=food]').click();await page.locator('#quickBusinessNext').click();
  assert.equal(await page.locator('#quickBoothTypes [role=radio]').count(),6);await page.locator('#quickBoothTypes [data-value='+type+']').click();
  assert.equal(await page.locator('#wizard-width').inputValue(),'6');assert.equal(await page.locator('#wizard-depth').inputValue(),'3');
  assert.equal(await page.locator('#wizard-width').isDisabled(),type==='photo360');
  if(type==='backdrop')await page.locator('#wizard-width').fill('7');
  for(const width of [644,390]){await page.setViewportSize({width,height:844});assert.ok(await page.locator('#quickBoothTypes').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await page.screenshot({path:'qa/project-workspace/wizard-photo-'+type+'-'+width+'.png'});}
  await page.setViewportSize({width:1280,height:900});await page.locator('#quickLayoutNext').click();
  assert.equal(await page.locator('#wizard-template-cards [data-template=blank]').count(),1);
  await page.locator('#wizard-template-next').click();await page.locator('#wizard-customize-next').click();
  await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});
  const draft=await page.evaluate(()=>YPWizardV2.result().spec);assert.equal(draft.type,type);assert.equal(draft.W,type==='backdrop'?7:6);
  await page.locator('#wizard-finish').click();
  await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open||document.getElementById('projectConfirm')?.offsetParent!==null);
  if(await page.locator('#projectConfirm').isVisible())await page.locator('#projectConfirm').click();
  await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open);
  const actual=await page.evaluate(()=>({type:S.type,walls:typ().walls,curve:wallCurveInfo(S),dims:[S.W,S.D,S.H]}));assert.equal(actual.type,type);assert.deepEqual(actual.walls,['back']);assert.equal(!!actual.curve,type==='photo360');assert.deepEqual(actual.dims,[type==='backdrop'?7:6,3,2.4]);
  await page.evaluate(()=>{YPQuickSetupBridge.open();YPWizardV2.begin('current','layout');});assert.equal(await page.locator('#quickBoothTypes [data-value='+type+']').getAttribute('aria-checked'),'true');await page.keyboard.press('Escape');
  console.log('PASS main Wizard',type,'responsive choices, dimensions, blank template, preview, apply, reopen');
 }
 assert.deepEqual(errors,[]);await page.close();
 const legacy=await browser.newPage({viewport:{width:644,height:844}}),legacyErrors=[];legacy.on('pageerror',e=>legacyErrors.push(e.message));
 await legacy.goto('http://127.0.0.1:4173/yp-web-ai/index.html?comparePreview=1',{waitUntil:'domcontentloaded'});await legacy.waitForFunction(()=>typeof completeQuickSetup==='function');
 for(const type of ['backdrop','photo360']){
  await legacy.evaluate(()=>YPQuickSetupBridge.open({start:'business'}));await legacy.locator('#quickBusinessGroups [data-value=food]').click();await legacy.locator('#quickBusinessNext').click();
  assert.equal(await legacy.locator('#quickBoothTypes [role=radio]').count(),6);await legacy.locator('#quickBoothTypes [data-value='+type+']').click();
  await legacy.screenshot({path:'qa/project-workspace/quick-setup-photo-'+type+'.png'});
  await legacy.locator('#quickLayoutNext').click();await legacy.locator('#quickBrandNext').click();await legacy.locator('#quickFloorNext').click();
  await legacy.evaluate(()=>completeQuickSetup());await legacy.waitForFunction(()=>!quickSetupCompleting&&!releaseNotesModal.classList.contains('show'));
  const actual=await legacy.evaluate(()=>({type:S.type,dims:[S.W,S.D,S.H],walls:typ().walls,curve:!!wallCurveInfo(S)}));assert.equal(actual.type,type);assert.deepEqual(actual.dims,[6,3,2.4]);assert.deepEqual(actual.walls,['back']);assert.equal(actual.curve,type==='photo360');
  console.log('PASS Quick Setup',type,'selection through completion');
 }
 assert.deepEqual(legacyErrors,[]);await legacy.close();
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
