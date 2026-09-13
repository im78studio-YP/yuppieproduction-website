const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 let release;const gate=new Promise(resolve=>release=resolve);
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Hold the real renderer's CDN imports until after the initial snapshot.
  // No fake renderer, no simulated logo bounds and no writes to a user tab.
  await page.route('https://cdn.jsdelivr.net/**',async route=>{await gate;await route.continue();});
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPWizardV2&&YPProjectWorkspace.state().ready);
  await page.locator('#wizard-start-new').click();
  const original=await page.evaluate(()=>YPProjectBridge.capture().spec);
  assert.equal(original.logoVisibleBounds,null);
  release();
  await page.locator('#quickBusinessNext').click();await page.locator('#quickLayoutNext').click();
  await page.locator('#wizard-template-cards [data-template=soft-wave]').click();await page.locator('#wizard-template-next').click();
  await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});
  await page.locator('summary').filter({hasText:'ธีมสีบูธ'}).click();await page.locator('#wizard-theme-0').click();
  await page.locator('#wizard-floor-details summary').click();await page.locator('#quickFloorOptions [data-value=carpet]').click();await page.locator('#quickCarpetOptions [data-value=grey]').click();
  await page.locator('summary').filter({hasText:'ห้องเก็บของ'}).click();await page.locator('#wizard-room').selectOption('add');
  await page.locator('#wizard-customize-next').click();await page.waitForFunction(()=>YPWizardV2.getState().previewReady,null,{timeout:90000});
  await page.waitForFunction(()=>S.logoVisibleBounds!==null);
  const settled=await page.evaluate(()=>YPProjectBridge.capture().spec);
  assert.notEqual(JSON.stringify(original),JSON.stringify(settled),'the old full JSON guard must reject this actual delayed-load reproduction');
  assert.equal(await page.evaluate(({a,b})=>YPWizardModel.designSignature(a)===YPWizardModel.designSignature(b),{a:original,b:settled}),true);
  console.log('PASS real delayed logo/3D changed derived data only; design signature unchanged');
  await page.locator('#wizard-target').selectOption('B');await page.locator('#wizard-finish').click();await page.locator('#projectConfirm').waitFor({state:'visible'});
  assert.equal(await page.locator('#wizard-error').innerText(),'');
  await page.screenshot({path:'qa/project-workspace/wizard-stale-guard-confirm.png'});
  await page.locator('#projectCancel').click();assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'A');
  await page.locator('#wizard-finish').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open);
  const applied=await page.evaluate(()=>({active:YPProjectWorkspace.state().active,s:YPProjectBridge.capture().spec,a:YPProjectWorkspace.capture().variants.A.spec}));
  assert.equal(applied.active,'B');assert.equal(applied.s.floor,'carpet');assert.equal(applied.s.carpet,'grey');assert.equal(applied.s.stSize,'a');assert.equal(applied.s.boothColorTheme.name,'เขียวธรรมชาติ');assert.ok(applied.s.objects.length>30);
  assert.equal(await page.evaluate(({a,b})=>YPWizardModel.designSignature(a)===YPWizardModel.designSignature(b),{a:original,b:applied.a}),true);
  console.log('PASS cancel and confirm exact user flow; other slot preserved');
  // Exercise the guard after native confirmation, not only before it.
  await page.evaluate(()=>{window.guardSnapshot=YPProjectBridge.capture();window.guardReply=null;YPProjectWorkspace.useWizard({makeSnapshot:()=>guardSnapshot,name:'guard test',target:'B',expectedActive:'B',expectedDesign:YPWizardModel.designSignature(guardSnapshot.spec)}).then(r=>guardReply=r);});
  await page.locator('#projectConfirm').waitFor({state:'visible'});await page.evaluate(()=>{S.brand='newer authored edit';sync();});await page.locator('#projectConfirm').click();await page.waitForFunction(()=>window.guardReply!==null);
  assert.equal(await page.evaluate(()=>guardReply.ok),false);assert.match(await page.evaluate(()=>guardReply.message),/เปลี่ยนระหว่างยืนยัน/);assert.equal(await page.evaluate(()=>S.brand),'newer authored edit');
  const mismatch=await page.evaluate(()=>YPProjectWorkspace.useWizard({makeSnapshot:()=>YPProjectBridge.capture(),name:'wrong slot',target:'B',expectedActive:'A',expectedDesign:YPWizardModel.designSignature(YPProjectBridge.capture().spec)}));assert.equal(mismatch.ok,false);
  assert.deepEqual(errors,[]);console.log('PASS real edits during confirmation and active-slot mismatch remain blocked');
 }finally{release();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
