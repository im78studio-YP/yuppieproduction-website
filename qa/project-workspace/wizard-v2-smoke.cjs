const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.YPWizardV2&&YPProjectWorkspace.state().ready&&!YPProjectWorkspace.state().pendingDraft,null,{timeout:60000});
 console.log('BOOT',await page.locator('#mRelease').innerText());
 await page.locator('#wizard-start-new').click();
 if(await page.locator('#quickBusinessNext').isDisabled())await page.locator('#quickBusinessGroups [role=radio]').first().click();
 await page.locator('#quickBusinessNext').click();await page.locator('#quickBoothTypes [data-value=inline]').click();
 await page.locator('#wizard-depth').fill('6');await page.locator('#wizard-height').fill('3.8');
 await page.screenshot({path:'qa/project-workspace/wizard-v2-area.png'});
 await page.locator('#quickLayoutNext').click();await page.locator('#wizard-template-cards [data-template=soft-wave]').click();
 console.log('TEMPLATE',await page.locator('#wizard-template-note').innerText());assert.match(await page.locator('#wizard-template-note').innerText(),/6 × 6/);
 const original=await page.evaluate(()=>JSON.stringify(YPProjectBridge.capture().spec));
 await page.locator('#wizard-template-next').click();
 try{await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:60000});}catch(e){console.log('PREVIEW FAILURE',await page.locator('#wizard-preview-status').innerText(),await page.locator('#wizard-preview-frame').getAttribute('src'));for(const f of page.frames())console.log('FRAME',f.url(),await f.evaluate(()=>({ready:!!window.YPProjectBridge,renderer:typeof threeRenderer!=='undefined'&&!!threeRenderer,body:document.body?.innerText.slice(-700)})).catch(err=>err.message));await page.screenshot({path:'qa/project-workspace/wizard-v2-failed.png'});throw e;}
 console.log('PREVIEW',await page.locator('#wizard-preview-status').innerText());
 assert.equal(await page.evaluate(()=>JSON.stringify(YPProjectBridge.capture().spec)),original);
 await page.screenshot({path:'qa/project-workspace/wizard-v2-customize.png'});
 await page.locator('#wizard-customize-next').click();await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});
 await page.screenshot({path:'qa/project-workspace/wizard-v2-review.png'});
 console.log('REVIEW',await page.locator('#wizard-review-summary').innerText());
 await page.locator('#wizard-target').selectOption('B');await page.locator('#wizard-finish').click();await page.locator('#projectCancel').click();
 assert.equal(await page.evaluate(()=>JSON.stringify(YPProjectBridge.capture().spec)),original);assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'A');
 await page.locator('#wizard-finish').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open);
 const applied=await page.evaluate(()=>({state:YPProjectWorkspace.state(),s:YPProjectBridge.capture().spec}));assert.equal(applied.state.active,'B');assert.equal(applied.s.W,6);assert.equal(applied.s.D,6);assert.equal(applied.s.H,3.8);assert.equal(applied.s.stSize,'none');assert.ok(applied.s.objects.length>30);
 assert.equal(await page.evaluate(()=>JSON.stringify(YPProjectWorkspace.capture().variants.A.spec)),original);
 await page.locator('#projectWizard').click();await page.locator('#wizard-edit-current').click();await page.locator('#quickBusinessNext').click();assert.equal(await page.locator('#wizard-depth').inputValue(),'6');assert.equal(await page.locator('#wizard-height').inputValue(),'3.8');
 await page.locator('#wizard-width').fill('');assert.equal(await page.locator('#quickLayoutNext').isDisabled(),true);await page.locator('#wizard-width').fill('6');
 await page.locator('#quickLayoutNext').click();assert.equal(await page.locator('#wizard-template-cards [data-template=current]').getAttribute('aria-pressed'),'true');
 await page.locator('#wizard-template-next').click();await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});
 await page.locator('summary').filter({hasText:'ธีมสีบูธ'}).click();await page.locator('#wizard-theme-2').click();await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});
 assert.equal(await page.evaluate(()=>YPWizardV2.result().spec.boothColorTheme.keepGraphics),true);assert.equal(await page.evaluate(()=>YPWizardV2.result().spec.boothColorTheme.keepWood),true);
 await page.locator('#wizard-floor-details summary').click();await page.locator('#quickTileOptions [data-value=woodD]').click();await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});assert.equal(await page.evaluate(()=>YPWizardV2.result().spec.tile),'woodD');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/project-workspace/wizard-v2-mobile.png'});assert.ok(await page.locator('#mRelease .release-sheet').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>YPQuickSetupBridge.getState().open),false);assert.equal(await page.evaluate(()=>YPProjectBridge.capture().spec.tile),applied.s.tile);
 await page.setViewportSize({width:1440,height:1000});
 // New/blank must actually clear the old template; returning through the flow
 // must not reset the chosen dimensions, and corner side is retained.
 await page.locator('#projectWizard').click();await page.locator('#wizard-start-new').click();await page.locator('#quickBusinessNext').click();
 await page.locator('#quickBoothTypes [data-value=corner]').click();await page.locator('#quickCornerSides [data-value=left]').click();await page.locator('#wizard-width').fill('9');await page.locator('#quickLayoutNext').click();
 await page.locator('#wizard-filter-exact').click();assert.match(await page.locator('#wizard-template-note').innerText(),/ไม่มีเทมเพลต/);await page.locator('#wizard-filter-all').click();
 await page.locator('#wizard-template-next').click();assert.equal(await page.evaluate(()=>YPWizardV2.result().spec.objects.length),0);assert.equal(await page.evaluate(()=>YPWizardV2.result().spec.cornerSide),'left');
 await page.locator('[data-quick-step=customize] .quick-step-actions button').first().click();await page.locator('[data-quick-step=template] .quick-step-actions button').first().click();assert.equal(await page.locator('#wizard-width').inputValue(),'9');
 await page.locator('#quickLayoutNext').click();await page.locator('#wizard-template-next').click();await page.locator('#wizard-customize-next').click();await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});
 // Deliberately alter the actual editor under this isolated test session: stale
 // Wizard content must never overwrite it, even if the preview is ready.
 await page.evaluate(()=>{S.brand='newer edit';sync();});await page.locator('#wizard-finish').click();await page.waitForFunction(()=>document.getElementById('wizard-error').textContent.includes('เปลี่ยนไป'));
 assert.equal(await page.evaluate(()=>S.brand),'newer edit');assert.ok(await page.evaluate(()=>S.objects.length)>30);await page.keyboard.press('Escape');
 await page.locator('#projectWizard').click();await page.locator('#wizard-start-new').click();await page.locator('#quickBusinessNext').click();await page.locator('#quickLayoutNext').click();await page.locator('#wizard-template-next').click();await page.locator('#wizard-customize-next').click();await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});
 await page.locator('#wizard-finish').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open);assert.equal(await page.evaluate(()=>S.objects.length),0);
 assert.deepEqual(errors,[]);console.log('PASS five steps, detached real preview, exact area, custom room retained, A/B commit and cancel, reopen current dimensions, validation, theme and floor preview, mobile, Escape, backtracking, corner, empty filter, stale guard, genuinely blank booth');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
