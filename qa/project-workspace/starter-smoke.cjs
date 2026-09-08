const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
    await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&window.YPStarterLayoutUI);
    await page.evaluate(()=>YPQuickSetupBridge.close());
    await page.waitForFunction(()=>document.querySelector('#view canvas'),{},{timeout:60000});
    await page.evaluate(()=>{const s=YPProjectBridge.capture();s.spec.brand='KEEP MY BRAND';s.spec.primary='#f72585';s.spec.colTouched=true;s.spec.stSize='none';YPProjectBridge.restore(s);addCatalogObject('counter-standard');});
    const original=await page.evaluate(()=>getBoothSpec());
    await page.locator('#starterOpen').click();
    assert.equal(await page.locator('#starterApply').isEnabled(),true);
    await page.locator('[name=starterPurpose][value=meeting]').check();
    console.log('MEETING PREVIEW',await page.locator('#starterFit').textContent());
    await page.screenshot({path:'qa/project-workspace/starter-desktop.png',animations:'disabled'});
    await page.locator('#starterApply').click();
    await page.waitForFunction(()=>getBoothSpec().designPurpose==='meeting'&&!document.getElementById('projectSave').disabled);
    assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'B');
    assert.equal(await page.evaluate(()=>getBoothSpec().brand),'KEEP MY BRAND');
    const actual=await page.evaluate(()=>getBoothSpec().objects);
    assert.equal(actual.filter(o=>o.catalogId==='chair-standard').length,2);
    const table=actual.find(o=>o.catalogId==='table-standard');for(const chair of actual.filter(o=>o.catalogId==='chair-standard'))assert.equal(chair.rotationY,chair.position.z<table.position.z?0:180);
    assert.ok(!actual.some(o=>o.id===original.objects[0].id));
    await page.locator('#projectA').click();await page.waitForFunction(()=>YPProjectWorkspace.state().active==='A'&&!YPProjectWorkspace.state().busy);
    assert.deepEqual(await page.evaluate(()=>getBoothSpec().objects),original.objects);
    // Trying another starter in B must confirm before overwriting it.
    await page.locator('#starterOpen').click();await page.locator('[name=starterPurpose][value=sales]').check();await page.locator('#starterApply').click();
    await page.locator('#projectCancel').click();await page.locator('#starterManual').click();
    assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'A');
    await page.locator('#projectB').click();await page.waitForFunction(()=>YPProjectWorkspace.state().active==='B'&&!YPProjectWorkspace.state().busy);
    assert.equal(await page.evaluate(()=>getBoothSpec().designPurpose),'meeting');
    // Locked objects survive when a starter is applied to the current variant.
    await page.evaluate(()=>{const s=YPProjectBridge.capture();s.spec.W=9;s.spec.D=6;const keep=s.spec.objects[0];keep.locked=true;keep.position={x:.8,y:0,z:.8};window.keepStarterId=keep.id;YPProjectBridge.restore(s);});
    await page.locator('#starterOpen').click();await page.locator('[name=starterPurpose][value=display]').check();
    await page.locator('[name=starterDestination][value=current]').check();
    console.log('LOCKED PREVIEW',await page.locator('#starterFit').textContent());
    await page.locator('#starterApply').click();await page.locator('#projectConfirm').click();
    await page.waitForFunction(()=>getBoothSpec().designPurpose==='display'&&!YPProjectWorkspace.state().busy);
    assert.ok(await page.evaluate(()=>getBoothSpec().objects.some(o=>o.id===window.keepStarterId&&o.locked)));
    // The serialized graph nests targetAssetId inside attachment; protect both ends.
    assert.ok(await page.evaluate(()=>{
      const previous=S.assetAttachmentGraph,objects=S.objects.filter(o=>!o.locked);const [child,parent]=objects;
      try{S.assetAttachmentGraph={version:1,attachments:[{childAssetId:child.id,attachment:{targetAssetId:parent.id,attached:false}}]};const c=YPStarterBridge.context();return c.keptIds.includes(child.id)&&c.keptIds.includes(parent.id);}finally{S.assetAttachmentGraph=previous;}
    }));
    // Generated objects use the ordinary editor and its undo stack.
    await page.evaluate(()=>{const object=getBoothSpec().objects.find(o=>!o.locked);setObjectSelection([object.id]);syncObjectControls();});
    const count=await page.evaluate(()=>getBoothSpec().objects.length);await page.locator('#btnDuplicateObject').click();assert.equal(await page.evaluate(()=>getBoothSpec().objects.length),count+1);
    await page.locator('#btnUndoObject').click();assert.equal(await page.evaluate(()=>getBoothSpec().objects.length),count);
    // Purpose and generated geometry survive portable save/open.
    assert.equal(await page.evaluate(async()=>YPProjectStore.fromText(await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture()))).variants.A.spec.designPurpose),'display');
    await page.locator('#starterOpen').click();await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'qa/project-workspace/starter-mobile.png',animations:'disabled'});
    assert.ok(await page.evaluate(()=>document.querySelector('.starter-dialog').scrollWidth<=document.querySelector('.starter-dialog').clientWidth+1));
    await page.locator('#starterManual').click();
    // A full room blocks templates without deleting current objects.
    await page.evaluate(()=>{const s=YPProjectBridge.capture();s.spec.W=3;s.spec.D=3;s.spec.stSize='custom';s.spec.stW=2.8;s.spec.stD=2.8;YPProjectBridge.restore(s);});
    const before=await page.evaluate(()=>getBoothSpec().objects.length);await page.locator('#starterOpen').click();assert.equal(await page.locator('#starterApply').isEnabled(),false);await page.locator('#starterManual').click();assert.equal(await page.evaluate(()=>getBoothSpec().objects.length),before);
    // Finishing the existing onboarding offers, but does not apply, a starter.
    await page.evaluate(()=>{YPQuickSetupBridge.open();quickSetupDraft=quickSetupDraftFromEditor();quickSetupDraft.businessCategoryId='food';quickSetupDraft.boothType='inline';quickSetupDraft.primary='#f72585';completeQuickSetup();});
    await page.locator('.starter-dialog').waitFor({state:'visible'});await page.locator('#starterManual').click();
    assert.deepEqual(errors,[]);console.log('PASS: preview, A/B preservation, cancel overwrite, locked objects, editing/undo, portable purpose, mobile, blocked room');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
