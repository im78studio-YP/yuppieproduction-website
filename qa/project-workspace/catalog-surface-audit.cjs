const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  const report=await page.evaluate(async()=>{
   YPQuickSetupBridge.close();const r=await loadThreeRenderer(),T=r.THREE,rows=[];
   function scan(root,gltf){
    const meshes=[];root.traverse(mesh=>{if(!mesh.isMesh)return;const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index;let triangles=0,opposite=0,corners=0,zero=0;
     if(n)for(let t=0;t<(idx?idx.count:p.count);t+=3){const ids=[0,1,2].map(k=>idx?idx.getX(t+k):t+k),[a,b,c]=ids.map(id=>new T.Vector3().fromBufferAttribute(p,id)),face=b.sub(a).cross(c.sub(a));if(face.length()<1e-10)continue;face.normalize();triangles++;let bad=false;
      for(const id of ids){const v=new T.Vector3().fromBufferAttribute(n,id);if(v.length()<1e-8)zero++;else if(face.dot(v.normalize())<-.1){corners++;bad=true;}}if(bad)opposite++;
     }
     const association=gltf?.parser.associations.get(mesh),primitive=gltf?.parser.json.meshes?.[association?.meshes]?.primitives?.[association?.primitives];
     meshes.push({name:mesh.name,vertices:p.count,triangles,opposite,corners,zero,missingNormals:!n,defaultMaterial:!!primitive&&primitive.material===undefined,materials:(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(m=>({name:m.name,color:m.color?.getHexString(),metalness:m.metalness,roughness:m.roughness,side:m.side,map:!!m.map,normalMap:!!m.normalMap}))});
    });return meshes;
   }
   for(const item of OBJECT_CATALOG){
    try{
     let root,gltf;if(item.modelUrl){gltf=await r.modelLoader.loadAsync(await furnitureModelSource(item));root=gltf.scene;}else{root=r.buildCatalogObject(makeCatalogObject(item.catalogId,0,0));}
     const meshes=scan(root,gltf);rows.push({id:item.catalogId,name:item.name,url:item.modelUrl||null,hidden:!!item.hiddenFromCatalog,thumb:item.thumbUrl,meshes});
    }catch(e){rows.push({id:item.catalogId,name:item.name,error:e.message});}
   }
   const fixtures=[];for(const item of LIGHT_MODELS){try{const gltf=await r.modelLoader.loadAsync(item.url);fixtures.push({id:item.k,url:item.url,meshes:scan(gltf.scene,gltf)});}catch(e){fixtures.push({id:item.k,error:e.message});}}
   return{catalog:rows,fixtures,date:new Date().toISOString()};
  });
  await fs.writeFile('qa/project-workspace/catalog-surface-audit-before.json',JSON.stringify(report,null,2));
  const summarize=items=>items.map(r=>({id:r.id,error:r.error,opposite:r.meshes?.reduce((s,m)=>s+m.opposite,0),missingMaterial:r.meshes?.filter(m=>m.defaultMaterial).length,unnamedMetal:r.meshes?.filter(m=>m.materials.some(s=>!s.name&&s.metalness===1)).length}));
  console.log(JSON.stringify({total:report.catalog.length,glb:report.catalog.filter(r=>r.url).length,errors:report.catalog.filter(r=>r.error),affected:summarize(report.catalog.filter(r=>r.meshes?.some(m=>m.opposite||m.zero||m.missingNormals||m.defaultMaterial||m.materials.some(s=>!s.name&&s.metalness===1)))),fixtures:summarize(report.fixtures)},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
