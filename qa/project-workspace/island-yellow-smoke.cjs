const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPIslandTemplateUI&&YPProjectWorkspace.state().ready);
 const checks=await page.evaluate(async()=>{
  YPQuickSetupBridge.close();const s=YPIslandTemplateBridge.snapshot('island-yellow-frame'),renderer=await loadThreeRenderer(),T=renderer.THREE;
  if(s.spec.H!==3.5||s.spec.type!=='island'||s.spec.logo!==YPDefaultLogo.data)throw Error('Wrong template state');
  const roofs=s.spec.objects.filter(o=>o.structure?.design==='yellow-oculus-roof');
  for(const roof of roofs){const o={...roof,position:{x:0,y:0,z:0}},mesh=renderer.buildCatalogObject(o);mesh.updateMatrixWorld(true);const ray=new T.Raycaster(new T.Vector3(0,1,0),new T.Vector3(0,-1,0));if(ray.intersectObject(mesh,true).length)throw Error('Roof opening is filled');ray.set(new T.Vector3(.6,1,0),new T.Vector3(0,-1,0));if(!ray.intersectObject(mesh,true).length)throw Error('Roof surface missing');}
  const original=s.spec.objects.find(o=>o.structure?.design==='yellow-stool'),roundTrip=YPProjectStore.fromText(await YPProjectStore.toText(YPProjectStore.create(s,'test')));
  if(!JSON.stringify(roundTrip).includes('yellow-stool'))throw Error('Custom stool lost after serialization');
  return {roofs:roofs.length,stools:s.spec.objects.filter(o=>o.structure?.design==='yellow-stool').length,bars:s.spec.objects.filter(o=>o.structure?.design==='yellow-bar').length};
 });assert.deepEqual(checks,{roofs:2,stools:6,bars:2});
 await page.evaluate(()=>YPIslandTemplateUI.open());assert.equal(await page.locator('[data-island-template]').count(),3);
 await page.locator('[data-island-template="island-yellow-frame"]').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
 assert.equal(await page.evaluate(()=>getBoothSpec().boothTemplate.id),'island-yellow-frame');const a=await page.evaluate(()=>YPProjectWorkspace.capture().variants.A);
 await page.locator('#projectB').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);await page.evaluate(()=>YPIslandTemplateUI.open());
 await page.locator('[data-island-template="island-blue-ribbon"]').click();await page.locator('#projectCancel').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
 await page.locator('[data-island-template="island-blue-ribbon"]').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
 assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A),a);
 await page.evaluate(()=>YPIslandTemplateUI.open());await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#islandTemplatesDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/assets/island-templates/overview.html');assert.equal(await page.locator('.card').count(),3);
 assert.deepEqual(errors,[]);console.log('PASS: true roof holes, 6 stools, 2 bars, portable geometry, 3 Island cards, A/B preservation, cancel and mobile');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
