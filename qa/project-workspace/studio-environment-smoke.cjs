const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|webgl|GL_INVALID|THREE/i.test(m.text()))errors.push(m.text());});
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.YPStudioEnvironment&&window.YPIslandTemplateBridge&&YPProjectWorkspace.state().ready,null,{timeout:60000});
 console.log('ready');
 const result=await page.evaluate(async()=>{
  YPQuickSetupBridge.close();YPProjectBridge.restore(YPIslandTemplateBridge.snapshot('island-yellow-frame'));
  const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);const original=JSON.stringify(S.objects),floor=S.floor,tile=S.tile;
  r.cancelCameraTransition();r.camera=r.perspectiveCamera;r.controls.object=r.camera;r.camera.position.set(10,5.3,12);r.controls.target.set(3,1.35,3);r.camera.lookAt(r.controls.target);r.updateCameraAspect(1.4);
  r.renderer.render(r.scene,r.camera);
  const ground=r.boothGroup.getObjectByName('scene-ground'),satin=ground.getObjectByName('studio-satin-floor');
  let disposed=false;const dispose=ground.userData.disposeResources;ground.userData.disposeResources=()=>{disposed=true;dispose();};
  const reflectionReady=satin.material.uniforms.ready.value,background=r.scene.background.getHexString();
  S.raise=5;sync();await r.waitForSceneAssets(20000);
  return {reflectionReady,background,disposed,objectsUnchanged:JSON.stringify(S.objects)===original,floorUnchanged:S.floor===floor&&S.tile===tile};
 });
 console.log(result);assert.equal(result.reflectionReady,1);assert.equal(result.background,'e6e7eb');assert.ok(result.disposed);assert.ok(result.objectsUnchanged);assert.ok(result.floorUnchanged);
 await page.locator('.three-host canvas').screenshot({path:'qa/project-workspace/studio-reference-perspective.png'});
 await page.evaluate(()=>{threeRenderer.setCameraView('orthographic_front',{animate:false,commit:false});threeRenderer.renderer.render(threeRenderer.scene,threeRenderer.camera);});
 await page.locator('.three-host canvas').screenshot({path:'qa/project-workspace/studio-reference-front.png'});
 const restored=await page.evaluate(async()=>{const r=threeRenderer,old=r.scene.background.getHexString();await r.exportCleanScreenshot({longEdge:640,minLongEdge:640,maxLongEdge:640,assetTimeoutMs:1000});return r.boothGroup.getObjectByName('scene-ground').visible&&r.scene.background.getHexString()===old;});
 assert.ok(restored);assert.deepEqual(errors,[]);console.log('PASS studio reflection, perspective/ortho, resource disposal, unchanged booth, export restore, no WebGL errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
