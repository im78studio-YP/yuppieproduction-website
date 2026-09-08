const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
  const p=await b.newPage();await p.goto('http://127.0.0.1:4173/yp-web-ai/index.html?comparePreview=1');await p.waitForFunction(()=>window.YPInlineTemplateBridge);
  const result=await p.evaluate(async()=>{await YPProjectBridge.ready;YPQuickSetupBridge.close();YPProjectBridge.restore(YPInlineTemplateBridge.snapshot('gallery'));const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);const im=r.brandImages.get(S.logo),texture=r.brandTexture(S,'#ffffff');
    const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=300;canvas.getContext('2d').drawImage(im,0,0,1000,252);
    return {natural:[im.naturalWidth,im.naturalHeight],bounds:im._ypVisibleAlphaBounds,texture:texture.image.toDataURL().split(',')[1],original:canvas.toDataURL().split(',')[1]};});
  fs.writeFileSync('qa/project-workspace/logo-texture.png',Buffer.from(result.texture,'base64'));fs.writeFileSync('qa/project-workspace/logo-canvas.png',Buffer.from(result.original,'base64'));delete result.texture;delete result.original;console.log(result);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
