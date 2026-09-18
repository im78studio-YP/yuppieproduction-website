const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  const data=await page.evaluate(async()=>{
   YPQuickSetupBridge.close();document.getElementById('projectEntryDialog')?.close();const r=await loadThreeRenderer(),T=r.THREE,F=YPAssetFaceStickers;
   const c=document.createElement('canvas');c.width=600;c.height=300;const ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,600,300);ctx.fillStyle='#ea147d';ctx.fillRect(0,0,110,300);ctx.fillStyle='#15151a';ctx.font='bold 65px sans-serif';ctx.fillText('YUPPIE',140,125);ctx.font='26px sans-serif';ctx.fillText('FRONT FACE ONLY',140,190);const data=c.toDataURL();
   // Box: all six projections stay on the selected face and preserve material.
   const root=new T.Group(),base=new T.MeshStandardMaterial({color:'#887766'});root.add(new T.Mesh(new T.BoxGeometry(2,1,1),base));
   for(const [face,f] of Object.entries(F.faces)){const g=F.geometry(T,root,face,F.clean({data})).geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const dot=n.getX(i)*f.n[0]+n.getY(i)*f.n[1]+n.getZ(i)*f.n[2];if(dot<.99)throw Error('Wrong face '+face);if(uv.getX(i)<-1e-6||uv.getX(i)>1.000001||uv.getY(i)<-1e-6||uv.getY(i)>1.000001)throw Error('UV out of range');}g.dispose();}
   const legacy=makeCatalogObject('standee-07',0,0);legacy.appearance={mode:'solid',color:'#f5f5f5',textureData:data,textureName:'legacy.png',textureId:'legacy'};normalizeSceneObjectModel(legacy);if(Object.keys(legacy.appearance.stickers).join()!=='front')throw Error('Legacy migration');
   for(const obj of [{catalogId:'tv-65'},{catalogId:'tv-samsung-40'},{type:'brandCopy'}])if(F.supported(obj))throw Error('Special artwork pipeline intercepted');
   for(const id of ['standee-07','counter-set-02-04']){r.requestFurnitureTemplate(objectCatalogDef(id));}await Promise.all([...r.furnitureLoads.values()]);
   Object.assign(S,{type:'island',W:6,D:6,stSize:'none',objects:[legacy,makeCatalogObject('counter-set-02-04',2,0)]});sync();await r.waitForSceneAssets(15000,BoothSpec);
   for(const obj of S.objects){const model=r.objectMeshes.get(obj.id);if(!model)throw Error('Missing model');model.traverse(m=>{if(m.isMesh&&!m.userData.assetFaceSticker&&(Array.isArray(m.material)?m.material:[m.material]).some(mat=>mat.map?.image===r.wallStickerImages?.get(data)))throw Error('Base material overwritten');});}
   const model=r.objectMeshes.get(legacy.id),decal=model.getObjectByName('asset-face-sticker-front');if(!decal)throw Error('Front decal missing');if(model.children.filter(m=>m.userData.assetFaceSticker).length!==1)throw Error('Sticker spilled');
   window.facePartKeys=YPAssetParts.entries(model).map(e=>e.key);selectObject(legacy.id);openAssetSettings();return data;
  });
  assert.equal(await page.locator('#assetStickerFace').inputValue(),'front');
  const backdrop=()=>page.locator('#mAssetSettings').evaluate(el=>{const s=getComputedStyle(el);return{blur:s.backdropFilter,background:s.backgroundColor};});
  assert.deepEqual(await backdrop(),{blur:'none',background:'rgba(0, 0, 0, 0)'});
  assert.equal(await page.locator('.modal:not(.asset-settings-modal)').first().evaluate(el=>getComputedStyle(el).backdropFilter),'blur(6px)');
  assert.equal(await page.locator('[data-face-setting="patternSize"]').isVisible(),false);
  assert.match(await page.locator('#assetChooseSticker').textContent(),/ด้านหน้า/);
  const pictures=await page.evaluate(async()=>{
   const r=await loadThreeRenderer(),T=r.THREE,F=YPAssetFaceStickers,original=S.objects[0],out=[];
   const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(600,450);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
   for(const id of ['standee-07','counter-set-02-04']){
    const obj=makeCatalogObject(id,0,0);obj.appearance=structuredClone(original.appearance);const model=r.buildCatalogObject(obj),world=new T.Scene();world.background=new T.Color('#b3bac2');model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());model.position.sub(center);world.add(model,new T.HemisphereLight(0xffffff,0x596470,2.5));const light=new T.DirectionalLight(0xffffff,3);light.position.set(3,5,5);world.add(light);
    const materials=[];model.traverse(m=>{if(m.isMesh&&!m.userData.assetFaceSticker)materials.push(...(Array.isArray(m.material)?m.material:[m.material]));});if(materials.some(m=>m.map))throw Error('Solid base got sticker material');
    for(const view of ['front','back']){const camera=new T.PerspectiveCamera(32,4/3,.001,100);camera.position.copy(new T.Vector3(view==='front'?1:-1,.65,view==='front'?1.8:-1.8).normalize().multiplyScalar(size.length()/2/Math.sin(32*Math.PI/360)*1.08));camera.lookAt(0,0,0);renderer.render(world,camera);out.push({label:id+' '+view,data:renderer.domElement.toDataURL()});}
    obj.transform.flipX=true;obj.rotationY=45;obj.size.w*=1.3;const changed=r.buildCatalogObject(obj);if(!changed.getObjectByName('asset-face-sticker-front'))throw Error('Transformed asset lost decal');
   }renderer.dispose();renderer.forceContextLoss();return out;
  });
  const visual=await browser.newPage({viewport:{width:1200,height:950}});await visual.setContent('<body style="margin:0;display:grid;grid-template-columns:1fr 1fr;background:#17151c;color:white;font:16px Arial"></body>');await visual.evaluate(rows=>{for(const row of rows){const div=document.createElement('div'),img=new Image();div.textContent=row.label;img.src=row.data;img.style.width='100%';div.append(img);document.body.append(div);}},pictures);await visual.screenshot({path:'qa/project-workspace/asset-face-stickers-render.png'});await visual.close();
  await page.locator('#assetStickerFace').selectOption('right');
  assert.equal(await page.locator('#assetRemoveSticker').isDisabled(),true);
  await page.locator('#assetStickerFile').setInputFiles({name:'right.png',mimeType:'image/png',buffer:Buffer.from(data.split(',')[1],'base64')});
  await page.waitForFunction(()=>!!S.objects[0].appearance.stickers.right?.data);
  await page.locator('[data-face-setting="mode"]').selectOption('repeat');
  await page.locator('[data-face-setting="patternSize"]').fill('0.25');await page.locator('[data-face-setting="patternSize"]').press('Tab');
  await page.locator('[data-face-setting="offsetX"]').fill('0.1');await page.locator('[data-face-setting="offsetX"]').press('Tab');
  await page.locator('#assetStickerRotate').click();
  assert.equal(await page.evaluate(()=>S.objects[0].appearance.stickers.right.rotation),90);
  await page.evaluate(()=>undoObjectChange());assert.equal(await page.evaluate(()=>S.objects[0].appearance.stickers.right.rotation),0);
  await page.evaluate(()=>redoObjectChange());assert.equal(await page.evaluate(()=>S.objects[0].appearance.stickers.right.rotation),90);
  await page.evaluate(async()=>{const r=await loadThreeRenderer();await r.waitForSceneAssets(15000,BoothSpec);const root=r.objectMeshes.get(S.objects[0].id);if(!root.getObjectByName('asset-face-sticker-right'))throw Error('Right face missing');if(JSON.stringify(YPAssetParts.entries(root).map(e=>e.key))!==JSON.stringify(facePartKeys))throw Error('Sticker polluted part editor');const saved=JSON.stringify(S.objects[0].appearance.stickers),project=YPProjectStore.fromText(await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture())));YPProjectBridge.restore(project.variants.A);if(JSON.stringify(S.objects[0].appearance.stickers)!==saved)throw Error('Roundtrip failed');selectObject(S.objects[0].id);openAssetSettings();});
  await page.locator('#assetStickerFace').selectOption('right');await page.locator('#assetRemoveSticker').click();
  assert.equal(await page.evaluate(()=>!!S.objects[0].appearance.stickers.front?.data&&!S.objects[0].appearance.stickers.right),true);
  await page.locator('#assetStickerFace').selectOption('front');
  await page.locator('[data-face-setting="mode"]').selectOption('cover');
  await page.locator('[data-face-setting="w"]').fill('0.8');await page.locator('[data-face-setting="w"]').press('Tab');
  await page.locator('#assetStickerResetPlacement').click();assert.equal(await page.evaluate(()=>S.objects[0].appearance.stickers.front.w),null);
  await page.locator('#assetFaceStickerControls').scrollIntoViewIfNeeded();await page.screenshot({path:'qa/project-workspace/asset-face-stickers-desktop.png'});
  await page.setViewportSize({width:390,height:900});await page.locator('#assetFaceStickerControls').scrollIntoViewIfNeeded();await page.screenshot({path:'qa/project-workspace/asset-face-stickers-mobile.png'});
  assert.deepEqual(await backdrop(),{blur:'none',background:'rgba(0, 0, 0, 0)'});
  assert.equal(await page.locator('#assetFaceStickerControls').evaluate(el=>el.getBoundingClientRect().right<=innerWidth+1),true);
  await page.evaluate(()=>{S.objects[0].locked=true;syncAssetSettingsForm();});assert.equal(await page.locator('#assetChooseSticker').isDisabled(),true);assert.equal(await page.locator('[data-face-setting="w"]').isDisabled(),true);
  await page.evaluate(()=>{S.objects[0].locked=false;syncAssetSettingsForm();});await page.locator('#assetResetSurface').click();assert.equal(await page.evaluate(()=>Object.keys(S.objects[0].appearance.stickers).length),0);
  assert.deepEqual(errors,[]);console.log('PASS: six face geometry, legacy migration, real upload, independent faces, transforms, undo/redo, save/load, part keys, locks, reset and responsive UI');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
