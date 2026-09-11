const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict'),crypto=require('node:crypto');
async function asset(path,data){const bytes=Buffer.from(data),tmp=path+'.tmp',hash=b=>crypto.createHash('md5').update(b).digest('hex');await fs.writeFile(tmp,bytes);assert.equal(hash(await fs.readFile(tmp)),hash(bytes));await fs.rename(tmp,path);}
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:4173/yp-web-ai/index.html';
  await page.goto(base+'?comparePreview=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPInlineSoftWave&&window.YPInlineTemplateBridge);
  const result=await page.evaluate(async()=>{
   await YPProjectBridge.ready;YPQuickSetupBridge.close();const snap=YPInlineTemplateBridge.snapshot('soft-wave');
   YPProjectBridge.restore(snap);const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);
   for(const o of snap.spec.objects){const node=r.buildCatalogObject(o),box=new r.THREE.Box3().setFromObject(node);if(box.isEmpty()||!box.min.toArray().concat(box.max.toArray()).every(Number.isFinite))throw Error('Invalid '+o.id);}
   const serialized=await YPProjectStore.toText(YPProjectStore.create(snap,'07 · Soft Wave Pavilion'));YPProjectStore.fromText(serialized);
   const imgs=[];for(const x of [6,-.7]){
    const camera={projection:'orthographic',cameraViewType:'comparison',position:{x,y:3.4,z:13},target:{x:3,y:1.8,z:1.4},up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-3.9,right:3.9,top:2.925,bottom:-2.925}};
    const out=await exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1280,maxLongEdge:1280,download:false,assetTimeoutMs:20000});imgs.push(await new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(f.result.split(',')[1]);f.readAsDataURL(out.blob);}));
   }
   return {imgs,serialized,count:snap.spec.objects.length,chairs:snap.spec.objects.filter(o=>o.type==='chair').length,tables:snap.spec.objects.filter(o=>o.type==='table').length,W:S.W,D:S.D,H:S.H,type:S.type,editable:snap.spec.objects.every(o=>!o.locked),art:snap.spec.objects.filter(o=>o.appearance.textureData).map(o=>o.appearance.textureName)};
  });
  assert.equal(result.chairs,6);assert.equal(result.tables,2);assert.equal(result.W,6);assert.equal(result.D,3);assert.equal(result.H,3.8);assert.equal(result.type,'inline');assert.ok(result.editable);assert.equal(result.art.length,10);assert.ok(result.art.every(n=>n.startsWith('Yuppie Production')));
  await asset('public/yp-web-ai/assets/inline-templates/soft-wave.png',Buffer.from(result.imgs[0],'base64'));
  await asset('public/yp-web-ai/assets/inline-templates/soft-wave-alt.png',Buffer.from(result.imgs[1],'base64'));
  await asset('public/yp-web-ai/assets/inline-templates/soft-wave.ypbooth.json',result.serialized);
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);await page.evaluate(()=>{YPQuickSetupBridge.close();YPInlineTemplateUI.open();});
  assert.equal(await page.locator('button[data-template]').count(),7);
  const before=await page.evaluate(()=>JSON.stringify(YPProjectBridge.capture().spec));
  const other=await page.evaluate(()=>JSON.stringify(YPProjectWorkspace.capture().variants.B));
  await page.locator('[data-template="soft-wave"]').click();await page.locator('#projectCancel').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);assert.equal(await page.evaluate(()=>JSON.stringify(YPProjectBridge.capture().spec)),before);
  await page.locator('[data-template="soft-wave"]').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);assert.equal(await page.evaluate(()=>S.inlineTemplate.id),'soft-wave');
  assert.equal(await page.evaluate(()=>JSON.stringify(YPProjectWorkspace.capture().variants.B)),other);
  const floor=await page.evaluate(()=>{const original=JSON.stringify(S.objects);S.tile='woodD';sync();return {same:JSON.stringify(S.objects)===original,tile:S.tile,customFloor:S.objects.some(o=>o.structure?.design==='soft-wave-floor')};});assert.deepEqual(floor,{same:true,tile:'woodD',customFloor:false});
  await page.evaluate(()=>YPInlineTemplateUI.open());await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('.inline-template-dialog[open]').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPInlineWizard&&window.YPProjectWorkspace?.state().ready);await page.evaluate(()=>{YPQuickSetupBridge.close();YPQuickSetupBridge.open({start:'business'});quickSetupDraft.boothType='inline';YPInlineWizard.update(quickSetupDraft);});assert.equal(await page.locator('#quickTemplateChoices [data-value="soft-wave"]').count(),1);
  assert.deepEqual(errors,[]);console.log('PASS',JSON.stringify({...result,imgs:undefined,serialized:undefined}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
