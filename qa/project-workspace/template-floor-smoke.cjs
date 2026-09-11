const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready,null,{timeout:60000});
  console.log('Page ready');
  await page.evaluate(async()=>{YPQuickSetupBridge.close();YPProjectBridge.restore(YPPeninsularTemplateBridge.snapshot('penin-botanical-atelier'));const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);});
  await page.locator('.dock-tool[data-dock-page="finish"]').click();
  await page.getByRole('button',{name:'ไม้เข้ม',exact:true}).click();
  assert.equal(await page.evaluate(()=>S.tile),'woodD');
  const result=await page.evaluate(async()=>{
   const r=threeRenderer,obj=S.objects.find(o=>o.structure?.design==='botanical-floor'),original=JSON.stringify(S.objects),records=[];
   const surface=()=>{let found;r.objectMeshes.get(obj.id).traverse(m=>{if(m.userData.boothFloorFinish)found=m;});return found;};
   const fingerprint=m=>JSON.stringify({color:m.color.getHexString(),map:m.map?.image?.src||m.map?.image?.toDataURL?.(),roughness:m.roughness});
   for(const [floor,tile] of [['tile','woodL'],['tile','woodD'],['tile','marble'],['carpet','woodD'],['grass','woodD']]){
    S.floor=floor;S.tile=tile;sync();await r.waitForSceneAssets(20000);
    records.push({floor,tile,match:fingerprint(surface().material)===fingerprint(r.boothGroup.getObjectByName('booth-floor').material),signature:fingerprint(surface().material)});
   }
   const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const ctx=canvas.getContext('2d');ctx.fillStyle='#ff0033';ctx.fillRect(0,0,32,32);ctx.fillStyle='#0033ff';ctx.fillRect(32,0,32,32);
   S.floor='sticker';S.floorStickerData=canvas.toDataURL();S.floorStickerW=4;S.floorStickerD=2;sync();await r.waitForSceneAssets(20000);
   const sticker=r.boothGroup.getObjectByName('template-floor-sticker-graphic'),pos=sticker?.geometry.getAttribute('position'),uv=sticker?.geometry.getAttribute('uv');
   const stickerOK=!!sticker&&Array.from(pos.array).filter((_,i)=>i%3===1).every(y=>y>surface().getWorldPosition(new r.THREE.Vector3()).y)&&Array.from(uv.array).every(v=>v>=0&&v<=1);
   const sameObjects=original===JSON.stringify(S.objects),beforeY=surface().getWorldPosition(new r.THREE.Vector3()).y;
   S.raise=10;sync();await r.waitForSceneAssets(20000);const raiseDelta=surface().getWorldPosition(new r.THREE.Vector3()).y-beforeY;
   const saved=YPProjectBridge.capture();YPProjectBridge.restore(saved);await r.waitForSceneAssets(20000);
   const restored=!!r.boothGroup.getObjectByName('template-floor-sticker-graphic')&&S.floor==='sticker';
   // Check the current restored object, not the old reference.
   S.objects.find(o=>o.id===obj.id).visible=false;sync();const hiddenNoOverlay=!r.boothGroup.getObjectByName('template-floor-sticker-graphic');
   YPProjectBridge.restore(saved);S.floor='tile';S.tile='woodD';sync();await r.waitForSceneAssets(20000);
   return {records:records.map(({signature,...row})=>row),distinct:new Set(records.map(r=>r.signature)).size,stickerOK,sameObjects,raiseDelta,restored,hiddenNoOverlay};
  });
  console.log(JSON.stringify(result,null,2));assert.ok(result.records.every(r=>r.match));assert.equal(result.distinct,5);assert.ok(result.stickerOK);assert.ok(result.sameObjects);assert.ok(Math.abs(result.raiseDelta-.1)<.0001);assert.ok(result.restored);assert.ok(result.hiddenNoOverlay);
  await page.screenshot({path:'qa/project-workspace/template-floor-dark-wood.png'});assert.deepEqual(errors,[]);
  console.log('PASS floor materials, sticker projection, preserved objects, raised floor, save/restore and hidden floor');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
