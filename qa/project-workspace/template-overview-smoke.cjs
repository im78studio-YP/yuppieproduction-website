const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const base='http://127.0.0.1:4173/yp-web-ai/';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
  for(const [folder,count,id] of [['peninsular-templates',13,'penin-orchard'],['inline-templates',5,'gallery']]){
    const context=await browser.newContext(),page=await context.newPage({viewport:{width:1365,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'assets/'+folder+'/overview.html');
    assert.equal(await page.locator('.use-template').count(),count);assert.equal(await page.locator('[download]').count(),0);
    assert.ok(!(await page.locator('body').textContent()).includes('ดาวน์โหลดแบบแก้ไขได้'));
    for(const href of await page.locator('.use-template').evaluateAll(items=>items.map(a=>a.href)))assert.ok(new URL(href).searchParams.get('useTemplate'));
    await page.locator('.use-template[href$="='+id+'"]').click();
    await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&!YPProjectWorkspace.state().busy&&!document.getElementById('templateEntryDialog').open);
    const marker=s=>(s.boothTemplate||s.inlineTemplate).id;
    const project=await page.evaluate(()=>YPProjectWorkspace.capture());assert.equal(project.active,'A');assert.equal(marker(project.variants.A.spec),id);assert.equal(project.variants.B,null);
    assert.equal(new URL(page.url()).searchParams.has('useTemplate'),false);
    assert.equal(await page.locator('.inline-template-card a[download]').count(),0);
    assert.equal(await page.locator('#projectSave').isVisible(),true);
    // Navigating from overview again must protect the already-persisted design.
    const next=folder==='peninsular-templates'?'penin-connect':'meeting';
    await page.goto(base+'index.html?useTemplate='+next);
    await page.waitForFunction(()=>window.YPProjectWorkspace?.state().pendingDraft&&document.querySelector('#templateEntryRecover'));
    await page.locator('#templateEntryCurrent').click();await page.locator('#projectCancel').click();
    await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
    assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().pendingDraft),true);
    await page.locator('#templateEntryRecover').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy&&!YPProjectWorkspace.state().pendingDraft);
    assert.equal(await page.evaluate(()=>{const s=YPProjectWorkspace.capture().variants.A.spec;return (s.boothTemplate||s.inlineTemplate).id;}),id);
    await page.locator('#templateEntryApply').click();
    await page.waitForFunction(()=>!YPProjectWorkspace.state().busy&&!document.querySelector('#templateEntryDialog').open);
    const result=await page.evaluate(()=>YPProjectWorkspace.capture());assert.equal(result.active,'B');assert.equal(marker(result.variants.A.spec),id);assert.equal(marker(result.variants.B.spec),next);
    assert.deepEqual(errors,[]);await context.close();
  }
  const page=await browser.newPage();await page.goto(base+'index.html?useTemplate=not-a-template');
  await page.locator('#templateEntryDialog').waitFor();assert.match(await page.locator('#templateEntryTitle').textContent(),/ไม่พบ/);assert.equal(await page.locator('#templateEntryApply').count(),0);
  await page.locator('#templateEntryClose').click();
  await page.goto(base+'assets/peninsular-templates/overview.html');await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok((await page.locator('.use-template').first().boundingBox()).height>=44);
  console.log('PASS: 18 overview use buttons; both template types open selected editable A; no template download links; saved draft cancel/recover and preserved A/new B; consumed URL; invalid ID safe; mobile CTA');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
