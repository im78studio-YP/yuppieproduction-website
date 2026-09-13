const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const art={name:'MY-BRAND.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240"><circle cx="110" cy="120" r="96" fill="#147ddd"/><path d="M250 30H590V210H250Z" fill="#ff4e98"/></svg>')};
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.YPWizardV2&&YPProjectWorkspace.state().ready,null,{timeout:60000});
 const ready=()=>p.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});
 const upload=async(file=art)=>{await p.locator('#wizard-logo-file').setInputFiles(file);await p.waitForFunction(()=>!document.getElementById('wizard-logo-status').textContent.includes('กำลังตรวจ'));};
 const start=async()=>{await p.locator('#wizard-start-new').click();if(await p.locator('#quickBusinessNext').isDisabled())await p.locator('#quickBusinessGroups [role=radio]').first().click();await p.locator('#quickBusinessNext').click();await p.locator('#quickBoothTypes [data-value=inline]').click();await p.locator('#quickLayoutNext').click();await p.locator('#wizard-template-cards [data-template=soft-wave]').click();await p.locator('#wizard-template-next').click();await ready();};
 await start();const before=await p.evaluate(()=>YPWizardModel.designSignature(YPProjectBridge.capture().spec)),base=await p.evaluate(()=>YPWizardV2.result());
 await upload();await ready();
 const draft=await p.evaluate(()=>YPWizardV2.result());assert.notEqual(draft.spec.logo,base.spec.logo);
 assert.equal(await p.evaluate(()=>YPWizardModel.designSignature(YPProjectBridge.capture().spec)),before,'editor must remain untouched');
 const roles=await p.evaluate(()=>YPWizardV2.result().spec.objects.map(o=>YPLogoReplacement.isLogo(o)));
 draft.spec.objects.forEach((o,i)=>{assert.deepEqual(o.position,base.spec.objects[i].position);assert.deepEqual(o.size,base.spec.objects[i].size);if(roles[i])assert.equal(o.appearance.textureName,'MY-BRAND.svg');else assert.deepEqual(o,base.spec.objects[i]);});
 const frame=p.frames().find(f=>f.url().includes('comparePreview=1'));assert.ok(frame);assert.equal(await frame.evaluate(()=>S.logo),draft.spec.logo,'3D preview uses the uploaded logo');
 await p.screenshot({path:'qa/project-workspace/wizard-logo-customize.png'});
 // Backtracking to another template retains the upload; reset restores its original logo.
 await p.locator('[data-quick-step=customize] .quick-step-actions button').first().click();await p.locator('#wizard-template-cards [data-template]').last().click();await p.locator('#wizard-template-next').click();await ready();assert.equal(await p.evaluate(()=>YPWizardV2.result().spec.logo),draft.spec.logo);
 await p.locator('#wizard-logo-reset').click();await ready();assert.equal(await p.locator('#wizard-logo-reset').isVisible(),false);assert.notEqual(await p.evaluate(()=>YPWizardV2.result().spec.logo),draft.spec.logo);
 // Opaque artwork cannot pass the step until explicitly acknowledged.
 await upload({name:'opaque.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><path d="M0 0H100V50H0Z" fill="white"/><circle cx="50" cy="25" r="15" fill="red"/></svg>')});assert.equal(await p.locator('#wizard-logo-warning').isVisible(),true);assert.equal(await p.locator('#wizard-customize-next').isDisabled(),true);
 await p.locator('#wizard-logo-opaque').check();await ready();assert.equal(await p.locator('#wizard-customize-next').isDisabled(),false);
 await upload();await ready();await p.setViewportSize({width:390,height:844});await p.screenshot({path:'qa/project-workspace/wizard-logo-mobile.png'});assert.ok(await p.locator('#mRelease .release-sheet').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
 await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>YPWizardModel.designSignature(YPProjectBridge.capture().spec)),before,'cancel discards upload');
 await p.setViewportSize({width:1440,height:1000});await p.locator('#projectWizard').click();await start();assert.equal(await p.locator('#wizard-logo-reset').isVisible(),false,'new session must not retain cancelled upload');await upload();await ready();
 const expected=await p.evaluate(()=>YPWizardV2.result());await p.locator('#wizard-customize-next').click();await ready();assert.match(await p.locator('#wizard-review-summary').textContent(),/MY-BRAND.svg/);
 await p.locator('#wizard-target').selectOption('B');await p.locator('#wizard-finish').click();await p.locator('#projectConfirm').click();await p.waitForFunction(()=>!YPQuickSetupBridge.getState().open,null,{timeout:60000});
 assert.equal(await p.evaluate(()=>S.logo),expected.spec.logo);assert.equal(await p.evaluate(()=>YPProjectWorkspace.state().active),'B');
 assert.equal(await p.evaluate(()=>YPWizardModel.designSignature(YPProjectWorkspace.capture().variants.A.spec)),before,'other variant is unchanged');
 assert.ok(await p.evaluate(()=>{YPProjectStore.validateSpec(S);return S.objects.filter(YPLogoReplacement.isLogo).every(o=>o.appearance.textureName==='MY-BRAND.svg');}));
 assert.deepEqual(errors,[]);console.log('PASS Wizard upload: detached draft/3D preview, retain/reset/backtrack, opaque guard, mobile, cancel/session reset, review, final B with logo and A preserved');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
