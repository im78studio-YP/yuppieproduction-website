const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',route=>route.abort());
 console.log('Loading app');
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.YPHandoffUI&&YPProjectWorkspace.state().ready,undefined,{timeout:60000});
 console.log('App ready; loading 3D');
 const id=await page.evaluate(async()=>{YPQuickSetupBridge.close();S.objects=[];const o=makeCatalogObject('brochure-zigzag',3,2);mutateObjects(()=>S.objects.push(o),o.id);await loadThreeRenderer();closeDockPanel(false);return o.id;});
 console.log('3D ready');
 const check=await page.evaluate(id=>{const obj=objectById(id),T=threeRenderer.THREE,m=threeRenderer.objectMeshes.get(id),size=new T.Box3().setFromObject(m).getSize(new T.Vector3()),names=[];m.traverse(n=>names.push(n.name));return{size:size.toArray(),names,canResize:obj.transformPolicy.canResize};},id);
 assert.ok(check.canResize);for(const [i,n]of [.28,1.55,.38].entries())assert.ok(Math.abs(check.size[i]-n)<1e-5);assert.equal(check.names.filter(n=>n==='brochure-artwork').length,3);assert.equal(check.names.filter(n=>n==='silver-tray').length,5);
 await page.evaluate(id=>{selectObject(id);updateSelectedObjectSize('h',1.8);},id);assert.equal(await page.evaluate(id=>objectById(id).size.h,id),1.8);
 await page.evaluate(()=>{const s=YPProjectBridge.capture();YPProjectBridge.restore(s);});assert.equal(await page.evaluate(id=>objectById(id).catalogId,id),'brochure-zigzag');
 await page.evaluate(async()=>{
  const T=threeRenderer.THREE,scene=new T.Scene();scene.background=new T.Color('#777c89');const cam=new T.PerspectiveCamera(32,1,0.01,20);cam.position.set(1.6,1.45,2.6);cam.lookAt(0,.79,0);
  const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(800,900);cam.aspect=800/900;cam.updateProjectionMatrix();r.setPixelRatio(1);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=.8;r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;scene.fog=new T.Fog('#777c89',4,9);
  const hemi=new T.HemisphereLight('#ffffff','#697487',3);scene.add(hemi);const light=new T.DirectionalLight('#ffffff',4);light.position.set(-2,4,4);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-2;light.shadow.camera.right=2;light.shadow.camera.top=3;light.shadow.camera.bottom=-2;light.shadow.normalBias=.002;scene.add(light);
  const fill=new T.DirectionalLight('#bed9ff',2);fill.position.set(2,2,-2);scene.add(fill);
  const obj=makeCatalogObject('brochure-zigzag',0,0),rack=threeRenderer.buildCatalogObject(obj);scene.add(rack);const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#777c89',roughness:.95}));ground.rotation.x=-Math.PI/2;ground.position.y=-.002;ground.receiveShadow=true;scene.add(ground);
  const holder=document.createElement('div');holder.id='rackPreview';holder.style='position:fixed;inset:0;z-index:99999;background:#777c89;display:grid;place-items:center';r.domElement.id='rackCanvas';holder.append(r.domElement);document.body.append(holder);
  window.rackTest={r,scene,cam};r.setAnimationLoop(()=>r.render(scene,cam));
 });
 await page.waitForTimeout(700);await page.locator('#rackCanvas').screenshot({path:'qa/project-workspace/brochure-rack-preview.png'});
 await page.evaluate(()=>{const{r,cam}=rackTest;r.setSize(320,360);cam.aspect=320/360;cam.updateProjectionMatrix();});await page.waitForTimeout(200);await page.locator('#rackCanvas').screenshot({path:'public/yp-web-ai/assets/catalog-thumbnails/brochure-zigzag.png'});
 assert.deepEqual(errors,[]);console.log('PASS rack real bounds, 5 folded trays, 3 brochures, resize, restore, thumbnail');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
