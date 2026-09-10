const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Isolated browser storage; CDN-free state/UI regression, not a 3D rendering test.
    await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
    const url='http://127.0.0.1:4173/yp-web-ai/index.html';
    const ready=()=>page.waitForFunction(()=>YPProjectWorkspace?.state().ready);
    const idle=()=>page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
    await page.goto(url);await ready();
    assert.equal(await page.locator('#projectEntryDialog').isVisible(),false);
    await page.evaluate(async()=>{
      YPQuickSetupBridge.close();addCatalogObject('counter-standard');
      const snapshot=YPProjectBridge.capture();snapshot.spec.brand='SAVED CUSTOMER WORK';
      await YPProjectStore.writeDraft(YPProjectStore.create(snapshot,'Saved project'));
    });
    await page.reload();await ready();
    assert.ok(await page.locator('#projectEntryDialog').isVisible());
    const saved=await page.evaluate(()=>YPProjectStore.readDraft());
    await page.keyboard.press('Escape');await page.keyboard.press('Control+s');
    assert.ok(await page.locator('#projectEntryDialog').isVisible());
    assert.deepEqual(await page.evaluate(()=>YPProjectStore.readDraft()),saved);
    for(const width of [390,768,1440]){
      await page.setViewportSize({width,height:900});
      await page.locator('#projectEntryRecover').focus();await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.id),'projectEntryNew');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.id),'projectEntryRecover');
      const box=await page.locator('#projectEntryDialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);
      await page.screenshot({path:`qa/project-workspace/entry-flow-${width}.png`});
    }
    await page.locator('#projectEntryNew').click();await page.locator('#projectCancel').click();await idle();
    assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().pendingDraft),true);
    assert.deepEqual(await page.evaluate(()=>YPProjectStore.readDraft()),saved);
    // A failed restore must leave the entry gate and the old draft intact.
    await page.evaluate(()=>{window.savedRestore=YPProjectBridge.restore;YPProjectBridge.restore=()=>{throw new Error('test restore failure');};});
    await page.locator('#projectEntryRecover').click();await idle();
    assert.ok(await page.locator('#projectEntryDialog').isVisible());
    assert.deepEqual(await page.evaluate(()=>YPProjectStore.readDraft()),saved);
    await page.evaluate(()=>{YPProjectBridge.restore=window.savedRestore;});
    // A template request made before recovery waits, then opens automatically once.
    await page.evaluate(()=>{void YPPeninsularTemplateUI.open();});
    assert.equal(await page.locator('#peninsularCards').isVisible(),false);
    await page.locator('#projectEntryRecover').click();await idle();
    await page.waitForSelector('#peninsularCards');
    assert.equal(await page.locator('#projectEntryDialog').isVisible(),false);
    assert.equal(await page.locator('#peninsularFeedback').isVisible(),false);
    assert.equal(await page.locator('[data-penin-template]').first().textContent(),'ใช้ในแบบ A');
    const priorA=await page.evaluate(()=>YPProjectWorkspace.capture().variants.A);
    await page.locator('[data-penin-template]').first().click();await page.locator('#projectConfirm').click();await idle();
    assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'A');
    assert.notDeepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A),priorA);
    assert.equal(await page.locator('#peninsularCards').isVisible(),false);
    await page.locator('#projectB').click();await idle();
    // All galleries show the same destination policy; no duplicate draft choices.
    for(const [api,selector,close] of [
      ['YPInlineTemplateUI','button[data-template]','#inlineTemplatesClose'],
      ['YPCornerTemplateUI','[data-corner-template]','#cornerTemplatesClose'],
      ['YPIslandTemplateUI','[data-island-template]','#islandTemplatesClose']
    ]){
      await page.evaluate(name=>window[name].open(),api);
      assert.equal(await page.locator(selector).first().textContent(),'ใช้ในแบบ B');
      assert.equal(await page.getByRole('button',{name:'ใช้แบบปัจจุบัน',exact:true}).count(),0);
      await page.locator(close).click();
    }
    // Occupied destination asks once and cancellation preserves both slots.
    await page.evaluate(()=>YPPeninsularTemplateUI.open());
    const both=await page.evaluate(()=>YPProjectWorkspace.capture().variants);
    await page.locator('[data-penin-template]').nth(1).click();
    await page.locator('#projectCancel').click();await idle();
    assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants),both);
    await page.locator('#peninsularTemplatesClose').click();
    // Deep link waits behind recovery, then continues the chosen template itself.
    await page.goto(url+'?useTemplate=penin-connect');await ready();
    assert.ok(await page.locator('#projectEntryDialog').isVisible());
    assert.equal(await page.locator('#templateEntryDialog').isVisible(),false);
    await page.locator('#projectEntryRecover').click();
    await page.waitForSelector('#projectConfirm');
    assert.match(await page.locator('#projectDialogTitle').textContent(),/แบบ B/);
    await page.locator('#projectConfirm').click();await idle();
    await page.waitForFunction(()=>YPProjectWorkspace.state().active==='B');
    assert.equal(await page.locator('#templateEntryDialog').isVisible(),false);
    assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A),both.A);
    // Fresh start is a real reset of the pending project, then opens business setup.
    await page.reload();await ready();
    await page.locator('#projectEntryNew').click();await page.locator('#projectConfirm').click();await idle();
    await page.waitForFunction(()=>YPQuickSetupBridge.getState().step==='business');
    const fresh=await page.evaluate(()=>YPProjectWorkspace.capture());
    assert.equal(fresh.active,'A');assert.equal(fresh.variants.B,null);assert.equal(fresh.variants.A.spec.objects.length,0);
    assert.equal(await page.locator('#projectEntryDialog').isVisible(),false);
    assert.deepEqual(errors,[]);
    console.log('PASS: startup gate, cancel/Escape/keyboard trap, restore failure safety, recover-and-continue, all gallery labels, A/B preservation, overwrite cancel, deep-link continuation, true fresh reset, mobile/tablet');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
