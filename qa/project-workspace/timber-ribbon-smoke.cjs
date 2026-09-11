const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict'),crypto=require('node:crypto');
async function writeAsset(path,data){const bytes=Buffer.isBuffer(data)?data:Buffer.from(data),temp=path+'.tmp',hash=b=>crypto.createHash('md5').update(b).digest('hex');await fs.writeFile(temp,bytes);assert.equal(hash(await fs.readFile(temp)),hash(bytes));await fs.rename(temp,path);}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:4173/yp-web-ai/index.html';
  await page.goto(base+'?comparePreview=1');await page.waitForFunction(()=>window.YPInlineTemplateBridge);
  const result=await page.evaluate(async()=>{
   await YPProjectBridge.ready;YPQuickSetupBridge.close();
   const snapshot=YPInlineTemplateBridge.snapshot('timber-ribbon'),project=YPProjectStore.create(snapshot,'06 · Timber Ribbon');
   const serialized=await YPProjectStore.toText(project);YPProjectStore.fromText(serialized);
   YPProjectBridge.restore(snapshot);const renderer=await loadThreeRenderer();
   for(const object of snapshot.spec.objects.filter(o=>o.structure?.design)){
    const root=renderer.buildCatalogObject(object),box=new renderer.THREE.Box3().setFromObject(root);
    if(box.isEmpty()||![...box.min.toArray(),...box.max.toArray()].every(Number.isFinite))throw new Error('Invalid detailed geometry: '+object.structure.design);
   }
   if(JSON.stringify(YPProjectBridge.capture().spec.objects.map(o=>o.structure||null))!==JSON.stringify(snapshot.spec.objects.map(o=>o.structure||null)))throw new Error('Detailed styles lost on restore');
   const camera={projection:'orthographic',cameraViewType:'comparison',position:{x:5,y:7,z:14},target:{x:3,y:1.1,z:1.4},up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-3.7,right:3.7,top:2.775,bottom:-2.775}};
   const image=await exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1280,maxLongEdge:1280,download:false,assetTimeoutMs:20000});
   const png=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(image.blob);});
   return {png,serialized};
  });
  await writeAsset('public/yp-web-ai/assets/inline-templates/timber-ribbon.png',Buffer.from(result.png,'base64'));
  await writeAsset('public/yp-web-ai/assets/inline-templates/timber-ribbon.ypbooth.json',result.serialized);
  await page.goto(base);await page.waitForFunction(()=>YPProjectWorkspace?.state().ready);await page.evaluate(()=>{YPQuickSetupBridge.close();YPInlineTemplateUI.open();});
  assert.equal(await page.locator('button[data-template]').count(),await page.evaluate(()=>YPInlineTemplates.templates.length));
  await page.locator('[data-template="timber-ribbon"]').click();await page.locator('#projectCancel').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
  await page.locator('[data-template="timber-ribbon"]').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
  assert.equal(await page.evaluate(()=>getBoothSpec().inlineTemplate.id),'timber-ribbon');
  assert.equal(await page.evaluate(()=>getBoothSpec().objects.some(o=>o.type==='trailingPlant')),false);
  await page.evaluate(()=>YPInlineTemplateUI.open());await page.setViewportSize({width:390,height:844});
  assert.ok(await page.locator('.inline-template-dialog[open]').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
  await page.goto(new URL('assets/inline-templates/overview.html',base).href);await page.locator('img[src="timber-ribbon.png"]').evaluate(i=>i.decode());
  assert.deepEqual(errors,[]);console.log('PASS: rendered portable Inline template, library cards, apply/cancel, mobile and overview');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
