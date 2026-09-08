const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&window.YPHandoffUI);await page.evaluate(()=>YPQuickSetupBridge.close());
    await page.waitForFunction(()=>document.querySelector('#view canvas'),{},{timeout:60000});
    await page.evaluate(()=>{addCatalogObject('counter-standard');const s=YPProjectBridge.capture(),o=s.spec.objects[0];o.position={x:-.3,y:0,z:1.5};o.rotationY=45;o.transform={...o.transform,scale:{x:2,y:2,z:2},uniformScale:2};YPProjectBridge.restore(s);});
    assert.equal(await page.evaluate(()=>{const spec=YPProjectBridge.capture().spec,before=JSON.stringify(spec),live=JSON.stringify(getBoothSpec()),b=YPProjectBridge.handoffGeometry(spec)[0].bounds;return JSON.stringify(spec)===before&&JSON.stringify(getBoothSpec())===live&&b.x0<-1&&b.x1>0;}),true);
    await page.locator('#projectDuplicate').click();await page.waitForFunction(()=>YPProjectWorkspace.state().active==='B'&&!YPProjectWorkspace.state().busy);
    await page.evaluate(()=>{const s=YPProjectBridge.capture(),o=s.spec.objects[0];o.position={x:3,y:0,z:1.5};o.rotationY=0;o.transform={...o.transform,scale:{x:1,y:1,z:1},uniformScale:1};s.spec.brand='VARIANT B';YPProjectBridge.restore(s);});
    await page.locator('#projectA').click();await page.waitForFunction(()=>YPProjectWorkspace.state().active==='A'&&!YPProjectWorkspace.state().busy);
    await page.evaluate(()=>{window.previewCalls=0;const original=window.exportCleanScreenshot;window.exportCleanScreenshot=async opts=>{window.previewCalls++;return original(opts);};sendQuote();});
    await page.locator('#handoff-contact').fill('Readiness Test');await page.locator('#handoff-phone').fill('0812345678');
    await page.locator('#handoffForm button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#handoffDownload').disabled);
    assert.equal(await page.locator('#handoffPreview').isVisible(),true);assert.equal(await page.locator('[data-code=outside-booth]').count(),1);
    await page.locator('#handoffCheckTitle').scrollIntoViewIfNeeded();await page.screenshot({path:'qa/project-workspace/readiness-desktop.png',animations:'disabled'});
    const before=await page.evaluate(()=>JSON.stringify(YPProjectBridge.capture().spec));
    await page.locator('[data-code=outside-booth] button').click();assert.equal(await page.locator('.handoff-dialog').isVisible(),false);
    assert.equal(await page.evaluate(()=>objectEditor.selectedId===getBoothSpec().objects[0].id),true);assert.equal(await page.evaluate(()=>JSON.stringify(YPProjectBridge.capture().spec)),before);
    await page.evaluate(()=>sendQuote());assert.equal(await page.locator('#handoff-contact').inputValue(),'Readiness Test');
    await page.locator('#handoffVariant').selectOption('B');await page.waitForFunction(()=>!document.querySelector('#handoffVariant').disabled);
    await page.locator('#handoffForm button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#handoffDownload').disabled);
    assert.equal(await page.locator('[data-code=outside-booth]').count(),0);assert.ok((await page.locator('#handoffPreviewCaption').textContent()).includes('แบบ B'));
    const preview=await page.locator('#handoffPreview').getAttribute('src');const calls=await page.evaluate(()=>window.previewCalls);
    const downloaded=page.waitForEvent('download');await page.locator('#handoffDownload').click();const download=await downloaded;
    assert.equal(await page.evaluate(()=>window.previewCalls),calls);assert.equal(await page.locator('#handoffPreview').getAttribute('src'),preview);
    // Verify the image bytes in the ZIP are exactly the reviewed image.
    const file=await download.path(),bytes=require('node:fs').readFileSync(file);let pos=0,png=null,brief=null;
    while(bytes.readUInt32LE(pos)===0x04034b50){const size=bytes.readUInt32LE(pos+18),n=bytes.readUInt16LE(pos+26),start=pos+30+n+bytes.readUInt16LE(pos+28),name=bytes.subarray(pos+30,pos+30+n).toString();if(name==='booth.png')png=bytes.subarray(start,start+size);if(name==='brief.json')brief=JSON.parse(bytes.subarray(start,start+size));pos=start+size;}
    assert.equal(brief.selected,'B');assert.ok(brief.readiness.warnings.some(w=>w.code==='missing-venue'));assert.ok(!brief.readiness.warnings.some(w=>w.code==='outside-booth'));
    assert.deepEqual(png,Buffer.from(await page.evaluate(async url=>Array.from(new Uint8Array(await (await fetch(url)).arrayBuffer())),preview)));
    await page.locator('[data-code=missing-venue] button').click();assert.equal(await page.locator('#handoff-venue').evaluate(el=>el===document.activeElement),true);
    await page.locator('#handoff-venue').fill('Hall 1');await page.locator('#handoff-eventDate').fill('2026-09-20');await page.locator('#handoffForm button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#handoffDownload').disabled);
    assert.equal(await page.locator('[data-code=missing-venue]').count(),0);assert.equal(await page.locator('[data-code=missing-eventDate]').count(),0);
    await page.setViewportSize({width:390,height:844});await page.locator('#handoffCheckTitle').scrollIntoViewIfNeeded();await page.screenshot({path:'qa/project-workspace/readiness-mobile.png',animations:'disabled'});
    assert.ok(await page.evaluate(()=>{const d=document.querySelector('.handoff-dialog');return d.scrollWidth<=d.clientWidth+1;}));
    await page.evaluate(()=>getBoothSpec().W+=1);await page.locator('#handoffDownload').click();assert.ok((await page.locator('#handoffStatus').textContent()).includes('แบบเปลี่ยนหลังตรวจสรุป'));
    assert.deepEqual(errors,[]);console.log('PASS: read-only rotated/scaled bounds, select-to-fix, A/B warning isolation, exact preview PNG, missing fields, mobile, stale snapshot guard');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
