const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPPeninsularTemplateBridge&&YPProjectWorkspace.state().ready);
 const result=await page.evaluate(async()=>{
  YPQuickSetupBridge.close();await YPProjectBridge.ready;
  const original=YPPeninsularTemplateBridge.snapshot('penin-botanical-atelier'),r=await loadThreeRenderer(),T=r.THREE;
  const cases=[original,YPPeninsularTemplateBridge.snapshot('penin-blue-horizon-6')],free=structuredClone(original);
  free.spec.objects[free.spec.objects.length-1].position={x:-8,y:2,z:7};cases.push(free);
  for(const snapshot of cases){
   YPProjectBridge.restore(snapshot);const before=JSON.stringify(getBoothSpec().objects);r.fitStudioLighting(getBoothSpec());r.renderer.render(r.scene,r.camera);
   const bounds=r.presentationBounds(snapshot.spec),center=bounds.getCenter(new T.Vector3());
   if(r.studioKey.target.position.distanceTo(center)>1e-6)throw Error('Key not centred');
   r.studioKey.shadow.updateMatrices(r.studioKey);const c=r.studioKey.shadow.camera;
   for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    const q=new T.Vector3(x,y,z).project(c);if(Math.max(Math.abs(q.x),Math.abs(q.y),Math.abs(q.z))>1)throw Error('Shadow clipped: '+JSON.stringify(q));
   }
   if(JSON.stringify(getBoothSpec().objects)!==before)throw Error('Layout mutated');
  }
  YPProjectBridge.restore(original);await r.setCameraView('perspective_front_right',{animate:false});
  await exportCleanScreenshot({aspectRatio:4/3,minLongEdge:800,maxLongEdge:800,download:false,assetTimeoutMs:20000});
  const capture=()=>{r.renderer.render(r.scene,r.camera);const c=document.createElement('canvas');c.width=r.renderer.domElement.width;c.height=r.renderer.domElement.height;const ctx=c.getContext('2d');ctx.drawImage(r.renderer.domElement,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
  const shaded=capture();r.studioKey.castShadow=false;const unshaded=capture();r.studioKey.castShadow=true;capture();
  let pixels=0,maximum=0;for(let i=0;i<shaded.length;i+=4){const delta=(unshaded[i]+unshaded[i+1]+unshaded[i+2]-shaded[i]-shaded[i+1]-shaded[i+2])/3;if(delta>8)pixels++;maximum=Math.max(maximum,delta);}
  return {pixels,maximum,background:r.scene.background.getHexString(),ground:r.scene.getObjectByName('studio-satin-floor').material.uniforms.baseColor.value.getHexString(),shadowLights:r.scene.children.filter(x=>x.isLight&&x.castShadow).length};
 });assert.ok(result.pixels>500,JSON.stringify(result));assert.ok(result.maximum>20);assert.equal(result.background,'e6e7eb');assert.equal(result.ground,'e6e7eb');assert.equal(result.shadowLights,1);
 await page.locator('.three-shell').screenshot({path:'qa/project-workspace/studio-depth-desktop.png'});assert.deepEqual(errors,[]);console.log('PASS: actual cast-shadow pixel contrast; fitted 6x3, 6x6 and free-positioned bounds; unchanged grey palette/layout; one shadow light',result);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
