const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
// Only the renderer-populated camera cache is excluded; all authored data is compared.
const authored=s=>{const c=structuredClone(s);if(c.spec.aiRendering)delete c.spec.aiRendering.camera;return c;};
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPPeninsularBotanical&&YPProjectWorkspace.state().ready);
 const result=await page.evaluate(async()=>{
  YPQuickSetupBridge.close();const id='penin-botanical-atelier',a=YPPeninsularTemplateBridge.snapshot(id),t=YPPeninsularTemplates.templates.find(t=>t.id===id),r=await loadThreeRenderer();let logos=0;
  if(a.spec.W!==6||a.spec.D!==3||a.spec.type!=='penin')throw Error('Wrong footprint/type');
  for(let i=0;i<t.objects.length;i++){const src=t.objects[i],o=a.spec.objects[i];if(src.brandLogo||src.graphic?.startsWith('botanical-')){
   const svg=atob(o.appearance.textureData.split(',')[1]);if(!svg.includes('xMidYMid meet')||/<text[\s>]/.test(svg)||!o.appearance.textureId.startsWith(YPTemplateBranding.revision))throw Error('Branding '+o.id);const im=new Image();im.src=o.appearance.textureData;await im.decode();logos++;
  }
  if(o.structure?.design?.startsWith('botanical-')){const model=r.buildCatalogObject(o),b=new r.THREE.Box3().setFromObject(model);if(b.isEmpty()||![...b.min.toArray(),...b.max.toArray()].every(Number.isFinite))throw Error('Invalid geometry '+o.id);}
  }
  const text=await YPProjectStore.toText(YPProjectStore.create(a,'Botanical'));const saved=YPProjectStore.fromText(text);if(!text.includes('botanical-helix-display')||!text.includes('data:image/'))throw Error('Nonportable artwork');
  YPProjectBridge.restore(a);
  const camera={projection:'orthographic',cameraViewType:'comparison',position:{x:10,y:4.5,z:12},target:{x:3,y:1.65,z:1.4},up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-4.2,right:4.2,top:3.15,bottom:-3.15}};
  const capture=await exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1280,maxLongEdge:1280,download:false,assetTimeoutMs:20000});const png=await new Promise(resolve=>{const rd=new FileReader();rd.onload=()=>resolve(rd.result.split(',')[1]);rd.readAsDataURL(capture.blob);});
  return {logos,cards:YPPeninsularTemplates.templates.length,png};
 });assert.equal(result.logos,6);assert.equal(result.cards,18);await fs.writeFile('public/yp-web-ai/assets/peninsular-templates/penin-botanical-atelier-alt.png',Buffer.from(result.png,'base64'));
 await page.locator('#projectA').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);await page.evaluate(()=>YPPeninsularTemplateUI.open());await page.locator('[data-penin-template="penin-botanical-atelier"]').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);assert.equal(await page.evaluate(()=>getBoothSpec().boothTemplate.id),'penin-botanical-atelier');const a=await page.evaluate(()=>YPProjectWorkspace.capture().variants.A);
 await page.locator('#projectB').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);await page.evaluate(()=>YPPeninsularTemplateUI.open());const b=await page.evaluate(()=>YPProjectWorkspace.capture().variants.B);
 await page.locator('[data-penin-template="penin-botanical-atelier"]').click();await page.locator('#projectCancel').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);assert.deepEqual(authored(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A)),authored(a));assert.deepEqual(authored(await page.evaluate(()=>YPProjectWorkspace.capture().variants.B)),authored(b));
 for(const width of [390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.locator('dialog[open]').evaluate(d=>d.scrollWidth<=d.clientWidth+1));}
 await page.goto('http://127.0.0.1:4173/yp-web-ai/assets/peninsular-templates/overview.html');assert.equal(await page.locator('.card').count(),18);assert.deepEqual(errors,[]);console.log('PASS: 6 actual Yuppie logos, 6x3 Peninsular, native geometry, embedded artwork, second view, A/B confirmation/cancel, mobile/tablet, 18 cards');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
