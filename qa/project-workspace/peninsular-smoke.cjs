const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base='http://127.0.0.1:4173/yp-web-ai/index.html';
async function writeAsset(path,data){const tmp=path+'.tmp',bytes=Buffer.isBuffer(data)?data:Buffer.from(data);await fs.writeFile(tmp,bytes);const hash=b=>crypto.createHash('md5').update(b).digest('hex');assert.equal(hash(await fs.readFile(tmp)),hash(bytes));await fs.rename(tmp,path);}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?comparePreview=1');await page.waitForFunction(()=>window.YPPeninsularTemplateBridge);await page.evaluate(async()=>{await YPProjectBridge.ready;YPQuickSetupBridge.close();});
  const ids=await page.evaluate(()=>YPPeninsularTemplates.templates.map(t=>t.id));
  for(const id of process.env.PENIN_SKIP_RENDER?[]:ids.filter(id=>!process.env.PENIN_RENDER_ID||process.env.PENIN_RENDER_ID.split(',').includes(id))){const result=await page.evaluate(async id=>{
    const snapshot=YPPeninsularTemplateBridge.snapshot(id),serialized=await YPProjectStore.toText(YPProjectStore.create(snapshot,id));YPProjectStore.fromText(serialized);YPProjectBridge.restore(snapshot);const renderer=await loadThreeRenderer();
    const models=snapshot.spec.objects.filter(o=>o.geometryMode!=='parametric').map(o=>objectCatalogDef(o.catalogId)).filter(o=>o.modelUrl);for(const m of models)renderer.requestFurnitureTemplate(m);if(!await renderer.waitForSceneAssets(20000))throw new Error('Assets not ready');for(const m of models)if(!renderer.furnitureTemplates.has(m.catalogId))throw new Error('Missing '+m.catalogId);
    const camera={projection:'orthographic',cameraViewType:'comparison',position:{x:8,y:5.9,z:12},target:{x:3,y:1,z:1.25},up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-4.35,right:4.35,top:3.2625,bottom:-3.2625}};
    const image=await exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1280,maxLongEdge:1280,download:false,assetTimeoutMs:20000});
    if(id==='penin-golden-oculus'){
      const o=snapshot.spec.objects.find(o=>o.type==='oculusPanel'),root=renderer.objectMeshes.get(o.id),T=renderer.THREE;
      root.updateMatrixWorld(true);const ray=new T.Raycaster(),origin=root.localToWorld(new T.Vector3(0,o.size.h*.45,1));ray.set(origin,new T.Vector3(0,0,-1));
      if(ray.intersectObject(root,true).length)throw new Error('Oculus opening is blocked');
      ray.set(root.localToWorld(new T.Vector3(o.size.w*.45,o.size.h*.45,1)),new T.Vector3(0,0,-1));if(!ray.intersectObject(root,true).length)throw new Error('Oculus panel geometry missing');
      if(snapshot.spec.objects.some(o=>o.type==='trailingPlant'))throw new Error('Unwanted hanging shrub');
    }
    if(id==='penin-blue-pavilion'){
      const logo=snapshot.spec.objects.find(o=>o.type==='brandCopy');let mapped=false;
      renderer.objectMeshes.get(logo.id).traverse(p=>{if(p.isMesh&&p.material.map?.image)mapped=true;});
      if(!mapped)throw new Error('Fascia logo missing after clean screenshot rebuild');
      for(const o of snapshot.spec.objects.filter(o=>o.type==='roundedPanel')){let extruded=false;renderer.objectMeshes.get(o.id).traverse(p=>{if(p.geometry?.type==='ExtrudeGeometry')extruded=true;});if(!extruded)throw new Error('Rounded panel reverted to box');}
    }
    const png=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(image.blob);});return {png,serialized};
  },id);const output='public/yp-web-ai/assets/peninsular-templates/'+id;await writeAsset(output+'.png',Buffer.from(result.png,'base64'));await writeAsset(output+'.ypbooth.json',result.serialized);console.log('RENDERED',id);}
  await page.goto(base);await page.waitForFunction(()=>window.YPInlineWizard&&YPProjectWorkspace.state().ready);await page.locator('#releaseStart').click();await page.locator('#quickBusinessNext').click();await page.locator('#quickBoothTypes [data-value=penin]').click();
  assert.equal(await page.locator('#quickTemplateChoices [role=radio]').count(),16);assert.equal(await page.evaluate(()=>YPQuickSetupBridge.getState().draft.depth),6);
  await page.locator('#quickTemplateChoices [data-value=penin-orchard]').click();assert.equal(await page.evaluate(()=>YPQuickSetupBridge.getState().draft.templateId),'penin-orchard');
  for(const id of ['penin-aqua-curve','penin-timber-noir','penin-blue-axis']){await page.locator('#quickTemplateChoices [data-value='+id+']').click();assert.equal(await page.evaluate(()=>YPQuickSetupBridge.getState().draft.templateId),id);}
  await page.locator('#quickTemplateChoices [data-value=penin-blue-pavilion]').click();assert.equal(await page.evaluate(()=>YPQuickSetupBridge.getState().draft.templateId),'penin-blue-pavilion');
  const originalObjects=await page.evaluate(()=>getBoothSpec().objects);
  await page.locator('#quickTemplateChoices [data-value=penin-connect]').click();assert.equal(await page.evaluate(()=>YPQuickSetupBridge.getState().draft.depth),3);assert.ok((await page.locator('#quickLayoutSummary').textContent()).includes('ลึก 3'));assert.deepEqual(await page.evaluate(()=>getBoothSpec().objects),originalObjects);
  await page.locator('#quickStepLayout .quick-step-scroll').evaluate(e=>e.scrollTo(0,180));await page.screenshot({path:'qa/project-workspace/peninsular-wizard.png'});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#quickInlineTemplates').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.screenshot({path:'qa/project-workspace/peninsular-mobile.png'});await page.setViewportSize({width:1440,height:1050});
  await page.locator('#quickTemplateChoices [data-value=manual]').click();assert.equal(await page.evaluate(()=>YPQuickSetupBridge.getState().draft.depth),6);
  await page.locator('#quickTemplateChoices [data-value=penin-adventure]').click();await page.locator('#quickBoothTypes [data-value=inline]').click();assert.equal(await page.locator('#quickTemplateChoices [role=radio]').count(),6);assert.equal(await page.evaluate(()=>YPQuickSetupBridge.getState().draft.templateId),null);
  await page.locator('#quickBoothTypes [data-value=penin]').click();await page.locator('#quickTemplateChoices [data-value=penin-natural]').click();await page.locator('#quickLayoutNext').click();await page.locator('#quickBrandNext').click();await page.locator('#quickFloorNext').click();await page.locator('#quickRoomFinish').click();await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open&&!YPProjectWorkspace.state().busy);
  const saved=await page.evaluate(()=>YPProjectWorkspace.capture());assert.equal(saved.active,'A');assert.equal(saved.variants.A.spec.type,'penin');assert.equal(saved.variants.A.spec.D,3);assert.equal(saved.variants.A.spec.boothTemplate.id,'penin-natural');assert.equal(await page.locator('.starter-dialog').count(),0);
  assert.equal(await page.locator('#peninsularTemplateSubmenu').evaluate(e=>e.hidden),false);assert.equal(await page.locator('#inlineTemplateSubmenu').evaluate(e=>e.hidden),true);
  await page.evaluate(()=>YPPeninsularTemplateUI.open());assert.equal(await page.locator('[data-penin-template]').count(),15);await page.locator('[data-penin-template=penin-blue-pavilion]').click();await page.waitForFunction(()=>YPProjectWorkspace.state().active==='B'&&!YPProjectWorkspace.state().busy);assert.equal(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A.spec.boothTemplate.id),'penin-natural');assert.equal(await page.evaluate(()=>YPProjectWorkspace.capture().variants.B.spec.boothTemplate.id),'penin-blue-pavilion');
  await page.evaluate(()=>YPPeninsularTemplateUI.open());await page.locator('[data-penin-template=penin-adventure]').click();await page.locator('#projectCancel').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);assert.equal(await page.evaluate(()=>YPProjectWorkspace.state().active),'B');
  assert.deepEqual(errors,[]);
  for(const id of ['penin-aqua-curve','penin-timber-noir','penin-blue-axis','penin-orchard','penin-noir-lounge','penin-aqua-wave','penin-crimson-flow','penin-sage-ribbon','penin-blush-gallery','penin-blue-step','penin-golden-oculus']){
    await page.evaluate(()=>YPPeninsularTemplateUI.open());await page.locator('[data-penin-template='+id+']').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
    assert.equal(await page.evaluate(()=>{const p=YPProjectWorkspace.capture();return p.variants[p.active].spec.boothTemplate.id;}),id);
  }
  assert.equal(await page.locator('#peninsularCards a').count(),0);assert.deepEqual(errors,[]);
  await page.goto(new URL('assets/peninsular-templates/overview.html',base).href);await page.setViewportSize({width:1600,height:1050});await page.locator('.card img').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.decode())));await page.screenshot({path:'qa/project-workspace/peninsular-overview.png',fullPage:true});
  console.log('PASS: 15 template choices, requested renders, portable files, 6x3 templates/6x6 manual, type switching, fresh A, B preserving A, mobile, no repeated starter');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
