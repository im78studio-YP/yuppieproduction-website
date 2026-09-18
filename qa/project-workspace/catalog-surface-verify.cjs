const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const write=async(file,data)=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file+'.tmp',data);if(crypto.createHash('md5').update(await fs.readFile(file+'.tmp')).digest('hex')!==crypto.createHash('md5').update(data).digest('hex'))throw Error('Write mismatch');await fs.rename(file+'.tmp',file);};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  const results=await page.evaluate(async()=>{
   YPQuickSetupBridge.close();const r=await loadThreeRenderer(),T=r.THREE,repair=YPAssetSurfaceRepair,rows=[],images=[],comparisons=[];
   // Regression: don't smooth hard edges or recolour legitimate dark/metal materials.
   const tri=new T.BufferGeometry();tri.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));tri.setAttribute('normal',new T.Float32BufferAttribute([0,0,-1,0,0,-1,0,0,-1],3));tri.setAttribute('tangent',new T.Float32BufferAttribute([1,0,0,1,1,0,0,1,1,0,0,1],4));
   const fixed=repair.repairGeometry(T,tri);if(fixed.geometry.attributes.normal.getZ(0)!==1||fixed.geometry.attributes.tangent.getW(0)!==-1||tri.attributes.normal.getZ(0)!==-1)throw Error('Normal/tangent clone regression');
   const shared=tri.clone();shared.setIndex([0,1,2,0,2,1]);const split=repair.repairGeometry(T,shared);if(!split.split||split.geometry.index||split.geometry.attributes.position.count!==6)throw Error('Conflicting corner repair');
   const healthy=fixed.geometry.clone();if(repair.repairGeometry(T,healthy)!==null)throw Error('Healthy geometry changed');
   const metal=new T.MeshStandardMaterial({color:'#111111',metalness:1,roughness:1}),mesh=new T.Mesh(healthy,metal),scene=new T.Scene();scene.add(mesh);
   repair.apply(T,{scene,parser:{associations:new Map([[mesh,{meshes:0,primitives:0}]]),json:{meshes:[{primitives:[{material:0}]}],materials:[{pbrMetallicRoughness:{baseColorFactor:[.01,.01,.01,1],metallicFactor:1,roughnessFactor:1}}]}}},{catalogId:'standee-03'});
   if(mesh.material!==metal||mesh.material.color.getHexString()!=='111111')throw Error('Intentional black/metal changed');
   const render=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});render.setSize(320,240);render.outputColorSpace=T.SRGBColorSpace;render.toneMapping=T.ACESFilmicToneMapping;
   function thumbnail(source){
    const model=source.clone(true),world=new T.Scene();world.background=new T.Color('#697585');model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());model.position.sub(center);
    world.add(model,new T.HemisphereLight(0xffffff,0x8791a1,2.5));const key=new T.DirectionalLight(0xffffff,3);key.position.set(3,5,5);world.add(key);const fill=new T.DirectionalLight(0xffffff,1.5);fill.position.set(-4,3,-2);world.add(fill);
    const camera=new T.PerspectiveCamera(32,4/3,.001,10000);camera.position.copy(new T.Vector3(1,.8,1.5).normalize().multiplyScalar(size.length()/2/Math.sin(32*Math.PI/360)*1.12));camera.lookAt(0,0,0);render.render(world,camera);return render.domElement.toDataURL('image/webp',.92);
   }
   function snapshot(root){
    const out=[];root.updateMatrixWorld(true);root.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,indices=g.index,ids=Array.from({length:indices?indices.count:g.attributes.position.count},(_,i)=>indices?indices.getX(i):i),attrs={};
     for(const [key,a] of Object.entries(g.attributes))if(!['normal','tangent'].includes(key))attrs[key]=ids.flatMap(i=>Array.from({length:a.itemSize},(_,k)=>a.getComponent(i,k)));
     out.push({name:m.name,attrs,matrix:m.matrixWorld.toArray(),mats:(Array.isArray(m.material)?m.material:[m.material]).map(mat=>({name:mat.name,color:mat.color?.getHexString(),metalness:mat.metalness,roughness:mat.roughness,map:mat.map?.uuid||null,side:mat.side}))});
    });return out;
   }
   function badNormals(root){let bad=0;root.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index;if(!n)return;
    for(let t=0;t<(idx?idx.count:p.count);t+=3){const ids=[0,1,2].map(k=>idx?idx.getX(t+k):t+k),[a,b,c]=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i)),f=b.sub(a).cross(c.sub(a));if(f.lengthSq()<1e-20)continue;f.normalize();for(const id of ids)if(f.dot(new T.Vector3().fromBufferAttribute(n,id).normalize())<-.1)bad++;}
   });return bad;}
   const sample=new Set(['standee-03','standee-06','counter-set-02-04','high-table-stool-set','fixture-clear100','fixture-arm']);
   const items=[...OBJECT_CATALOG,...LIGHT_MODELS.map(d=>({catalogId:'fixture-'+d.k,name:d.n,modelUrl:d.url,fixture:true}))];
   for(const item of items){
    if(!item.modelUrl){const root=r.buildCatalogObject(makeCatalogObject(item.catalogId,0,0));rows.push({id:item.catalogId,procedural:true,bad:badNormals(root)});continue;}
    const gltf=await r.modelLoader.loadAsync(item.modelUrl),before=snapshot(gltf.scene),beforeBad=badNormals(gltf.scene),beforeImage=sample.has(item.catalogId)?thumbnail(gltf.scene):null;
    const report=repair.apply(T,gltf,item),after=snapshot(gltf.scene),bad=badNormals(gltf.scene);
    if(before.length!==after.length)throw Error('Mesh count changed '+item.catalogId);
    before.forEach((m,i)=>{const n=after[i];if(JSON.stringify(m.attrs)!==JSON.stringify(n.attrs)||JSON.stringify(m.matrix)!==JSON.stringify(n.matrix)||m.name!==n.name)throw Error('Shape/UV/transform changed '+item.catalogId);
     m.mats.forEach((mat,j)=>{const next=n.mats[j];if(mat.color!==next.color||mat.map!==next.map||mat.side!==next.side||mat.name!==next.name)throw Error('Authored material changed '+item.catalogId);if(mat.name&&JSON.stringify(mat)!==JSON.stringify(next))throw Error('Named finish changed '+item.catalogId);});
    });
    if(bad)throw Error('Remaining bad normals '+item.catalogId+': '+bad);
    if(repair.apply(T,gltf,item).normalMeshes!==0)throw Error('Not idempotent');
    rows.push({id:item.catalogId,beforeBad,bad,...report});
    if(repair.repairedPreview(item))images.push({id:item.catalogId,url:thumbnail(gltf.scene)});
    if(beforeImage)comparisons.push({id:item.catalogId,before:beforeImage,after:thumbnail(gltf.scene)});
   }
   render.dispose();render.forceContextLoss();
   // Exercise actual cached renderer path, independent editing, save/restore and part keys.
   const item=OBJECT_CATALOG.find(i=>i.catalogId==='counter-set-02-04');r.requestFurnitureTemplate(item);await Promise.all([...r.furnitureLoads.values()]);
   if(!r.furnitureTemplates.has(item.catalogId)||badNormals(r.furnitureTemplates.get(item.catalogId)))throw Error('Renderer did not repair surface');
   S.objects=[makeCatalogObject(item.catalogId,0,0),makeCatalogObject(item.catalogId,2,0)];sync();await r.waitForSceneAssets(15000,BoothSpec);
   const keys=YPAssetParts.entries(r.objectMeshes.get(S.objects[0].id)).map(e=>e.key);selectObject(S.objects[0].id);updateSelectedObjectAppearanceMode('solid');updateSelectedObjectColor('#222222');
   if(S.objects[1].appearance.mode!=='original')throw Error('Appearance leaked');
   const project=YPProjectStore.fromText(await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture())));YPProjectBridge.restore(project.variants.A);await r.waitForSceneAssets(15000,BoothSpec);
   if(JSON.stringify(keys)!==JSON.stringify(YPAssetParts.entries(r.objectMeshes.get(S.objects[0].id)).map(e=>e.key)))throw Error('Part paths changed');
   if(S.objects[0].appearance.color!=='#222222'||S.objects[1].appearance.mode!=='original')throw Error('Saved appearance lost');
   return{rows,images,comparisons};
  });
  await write('qa/project-workspace/catalog-surface-audit-after.json',JSON.stringify(results.rows,null,2));
  if(process.argv.includes('--write-previews'))for(const img of results.images)await write('public/yp-web-ai/assets/catalog-thumbnails/surface-corrected/'+img.id+'.webp',Buffer.from(img.url.split(',')[1],'base64'));
  const reportPage=await browser.newPage({viewport:{width:1280,height:960}});
  await reportPage.setContent('<body style="margin:0;padding:12px;background:#17151c;color:white;font:16px Arial;display:grid;grid-template-columns:repeat(4,1fr);gap:10px"></body>');
  await reportPage.evaluate(rows=>{for(const r of rows)for(const key of ['before','after']){const d=document.createElement('div'),img=new Image(),title=document.createElement('div');title.textContent=r.id+' '+key;img.src=r[key];img.style.width='100%';d.append(title,img);document.body.append(d);}},results.comparisons);
  await reportPage.screenshot({path:'qa/project-workspace/catalog-surface-before-after.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({checked:results.rows.length,normalFixed:results.rows.filter(r=>r.normalMeshes).length,materialFixed:results.rows.filter(r=>r.defaultMaterials).length,remainingBad:results.rows.filter(r=>r.bad),previews:results.images.length,pass:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
