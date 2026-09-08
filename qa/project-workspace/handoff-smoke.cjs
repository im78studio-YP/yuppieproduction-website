const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.HANDOFF_URL||'http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&window.YPHandoffUI);
    await page.evaluate(()=>YPQuickSetupBridge.close());await page.waitForFunction(()=>document.querySelector('#view canvas'),{},{timeout:60000});
    await page.evaluate(()=>addCatalogObject('counter-standard'));await page.locator('#projectDuplicate').click();await page.waitForFunction(()=>YPProjectWorkspace.state().active==='B'&&!YPProjectWorkspace.state().busy);
    await page.evaluate(()=>sendQuote());await page.locator('#handoffVariant').selectOption('A');await page.waitForFunction(()=>!document.querySelector('#handoffVariant').disabled);assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'A');
    await page.locator('#handoff-contact').fill('ทดสอบ ลูกค้า');await page.locator('#handoff-phone').fill('0812345678');await page.locator('#handoff-notes').fill('https://example.test <script>bad()</script>');
    await page.locator('#handoffForm button[type=submit]').click();assert.ok((await page.locator('#handoffSummary').textContent()).includes('<script>bad()</script>'));
    await page.waitForFunction(()=>!document.querySelector('#handoffDownload').disabled);assert.equal(await page.locator('#handoffPreview').isVisible(),true);
    await page.screenshot({path:'qa/project-workspace/handoff-desktop.png',animations:'disabled'});
    // Export real PNG, inspect archive bytes and restore editable project.
    const downloadEvent=page.waitForEvent('download',{timeout:90000});await page.locator('#handoffDownload').click();const download=await downloadEvent;await download.saveAs('qa/project-workspace/handoff-test.zip');
    const bytes=require('node:fs').readFileSync('qa/project-workspace/handoff-test.zip'),files={};let pos=0;
    while(bytes.readUInt32LE(pos)===0x04034b50){const length=bytes.readUInt32LE(pos+18),n=bytes.readUInt16LE(pos+26),extra=bytes.readUInt16LE(pos+28),start=pos+30+n+extra;files[bytes.subarray(pos+30,pos+30+n).toString()]=bytes.subarray(start,start+length);pos=start+length;}
    assert.equal(files['booth.png'].subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    const info=JSON.parse(files['brief.json']);assert.equal(info.selected,'A');assert.equal(info.equipment[0].name,'เคาน์เตอร์');
    assert.equal(await page.evaluate(text=>{const p=YPProjectStore.fromText(text);return p.active==='A'&&p.variants.B===null&&p.variants.A.spec.objects.length===1;},files['project.ypbooth.json'].toString()),true);
    await page.waitForFunction(()=>!document.querySelector('#handoffDownload').disabled);assert.ok((await page.locator('#handoffStatus').textContent()).includes('มีภาพบูธ'));
    assert.ok((await page.locator('#handoffStatus').textContent()).includes('ยังไม่ได้ส่งถึงทีม'));
    assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'A');
    // Do not silently downgrade a failed image. User explicitly opts out.
    await page.evaluate(()=>{window.savedHandoffExport=window.exportCleanScreenshot;window.exportCleanScreenshot=async()=>{throw new Error('TEST_IMAGE_FAILURE');};});
    await page.locator('#handoffPreviewRefresh').click();await page.waitForFunction(()=>document.querySelector('#handoffStatus').textContent.includes('TEST_IMAGE_FAILURE'));
    await page.locator('#handoffImage').uncheck();const second=page.waitForEvent('download');await page.locator('#handoffDownload').click();await second;
    await page.waitForFunction(()=>document.querySelector('#handoffStatus').textContent.includes('ไม่มีภาพบูธ'));
    await page.locator('#handoffEdit').click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/project-workspace/handoff-mobile.png',animations:'disabled'});
    assert.ok(await page.evaluate(()=>{const d=document.querySelector('.handoff-dialog');return d.scrollWidth<=d.clientWidth+1;}));
    await page.locator('#handoffClose').click();assert.equal(await page.evaluate(()=>JSON.stringify(YPProjectWorkspace.capture()).includes('ทดสอบ ลูกค้า')),false);
    assert.deepEqual(errors,[]);console.log('PASS handoff A/B, real image ZIP, error fallback, no PII in project, mobile');
    // The data-only handoff also works when the editor is opened directly as a file.
    const local=await browser.newPage({acceptDownloads:true});
    await local.goto(require('node:url').pathToFileURL(require('node:path').resolve('public/yp-web-ai/index.html')).href);
    await local.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&window.YPHandoffUI);
    await local.evaluate(()=>{YPQuickSetupBridge.close();sendQuote();});
    await local.evaluate(()=>document.querySelector('#handoffImage').checked=false);
    await local.locator('#handoff-contact').fill('Local Test');await local.locator('#handoff-phone').fill('0812345678');
    await local.locator('#handoffForm button[type=submit]').click();await local.locator('#handoffImage').uncheck();
    const offline=local.waitForEvent('download');await local.locator('#handoffDownload').click();await offline;
    console.log('PASS file:// form and data-only ZIP');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
