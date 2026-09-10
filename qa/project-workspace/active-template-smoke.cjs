const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Isolate test drafts from the user's browser; test state/UI without CDN rendering.
    await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
    await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
    await page.waitForFunction(()=>YPProjectWorkspace?.state().ready);
    await page.evaluate(()=>YPQuickSetupBridge.close());
    const idle=()=>page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
    assert.ok(await page.locator('#projectB').isEnabled());
    assert.equal(await page.evaluate(()=>YPProjectWorkspace.capture().variants.B),null);
    for(const [slot,api,selector,close] of [
      ['A','YPPeninsularTemplateUI','[data-penin-template]','#peninsularTemplatesClose'],
      ['B','YPCornerTemplateUI','[data-corner-template]','#cornerTemplatesClose'],
      ['A','YPIslandTemplateUI','[data-island-template]','#islandTemplatesClose'],
      ['B','YPInlineTemplateUI','button[data-template]','#inlineTemplatesClose']
    ]){
      const prior=await page.evaluate(()=>YPProjectWorkspace.capture());
      await page.locator('#project'+slot).click();await idle();
      const before=await page.evaluate(()=>YPProjectWorkspace.capture()),other=slot==='A'?'B':'A';
      assert.equal(before.active,slot);assert.deepEqual(before.variants[other],prior.variants[other]);
      if(!prior.variants[slot])assert.equal(before.variants[slot].spec.objects.length,0);
      await page.evaluate(name=>window[name].open(),api);
      assert.equal(await page.locator('#projectConfirm').isVisible(),false,'Opening a gallery does not ask confirmation');
      const choice=page.locator(selector).first();assert.equal(await choice.textContent(),'ใช้ในแบบ '+slot);
      await choice.click();await page.waitForSelector('#projectConfirm');
      assert.match(await page.locator('#projectDialogTitle').textContent(),new RegExp('แทนที่แบบ '+slot));
      assert.match(await page.locator('#projectDialogText').textContent(),new RegExp('แบบ '+other+' ไม่เปลี่ยน'));
      const unchanged=await page.evaluate(()=>YPProjectBridge.capture());
      assert.deepEqual(unchanged,before.variants[slot],'No changes before confirmation');
      await page.locator('#projectCancel').click();await idle();
      assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants),before.variants);
      await choice.click();await page.locator('#projectConfirm').click();await idle();
      await page.waitForFunction(id=>!document.querySelector(id).closest('dialog').open,close);
      const after=await page.evaluate(()=>YPProjectWorkspace.capture());
      assert.equal(after.active,slot);assert.deepEqual(after.variants[other],before.variants[other]);
      assert.notDeepEqual(after.variants[slot].spec,before.variants[slot].spec);
      assert.deepEqual((await page.evaluate(()=>YPProjectStore.readDraft())).variants,after.variants);
      assert.equal(await page.locator('#project'+slot).getAttribute('aria-pressed'),'true');
    }
    // Selecting A/B restores that design instead of changing the active template target.
    const both=await page.evaluate(()=>YPProjectWorkspace.capture().variants);
    for(const slot of ['A','B']){
      await page.locator('#project'+slot).click();await idle();
      assert.deepEqual(await page.evaluate(()=>YPProjectBridge.capture()),both[slot]);
    }
    await page.evaluate(()=>YPCornerTemplateUI.open());
    await page.locator('[data-corner-template]').first().click();
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'qa/project-workspace/active-template-confirm.png'});
    const box=await page.locator('#projectConfirm').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);
    await page.keyboard.press('Escape');await idle();
    assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants),both);
    assert.deepEqual(errors,[]);
    console.log('PASS: all four template galleries target active A/B; always confirm on apply, never on browse; cancel/Escape unchanged; inactive slot preserved; empty B selectable; persistence and mobile confirmation');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
