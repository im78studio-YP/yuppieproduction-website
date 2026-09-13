const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPBoothLighting&&window.YPInlineTemplateBridge&&YPProjectWorkspace.state().ready);
  await page.evaluate(async()=>{YPQuickSetupBridge.close();YPProjectBridge.restore(YPInlineTemplateBridge.snapshot('soft-wave'));const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);});
  await page.locator('.dock-tool[data-dock-page="lighting"]').click();
  assert.equal(await page.locator('#simpleBoothLighting button:visible').count(),4);
  assert.equal(await page.locator('#legacyLightingControls').isVisible(),false);
  assert.equal(await page.locator('#boothLightWarm').getAttribute('aria-pressed'),'true');
  const read=()=>page.evaluate(()=>{
   const lights=[],emitters=[],protectedMeshes=[];let meshes=0;
   threeRenderer.boothGroup.traverse(n=>{
    if(n.isLight)lights.push({name:n.name,intensity:n.intensity,color:n.color.getHexString()});
    if(n.isMesh){meshes++;(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>{
     if(m.userData.boothLightManaged)emitters.push({intensity:m.emissiveIntensity,color:m.emissive.getHexString()});
     else if(m.map||m.isMeshBasicMaterial)protectedMeshes.push([n.name,m.color?.getHexString(),m.map?.image?.src||'']);
    });}
   });
   return{lights,emitters,protectedMeshes,meshes,objects:JSON.stringify(S.objects),price:JSON.stringify(priceLines()),studio:[threeRenderer.studioKey.intensity,threeRenderer.studioFill.intensity,threeRenderer.studioRim.intensity],other:YPProjectWorkspace.capture().variants.B?.spec||null,control:YPBoothLighting.settings(S),prompt:buildDesignPrompt()};
  });
  const before=await read();assert.ok(before.emitters.length>5);assert.ok(before.lights.some(l=>l.intensity>0));
  await page.locator('#boothLightWhite').click();const white=await read();
  assert.ok(white.lights.every(l=>l.color==='f2f6ff'));assert.notDeepEqual(white.emitters,before.emitters);
  assert.match(white.prompt,/white \(5000K\)/);
  await page.screenshot({path:'qa/auto-lighting/booth-light-white.png'});
  await page.locator('#boothLightOff').click();const off=await read();
  assert.ok(off.lights.every(l=>l.intensity===0));assert.ok(off.emitters.every(e=>e.intensity===0));
  assert.equal(off.meshes,white.meshes);assert.equal(off.objects,before.objects);assert.equal(off.price,before.price);
  assert.deepEqual(off.studio,before.studio);assert.deepEqual(off.protectedMeshes,before.protectedMeshes);
  assert.equal(await page.locator('#boothLightWarm').isDisabled(),true);assert.match(off.prompt,/Switch off booth light emission/);
  await page.screenshot({path:'qa/auto-lighting/booth-light-off.png'});
  await page.evaluate(()=>undoObjectChange());assert.equal((await read()).control.enabled,true);
  await page.evaluate(()=>redoObjectChange());assert.equal((await read()).control.enabled,false);
  await page.locator('#boothLightOn').click();assert.equal((await read()).control.tone,'white');
  await page.locator('#boothLightWarm').focus();await page.keyboard.press('Enter');const warm=await read();assert.ok(warm.lights.every(l=>l.color==='ffe1b3'));
  assert.deepEqual(warm.other,before.other);
  await page.screenshot({path:'qa/auto-lighting/booth-light-warm.png'});
  await page.evaluate(async()=>{const text=await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture(),'lights'));YPProjectBridge.restore(YPProjectStore.fromText(text).variants.A);});
  assert.equal((await read()).control.tone,'warm');
  // Reapplying presentation to the same scene is reversible, without accumulating lights.
  const repeated=await page.evaluate(()=>{const r=threeRenderer,s=structuredClone(S);s.lighting.boothControl.enabled=false;YPBoothLighting.apply(r,s);s.lighting.boothControl.enabled=true;YPBoothLighting.apply(r,s);let lit=0;r.boothGroup.traverse(n=>{if(n.isMesh&&(Array.isArray(n.material)?n.material:[n.material]).some(m=>m.userData.boothLightManaged&&m.emissiveIntensity>0))lit++;});return lit;});assert.ok(repeated>5);
  console.log('PASS Soft Wave white/warm/off, geometry/price/graphics/studio/B preserved, Undo/Redo and portable state');
  for(const [bridge,id] of [['YPPeninsularTemplateBridge','penin-botanical-atelier'],['YPIslandTemplateBridge','island-yellow-frame'],['YPCornerTemplateBridge','corner-timber-lounge']]){
   await page.evaluate(async({bridge,id})=>{YPProjectBridge.restore(window[bridge].snapshot(id));await threeRenderer.waitForSceneAssets(20000);},{bridge,id});
   const initial=await read();await page.evaluate(()=>setBoothLighting({enabled:false}));const dark=await read();
   assert.equal(initial.meshes,dark.meshes);assert.equal(initial.objects,dark.objects);assert.equal(initial.price,dark.price);assert.ok(dark.lights.every(l=>l.intensity===0));assert.ok(dark.emitters.every(l=>l.intensity===0));
   await page.evaluate(()=>setBoothLighting({enabled:true,tone:'white'}));const next=await read();assert.ok(next.lights.some(l=>l.intensity>0));console.log('PASS template',id,initial.emitters.length,'emitting surfaces');
  }
  // Existing legacy approved and manual fixture inventories survive the new switch.
  await page.evaluate(async()=>{calculateAutoLighting();approveAutoLighting();await threeRenderer.waitForSceneAssets(20000);});
  const approved=await read();assert.ok(await page.evaluate(()=>S.lighting.approvedFixtures.length>0));
  const inventory=await page.evaluate(()=>JSON.stringify(S.lighting.approvedFixtures));
  await page.locator('#boothLightOff').click();const approvedOff=await read();
  assert.equal(approvedOff.meshes,approved.meshes);assert.equal(approvedOff.price,approved.price);
  assert.equal(await page.evaluate(()=>JSON.stringify(S.lighting.approvedFixtures)),inventory);
  assert.ok(approvedOff.lights.every(l=>l.intensity===0));
  await page.evaluate(async()=>{S.lighting.mode='manual';S.lights=true;setBoothLighting({enabled:true});await threeRenderer.waitForSceneAssets(20000);});
  const manual=await read();await page.locator('#boothLightOff').click();const manualOff=await read();
  assert.equal(manualOff.meshes,manual.meshes);assert.equal(manualOff.price,manual.price);assert.ok(manualOff.lights.every(l=>l.intensity===0));
  await page.locator('#boothLightOn').click();
  console.log('PASS legacy approved/manual fixtures retained with lights off; price unchanged');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('#boothLightOn').isVisible(),true);assert.equal(await page.locator('#boothLightWarm').isVisible(),true);
  await page.screenshot({path:'qa/auto-lighting/booth-light-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS mobile and no browser errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
