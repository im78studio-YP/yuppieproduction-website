/* Regenerate shipped thumbnails from the actual catalogue renderer, in an isolated browser. */
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../../public/yp-web-ai/assets/catalog-thumbnails');
async function save(name,bytes){const target=path.join(out,name),tmp=target+'.tmp';await fs.writeFile(tmp,bytes);const hash=b=>crypto.createHash('md5').update(b).digest('hex');assert.equal(hash(await fs.readFile(tmp)),hash(bytes));await fs.rename(tmp,target);}
(async()=>{await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html?comparePreview=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof makeCatalogObject==='function'&&typeof loadThreeRenderer==='function');
 const items=await page.evaluate(async()=>{
  YPQuickSetupBridge.close();S.W=6;S.D=3;
  const r=await loadThreeRenderer();
  for(const item of OBJECT_CATALOG.filter(i=>!i.hiddenFromCatalog&&i.modelUrl))r.requestFurnitureTemplate(item);
  r.requestDownlightTemplate();
  await Promise.all([...r.furnitureLoads.values(),...r.fixtureLoads.values()]);
  for(const item of OBJECT_CATALOG.filter(i=>!i.hiddenFromCatalog&&i.modelUrl))if(!r.furnitureTemplates.has(item.catalogId))throw Error('Missing model: '+item.catalogId);
  return OBJECT_CATALOG.filter(i=>!i.hiddenFromCatalog).map(i=>({id:i.catalogId,name:i.name}));
 });
 for(const item of items){const data=await page.evaluate(async id=>{
  const r=await loadThreeRenderer(),T=r.THREE,object=makeCatalogObject(id,0,0),root=r.buildCatalogObject(object);
  const scene=new T.Scene();scene.background=new T.Color('#697585');scene.add(root);root.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
  if(bounds.isEmpty())throw Error('Empty geometry: '+id);
  root.position.sub(center);root.updateMatrixWorld(true);
  const span=Math.max(size.x,size.y,size.z),camera=new T.OrthographicCamera(-1,1,1,-1,.001,span*30);
  camera.position.set(4,2.8,6).normalize().multiplyScalar(span*5);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const fit=new T.Box3(),box=new T.Box3().setFromObject(root);
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])fit.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  const half=Math.max((fit.max.y-fit.min.y)/2,(fit.max.x-fit.min.x)/2/(4/3))*1.18;
  const cx=(fit.min.x+fit.max.x)/2,cy=(fit.min.y+fit.max.y)/2;
  camera.left=cx-half*4/3;camera.right=cx+half*4/3;camera.top=cy+half;camera.bottom=cy-half;camera.updateProjectionMatrix();
  scene.add(new T.HemisphereLight(0xffffff,0x7a8494,2));
  const key=new T.DirectionalLight(0xfff5e8,3);key.position.set(span*2,span*4,span*5);scene.add(key);
  const fill=new T.DirectionalLight(0xc7dbff,1.1);fill.position.set(-span*4,span,span*2);scene.add(fill);
  const render=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});render.setSize(320,240);render.outputColorSpace=T.SRGBColorSpace;render.toneMapping=T.ACESFilmicToneMapping;render.toneMappingExposure=1.05;
  render.render(scene,camera);const url=render.domElement.toDataURL('image/webp',.9);
  render.dispose();render.forceContextLoss();return url.split(',')[1];
 },item.id);await save(item.id+'.webp',Buffer.from(data,'base64'));console.log('Rendered',item.id);}
 await save('manifest.json',Buffer.from(JSON.stringify({version:1,width:320,height:240,items},null,2)+'\n'));
 console.log('PASS: rendered '+items.length+' catalogue thumbnails');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
