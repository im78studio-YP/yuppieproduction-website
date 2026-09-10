const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPPeninsularTemplateBridge&&YPProjectWorkspace.state().ready);
 const result=await page.evaluate(async()=>{
  YPQuickSetupBridge.close();await YPProjectBridge.ready;const snapshot=YPPeninsularTemplateBridge.snapshot('penin-botanical-atelier');YPProjectBridge.restore(snapshot);const r=await loadThreeRenderer();
  r.setCameraView('perspective_front_right');
  const background=r.scene.background.getHexString(),ground=r.scene.getObjectByName('scene-ground'),light=r.scene.children.find(o=>o.isHemisphereLight);
  if(!ground.receiveShadow)throw Error('Ground lost contact shadows');
  const before=JSON.stringify(getBoothSpec().objects),exposure=r.renderer.toneMappingExposure;
  await exportCleanScreenshot({aspectRatio:4/3,minLongEdge:800,maxLongEdge:800,download:false,assetTimeoutMs:20000});
  if(r.scene.background.getHexString()!==background||!r.scene.getObjectByName('scene-ground').visible)throw Error('Export did not restore studio');
  if(JSON.stringify(getBoothSpec().objects)!==before)throw Error('Lighting changed design');
  r.renderer.render(r.scene,r.camera);
  return {background,ground:ground.material.color.getHexString(),light:light.intensity,exposure};
 });assert.deepEqual(result,{background:'d5d5d3',ground:'bab9b4',light:.80,exposure:1.05});
 await page.locator('.three-shell').screenshot({path:'qa/project-workspace/bright-studio-desktop.png'});
 for(const width of [390,768]){await page.setViewportSize({width,height:844});await page.locator('.three-host canvas').waitFor({state:'visible'});assert.ok(await page.locator('.three-host canvas').evaluate(c=>c.width>0&&c.height>0));}
 assert.deepEqual(errors,[]);console.log('PASS: light studio background, floor shadows, soft bounce, unchanged exposure/design, export restoration, mobile/tablet');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
