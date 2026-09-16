const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready,null,{timeout:60000});
  await page.evaluate(async()=>{YPQuickSetupBridge.close();selectView('three');await loadThreeRenderer();closeDockPanel();});
  const gizmo=page.locator('.viewport-gizmo');
  await gizmo.waitFor({state:'visible'});
  assert.ok(await gizmo.evaluate(el=>{const s=getComputedStyle(el);return s.backgroundColor==='rgba(0, 0, 0, 0)'&&s.boxShadow==='none'&&Math.abs(el.getBoundingClientRect().width/el.offsetWidth-.5)<.01;}),'gizmo is transparent and half size');
  assert.equal(await page.locator('.view-controls-help,.view-controls-dialog').count(),0);
  assert.match(await page.locator('.view-controls-hint').innerText(),/ลากพื้นที่ว่าง.*ล้อเมาส์/);
  const geometry=()=>page.evaluate(()=>{const nodes=[];threeRenderer.boothGroup.traverse(o=>nodes.push({id:o.uuid,position:o.position.toArray(),rotation:o.quaternion.toArray(),scale:o.scale.toArray(),geometry:o.geometry?.uuid}));return JSON.stringify(nodes);});
  const original=await geometry();
  for(const view of ['orthographic_front','orthographic_rear','orthographic_left','orthographic_right','orthographic_top']){
    await page.evaluate(()=>threeRenderer.setCameraView('perspective_front_left',{animate:false}));
    await page.waitForTimeout(100);
    await gizmo.locator('[data-view='+view+']').click();
    await page.waitForFunction(v=>threeRenderer.currentView===v,view);
    await page.waitForFunction(v=>document.querySelector('.viewport-gizmo [data-view='+v+']').getAttribute('aria-pressed')==='true',view);
    assert.equal(await page.evaluate(()=>threeRenderer.camera.isOrthographicCamera),true);
    assert.match(await page.locator('.view-controls-hint').innerText(),/มุมมองด้านตรง/);
    assert.equal(await page.locator('.three-tools button.on').innerText(),{orthographic_front:'หน้า',orthographic_rear:'หลัง',orthographic_left:'ซ้าย',orthographic_right:'ขวา',orthographic_top:'บน'}[view]);
  }
  await gizmo.locator('.viewport-gizmo-reset').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>threeRenderer.currentView==='perspective'&&!threeRenderer.cameraTransitionRaf);
  const before=await gizmo.locator('[data-view=orthographic_right]').getAttribute('style');
  await page.evaluate(()=>{const r=threeRenderer;r.camera.position.x+=3;r.camera.lookAt(r.controls.target);r.controls.update();});
  await page.waitForTimeout(150);
  assert.notEqual(await gizmo.locator('[data-view=orthographic_right]').getAttribute('style'),before,'gizmo tracks camera');
  // Top view restores temporarily hidden geometry after returning to perspective.
  assert.equal(await geometry(),original,'camera controls must not change booth geometry');
  async function checkBounds(){
    const g=await gizmo.boundingBox(),t=await page.locator('.three-tools').boundingBox(),s=await page.locator('.three-shell').boundingBox();
    assert.ok(g.x+g.width<=s.x+s.width+1&&g.y>=s.y,'gizmo stays inside viewport');
    assert.ok(t.x+t.width<=g.x,'camera toolbar does not overlap gizmo');
  }
  await checkBounds();await page.screenshot({path:'qa/project-workspace/viewport-gizmo-desktop.png'});
  await page.setViewportSize({width:390,height:844});await checkBounds();
  await page.screenshot({path:'qa/project-workspace/viewport-gizmo-mobile.png'});
  await page.evaluate(()=>document.querySelector('.three-host').dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch'})));
  assert.match(await page.locator('.view-controls-hint').innerText(),/สองนิ้ว/);
  await page.evaluate(()=>selectView('plan'));assert.equal(await gizmo.isVisible(),false);
  await page.evaluate(()=>selectView('three'));await gizmo.waitFor({state:'visible'});
  assert.equal(await page.locator('.viewport-gizmo').count(),1);
  assert.deepEqual(errors,[]);console.log('PASS removed help, five clickable views, camera sync, keyboard reset, unchanged geometry, responsive bounds, contextual hints, remount');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
