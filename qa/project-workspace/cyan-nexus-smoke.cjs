const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.YPPeninsularTemplateBridge&&YPProjectWorkspace.state().ready,undefined,{timeout:60000});
 const result=await page.evaluate(async()=>{YPQuickSetupBridge.close();const snapshot=YPPeninsularTemplateBridge.snapshot('penin-cyan-nexus');YPProjectBridge.restore(snapshot);const r=await loadThreeRenderer();if(!await r.waitForSceneAssets(20000))throw new Error('Assets not ready');return{spec:snapshot.spec,portable:await YPProjectStore.toText(YPProjectStore.create(snapshot,'Cyan Nexus'))};});
 assert.equal(result.spec.W,6);assert.equal(result.spec.D,3);assert.equal(result.spec.H,3.5);assert.equal(result.spec.type,'penin');assert.equal(result.spec.objects.filter(o=>o.logoSlot?.kind==='logo').length,2);assert.equal(result.spec.objects.filter(o=>o.logoSlot?.kind==='media').length,3);assert.ok(result.spec.objects.filter(o=>o.logoSlot).every(o=>o.appearance.textureData));
 console.log('PASS snapshot, editable logo/media slots and portable project');
 for(const [view,pos]of [['overview',{x:8.8,y:6.8,z:11}],['front',{x:4.8,y:2.9,z:12}]]){
  const image=await page.evaluate(async({pos})=>{const camera={projection:'orthographic',cameraViewType:'comparison',position:pos,target:{x:3,y:1.55,z:1.2},up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-4.1,right:4.1,top:3.075,bottom:-3.075}};const shot=await exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1440,maxLongEdge:1440,download:false,assetTimeoutMs:20000});return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(shot.blob);});},{pos});
  await fs.writeFile('qa/project-workspace/cyan-nexus-'+view+'.png',Buffer.from(image,'base64'));
  if(view==='overview')await fs.writeFile('public/yp-web-ai/assets/peninsular-templates/penin-cyan-nexus.png',Buffer.from(image,'base64'));
 }
 await fs.writeFile('public/yp-web-ai/assets/peninsular-templates/penin-cyan-nexus.ypbooth.json',result.portable);
 const checks=await page.evaluate(()=>{const r=threeRenderer,T=r.THREE;const roots=S.objects.filter(o=>o.structure?.design==='nexus-side-portal').map(o=>r.objectMeshes.get(o.id));const openings=roots.map(root=>{root.updateMatrixWorld(true);const ray=new T.Raycaster(),q=root.getWorldQuaternion(new T.Quaternion());ray.set(root.localToWorld(new T.Vector3(0,1.4,1)),new T.Vector3(0,0,-1).applyQuaternion(q));return ray.intersectObject(root,true).length===0;});const emitters=[];r.boothGroup.traverse(n=>{if(n.userData.boothEmitter)emitters.push(n);});return{openings,emitters:emitters.length};});assert.deepEqual(checks.openings,[true,true]);assert.ok(checks.emitters>0);
 await page.evaluate(()=>YPPeninsularTemplateUI.open());assert.equal(await page.locator('[data-penin-template="penin-cyan-nexus"]').count(),1);await page.locator('#peninsularTemplatesClose').click();
 const unchanged=await page.evaluate(()=>JSON.stringify(S.objects));
 await page.evaluate(()=>{YPQuickSetupBridge.open({start:'business'});YPWizardV2.show('template');});
 await page.locator('#wizard-template-cards [data-template="penin-cyan-nexus"]').click();
 const wizard=await page.evaluate(()=>YPWizardV2.result().spec);assert.equal(wizard.boothTemplate.id,'penin-cyan-nexus');assert.deepEqual([wizard.W,wizard.D],[6,3]);assert.equal(wizard.raise,0);assert.equal(wizard.floor,'carpet');assert.equal(wizard.carpet,'grey');
 assert.equal(await page.evaluate(()=>JSON.stringify(S.objects)),unchanged);await page.evaluate(()=>YPQuickSetupBridge.close());
 assert.deepEqual(errors,[]);console.log('PASS 2 rendered views, open side portals, emitters, template picker and Wizard defaults without changing active design');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
