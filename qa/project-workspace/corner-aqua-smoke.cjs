const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
// First render populates this derived cache asynchronously; it is not an authored edit.
const authored=s=>{const copy=structuredClone(s);if(copy.spec.aiRender)delete copy.spec.aiRender.camera;return copy;};
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPCornerAqua&&YPProjectWorkspace.state().ready);
 const result=await page.evaluate(async()=>{
  YPQuickSetupBridge.close();const id='corner-aqua-wave',a=YPCornerTemplateBridge.snapshot(id),b=YPCornerTemplateBridge.snapshot(id,{cornerSide:'left'}),t=YPCornerTemplates.templates.find(t=>t.id===id),r=await loadThreeRenderer();let logos=0,cases=0;
  for(let i=0;i<t.objects.length;i++){const src=t.objects[i],o=a.spec.objects[i];if(src.brandLogo||src.graphic==='aqua-screen'){
   const svg=atob(o.appearance.textureData.split(',')[1]);if(!svg.includes('xMidYMid meet')||/<text[\s>]/.test(svg)||!o.appearance.textureId.startsWith(YPTemplateBranding.revision))throw Error('Branding '+o.id);
   if(b.spec.objects[i].flipX||b.spec.objects[i].appearance.textureData!==o.appearance.textureData)throw Error('Mirrored logo');logos++;
  }
  if(o.structure?.design?.startsWith('aqua-')){if(b.spec.objects[i].transform?.flipX!==true)throw Error('Native mesh did not mirror');const model=r.buildCatalogObject(o),box=new r.THREE.Box3().setFromObject(model);if(box.isEmpty())throw Error('Missing geometry');
   if(o.structure.design==='aqua-display-plinth'){let panes=0;model.traverse(m=>{if(m.material?.transparent&&m.material.opacity<.3)panes++;});if(panes!==5)throw Error('Glass panes');cases++;}
   if(o.structure.design==='aqua-curved-counter'&&model.children[0].geometry.attributes.position.count<100)throw Error('Counter is not curved');
  }}
  const text=await YPProjectStore.toText(YPProjectStore.create(b,'Aqua'));YPProjectStore.fromText(text);if(!text.includes('aqua-wave-fascia'))throw Error('Geometry lost');return {logos,cases,cards:YPCornerTemplates.templates.length};
 });assert.deepEqual(result,{logos:8,cases:2,cards:8});
 await page.evaluate(()=>YPCornerTemplateUI.open());await page.locator('[data-corner-template="corner-aqua-wave"]').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);assert.equal(await page.evaluate(()=>getBoothSpec().boothTemplate.id),'corner-aqua-wave');const a=await page.evaluate(()=>YPProjectWorkspace.capture().variants.A);
 await page.locator('#projectB').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);await page.evaluate(()=>YPCornerTemplateUI.open());const b=await page.evaluate(()=>YPProjectWorkspace.capture().variants.B);
 await page.locator('[data-corner-template="corner-aqua-wave"]').click();await page.locator('#projectCancel').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A),a);assert.deepEqual(authored(await page.evaluate(()=>YPProjectWorkspace.capture().variants.B)),authored(b));
 for(const width of [390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.locator('#cornerTemplatesDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));}
 await page.goto('http://127.0.0.1:4173/yp-web-ai/assets/corner-templates/overview.html');assert.equal(await page.locator('.card').count(),16);assert.deepEqual(errors,[]);
 console.log('PASS: 8 Yuppie logos, mirrored lettering, curved geometry, 2 glass cases, serialization, A/B cancellation, mobile/tablet, 16 gallery orientations');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
