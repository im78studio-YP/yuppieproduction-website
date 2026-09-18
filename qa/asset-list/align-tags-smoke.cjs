const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  await page.evaluate(()=>{YPQuickSetupBridge.close();showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]'));setAssetTab('catalog');});
  await page.locator('#catalogTagFilters [data-tag="Standee"]').click();
  assert.equal(await page.locator('#objectCatalog .catalog-item[data-catalog-id^="standee-"]:visible').count(),10);
  assert.equal(await page.locator('#objectCatalog .catalog-item:visible').evaluateAll(cards=>cards.every(c=>YPAssetTags.tags(objectCatalogDef(c.dataset.catalogId)).includes('Standee'))),true);
  assert.equal(await page.locator('#catalogTagFilters [data-tag="Standee"]').getAttribute('aria-pressed'),'true');
  await page.locator('#objectCatalog [data-catalog-id="standee-03"]').click();
  assert.equal(await page.evaluate(()=>S.objects.at(-1).catalogId),'standee-03');
  await page.evaluate(()=>setAssetTab('catalog'));
  await page.screenshot({path:'qa/asset-list/catalog-tags-desktop.png'});
  for(const [mode,key] of Object.entries({left:'minX',horizontal:'centerX',right:'maxX',top:'maxY',vertical:'centerY',bottom:'minY',front:'maxZ',depth:'centerZ',back:'minZ'})){
   await page.evaluate(()=>{
    Object.assign(S,{type:'island',W:6,D:6,objects:[],stSize:'none'});
    const a=makeCatalogObject('standee-02',0,0),b=makeCatalogObject('standee-03',2,2);
    a.position={x:.75,y:.5,z:.8};a.rotationY=45;b.position={x:2,y:1.8,z:2};b.rotationY=30;
    S.objects.push(a,b);setObjectSelection([a.id,b.id],a.id);sync();setAssetTab('editor');
   });
   const before=await page.evaluate(()=>JSON.stringify(S.objects[0].position));
   await page.locator(`[data-ae-align="${mode}"]`).click();
   const bounds=await page.evaluate(()=>S.objects.map(selectedAlignmentBounds));
   assert.ok(Math.abs(bounds[0][key]-bounds[1][key])<.002,mode);
   assert.equal(await page.evaluate(()=>JSON.stringify(S.objects[0].position)),before);
   await page.evaluate(()=>undoObjectChange());
   assert.equal(await page.evaluate(()=>S.objects[1].position.x),2);
   await page.evaluate(()=>redoObjectChange());
   const again=await page.evaluate(()=>S.objects.map(selectedAlignmentBounds));assert.ok(Math.abs(again[0][key]-again[1][key])<.002);
  }
  assert.equal(await page.locator('[data-ae-align] svg').count(),9);
  assert.match(await page.locator('[data-ae-reference]').textContent(),/Standee 02/);
  await page.locator('[data-ae-reference]').scrollIntoViewIfNeeded();await page.screenshot({path:'qa/asset-list/align-icons-desktop.png'});
  await page.evaluate(()=>selectObject(S.objects[0].id));assert.equal(await page.locator('[data-ae-align]:disabled').count(),9);
  await page.evaluate(()=>{setAssetTab('my');});
  await page.locator('#myAssetName').fill('QA standee tags');
  await page.locator('#myAssetTagPicker').evaluate(el=>el.parentElement.open=true);
  await page.locator('#myAssetTagPicker input[value="Standee"]').check();await page.locator('#myAssetTagPicker input[value="จัดแสดงสินค้า"]').check();
  await page.locator('#myAssetFile').setInputFiles('public/yp-web-ai/assets/standee-imports/standee-03.glb');
  await page.waitForFunction(()=>!myAssetDimensionReadPromise);
  await page.locator('#myAssetUpload').click();await page.waitForFunction(()=>CUSTOM_ASSETS.some(a=>a.name==='QA standee tags'));
  let record=await page.evaluate(async()=>(await myAssetReadAll()).find(r=>r.name==='QA standee tags'));
  assert.deepEqual(record.tags,['Standee','จัดแสดงสินค้า']);
  await page.locator('#myAssetList .my-asset-tag-edit summary').click();
  await page.locator('#myAssetList .asset-tag-picker input[value="ทรงเหลี่ยม"]').check();
  await page.locator('#myAssetList .my-asset-tag-edit button').click();
  await page.waitForFunction(()=>CUSTOM_ASSETS.find(a=>a.name==='QA standee tags')?.tags.includes('ทรงเหลี่ยม'));
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  await page.waitForFunction(()=>CUSTOM_ASSETS.some(a=>a.name==='QA standee tags'));
  assert.equal(await page.evaluate(()=>CUSTOM_ASSETS.find(a=>a.name==='QA standee tags').tags.includes('ทรงเหลี่ยม')),true);
  await page.evaluate(()=>{document.getElementById('projectEntryDialog')?.close();YPQuickSetupBridge.close();showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]'));setAssetTab('my');});
  await page.locator('#myAssetTagFilters [data-tag="ทรงเหลี่ยม"]').click();assert.equal(await page.locator('#myAssetList .my-asset-card').count(),1);
  const restoredTags=await page.evaluate(async()=>{
    const item=CUSTOM_ASSETS.find(a=>a.name==='QA standee tags');S.objects=[makeCatalogObject(item.catalogId,0,0)];sync();
    const text=await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture()));const project=YPProjectStore.fromText(text);
    YPProjectBridge.restore(project.variants.A);return CUSTOM_ASSETS.find(a=>a.catalogId===item.catalogId).tags;
  });assert.deepEqual(restoredTags,['Standee','จัดแสดงสินค้า','ทรงเหลี่ยม']);
  await page.setViewportSize({width:390,height:900});
  await page.evaluate(()=>setAssetTab('catalog'));await page.locator('#catalogTagFilters [data-tag="Standee"]').click();
  await page.locator('#catalogTagFilters').scrollIntoViewIfNeeded();await page.screenshot({path:'qa/asset-list/catalog-tags-mobile.png'});
  assert.equal(await page.locator('#catalogTagFilters').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await page.evaluate(()=>{const a=makeCatalogObject('standee-02',0,0),b=makeCatalogObject('standee-03',2,2);S.objects=[a,b];setObjectSelection([a.id,b.id],a.id);sync();setAssetTab('editor');});
  await page.locator('[data-ae-reference]').scrollIntoViewIfNeeded();await page.screenshot({path:'qa/asset-list/align-icons-mobile.png'});
  assert.equal(await page.locator('.asset-editor-selection-card').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  assert.deepEqual(errors,[]);console.log('PASS: 9 align icons, rotated bounds, fixed reference, Undo/Redo, single-select disabled, catalog tag filtering, upload/edit/persist tags, desktop/mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
