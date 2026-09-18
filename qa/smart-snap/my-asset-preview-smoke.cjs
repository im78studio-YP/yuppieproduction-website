const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  const open=()=>page.evaluate(()=>{YPQuickSetupBridge.close();showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]'));setAssetTab('my');});
  await open();
  await page.locator('#myAssetFile').setInputFiles('public/yp-web-ai/assets/furniture/counter-standard.glb');
  await page.waitForFunction(()=>!myAssetDimensionReadPromise&&pendingMyAssetFile);
  await page.locator('#myAssetUpload').click();
  await page.waitForFunction(()=>document.querySelector('#myAssetList img')?.naturalWidth===192);
  const stored=await page.evaluate(async()=>{const rows=await myAssetReadAll();return rows.map(r=>({id:r.id,thumbnail:r.thumbnail,size:r.file.size}));});
  assert.equal(stored.length,1);assert.match(stored[0].thumbnail,/^data:image\//);assert.ok(stored[0].size>0);
  await page.locator('#myAssetList').screenshot({path:'qa/smart-snap/my-asset-preview-desktop.png'});
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);await open();
  await page.waitForFunction(()=>document.querySelector('#myAssetList img')?.naturalWidth===192);
  assert.equal(await page.locator('#myAssetList img').getAttribute('src'),stored[0].thumbnail,'reload uses stored preview');
  await page.evaluate(async()=>{
   const file=await(await fetch('assets/structure-imports/wall-shelf-01.glb')).blob();
   await myAssetPut({id:'legacy-preview',name:'Legacy shelf',file,size:{w:1,d:.3,h:2.4},createdAt:1});
   await myAssetPut({id:'broken-preview',name:'Unreadable GLB',file:new Blob(['invalid']),size:{w:1,d:1,h:1},createdAt:2});
   await loadMyAssets();
  });
  await page.waitForFunction(()=>document.querySelector('[data-catalog-id="legacy-preview"] img')?.naturalWidth===192);
  await page.waitForFunction(()=>document.querySelector('[data-catalog-id="broken-preview"] .my-asset-icon')?.textContent==='GLB');
  assert.ok(await page.evaluate(async()=>(await myAssetReadAll()).find(r=>r.id==='legacy-preview').thumbnail),'legacy preview saved');
  // Thumbnail-only persistence must never resurrect a deleted asset.
  await page.evaluate(async()=>{await myAssetRemove('legacy-preview');await myAssetSavePreview('legacy-preview','data:image/webp;base64,test');});
  assert.equal(await page.evaluate(async()=>(await myAssetReadAll()).some(r=>r.id==='legacy-preview')),false);
  await page.setViewportSize({width:390,height:844});await page.locator('#myAssetList').screenshot({path:'qa/smart-snap/my-asset-preview-mobile.png'});
  await page.locator(`[data-catalog-id="${stored[0].id}"]`).getByRole('button',{name:'เพิ่ม',exact:true}).click();
  assert.equal(await page.evaluate(id=>S.objects.some(o=>o.catalogId===id),stored[0].id),true,'preview card still adds asset');
  assert.deepEqual(errors,[]);console.log('PASS upload preview, reload persistence, legacy backfill, invalid fallback, deletion safety, add asset');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
