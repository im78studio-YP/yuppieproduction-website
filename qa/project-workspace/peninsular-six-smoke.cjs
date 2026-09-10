const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict'),crypto=require('node:crypto');
async function writeAsset(path,data){const bytes=Buffer.isBuffer(data)?data:Buffer.from(data),temp=path+'.tmp',hash=b=>crypto.createHash('md5').update(b).digest('hex');await fs.writeFile(temp,bytes);assert.equal(hash(await fs.readFile(temp)),hash(bytes));await fs.rename(temp,path);}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:4173/yp-web-ai/index.html';
  await page.goto(base+'?comparePreview=1');await page.waitForFunction(()=>window.YPPeninsularTemplateBridge);
  for(const id of ['penin-blue-horizon-6','penin-noir-mobile-6']){
   const result=await page.evaluate(async id=>{
    await YPProjectBridge.ready;YPQuickSetupBridge.close();const snapshot=YPPeninsularTemplateBridge.snapshot(id);
    if(snapshot.spec.W!==6||snapshot.spec.D!==6)throw Error('Not native 6x6');
    const serialized=await YPProjectStore.toText(YPProjectStore.create(snapshot,id));YPProjectStore.fromText(serialized);
    YPProjectBridge.restore(snapshot);const renderer=await loadThreeRenderer();
    for(const o of snapshot.spec.objects.filter(o=>o.structure?.design)){const m=renderer.buildCatalogObject(o),box=new renderer.THREE.Box3().setFromObject(m);if(box.isEmpty()||![...box.min.toArray(),...box.max.toArray()].every(Number.isFinite))throw Error('Invalid '+o.id);}
    const camera={projection:'orthographic',cameraViewType:'comparison',position:{x:id.includes('blue')?-4:-3,y:id.includes('blue')?10:4.5,z:id.includes('blue')?13:15},target:{x:3,y:1.65,z:2.7},up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-4.9,right:4.9,top:3.675,bottom:-3.675}};
    const image=await exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1280,maxLongEdge:1280,download:false,assetTimeoutMs:20000});
    const png=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(image.blob);});return {png,serialized};
   },id);
   await writeAsset('public/yp-web-ai/assets/peninsular-templates/'+id+'.png',Buffer.from(result.png,'base64'));await writeAsset('public/yp-web-ai/assets/peninsular-templates/'+id+'.ypbooth.json',result.serialized);console.log('RENDERED',id);
  }
  await page.goto(base);await page.waitForFunction(()=>YPProjectWorkspace?.state().ready);await page.evaluate(()=>{YPQuickSetupBridge.close();YPPeninsularTemplateUI.open();});
  assert.equal(await page.locator('[data-penin-template]').count(),17);
  await page.locator('[data-penin-template="penin-blue-horizon-6"]').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
  assert.equal(await page.evaluate(()=>getBoothSpec().D),6);const a=await page.evaluate(()=>YPProjectWorkspace.capture().variants.A);
  await page.locator('#projectB').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);await page.evaluate(()=>YPPeninsularTemplateUI.open());
  await page.locator('[data-penin-template="penin-noir-mobile-6"]').click();await page.locator('#projectCancel').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
  await page.locator('[data-penin-template="penin-noir-mobile-6"]').click();await page.locator('#projectConfirm').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy);
  assert.equal(await page.evaluate(()=>getBoothSpec().boothTemplate.id),'penin-noir-mobile-6');assert.equal(await page.evaluate(()=>getBoothSpec().D),6);assert.deepEqual(await page.evaluate(()=>YPProjectWorkspace.capture().variants.A),a);
  await page.evaluate(()=>YPPeninsularTemplateUI.open());await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('.inline-template-dialog[open]').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
  await page.goto(new URL('assets/peninsular-templates/overview.html',base).href);assert.equal(await page.locator('.card').count(),17);await page.locator('img[src^="penin-noir-mobile-6.png"]').evaluate(i=>i.decode());
  assert.deepEqual(errors,[]);console.log('PASS: two 6x6 renders and portable files, selection, cancel, A/B, mobile and overview');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
