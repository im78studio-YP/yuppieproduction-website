const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.COMPARE_URL||'http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&window.YPCompareUI);await page.evaluate(()=>YPQuickSetupBridge.close());
    await page.locator('#projectCompare').click();assert.ok((await page.locator('#compareStatus').textContent()).includes('มีแบบเดียว'));assert.equal(await page.locator('[data-choose=B]').count(),0);await page.locator('#compareClose').click();
    await page.waitForFunction(()=>document.querySelector('#view canvas'),{},{timeout:60000});
    await page.evaluate(async()=>{addCatalogObject('counter-standard');const s=YPProjectBridge.capture();s.spec.brand='ALPHA';s.spec.primary='#ef285e';s.spec.colTouched=true;
      const file=await (await fetch('./assets/furniture/counter-standard.glb')).blob();s.assets.push({id:'my-asset-compare',name:'Uploaded piece',size:{w:1,d:.5,h:1},file});s.spec.objects.push({id:'uploaded',catalogId:'my-asset-compare',type:'custom',unitPrice:0,position:{x:2,y:0,z:1.5},size:{w:1,d:.5,h:1},rotationY:0});YPProjectBridge.restore(s);
      window.compareCameras=[];window.addEventListener('message',e=>{if(e.data?.channel==='yp-compare'&&e.data.type==='result')window.compareCameras.push(e.data.camera);});});
    await page.locator('#projectDuplicate').click();await page.waitForFunction(()=>YPProjectWorkspace.state().active==='B'&&!YPProjectWorkspace.state().busy);
    await page.evaluate(async()=>{const s=YPProjectBridge.capture();s.spec.W=9;s.spec.brand='BETA';s.spec.primary='#2458dc';s.assets[0].file=await (await fetch('./assets/furniture/high-table-stool-set.glb')).blob();YPProjectBridge.restore(s);addCatalogObject('table-standard');});
    await page.locator('#projectA').click();await page.waitForFunction(()=>YPProjectWorkspace.state().active==='A'&&!YPProjectWorkspace.state().busy);
    await page.evaluate(()=>addCatalogObject('chair-standard'));
    const before=await page.evaluate(()=>({variants:YPProjectWorkspace.capture().variants,past:objectEditor.past.slice(),future:objectEditor.future.slice(),selected:objectEditor.selectedId}));
    await page.locator('#projectCompare').click();await page.waitForFunction(()=>document.querySelector('#compareStatus').textContent.includes('ภาพพร้อมแล้ว')||document.querySelector('#compareStatus').dataset.error==='true',{},{timeout:100000});
    console.log('STATUS',await page.locator('#compareStatus').textContent());assert.equal(await page.locator('#compareStatus').getAttribute('data-error'),'false');
    for(const slot of ['A','B'])assert.equal(await page.locator('#compareImage'+slot).isVisible(),true);
    const cameras=await page.evaluate(()=>window.compareCameras);assert.equal(cameras.length,2);assert.deepEqual(cameras[0].frustum,cameras[1].frustum);assert.equal(cameras[0].projection,'orthographic');assert.equal(cameras[0].zoom,cameras[1].zoom);
    assert.ok((await page.locator('#compareRows').textContent()).includes('9 × 3 × 2.4'));assert.ok(await page.locator('#compareRows tr.different').count()>0);
    await page.screenshot({path:'qa/project-workspace/compare-desktop.png',animations:'disabled'});
    const after=await page.evaluate(()=>({variants:YPProjectWorkspace.capture().variants,past:objectEditor.past.slice(),future:objectEditor.future.slice(),selected:objectEditor.selectedId}));assert.deepEqual(after,before);
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/project-workspace/compare-mobile.png',animations:'disabled'});
    assert.ok(await page.evaluate(()=>{const d=document.querySelector('.compare-dialog');return d.scrollWidth<=d.clientWidth+1;}));
    await page.locator('[data-choose=B]').click();await page.waitForFunction(()=>document.querySelector('.handoff-dialog').open);assert.equal(await page.locator('#handoffVariant').inputValue(),'B');
    assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A.spec.objects),before.variants.A.spec.objects);await page.locator('#handoffClose').click();await page.setViewportSize({width:1440,height:1000});
    // Closing during loading cleans the worker and leaves the current slot intact.
    await page.locator('#projectCompare').click();await page.locator('#compareClose').click();assert.equal(await page.locator('.compare-render-frame').count(),0);assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'B');
    // A failed preview is explicit; choosing an existing design remains possible.
    await page.route('**/*comparePreview=1*',route=>route.abort());await page.locator('#projectCompare').click();
    await page.waitForFunction(()=>document.querySelector('#compareStatus').dataset.error==='true',{},{timeout:55000});assert.equal(await page.locator('[data-choose=A]').isEnabled(),true);await page.locator('#compareClose').click();
    assert.deepEqual(errors,[]);console.log('PASS: single variant, paired images, parent/Undo preservation, counts, mobile, choose-to-handoff, cancel, failure');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
