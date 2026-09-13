const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPLogoFinishes&&YPProjectWorkspace.state().ready);
 await page.evaluate(async()=>{YPQuickSetupBridge.close();Object.assign(S,{type:'inline',W:6,D:3,H:2.4,logo:YPDefaultLogo.data,logoScale:100,nameScale:0,logoWall:'back',logoWallU:3,logoWallY:1.65,logoMount:'wall',logoShape:'cutout',logoType:'diecut',logoColorMode:'original',wallPaintOverrides:{back:'#006775'},objects:[]});sync();const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);r.setCameraView('front');});
 const read=()=>page.evaluate(()=>{const r=threeRenderer,front=r.brandingRoot.children.filter(n=>/^brand-diecut-wall-layer/.test(n.name)).at(-1),halo=r.brandingRoot.children.find(n=>n.userData.logoHalo);return{emission:front.material.emissiveIntensity,map:front.material.map.image.toDataURL(),halo:halo?.material.opacity||0,type:S.logoType,light:S.logoLight,objects:JSON.stringify(S.objects),geometry:JSON.stringify([S.logoWallU,S.logoWallY,S.logoScale,S.logoDepth]),beams:r.boothGroup.userData.beamLayout};});
 const original=await read();assert.equal(original.emission,0);assert.equal(original.halo,0);
 for(const type of ['diecut','backlit','light']){
  await page.evaluate(type=>YPLogoFinishes.change({logoType:type}),type);const data=await read();assert.equal(data.map,original.map);assert.equal(data.geometry,original.geometry);
  if(type==='backlit'){assert.ok(data.halo>0);assert.equal(data.emission,0);}if(type==='light'){assert.ok(data.emission>.5);assert.equal(data.halo,0);}
  if(type==='backlit')console.log('HALO',await page.evaluate(()=>{const n=threeRenderer.brandingRoot.children.find(n=>n.userData.logoHalo),c=n.material.map.image,a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return{visible:n.visible,position:n.position.toArray(),width:n.geometry.parameters,alpha:Array.from(a).filter((v,i)=>i%4===3&&v>0).length};}));
  await page.screenshot({path:'qa/project-workspace/logo-'+type+'.png'});console.log('PASS style',type);
 }
 await page.evaluate(()=>YPLogoFinishes.change({logoLight:{enabled:false,tone:'white',intensity:.8}}));assert.equal((await read()).emission,0);await page.evaluate(()=>undoObjectChange());assert.ok((await read()).emission>0);
 await page.evaluate(()=>YPLogoFinishes.change({logoLight:{enabled:true,tone:'white',intensity:.8}}));await page.evaluate(()=>setBoothLighting({enabled:false}));assert.ok((await read()).emission>0);
 const saved=await page.evaluate(async()=>{const t=await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture(),'logo'));YPProjectBridge.restore(YPProjectStore.fromText(t).variants.A);return S.logoLight;});assert.equal(saved.tone,'white');assert.equal(saved.intensity,.8);
 await page.locator('.dock-tool[data-dock-page="signage"]').click();
 await page.locator('#logoType').selectOption('backlit');assert.ok(await page.locator('#oLogoShape button').first().isDisabled());
 await page.locator('#logoLightOff').click();assert.equal((await read()).halo,0);await page.locator('#logoLightOn').click();assert.ok((await read()).halo>0);
 await page.locator('#logoType').selectOption('light');await page.locator('#oLogoShape [data-k=panel]').click();assert.equal(await page.evaluate(()=>S.logoShape),'panel');
 await page.screenshot({path:'qa/project-workspace/logo-controls.png'});
 await page.evaluate(async()=>{YPProjectBridge.restore(YPPeninsularTemplateBridge.snapshot('penin-botanical-atelier'));await threeRenderer.waitForSceneAssets(20000);const o=S.objects.find(o=>o.type==='brandCopy');setObjectSelection([o.id],o.id);syncObjectControls();YPLogoFinishes.change({logoType:'light'});});
 const copy=await page.evaluate(()=>{const o=objectById(objectEditor.selectedId),root=threeRenderer.objectMeshes.get(o.id),names=[];root.traverse(n=>names.push([n.name,n.type]));return {finish:o.logoFinish,names,emission:root.getObjectByName('brand-artwork-copy')?.material.emissiveIntensity,other:S.objects.filter(n=>n.id!==o.id).some(n=>n.logoFinish)};});console.log('COPY',copy);assert.equal(copy.finish.logoType,'light');assert.ok(copy.emission>0);assert.equal(copy.other,false);
 await page.evaluate(()=>YPLogoFinishes.change({logoType:'backlit'}));assert.equal(await page.evaluate(()=>document.getElementById('logoType').value),'backlit');
 const copied=await page.evaluate(async()=>{const id=objectEditor.selectedId,t=await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture(),'copy'));YPProjectBridge.restore(YPProjectStore.fromText(t).variants.A);return objectById(id).logoFinish;});assert.equal(copied.logoType,'backlit');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/project-workspace/logo-controls-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS independent switch, Undo, saved settings and selected template logo only');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
