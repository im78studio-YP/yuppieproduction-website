const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(async()=>{
  YPQuickSetupBridge.close();S.type='penin';S.W=6;S.D=3;S.H=2.4;S.objects=[];S.stSize='none';S.raise=0;
  const canvas=document.createElement('canvas');canvas.width=600;canvas.height=240;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#555b50';ctx.fillRect(0,0,600,240);
  S.wallStickerFaces=['back'];S.wallStickers.back={...wallStickerDefault(),data:canvas.toDataURL(),w:6,h:2.4,ar:2.5,id:999};
  sync();closeDockPanel(false);await loadThreeRenderer();
 });
 await page.waitForFunction(()=>!!threeRenderer.boothGroup.getObjectByName('wall-sticker-back'));
 await require('./grid-menu-test-helper.cjs')(page,'dockWallGridToggle').click();
 const result=await page.evaluate(()=>{
  const r=threeRenderer,T=r.THREE,grid=r.boothGroup.getObjectByName('booth-wall-editing-grid-back');
  const camera=new T.OrthographicCamera(-3,3,1.2,-1.2,.1,20);camera.position.set(3,1.2,8);camera.lookAt(3,1.2,0);
  const target=new T.WebGLRenderTarget(600,240),previous=r.renderer.getRenderTarget();
  const blocker=new T.Mesh(new T.BoxGeometry(.8,.8,.2),new T.MeshBasicMaterial({color:0xc58b24}));
  blocker.position.set(3,1.2,1);r.scene.add(blocker);
  const capture=()=>{r.renderer.setRenderTarget(target);r.renderer.render(r.scene,camera);const pixels=new Uint8Array(600*240*4);r.renderer.readRenderTargetPixels(target,0,0,600,240,pixels);return pixels;};
  try{
   grid.visible=false;const off=capture();grid.visible=true;const on=capture();
   // Reproduce the old ordering in memory as a negative control: artwork hides the grid.
   const orders=grid.children.map(p=>p.renderOrder);grid.children.forEach(p=>p.renderOrder=0);const old=capture();
   grid.children.forEach((p,i)=>p.renderOrder=orders[i]);
   let visible=0,covered=0,oldVisible=0;
   for(let y=30;y<210;y++)for(let x=80;x<520;x++){
    const i=(y*600+x)*4,diff=(a,b)=>Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);
    if(x>265&&x<335&&y>85&&y<155){if(diff(on,off)>3)covered++;}
    else if(x<250||x>350){if(diff(on,off)>3)visible++;if(diff(old,off)>3)oldVisible++;}
   }
   return {visible,covered,oldVisible,depthTest:grid.children.every(p=>p.material.depthTest),orders};
  }finally{r.renderer.setRenderTarget(previous);target.dispose();r.scene.remove(blocker);blocker.geometry.dispose();blocker.material.dispose();}
 });
 console.log('Pixel comparison',result);
 assert.ok(result.visible>1000,JSON.stringify(result));assert.equal(result.covered,0);
 assert.ok(result.visible>result.oldVisible*5,'Old order must hide most grid pixels under artwork');
 assert.equal(result.depthTest,true);assert.deepEqual(result.orders,[3,3]);
 await page.screenshot({path:require('node:path').join(__dirname,'wall-grid-sticker-fixed.png')});
 console.log('PASS: grid visible over wall artwork, opaque foreground occlusion preserved, old-order negative control',result);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
