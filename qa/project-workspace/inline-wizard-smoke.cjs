const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.WIZARD_URL||'http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPInlineWizard&&YPProjectWorkspace.state().ready);
    assert.equal(await page.evaluate(()=>getBoothSpec().logo===YPDefaultLogo.data),true);
    await page.locator('#releaseStart').click();await page.locator('#quickBusinessNext').click();
    assert.equal(await page.locator('#quickTemplateChoices [role=radio]').count(),await page.evaluate(()=>YPInlineTemplates.templates.length+1));
    assert.equal(await page.locator('#quickTemplateChoices [data-value=manual]').getAttribute('aria-checked'),'true');
    const before=await page.evaluate(()=>({objects:getBoothSpec().objects,primary:getBoothSpec().primary,stSize:getBoothSpec().stSize}));
    await page.locator('#quickTemplateChoices [data-value=retail]').click();
    assert.deepEqual(await page.evaluate(()=>({objects:getBoothSpec().objects,primary:getBoothSpec().primary,stSize:getBoothSpec().stSize})),before);
    await page.locator('#quickStepLayout .quick-step-scroll').evaluate(e=>e.scrollTo(0,160));
    await page.screenshot({path:'qa/project-workspace/inline-wizard-desktop.png'});
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/project-workspace/inline-wizard-mobile.png'});
    assert.ok(await page.locator('#quickInlineTemplates').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
    await page.setViewportSize({width:1440,height:1050});
    // Changing type clears the template and restores pre-template settings.
    await page.locator('#quickBoothTypes [data-value=corner]').click();assert.equal(await page.locator('#quickInlineTemplates').isVisible(),false);
    assert.equal(await page.evaluate(()=>YPQuickSetupBridge.getState().draft.templateId),null);
    await page.locator('#quickBoothTypes [data-value=inline]').click();await page.locator('#quickTemplateChoices [data-value=retail]').click();
    await page.locator('#quickLayoutNext').click();assert.equal((await page.locator('#quickBrandHex').inputValue()).toUpperCase(),'#633C63');
    await page.locator('#quickBrandHex').fill('#156F80');await page.locator('#quickBrandNext').click();
    assert.equal(await page.locator('#quickFloorOptions [data-value=tile]').getAttribute('aria-checked'),'true');
    assert.equal(await page.locator('#quickTileOptions [data-value=woodD]').getAttribute('aria-checked'),'true');
    await page.locator('#quickTileOptions [data-value=woodL]').click();await page.locator('#quickFloorNext').click();
    assert.equal(await page.locator('#quickRoomOptions [data-value=storage]').getAttribute('aria-checked'),'true');
    await page.locator('#quickRoomFinish').click();await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open&&!YPProjectWorkspace.state().busy);
    const result=await page.evaluate(()=>YPProjectWorkspace.capture());assert.equal(result.active,'A');assert.equal(result.variants.B,null);
    assert.equal(result.variants.A.spec.inlineTemplate.id,'retail');assert.equal(result.variants.A.spec.tile,'woodL');assert.equal(result.variants.A.spec.primary.toUpperCase(),'#156F80');assert.equal(result.variants.A.spec.stSize,'a');assert.equal(result.variants.A.spec.stDoor,'left');
    assert.equal(result.variants.A.spec.logoColor,'#ee3c96');assert.equal(await page.locator('.starter-dialog').count(),0);
    // Submenu follows the real editor type, including restore/sync.
    await page.evaluate(()=>selectBoothType('corner'));assert.equal(await page.locator('#inlineTemplateSubmenu').evaluate(e=>e.hidden),true);
    await page.evaluate(()=>selectBoothType('inline'));assert.equal(await page.locator('#inlineTemplateSubmenu').evaluate(e=>e.hidden),false);
    // Reopening Wizard must preserve the edited project as A, create B only on Finish.
    await page.locator('#projectWizard').click();await page.locator('#releaseStart').click();await page.locator('#quickBusinessNext').click();await page.locator('#quickTemplateChoices [data-value=meeting]').click();
    await page.locator('#quickLayoutNext').click();await page.locator('#quickBrandNext').click();await page.locator('#quickFloorNext').click();
    const savedA=await page.evaluate(()=>YPProjectWorkspace.capture().variants.A);
    await page.locator('#quickRoomFinish').click();await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open&&!YPProjectWorkspace.state().busy);
    const second=await page.evaluate(()=>YPProjectWorkspace.capture());assert.equal(second.active,'B');assert.deepEqual(second.variants.A,savedA);assert.equal(second.variants.B.spec.inlineTemplate.id,'meeting');
    // Cancelled Wizard never replaces existing logo, objects, or style.
    const shape=await page.evaluate(()=>{const s=getBoothSpec();return {logo:s.logo,objects:s.objects,primary:s.primary};});
    await page.evaluate(()=>YPQuickSetupBridge.open());await page.locator('#releaseStart').click();await page.locator('#quickBusinessNext').click();await page.locator('#quickTemplateChoices [data-value=gallery]').click();await page.locator('#releaseClose').click();
    assert.deepEqual(await page.evaluate(()=>{const s=getBoothSpec();return {logo:s.logo,objects:s.objects,primary:s.primary};}),shape);
    // Saved custom/empty logos are not replaced by the new default on restore.
    await page.evaluate(()=>{const s=YPProjectBridge.capture();s.spec.logo=null;s.spec.logoAcc=null;s.spec.logoHasTransparency=null;YPProjectBridge.restore(s);});assert.equal(await page.evaluate(()=>getBoothSpec().logo),null);
    assert.deepEqual(errors,[]);console.log('PASS: Wizard selection, type reset, no early mutation, color/floor/storage carry, fresh A, subsequent B, cancel, logo persistence, mobile');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
