const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.YPHandoffUI&&YPProjectWorkspace.state().ready,undefined,{timeout:60000});
 const ids=await page.evaluate(async()=>{YPQuickSetupBridge.close();S.objects=[];const objects=YPTVStands.ids.map((id,i)=>makeCatalogObject(id,1+i*1.6,1));mutateObjects(()=>S.objects.push(...objects),objects[0].id);await loadThreeRenderer();closeDockPanel(false);return objects.map(o=>o.id);});console.log('3 stands created');
 for(const id of ids){
  const info=await page.evaluate(id=>{const o=objectById(id),T=threeRenderer.THREE,root=threeRenderer.objectMeshes.get(id),s=new T.Box3().setFromObject(root).getSize(new T.Vector3());return{size:o.size,bounds:{w:s.x,d:s.z,h:s.y},screens:root.getObjectsByProperty('name','tv-stand-screen').length};},id);
  for(const k of ['w','d','h'])assert.ok(Math.abs(info.size[k]-info.bounds[k])<.00001);assert.equal(info.screens,1);
  await page.evaluate(id=>{selectObject(id);openAssetSettings();},id);assert.equal(await page.locator('#assetChooseSticker').textContent(),'เปลี่ยนภาพหน้าจอ');
  const before=await page.evaluate(id=>{const parts=[];threeRenderer.objectMeshes.get(id).traverse(n=>{if(n.isMesh&&n.name!=='tv-stand-screen')parts.push([n.name,n.material.color.getHex()]);});return parts;},id);
  const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=32;c.height=16;const x=c.getContext('2d');x.fillStyle='#ff0000';x.fillRect(0,0,32,16);return c.toDataURL().split(',')[1];});
  await page.locator('#assetStickerFile').setInputFiles({name:'test-screen.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
  await page.waitForFunction(id=>{const o=objectById(id),s=threeRenderer.objectMeshes.get(id)?.getObjectByName('tv-stand-screen');return o.appearance.textureData&&s?.userData.screenSource===o.appearance.textureData;},id);
  const after=await page.evaluate(id=>{const parts=[];threeRenderer.objectMeshes.get(id).traverse(n=>{if(n.isMesh&&n.name!=='tv-stand-screen')parts.push([n.name,n.material.color.getHex()]);});return parts;},id);assert.deepEqual(after,before);
  await page.locator('#assetRemoveSticker').click();await page.waitForFunction(id=>!objectById(id).appearance.textureData,id);
  await page.evaluate(id=>{selectObject(id);updateSelectedObjectSize('h',1.8);},id);assert.equal(await page.evaluate(id=>objectById(id).size.h,id),1.8);
 }
 await page.evaluate(()=>{const p=YPProjectBridge.capture();YPProjectBridge.restore(p);});assert.equal(await page.evaluate(()=>S.objects.filter(o=>YPTVStands.isStand(o)).length),3);console.log('PASS bounds, independent IDs, screen-only uploads, reset, resize and save/restore');
 await page.evaluate(()=>{
  const T=threeRenderer.THREE,scene=new T.Scene();scene.background=new T.Color('#f4f4f4');scene.fog=new T.Fog('#f4f4f4',7,18);const cam=new T.PerspectiveCamera(32,1.8,.01,60);cam.position.set(.35,1.60,4.9);cam.lookAt(0,.72,0);
  const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(1260,700);r.setPixelRatio(1);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=.9;r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;
  scene.add(new T.HemisphereLight('#ffffff','#818791',3));const light=new T.DirectionalLight('#ffffff',3.5);light.position.set(-3,5,4);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-4,right:4,top:4,bottom:-4});light.shadow.normalBias=.002;scene.add(light);const fill=new T.DirectionalLight('#ffffff',2);fill.position.set(3,2,-2);scene.add(fill);
  const stands=YPTVStands.ids.map((id,i)=>{const m=threeRenderer.buildCatalogObject(makeCatalogObject(id,0,0));m.position.x=(i-1)*1.52;scene.add(m);return m;});
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#eeeeee',roughness:.92}));floor.rotation.x=-Math.PI/2;floor.position.y=-.002;floor.receiveShadow=true;scene.add(floor);
  const holder=document.createElement('div');holder.style='position:fixed;inset:0;z-index:99999;background:#f4f4f4;display:grid;place-items:center';r.domElement.id='standCanvas';holder.append(r.domElement);document.body.append(holder);window.standTest={r,cam,scene,stands};r.setAnimationLoop(()=>r.render(scene,cam));
 });
 await page.waitForFunction(()=>standTest.stands.every(m=>m.getObjectByName('tv-stand-screen').material.map));
 const fits=await page.evaluate(()=>standTest.stands.map(m=>{const s=m.getObjectByName('tv-stand-screen');return{source:s.userData.screenSource,...s.userData.screenFit};}));
 for(const f of fits){assert.equal(f.source,'assets/tv-stands/yuppie-screen.png');assert.ok(Math.abs(f.w/f.h-f.sourceWidth/f.sourceHeight)<1e-6);assert.ok(f.x>=0&&f.y>=0);assert.ok(f.w<=f.canvasWidth+.001&&f.h<=f.canvasHeight+.001);assert.ok(Math.abs(f.canvasWidth/f.canvasHeight-f.displayRatio)<.002);}
 await page.waitForTimeout(500);await page.locator('#standCanvas').screenshot({path:'qa/project-workspace/tv-stands-preview.png'});
 const catalogIds=await page.evaluate(()=>YPTVStands.ids);
 for(let i=0;i<3;i++){await page.evaluate(i=>{const {r,cam,stands}=standTest;stands.forEach((m,k)=>{m.visible=k===i;if(k===i)m.position.x=0;});r.setSize(360,400);cam.aspect=.9;cam.position.set(1.8,1.8,3.4);cam.lookAt(0,.7,0);cam.updateProjectionMatrix();},i);await page.waitForTimeout(200);await page.locator('#standCanvas').screenshot({path:'public/yp-web-ai/assets/catalog-thumbnails/'+catalogIds[i]+'.png'});}
 assert.deepEqual(errors,[]);console.log('PASS studio preview and 3 catalog thumbnails');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
