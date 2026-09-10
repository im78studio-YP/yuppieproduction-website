const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(async()=>{YPQuickSetupBridge.close();YPProjectBridge.restore(YPPeninsularTemplateBridge.snapshot('penin-golden-oculus'));const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);const chairs=getBoothSpec().objects.filter(o=>o.type==='chair');window.auditChairIds=chairs.slice(0,2).map(o=>o.id);setObjectSelection(auditChairIds);syncObjectControls();});
 assert.equal(await page.locator('#objectToolsDialog,[data-tool-category]').count(),0);
 for(const id of ['btnMoveSmart','btnResizeObject','btnScaleObject','moveAdvanced','btnRotateObject','btnGroupObjects','btnUngroupObjects','btnDuplicateObject','btnLockObject','btnDeleteObject','btnUndoObject'])assert.equal(await page.locator('#objectToolbar > #'+id).count(),1,id);
 for(const [w,h] of [[360,800],[390,844],[844,390],[768,1024],[1024,768],[820,1180],[1440,1000]]){
  await page.setViewportSize({width:w,height:h});await page.evaluate(()=>showDockPage('prompt',document.querySelector('.dock-tool[data-dock-page="prompt"]')));await page.waitForTimeout(250);
  if(w<=1100)assert.equal(await page.locator('#objectToolbar').isVisible(),false);
  await page.locator('#dockUpdate').click({trial:true,timeout:3000});
  await page.locator('#dockClose').click({timeout:3000});await page.waitForTimeout(250);
  assert.equal(await page.locator('#objectToolbar').isVisible(),true);
 }
 await page.locator('#btnGroupObjects').click();
 assert.equal(await page.evaluate(()=>{const a=auditChairIds.map(id=>getBoothSpec().objects.find(o=>o.id===id));return !!a[0].groupId&&a[0].groupId===a[1].groupId;}),true);
 await page.locator('#btnUngroupObjects').click();assert.equal(await page.evaluate(()=>getBoothSpec().objects.find(o=>o.id===auditChairIds[0]).groupId||null),null);
 assert.deepEqual(errors,[]);console.log('PASS: original flat toolbar restored, Group/Ungroup work, responsive panel/close/done fixes retained at 7 sizes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
