const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base='http://127.0.0.1:4173/yp-web-ai/',id='corner-timber-lounge';
async function writeAsset(path,data){const tmp=path+'.tmp',bytes=Buffer.isBuffer(data)?data:Buffer.from(data);await fs.writeFile(tmp,bytes);const hash=b=>crypto.createHash('md5').update(b).digest('hex');assert.equal(hash(await fs.readFile(tmp)),hash(bytes));await fs.rename(tmp,path);}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'index.html?comparePreview=1');await page.waitForFunction(()=>window.YPCornerTemplateBridge);await page.evaluate(async()=>{await YPProjectBridge.ready;YPQuickSetupBridge.close();});
  for(const side of ['right','left']){
    const result=await page.evaluate(async({id,side})=>{
      const snap=YPCornerTemplateBridge.snapshot(id,{cornerSide:side}),serialized=await YPProjectStore.toText(YPProjectStore.create(snap,id));YPProjectStore.fromText(serialized);YPProjectBridge.restore(snap);const renderer=await loadThreeRenderer();if(!await renderer.waitForSceneAssets(20000))throw new Error('Assets not ready');
      const camera={projection:'orthographic',cameraViewType:'comparison',position:{x:side==='right'?8:-2,y:5.9,z:12},target:{x:3,y:1,z:1.25},up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-4.35,right:4.35,top:3.2625,bottom:-3.2625}};
      const shot=await exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1280,maxLongEdge:1280,download:false,assetTimeoutMs:20000});
      for(const o of snap.spec.objects.filter(o=>o.type==='barStool'))if(!renderer.objectMeshes.get(o.id))throw new Error('Missing bar stool');
      const png=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(shot.blob);});return {png,serialized,side:typ().walls};
    },{id,side});
    assert.deepEqual(result.side,side==='right'?['back','left']:['back','right']);
    await writeAsset('public/yp-web-ai/assets/corner-templates/'+id+'-'+side+'.png',Buffer.from(result.png,'base64'));console.log('RENDERED',side);
  }
  await page.goto(base+'index.html');await page.waitForFunction(()=>window.YPInlineWizard&&YPProjectWorkspace.state().ready);await page.locator('#releaseStart').click();await page.locator('#quickBusinessNext').click();await page.locator('#quickBoothTypes [data-value=corner]').click();assert.equal(await page.locator('#quickTemplateChoices [role=radio]').count(),2);
  const original=await page.evaluate(()=>getBoothSpec().objects);
  await page.locator('#quickTemplateChoices [data-value='+id+']').click();await page.locator('#quickCornerSides [data-value=left]').click();assert.ok((await page.locator('#quickTemplateImage').getAttribute('src')).endsWith('-left.png'));assert.deepEqual(await page.evaluate(()=>getBoothSpec().objects),original);
  await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#quickInlineTemplates').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.setViewportSize({width:1440,height:1050});
  await page.locator('#quickLayoutNext').click();await page.locator('#quickBrandNext').click();await page.locator('#quickFloorNext').click();await page.locator('#quickRoomFinish').click();await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open&&!YPProjectWorkspace.state().busy);
  assert.equal(await page.evaluate(()=>getBoothSpec().cornerSide),'left');assert.equal(await page.evaluate(()=>getBoothSpec().boothTemplate.id),id);
  await page.evaluate(()=>{const s=YPProjectBridge.capture();s.spec.objects[0].position.x=4.1;s.spec.objects[0].appearance.color='#abcdef';YPProjectBridge.restore(s);document.querySelector('#oCornerSide [data-k=right]').click();});
  const mirrored=await page.evaluate(()=>getBoothSpec());assert.ok(Math.abs(mirrored.objects[0].position.x-1.9)<1e-9);assert.equal(mirrored.objects[0].appearance.color,'#abcdef');assert.equal(mirrored.cornerSide,'right');
  await page.evaluate(()=>YPCornerTemplateUI.open());await page.locator('#cornerTemplateSide').selectOption('left');assert.ok((await page.locator('#cornerCards img').getAttribute('src')).endsWith('-left.png'));await page.locator('[data-corner-template]').click();await page.waitForFunction(()=>!YPProjectWorkspace.state().busy&&YPProjectWorkspace.state().active==='B');assert.equal(await page.evaluate(()=>getBoothSpec().cornerSide),'left');assert.equal(await page.locator('#cornerCards a').count(),0);
  assert.deepEqual(errors,[]);
  for(const side of ['left','right']){const ctx=await browser.newContext(),p=await ctx.newPage();await p.goto(base+'assets/corner-templates/overview.html');assert.equal(await p.locator('.use-template').count(),2);assert.equal(await p.locator('[download]').count(),0);await p.locator('.use-template[href$="cornerSide='+side+'"]').click();await p.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&!YPProjectWorkspace.state().busy&&!document.getElementById('templateEntryDialog').open);assert.equal(await p.evaluate(()=>getBoothSpec().cornerSide),side);assert.equal(new URL(p.url()).searchParams.has('cornerSide'),false);await ctx.close();}
  console.log('PASS Corner: both renders, mirror preserving edits, Wizard/mobile, gallery, A/B, overview deep links');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
