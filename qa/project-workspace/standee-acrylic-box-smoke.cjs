const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const hash=p=>crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
assert.equal(hash('../Asset/Counters/Standee_ArcylicBox.glb'),hash('public/yp-web-ai/assets/structure-imports/standee-acrylic-box.glb'),'source preserved exactly');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(()=>{YPQuickSetupBridge.close();S.objects=[];showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]'));});
 const card=page.locator('#objectCatalog [data-catalog-id="imported-standee-acrylic-box"]');
 await card.scrollIntoViewIfNeeded();assert.match(await card.innerText(),/Standee_ArcylicBox/);
 await card.locator('img').evaluate(async img=>{img.loading='eager';await img.decode();if(img.naturalWidth!==320)throw Error('Thumbnail missing');});
 await card.click();
 const result=await page.evaluate(async()=>{
  const obj=S.objects.find(o=>o.catalogId==='imported-standee-acrylic-box');if(!obj)throw Error('Not added');
  const r=await loadThreeRenderer();await r.waitForSceneAssets(15000,BoothSpec);
  function inspect(object){
   const mesh=r.objectMeshes.get(object.id),parts=YPAssetParts.entries(mesh);
   if(parts.length!==3)throw Error('Missing parts');
   const details=parts.map(e=>({name:e.original.name,transparent:e.original.transparent,opacity:e.original.opacity,color:e.original.color?.getHexString()}));
   if(details.filter(m=>m.transparent&&m.opacity<.2).length!==1)throw Error('Clear acrylic must remain transparent');
   if(details.filter(m=>!m.transparent&&m.opacity===1).length!==2)throw Error('Base must remain opaque');
   return details;
  }
  const before=inspect(obj);
  const project=YPProjectStore.fromText(await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture())));
  YPProjectBridge.restore(project.variants.A);await r.waitForSceneAssets(15000,BoothSpec);
  const saved=S.objects.find(o=>o.catalogId==='imported-standee-acrylic-box');if(!saved)throw Error('Project lost asset');
  const after=inspect(saved);selectObject(saved.id);openAssetSettings();return{size:saved.size,before,after};
 });
 assert.deepEqual(result.size,{w:.4,d:.4,h:.95});assert.deepEqual(result.before,result.after);
 await page.locator('.asset-parts-dialog canvas').waitFor();
 await page.screenshot({path:'qa/project-workspace/standee-acrylic-box-editor.png'});
 await page.keyboard.press('Escape');
 await page.evaluate(()=>showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]')));
 await card.scrollIntoViewIfNeeded();await page.screenshot({path:'qa/project-workspace/standee-acrylic-box-catalog.png'});
 assert.deepEqual(errors,[]);console.log('PASS acrylic catalogue/preview/add/3 parts/transparent top/opaque base/dimensions/project round-trip',JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
