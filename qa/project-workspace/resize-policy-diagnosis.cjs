// Diagnostic only: isolated browser context; no production changes.
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage();await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.YPPeninsularTemplateBridge&&YPProjectWorkspace.state().ready,undefined,{timeout:60000});
 const evidence=await page.evaluate(async()=>{
  YPQuickSetupBridge.close();YPProjectBridge.restore(YPPeninsularTemplateBridge.snapshot('penin-oak-gallery-6'));await loadThreeRenderer();
  const beam=S.objects.find(o=>o.structure?.design==='oak-wood'&&o.size.d===5.72);selectObject(beam.id);
  const blocked=S.objects.filter(o=>!o.transformPolicy.canResize),byCatalog={};for(const o of blocked)byCatalog[o.catalogId]=(byCatalog[o.catalogId]||0)+1;
  const catalog=objectCatalogDef(beam.catalogId),original={id:beam.id,locked:objectLocked(beam),selected:selectedObjectIds(),size:{...beam.size},geometryMode:beam.geometryMode,policy:{...beam.transformPolicy},buttonDisabled:document.getElementById('btnResizeObject').disabled,catalog:{type:catalog.type,category:catalog.category,capabilities:catalog.capabilities||null}},total=S.objects.length;
  // Hypothesis probe in this isolated context only, not in source or user's draft.
  beam.transformPolicy.canResize=true;selectObject(beam.id);const enabled=!document.getElementById('btnResizeObject').disabled;
  return{original,enabled,total,blocked:blocked.length,byCatalog,limits:{max:MAX_ASSET_DIMENSION},beamId:beam.id};
 });
 console.log(JSON.stringify(evidence,null,2));assert.equal(evidence.original.buttonDisabled,true);assert.equal(evidence.original.locked,false);assert.equal(evidence.original.policy.canResize,false);assert.equal(evidence.enabled,true);
 await page.locator('#btnResizeObject').click();assert.equal(await page.locator('#resizeValued').inputValue(),'5.72');
 await page.locator('#resizeValued').fill('5.5');await page.locator('[data-resize-apply="d"]').click();console.log('numericLimit',await page.locator('#resizeSubmenuStatus').textContent());assert.equal(await page.locator('#resizeValued').getAttribute('aria-invalid'),'true');
 await page.evaluate(()=>YPResizeSubmenu.close());
 const resize=await page.evaluate(id=>{const obj=objectById(id),before=obj.size.h;document.getElementById('assetSizeLock').checked=false;updateSelectedObjectSize('h',.5);let height=null;const root=threeRenderer.objectMeshes.get(id);root.traverse(m=>{if(m.geometry?.type==='BoxGeometry')height=m.geometry.parameters.height;});return{before,after:obj.size.h,meshHeight:height};},evidence.beamId);
 console.log('geometryProbe',resize);assert.equal(resize.after,.5);assert.equal(resize.meshHeight,.5);
 console.log('PASS reproduced disabled panel policy and 5 m input limit; underlying beam geometry resizes');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
