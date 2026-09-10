const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPCornerTemplateUI&&YPProjectWorkspace.state().ready);
 const result=await page.evaluate(async()=>{
  YPQuickSetupBridge.close();const id='corner-luminous-beauty',a=YPCornerTemplateBridge.snapshot(id),b=YPCornerTemplateBridge.snapshot(id,{cornerSide:'left'}),t=YPCornerTemplates.templates.find(t=>t.id===id),renderer=await loadThreeRenderer();
  let branded=0;for(let i=0;i<t.objects.length;i++){
   const source=t.objects[i],o=a.spec.objects[i];
   if(source.brandLogo||source.graphic){const svg=atob(o.appearance.textureData.split(',')[1]);if(!svg.includes('xMidYMid meet')||/<text[\s>]/.test(svg)||!o.appearance.textureId.startsWith(YPTemplateBranding.revision))throw Error('Incorrect branding '+o.id);if(b.spec.objects[i].flipX)throw Error('Mirrored lettering');if(b.spec.objects[i].appearance.textureData!==o.appearance.textureData)throw Error('Logo changed on mirror');branded++;}
   if(o.structure){const model=renderer.buildCatalogObject(o);if(!model.children.length)throw Error('Missing native geometry');if(o.structure.design==='beauty-vitrine'){let panes=0;model.traverse(m=>{if(m.material?.transparent&&m.material.opacity<.3)panes++;});if(panes!==5)throw Error('Not five transparent glass panels');}}
  }
  const text=await YPProjectStore.toText(YPProjectStore.create(b,'Beauty'));YPProjectStore.fromText(text);if(!text.includes('beauty-vitrine')||!text.includes('beauty-charcoal-floor'))throw Error('Portable assets lost');
  return {branded,bottles:a.spec.objects.filter(o=>o.structure?.design==='beauty-bottle').length,height:a.spec.H,cards:YPCornerTemplates.templates.length};
 });assert.deepEqual(result,{branded:16,bottles:18,height:2.9,cards:8});
 await page.evaluate(()=>YPCornerTemplateUI.open());await page.locator('#cornerTemplateSide').selectOption('left');await page.locator('[data-corner-template="corner-luminous-beauty"]').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
 assert.equal(await page.evaluate(()=>getBoothSpec().boothTemplate.id),'corner-luminous-beauty');assert.equal(await page.evaluate(()=>getBoothSpec().cornerSide),'left');const a=await page.evaluate(()=>YPProjectWorkspace.capture().variants.A);
 await page.locator('#projectB').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
 await page.evaluate(()=>YPCornerTemplateUI.open());const b=await page.evaluate(()=>YPProjectWorkspace.capture().variants.B);await page.locator('[data-corner-template="corner-luminous-beauty"]').click();await page.locator('#projectCancel').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants.B),b);assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A),a);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#cornerTemplatesDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/assets/corner-templates/overview.html');assert.equal(await page.locator('.card').count(),16);assert.equal(await page.locator('#count').textContent(),'8');assert.deepEqual(errors,[]);
 console.log('PASS: 16 branded panels, readable mirrored logos, glass case, 18 bottles, portable assets, A/B confirmation and cancellation, mobile, 16 gallery orientations');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
