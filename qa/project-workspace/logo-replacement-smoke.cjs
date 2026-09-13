const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const art={name:'customer-logo.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><circle cx="100" cy="100" r="80" fill="#008bc0"/><path d="M210 20H390V180H210Z" fill="#f51a86"/></svg>')};
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:1440,height:960}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.YPLogoReplacement&&YPProjectWorkspace.state().ready);
 await p.evaluate(async()=>{YPQuickSetupBridge.close();YPProjectBridge.restore(YPPeninsularTemplateBridge.snapshot('penin-blue-horizon-6'));const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);});
 const inventory=await p.evaluate(()=>{
  const result=[];for(const [lib,bridge] of [[YPInlineTemplates,YPInlineTemplateBridge],[YPCornerTemplates,YPCornerTemplateBridge],[YPPeninsularTemplates,YPPeninsularTemplateBridge],[YPIslandTemplates,YPIslandTemplateBridge]])for(const t of lib.templates){
   const s=bridge.snapshot(t.id).spec;for(let i=0;i<s.objects.length;i++){const o=s.objects[i];if(o.type!=='brandCopy')continue;const expected=YPTemplateBranding.isLogoSource(t.objects[i]);
    if(YPLogoReplacement.isLogo(o)!==expected)throw new Error('Wrong role '+o.id);
    if(expected){if(o.logoFinish.logoShape!=='cutout')throw new Error('Non-cutout '+o.id);const svg=atob(o.appearance.textureData.split(',')[1]);if(svg.includes('<image '))throw new Error('Baked background '+o.id);}
   }result.push(t.id);
  }return result;
 });console.log('PASS template logo/media roles and transparent defaults:',inventory.length);
 const before=await p.evaluate(()=>{const o=S.objects.find(YPLogoReplacement.isLogo);window.logoTestId=o.id;return {id:o.id,appearance:JSON.stringify(o.appearance),geometry:JSON.stringify([o.position,o.size,o.rotationY]),main:S.logo,others:JSON.stringify(S.objects.filter(x=>x.id!==o.id))};});
 // Select through the actual scene canvas, checking the raycast-to-signage flow.
 const point=await p.evaluate(()=>{const r=threeRenderer,T=r.THREE,o=objectById(logoTestId);r.camera.position.set(3,3.2,5.5);r.controls.target.set(3,3.2,.8);r.controls.update();r.renderer.render(r.scene,r.camera);const root=r.objectMeshes.get(o.id),v=root.localToWorld(new T.Vector3(0,o.size.h/2,0)).project(r.camera),rect=r.renderer.domElement.getBoundingClientRect();return{x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2};});
 await p.mouse.click(point.x,point.y);await p.waitForFunction(()=>objectEditor.selectedId===logoTestId);
 assert.equal(await p.locator('.dock-page.on').getAttribute('data-dock-page'),'signage');
 await p.locator('#replaceSelectedLogo').click();await p.locator('#logoReplaceFile').setInputFiles(art);await p.waitForFunction(()=>!document.getElementById('logoReplaceConfirm').disabled);
 assert.equal(await p.locator('#logoReplaceWarning').isVisible(),false);assert.equal(await p.evaluate(()=>JSON.stringify(objectById(logoTestId).appearance)),before.appearance,'preview must not mutate scene');
 await p.screenshot({path:'qa/project-workspace/logo-replacement-preview.png'});
 await p.locator('#logoReplaceCancel').click();assert.equal(await p.evaluate(()=>JSON.stringify(objectById(logoTestId).appearance)),before.appearance);
 await p.locator('#replaceSelectedLogo').click();await p.locator('#logoReplaceFile').setInputFiles(art);await p.waitForFunction(()=>!document.getElementById('logoReplaceConfirm').disabled);await p.locator('#logoReplaceConfirm').click();
 assert.equal(await p.locator('#logoReplaceDialog').isVisible(),false);
 const after=await p.evaluate(()=>{const o=objectById(logoTestId);return {name:o.appearance.textureName,geometry:JSON.stringify([o.position,o.size,o.rotationY]),main:S.logo,others:JSON.stringify(S.objects.filter(x=>x.id!==o.id)),shape:o.logoFinish.logoShape};});
 assert.equal(after.name,'customer-logo.svg');assert.equal(after.geometry,before.geometry);assert.equal(after.main,before.main);assert.equal(after.others,before.others);assert.equal(after.shape,'cutout');
 await p.evaluate(()=>threeRenderer.waitForSceneAssets(20000));await p.screenshot({path:'qa/project-workspace/logo-replacement-selected.png'});
 // Read-only legacy recognition does not migrate or erase saved customer artwork.
 assert.ok(await p.evaluate(()=>{const o=objectById(logoTestId),a=JSON.stringify(o.appearance);delete o.logoSlot;return YPLogoReplacement.isLogo(o)&&JSON.stringify(o.appearance)===a;}));
 // Bulk replacement excludes all media and structural panels, and retains finish settings.
 const media=await p.evaluate(()=>{const o=objectById(logoTestId);o.logoFinish={logoType:'light',logoShape:'cutout',logoLight:{enabled:true,tone:'warm',intensity:.5}};sync();return JSON.stringify(S.objects.filter(x=>!YPLogoReplacement.isLogo(x)));});
 await p.locator('#replaceSelectedLogo').click();await p.locator('#logoReplaceExample').click();await p.waitForFunction(()=>!document.getElementById('logoReplaceConfirm').disabled);await p.locator('#logoReplaceScope').selectOption('all');await p.locator('#logoReplaceConfirm').click();
 assert.equal(await p.locator('#logoReplaceDialog').isVisible(),false);assert.equal(await p.evaluate(()=>JSON.stringify(S.objects.filter(x=>!YPLogoReplacement.isLogo(x)))),media);
 assert.deepEqual(await p.evaluate(()=>objectById(logoTestId).logoFinish.logoLight),{enabled:true,tone:'warm',intensity:.5});
 assert.ok(await p.evaluate(()=>S.objects.filter(YPLogoReplacement.isLogo).every(x=>x.appearance.textureName==='Yuppie Production โปร่งใส')));
 // Opaque files require explicit acknowledgement; uploading doesn't silently cut white artwork.
 await p.locator('#replaceSelectedLogo').click();await p.locator('#logoReplaceFile').setInputFiles({name:'opaque.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><path fill="white" d="M0 0H200V100H0Z"/><circle cx="100" cy="50" r="30" fill="red"/></svg>')});await p.waitForFunction(()=>!document.getElementById('logoReplaceConfirm').disabled);
 assert.equal(await p.locator('#logoReplaceWarning').isVisible(),true);await p.locator('#logoReplaceConfirm').click();assert.equal(await p.locator('#logoReplaceDialog').isVisible(),true);await p.locator('#logoReplaceCancel').click();
 // Main logo participates in undo; selected copies never redirect to it.
 await p.evaluate(()=>{setObjectSelection([]);S.logoScale=50;sync();});const mainBefore=await p.evaluate(()=>S.logo);
 await p.locator('#btnLogo').click();await p.locator('#logoReplaceFile').setInputFiles(art);await p.waitForFunction(()=>!document.getElementById('logoReplaceConfirm').disabled);await p.locator('#logoReplaceConfirm').click();assert.notEqual(await p.evaluate(()=>S.logo),mainBefore);
 await p.keyboard.press('Control+z');assert.equal(await p.evaluate(()=>S.logo),mainBefore);
 await p.keyboard.press('Control+Shift+z');assert.notEqual(await p.evaluate(()=>S.logo),mainBefore);
 // Save/open retains user artwork and slot roles, without template rebranding.
 const saved=await p.evaluate(()=>{YPProjectStore.validateSpec(S);const snap={spec:JSON.parse(JSON.stringify(S)),assets:[]},data=S.logo;YPProjectBridge.restore(snap);return {data,same:S.logo===data,roles:S.objects.filter(YPLogoReplacement.isLogo).length};});assert.ok(saved.same&&saved.roles>0);
 // An old file-read session cannot apply to a restored/replaced project.
 await p.evaluate(()=>selectObject(logoTestId));await p.locator('#replaceSelectedLogo').click();await p.locator('#logoReplaceExample').click();await p.waitForFunction(()=>!document.getElementById('logoReplaceConfirm').disabled);
 await p.evaluate(()=>YPProjectBridge.restore({spec:JSON.parse(JSON.stringify(S)),assets:[]}));await p.locator('#logoReplaceConfirm').click();assert.match(await p.locator('#logoReplaceStatus').textContent(),/งานปัจจุบันเปลี่ยน/);await p.locator('#logoReplaceCancel').click();
 // A locked target prevents the entire bulk operation, not a partial replacement.
 await p.evaluate(()=>{const logos=S.objects.filter(YPLogoReplacement.isLogo);logos[1].locked=true;selectObject(logos[0].id);});
 const lockedBefore=await p.evaluate(()=>JSON.stringify(S.objects.map(o=>o.appearance)));
 await p.locator('#replaceSelectedLogo').click();await p.locator('#logoReplaceExample').click();await p.waitForFunction(()=>!document.getElementById('logoReplaceConfirm').disabled);await p.locator('#logoReplaceScope').selectOption('all');await p.locator('#logoReplaceConfirm').click();
 assert.match(await p.locator('#logoReplaceStatus').textContent(),/ล็อก/);assert.equal(await p.evaluate(()=>JSON.stringify(S.objects.map(o=>o.appearance))),lockedBefore);await p.locator('#logoReplaceCancel').click();
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>YPLogoReplacement.open());await p.locator('#logoReplaceExample').click();await p.waitForFunction(()=>!document.getElementById('logoReplaceConfirm').disabled);await p.screenshot({path:'qa/project-workspace/logo-replacement-mobile.png'});
 assert.ok(await p.evaluate(()=>{const r=document.getElementById('logoReplaceDialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}));await p.locator('#logoReplaceCancel').click();
 assert.deepEqual(errors,[]);console.log('PASS real scene selection, preview/cancel, selected/all, preserved geometry/media/lighting, legacy recognition, opaque warning and main Undo');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
