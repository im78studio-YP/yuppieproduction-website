const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ids=['facade-u-3x3','top-panel','triangle-tray-wall','tray-wall','wall-shelf-01','wall-100x240','s-beam-01'];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:900}});
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html?comparePreview=1');
  await page.waitForFunction(()=>typeof loadThreeRenderer==='function');
  for(const id of ids){
   const result=await page.evaluate(async id=>{
    YPQuickSetupBridge.close();const r=await loadThreeRenderer(),T=r.THREE;
    const gltf=await r.modelLoader.loadAsync('assets/structure-imports/'+id+'.glb');
    const sourceSize=new T.Box3().setFromObject(gltf.scene).getSize(new T.Vector3());
    const item=objectCatalogDef('imported-'+id);if(!item)throw Error('Missing catalogue entry: '+id);
    r.requestFurnitureTemplate(item);await Promise.all([...r.furnitureLoads.values()]);
    if(!r.furnitureTemplates.has(item.catalogId))throw Error('Missing GLB: '+id);
    const object=makeCatalogObject(item.catalogId,0,0),root=r.buildCatalogObject(object);
    if(object.appearance.mode!=='original')throw Error('Original materials not retained');
    const scene=new T.Scene();scene.background=new T.Color('#697585');scene.add(root);root.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
    root.position.sub(center);root.updateMatrixWorld(true);
    const span=Math.max(size.x,size.y,size.z),camera=new T.OrthographicCamera(-1,1,1,-1,.001,span*30);
    camera.position.set(4,2.8,6).normalize().multiplyScalar(span*5);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
    const fit=new T.Box3(),box=new T.Box3().setFromObject(root);
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])fit.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
    const half=Math.max((fit.max.y-fit.min.y)/2,(fit.max.x-fit.min.x)/2/(4/3))*1.18,cx=(fit.min.x+fit.max.x)/2,cy=(fit.min.y+fit.max.y)/2;
    camera.left=cx-half*4/3;camera.right=cx+half*4/3;camera.top=cy+half;camera.bottom=cy-half;camera.updateProjectionMatrix();
    scene.add(new T.HemisphereLight(0xffffff,0x7a8494,2));
    const key=new T.DirectionalLight(0xfff5e8,3);key.position.set(span*2,span*4,span*5);scene.add(key);
    const fill=new T.DirectionalLight(0xc7dbff,1.1);fill.position.set(-span*4,span,span*2);scene.add(fill);
    const render=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});render.setSize(320,240);render.outputColorSpace=T.SRGBColorSpace;render.toneMapping=T.ACESFilmicToneMapping;
    render.render(scene,camera);const image=render.domElement.toDataURL('image/webp',.9).split(',')[1];render.dispose();render.forceContextLoss();
    object.size.w*=1.5;const resized=r.buildCatalogObject(object),resizedSize=new T.Box3().setFromObject(resized).getSize(new T.Vector3());
    return {image,size:size.toArray(),expected:[item.size.w,item.size.h,item.size.d],source:sourceSize.toArray(),resized:resizedSize.x,canResize:object.transformPolicy.canResize};
   },id);
   result.size.forEach((v,i)=>assert.ok(Math.abs(v-result.expected[i])<.005,id+' size'));
   assert.ok(result.canResize);assert.ok(Math.abs(result.resized-result.expected[0]*1.5)<.005,id+' resize');
   const target=path.resolve(__dirname,'../../public/yp-web-ai/assets/catalog-thumbnails/imported-'+id+'.webp'),bytes=Buffer.from(result.image,'base64');
   await fs.writeFile(target+'.tmp',bytes);
   assert.equal(crypto.createHash('md5').update(await fs.readFile(target+'.tmp')).digest('hex'),crypto.createHash('md5').update(bytes).digest('hex'));
   await fs.rename(target+'.tmp',target);console.log('PASS',id,'dimensions, materials, resize, thumbnail');
  }
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  const thumbs=await page.evaluate(async()=>Promise.all(YPImportedStructureAssets.map(item=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({id:item.catalogId,width:img.naturalWidth});img.onerror=()=>resolve({id:item.catalogId,width:0});img.src=item.thumbUrl;}))));
  assert.ok(thumbs.every(t=>t.width===320),'all seven preview files load');
  await page.evaluate(()=>{YPQuickSetupBridge.close();showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]'));});
  for(const id of ids){
   const card=page.locator('#objectCatalog [data-catalog-id="imported-'+id+'"]');
   await card.locator('img').evaluate(async img=>{img.loading='eager';await img.decode();});
   const before=await page.evaluate(()=>S.objects.length);await card.click();
   assert.equal(await page.evaluate(()=>S.objects.length),before+1);
   assert.equal(await page.evaluate(()=>S.objects.at(-1).catalogId),'imported-'+id);
   await page.evaluate(()=>showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]')));
  }
  const roundTrip=await page.evaluate(async()=>{
   const snap=YPProjectBridge.capture(),text=await YPProjectStore.toText(YPProjectStore.create(snap)),loaded=YPProjectStore.fromText(text);
   YPProjectBridge.restore(loaded.variants[loaded.active]);return S.objects.filter(o=>o.catalogId.startsWith('imported-')).map(o=>o.catalogId);
  });assert.equal(roundTrip.length,7);
  for(const width of [1200,390]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(()=>showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]')));
   assert.ok(await page.locator('#objectCatalog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   await page.locator('#objectCatalog').evaluate(e=>e.scrollIntoView());
   await page.screenshot({path:path.join(__dirname,'imported-assets-catalog-'+width+'.png')});
  }
  console.log('PASS catalogue buttons, image decode, project round-trip and responsive layout');
  await page.setViewportSize({width:1200,height:900});
  await page.setContent('<html><body style="background:#17141a;color:white;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font:14px sans-serif">'+ids.map(id=>'<div><img width="320" src="http://127.0.0.1:4173/yp-web-ai/assets/catalog-thumbnails/imported-'+id+'.webp"><p>'+id+'</p></div>').join('')+'</body></html>');
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  await page.screenshot({path:path.join(__dirname,'imported-assets-contact.png'),fullPage:true});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
