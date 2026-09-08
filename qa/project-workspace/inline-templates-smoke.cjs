const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
async function writeAsset(path,data){const temp=path+'.tmp',bytes=Buffer.isBuffer(data)?data:Buffer.from(data);await fs.writeFile(temp,bytes);const hash=b=>crypto.createHash('md5').update(b).digest('hex');assert.equal(hash(await fs.readFile(temp)),hash(bytes));await fs.rename(temp,path);}
const base=process.env.INLINE_URL||'http://127.0.0.1:4173/yp-web-ai/index.html';
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'?comparePreview=1');await page.waitForFunction(()=>window.YPInlineTemplateBridge&&window.YPProjectBridge);await page.evaluate(async()=>{await YPProjectBridge.ready;YPQuickSetupBridge.close();});
    const ids=await page.evaluate(()=>YPInlineTemplates.templates.map(t=>t.id));
    const output='public/yp-web-ai/assets/inline-templates';await fs.mkdir(output,{recursive:true});
    for(const id of process.env.INLINE_SKIP_RENDER?[]:ids){
      const result=await page.evaluate(async id=>{
        const snapshot=YPInlineTemplateBridge.snapshot(id),project=YPProjectStore.create(snapshot,YPInlineTemplates.templates.find(t=>t.id===id).name);
        const serialized=await YPProjectStore.toText(project);await YPProjectStore.fromText(serialized);
        YPProjectBridge.restore(snapshot);const renderer=await loadThreeRenderer();
        // Shared camera framing shows the full fixed 6 x 3 footprint and interior.
        const camera={projection:'orthographic',cameraViewType:'comparison',position:{x:6,y:7,z:14},target:{x:3,y:1,z:1.25},up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-4.6,right:4.6,top:3.45,bottom:-3.45}};
        const image=await exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1280,maxLongEdge:1280,download:false,assetTimeoutMs:20000});
        const png=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(image.blob);});
        return {png,serialized,objects:snapshot.spec.objects.length,geometry:YPProjectBridge.handoffGeometry(snapshot.spec)};
      },id);
      await writeAsset(output+'/'+id+'.png',Buffer.from(result.png,'base64'));await writeAsset(output+'/'+id+'.ypbooth.json',result.serialized);
      console.log('RENDERED',id,result.objects+' objects');
    }
    assert.deepEqual(errors,[]);await page.close();
    const editor=await browser.newPage({viewport:{width:1440,height:1000}});
    await editor.goto(base);await editor.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&window.YPInlineTemplateUI);await editor.evaluate(()=>YPQuickSetupBridge.close());
    // Standard Chrome blocks the editor's existing local ESM drag module on file://.
    // Here verify file-based template data/UI; actual 3D generation uses the isolated renderer above.
    if(!base.startsWith('file:'))await editor.waitForFunction(()=>document.querySelector('#view canvas')&&YPProjectBridge.capture().spec.aiRendering.camera&&YPProjectBridge.capture().spec.logoVisibleBounds,{},{timeout:60000});
    await editor.evaluate(()=>YPInlineTemplateUI.open());assert.equal(await editor.locator('[data-template]').count(),5);
    await editor.locator('.inline-template-card img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()));});
    await editor.screenshot({path:'qa/project-workspace/inline-templates-gallery.png',fullPage:false});
    const before=await editor.evaluate(()=>YPProjectWorkspace.capture().variants.A);
    await editor.locator('[data-template=gallery]').click();await editor.waitForFunction(()=>YPProjectWorkspace.state().active==='B'&&!YPProjectWorkspace.state().busy);
    assert.deepEqual(await editor.evaluate(()=>YPProjectWorkspace.capture().variants.A),before);
    assert.equal(await editor.evaluate(()=>YPProjectWorkspace.capture().variants.B.spec.inlineTemplate.id),'gallery');
    await editor.evaluate(()=>YPInlineTemplateUI.open());await editor.locator('[data-template=retail]').click();await editor.locator('#projectCancel').click();
    await editor.waitForFunction(()=>!YPProjectWorkspace.state().busy);assert.equal(await editor.evaluate(()=>YPProjectWorkspace.state().active),'B');
    assert.deepEqual(await editor.evaluate(()=>YPProjectWorkspace.capture().variants.A),before);
    await editor.setViewportSize({width:390,height:844});await editor.screenshot({path:'qa/project-workspace/inline-templates-mobile.png'});
    assert.ok(await editor.locator('.inline-template-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
    const preservedB=await editor.evaluate(()=>YPProjectWorkspace.capture().variants.B);
    await editor.locator('[data-template=retail]').click();await editor.locator('#projectConfirm').click();await editor.waitForFunction(()=>!YPProjectWorkspace.state().busy&&YPProjectWorkspace.state().active==='A');
    assert.equal(await editor.evaluate(()=>YPProjectWorkspace.capture().variants.A.spec.inlineTemplate.id),'retail');
    assert.deepEqual(await editor.evaluate(()=>YPProjectWorkspace.capture().variants.B),preservedB);
    const sheet=await browser.newPage({viewport:{width:1680,height:1380}});await sheet.goto(new URL('assets/inline-templates/overview.html',base).href);
    await sheet.locator('.card img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()));});
    await sheet.screenshot({path:'qa/project-workspace/inline-templates-overview.png',fullPage:true});
    console.log('PASS: five renders, portable files, original preserved, overwrite cancellation, mobile gallery');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
