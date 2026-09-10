const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  // A new browser context keeps all test drafts separate from the customer's work.
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const no3D=process.env.RESET_NO_3D==='1';
    if(no3D)await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
    await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
    await page.evaluate(()=>YPQuickSetupBridge.close());
    if(!no3D){
      await page.evaluate(()=>loadThreeRenderer().catch(error=>{throw new Error('Renderer: '+error.message);}));
      await page.waitForSelector('.three-tools');
    }
    assert.equal(await page.locator('.three-tools .reset').count(),0);
    assert.equal(await page.locator('#projectKeepCurrent').count(),0);
    assert.ok(await page.locator('.vtop #projectReset').isVisible());
    assert.equal(await page.locator('#projectReset').textContent(),'เริ่มใหม่');
    assert.equal(await page.locator('#tagSize + #projectReset').count(),1);
    assert.equal(await page.locator('.project-recovery').isVisible(),false);
    await page.evaluate(async()=>{
      const a=YPProjectBridge.capture();a.spec.brand='KEEP A';a.spec.primary='#123456';
      YPProjectBridge.restore(a);
      addCatalogObject('counter-standard');
      await YPProjectWorkspace.useStarter({makeSnapshot:()=>{
        const b=YPProjectBridge.capture();b.spec.brand='RESET B';b.spec.W=9;b.spec.D=6;
        b.spec.primary='#654321';b.spec.templateId='test-reset';b.spec.placementSnap=false;
        b.spec.floor='tile';b.spec.wallCol='black';b.spec.logo=null;b.spec.lights=false;
        return b;
      }});
    });
    const before=await page.evaluate(()=>YPProjectWorkspace.capture());
    assert.equal(before.active,'B');
    assert.ok(before.variants.B.spec.objects.length>0);
    await page.locator('#projectReset').click();await page.locator('#projectCancel').click();
    await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
    assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants),before.variants);
    await page.locator('#projectReset').click();await page.locator('#projectConfirm').click();
    await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
    const check=await page.evaluate(async()=>({
      current:YPProjectWorkspace.capture(),draft:await YPProjectStore.readDraft(),
      initial:JSON.parse(INITIAL_BOOTH_SPEC_JSON),past:objectEditor.past.length,future:objectEditor.future.length,
      grid:[viewGridVisible,wallGridVisible],view:threeRenderer?.currentView
    }));
    assert.equal(check.current.active,'B');
    assert.deepEqual(check.current.variants.A,before.variants.A);
    for(const key of ['W','D','H','brand','primary','type','cat','objects','logo','placementSnap','view','floor','wallCol','lights']){
      assert.deepEqual(check.current.variants.B.spec[key],check.initial[key],key);
    }
    assert.equal(check.current.variants.B.spec.templateId,undefined);
    assert.deepEqual(check.draft.variants,check.current.variants);
    assert.deepEqual(check.grid,[false,false]);if(!no3D)assert.equal(check.view,'perspective');
    assert.equal(check.past,0);assert.equal(check.future,0);
    assert.ok(await page.locator('#projectReset').isVisible());
    // Pending recovery requires explicit confirmation before replacing the draft.
    await page.reload();await page.waitForFunction(()=>YPProjectWorkspace?.state().ready);
    assert.ok(await page.locator('#projectEntryRecover').isVisible());
    await page.locator('#projectEntryNew').click();await page.locator('#projectCancel').click();
    await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
    assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().pendingDraft),true);
    await page.locator('#projectEntryNew').click();await page.locator('#projectConfirm').click();
    await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
    assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().pendingDraft),false);
    assert.equal(await page.locator('#projectRecover').isVisible(),false);
    await page.evaluate(()=>YPQuickSetupBridge.close());
    for(const width of [320,390,768,1440]){
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.locator('#projectReset').isVisible());
      const box=await page.locator('#projectReset').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);
      const viewer=await page.locator('.vtop').boundingBox();assert.ok(box.x+box.width<=viewer.x+viewer.width+.5,'button stays inside viewer');
    }
    await page.screenshot({path:'qa/project-workspace/reset-fixed.png'});
    assert.deepEqual(errors,[]);
    console.log('PASS: relocated Reset, cancel unchanged, full active-design defaults, other variant preserved, draft persistence/recovery, responsive visibility, no runtime errors'+(no3D?' (3D CDN blocked: state/UI test only)':''));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
