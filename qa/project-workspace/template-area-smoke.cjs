const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
  await page.waitForFunction(()=>YPProjectWorkspace?.state().ready);
  await page.evaluate(async()=>{YPQuickSetupBridge.close();await loadThreeRenderer();const s=YPProjectBridge.capture();s.spec.W=6;s.spec.D=6;YPProjectBridge.restore(s);});
  const before=await page.evaluate(()=>YPProjectWorkspace.capture());
  const request=()=>page.evaluate(()=>{window.areaResult=null;YPProjectWorkspace.useTemplate({name:'Adventure Gateway',makeSnapshot:()=>YPPeninsularTemplateBridge.snapshot('penin-adventure'),detailed:true}).then(r=>window.areaResult=r);});
  await request();await page.locator('#templateAreaChoice').waitFor();
  assert.equal(await page.locator('#templateAreaChoice').inputValue(),'current');
  for(const width of [320,768,1440]){await page.setViewportSize({width,height:1000});const box=await page.locator('#templateAreaChoice').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);}
  await page.locator('#projectCancel').click();await page.waitForFunction(()=>areaResult);
  assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants),before.variants);
  await request();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>areaResult);
  assert.equal(await page.evaluate(()=>areaResult.ok),true);
  const parts=await page.evaluate(()=>{const s=YPProjectBridge.capture().spec;return {W:s.W,D:s.D,objects:s.objects.map(o=>({id:o.id,position:o.position,size:o.size}))};});
  assert.equal(parts.W,6);assert.equal(parts.D,6);
  const original=await page.evaluate(()=>YPPeninsularTemplateBridge.snapshot('penin-adventure').spec.objects.map(o=>({id:o.id,position:o.position,size:o.size})));
  assert.deepEqual(parts.objects,original);
  // Restore an original 6x3 template, then expand through the actual size preset.
  await request();await page.locator('#templateAreaChoice').selectOption('original');await page.locator('#projectConfirm').click();await page.waitForFunction(()=>areaResult);
  assert.equal(await page.evaluate(()=>getBoothSpec().D),3);
  await page.evaluate(()=>document.querySelector('#oPreset button[data-k="6x6"]').click());
  assert.equal(await page.evaluate(()=>getBoothSpec().D),6);
  assert.deepEqual(await page.evaluate(()=>getBoothSpec().objects.map(o=>({id:o.id,position:o.position,size:o.size}))),original);
  await page.screenshot({path:'qa/project-workspace/template-area-6x6.png'});
  await page.locator('#projectB').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
  await request();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>areaResult);
  assert.equal(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A.spec.D),6);
  const saved=await page.evaluate(()=>YPProjectWorkspace.capture());
  await page.reload();await page.waitForFunction(()=>YPProjectWorkspace?.state().ready);await page.locator('#projectEntryRecover').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().pendingDraft);
  assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants),saved.variants);
  assert.deepEqual(errors,[]);console.log('PASS: template area choice, cancellation, 6x6, original, furniture, A/B, recovery and responsive control');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
