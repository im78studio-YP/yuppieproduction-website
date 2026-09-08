const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const open=()=>page.evaluate(()=>YPPeninsularTemplateUI.open());
  const settled=()=>page.waitForFunction(()=>!YPProjectWorkspace.state().busy&&document.querySelector('#peninsularCards').closest('dialog').getAttribute('aria-busy')!=='true');
  const code=()=>page.locator('#peninsularFeedback').getAttribute('data-code');
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  await page.evaluate(()=>{YPQuickSetupBridge.close();YPProjectBridge.restore(YPPeninsularTemplateBridge.snapshot('penin-natural'));});
  await open();assert.equal(await page.locator('#peninsularCards a').count(),0);
  await page.locator('[data-penin-template=penin-connect]').click();await settled();
  assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'B');
  await open();await page.locator('[data-penin-template=penin-adventure]').click();
  assert.equal(await page.evaluate(async()=> (await YPProjectWorkspace.useTemplate({detailed:true})).code),'busy');
  await page.locator('#projectCancel').click();await settled();assert.equal(await code(),'cancelled');
  assert.match(await page.locator('#peninsularTemplateStatus').textContent(),/ยกเลิก/);
  assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'B');
  await page.locator('#peninsularTemplatesClose').click();await open();
  assert.equal(await page.locator('#peninsularTemplateStatus').textContent(),'');
  // Inject a build failure, verifying the real exception reaches the visible dialog.
  await page.evaluate(()=>{window.originalTemplateBuild=YPPeninsularTemplates.build;YPPeninsularTemplates.build=()=>{throw new Error('TEST missing catalog');};});
  await page.locator('[data-penin-template=penin-adventure]').click();await page.locator('#projectConfirm').click();await settled();
  assert.equal(await code(),'error');assert.match(await page.locator('#peninsularTemplateStatus').textContent(),/TEST missing catalog/);
  await page.evaluate(()=>{YPPeninsularTemplates.build=window.originalTemplateBuild;});
  await page.locator('#peninsularRetry').click();await page.locator('#projectConfirm').click();await settled();
  assert.equal(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A.spec.boothTemplate.id),'penin-adventure');
  // Loading/busy UI states are transient: retry must recheck readiness.
  await page.evaluate(()=>{window.originalWorkspaceState=YPProjectWorkspace.state;YPProjectWorkspace.state=()=>({ready:false});});
  await open();assert.equal(await code(),'not-ready');
  await page.evaluate(()=>{YPProjectWorkspace.state=()=>({ready:true,busy:true});});
  await page.locator('#peninsularRetry').click();assert.equal(await code(),'busy');
  await page.evaluate(()=>{YPProjectWorkspace.state=window.originalWorkspaceState;});
  await page.locator('#peninsularRetry').click();assert.equal(await page.locator('#peninsularTemplateStatus').textContent(),'');
  // Real IndexedDB draft on reload: do not mutate until the user chooses.
  const before=await page.evaluate(()=>YPProjectWorkspace.capture());
  await page.reload();await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);await open();
  assert.equal(await code(),'pending-draft');
  await page.locator('[data-penin-template=penin-blue-pavilion]').click();await settled();assert.equal(await code(),'pending-draft');
  await page.locator('#peninsularKeepCurrent').click();await page.locator('#projectCancel').click();await settled();
  assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().pendingDraft),true);
  assert.equal(await page.locator('#peninsularRecoverDraft').isVisible(),true);
  await page.locator('#peninsularRecoverDraft').click();await settled();assert.equal(await code(),'ready');
  assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().pendingDraft),false);
  const after=await page.evaluate(()=>YPProjectWorkspace.capture());
  assert.equal(after.active,before.active);assert.equal(after.variants.A.spec.boothTemplate.id,before.variants.A.spec.boothTemplate.id);assert.equal(after.variants.B.spec.boothTemplate.id,before.variants.B.spec.boothTemplate.id);
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.locator('#peninsularFeedback').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  // The deliberate replace-draft route still requires confirmation.
  await page.reload();await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);await open();
  await page.locator('#peninsularKeepCurrent').click();await page.locator('#projectConfirm').click();await settled();
  assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().pendingDraft),false);assert.equal(await code(),'ready');
  assert.deepEqual(errors,[]);
  console.log('PASS: no gallery downloads; successful apply; cancelled/error/busy/loading feedback; retry; stale message cleared; real draft recovery and confirmed replacement; mobile; no page errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
