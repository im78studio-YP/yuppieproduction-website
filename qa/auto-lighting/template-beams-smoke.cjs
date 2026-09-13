const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader|THREE.WebGLProgram/.test(m.text()))errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPBoothBeams&&window.YPInlineTemplateBridge&&YPProjectWorkspace.state().ready);
  await page.evaluate(()=>YPQuickSetupBridge.close());
  const layouts=[];
  for(const [bridge,id] of [['YPInlineTemplateBridge','soft-wave'],['YPPeninsularTemplateBridge','penin-botanical-atelier'],['YPIslandTemplateBridge','island-yellow-frame'],['YPCornerTemplateBridge','corner-timber-lounge']]){
   const result=await page.evaluate(async({bridge,id})=>{
    const snap=window[bridge].snapshot(id);YPProjectBridge.restore(snap);const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);setBoothLighting({enabled:true,tone:'warm'});
    const before={objects:JSON.stringify(S.objects),price:JSON.stringify(priceLines()),studio:r.studioKey.intensity},read=()=>{
     const cones=[],fixtures=[],strips=[];r.boothGroup.traverse(n=>{if(n.userData.boothBeamVisual)cones.push({visible:n.visible,helper:n.userData.systemHelper,color:n.material.uniforms.beamColor.value.getHexString()});if(n.userData.boothFixture||/^(auto-light-visual-|spotlight-fixture|downlight-model)/.test(n.name||''))fixtures.push(n.visible);if(n.userData.boothEmitter&&!n.userData.boothFixture)strips.push(n.visible);});return{cones,fixtures,strips,layout:r.boothGroup.userData.beamLayout};
    };
    const on=read();setBoothLighting({enabled:false});const off=read();setBoothLighting({enabled:true,tone:'white'});const white=read();
    return{before,after:{objects:JSON.stringify(S.objects),price:JSON.stringify(priceLines()),studio:r.studioKey.intensity},on,off,white,prompt:buildDesignPrompt()};
   },{bridge,id});
   assert.deepEqual(result.before,result.after);assert.ok(result.on.cones.length>0,id+' has visible beams');assert.ok(result.on.cones.every(c=>c.visible&&c.helper));assert.ok(result.on.fixtures.every(v=>v===false));assert.ok(result.off.cones.every(c=>!c.visible));assert.ok(result.white.cones.every(c=>c.color==='f2f6ff'));
   if(id==='soft-wave')assert.ok(result.on.strips.filter(Boolean).length>=2,'LED strips retained');
   assert.match(result.prompt,/Hide lamp housings/);layouts.push(JSON.stringify(result.on.layout));
   await page.locator('.dock-tool[data-dock-page="lighting"]').click();await page.screenshot({path:'qa/auto-lighting/beams-'+id+'.png'});console.log('PASS',id,result.on.cones.length,'beams;',result.on.fixtures.length,'hidden lamp parts');
  }
  assert.equal(new Set(layouts).size,4,'template-specific layouts, not one fixed arrangement');
  const legacy=await page.evaluate(async()=>{calculateAutoLighting();approveAutoLighting();await threeRenderer.waitForSceneAssets(20000);const r=threeRenderer;const inventory=JSON.stringify(S.lighting.approvedFixtures),price=JSON.stringify(priceLines());setBoothLighting({enabled:false});setBoothLighting({enabled:true});let visible=0;r.boothGroup.traverse(n=>{if(/^auto-light-visual-/.test(n.name)&&n.visible)visible++;});return{visible,inventoryKept:inventory===JSON.stringify(S.lighting.approvedFixtures),priceKept:price===JSON.stringify(priceLines()),beams:r.boothGroup.userData.beamLayout.length};});
  assert.equal(legacy.visible,0);assert.ok(legacy.inventoryKept&&legacy.priceKept&&legacy.beams>0);
  const follow=await page.evaluate(()=>{YPProjectBridge.restore(YPInlineTemplateBridge.snapshot('soft-wave'));setBoothLighting({enabled:true});const o=S.objects.find(o=>o.structure?.design==='soft-wave-downlight'),before=threeRenderer.boothGroup.userData.beamLayout.map(b=>b.source);o.position.x+=.2;sync();const after=threeRenderer.boothGroup.userData.beamLayout.map(b=>b.source);return{before,after};});assert.notDeepEqual(follow.before,follow.after);
  await page.evaluate(()=>{setBoothLighting({enabled:false});undoObjectChange();});assert.equal(await page.evaluate(()=>YPBoothLighting.settings(S).enabled),true);
  const saved=await page.evaluate(async()=>{const snap=YPProjectBridge.capture(),txt=await YPProjectStore.toText(YPProjectStore.create(snap,'beams'));YPProjectBridge.restore(YPProjectStore.fromText(txt).variants.A);return{enabled:YPBoothLighting.settings(S).enabled,beams:threeRenderer.boothGroup.userData.beamLayout.length};});assert.ok(saved.enabled&&saved.beams>0);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/auto-lighting/beams-mobile.png'});assert.deepEqual(errors,[]);console.log('PASS legacy lights, transform following, Undo, portable file and no WebGL errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
