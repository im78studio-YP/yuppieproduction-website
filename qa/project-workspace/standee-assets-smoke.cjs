const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const counters=process.argv.includes('--counter-set')||process.argv.includes('--counter-set-02');
const config=process.argv.includes('--counter-set-02')?{globalName:'YPCounterSet02Assets',prefix:'counter-set-02-',count:6,selected:['01','03'],screenshot:'counter-set-02'}:counters?{globalName:'YPCounterSetAssets',prefix:'counter-set-01-',count:8,selected:['01','02'],screenshot:'counter-set-01'}:{globalName:'YPStandeeAssets',prefix:'standee-',count:10,selected:['03','04'],screenshot:'standee'};
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 const sizes=await page.evaluate(async config=>{
  YPQuickSetupBridge.close();Object.assign(S,{type:'island',W:6,D:6,objects:[],stSize:'none',lights:false});sync();const r=await loadThreeRenderer(),T=r.THREE,out=[];
  for(const item of window[config.globalName]){
   r.requestFurnitureTemplate(item);await Promise.all([...r.furnitureLoads.values()]);if(!r.furnitureTemplates.has(item.catalogId))throw Error('Missing model '+item.catalogId);
   const obj=makeCatalogObject(item.catalogId,0,0),root=r.buildCatalogObject(obj),box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());
   let meshes=0;root.traverse(n=>{if(n.isMesh)meshes++;});
   out.push({id:item.catalogId,size:size.toArray(),expected:[item.size.w,item.size.h,item.size.d],base:box.min.y,mode:obj.appearance.mode,meshes});
  }
  showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]'));setAssetTab('catalog');return out;
 },config);
 assert.equal(sizes.length,config.count);for(const s of sizes){s.size.forEach((v,i)=>assert.ok(Math.abs(v-s.expected[i])<.003,JSON.stringify(s)));assert.ok(Math.abs(s.base)<.003);assert.equal(s.mode,'original');}
 if(config.globalName==='YPCounterSet02Assets')assert.deepEqual(sizes.map(s=>s.meshes),[3,3,3,2,2,2]);
 if(counters)await page.locator('#catalogTagFilters [data-tag="เคาน์เตอร์"]').click();
 const cards=page.locator(`#objectCatalog [data-catalog-id^="${config.prefix}"]`);assert.equal(await cards.count(),config.count);
 assert.equal(await cards.evaluateAll(items=>items.every(item=>!item.hidden)),true);
 await cards.locator('img').evaluateAll(async imgs=>{imgs.forEach(i=>i.loading='eager');await Promise.all(imgs.map(i=>i.decode()));});
 assert.equal(await cards.locator('img').evaluateAll(imgs=>imgs.every(i=>i.naturalWidth===320)),true);
 for(const number of config.selected)await page.locator(`[data-catalog-id="${config.prefix}${number}"]`).click();
 const ids=await page.evaluate(()=>S.objects.map(o=>o.id));assert.equal(ids.length,2);assert.notEqual(ids[0],ids[1]);
 const result=await page.evaluate(async ids=>{
  await threeRenderer.waitForSceneAssets(15000,BoothSpec);const other=JSON.stringify(objectById(ids[1]));selectObject(ids[0]);fineMoveSelectedObjects('x',.05);flipSelectedObject('z');
  const independent=JSON.stringify(objectById(ids[1]))===other,parts=YPAssetParts.entries(threeRenderer.objectMeshes.get(ids[1])).length;
  const text=await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture())),project=YPProjectStore.fromText(text);YPProjectBridge.restore(project.variants[project.active]);
  return{independent,parts,ids:S.objects.map(o=>o.catalogId),grouped:S.objects.some(o=>!!o.groupId),flip:S.objects[0].transform.flipZ};
 },ids);
 assert.equal(result.independent,true);assert.ok(result.parts>=2);assert.deepEqual(result.ids,config.selected.map(number=>config.prefix+number));assert.equal(result.grouped,false);assert.equal(result.flip,true);
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:950});await page.evaluate(()=>{showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]'));setAssetTab('catalog');});
  await page.locator(`[data-catalog-id="${config.prefix}${config.selected[0]}"]`).scrollIntoViewIfNeeded();await page.screenshot({path:`qa/project-workspace/${config.screenshot}-catalog-${width}.png`});
  assert.equal(await page.locator('#objectCatalog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
 }
 assert.deepEqual(errors,[]);console.log('PASS '+config.count+' standalone GLBs, source dimensions, grounded, thumbnails, independent selection/move/flip, editable subparts, save/reopen, desktop/mobile');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
