// Read-only diagnosis: changes materials only in an isolated in-memory test scene.
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');
(async()=>{
 const paths=['../Asset/Counters/Standee Set.glb','../Asset/Counters/Counter_Set_01.glb','../Asset/Counters/Counter_Set_02.glb','public/yp-web-ai/assets/counter-imports/counter-set-02-04.glb'];
 const inputs=[];for(const path of paths){const b=await fs.readFile(path),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));inputs.push({path,base64:b.toString('base64'),missing:j.meshes.flatMap(m=>m.primitives).filter(p=>p.material===undefined).length,total:j.meshes.flatMap(m=>m.primitives).length});}
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:760}});await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(async inputs=>{
   const T=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
   const parsed=[];for(const input of inputs){const b=Uint8Array.from(atob(input.base64),c=>c.charCodeAt(0));parsed.push(await new GLTFLoader().parseAsync(b.buffer,''));}
   const normalAudit=parsed.map((gltf,i)=>{
    let triangles=0,oppositeNormals=0,zeroNormals=0;const affected=[];
    gltf.scene.traverse(mesh=>{if(!mesh.isMesh)return;const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index;let bad=0;
     for(let t=0;t<(idx?idx.count:p.count);t+=3){const ids=[0,1,2].map(k=>idx?idx.getX(t+k):t+k),[a,b,c]=ids.map(id=>new T.Vector3().fromBufferAttribute(p,id)),face=b.clone().sub(a).cross(c.clone().sub(a));if(face.length()<1e-10)continue;triangles++;
      const average=ids.reduce((sum,id)=>sum.add(new T.Vector3().fromBufferAttribute(n,id)),new T.Vector3());if(average.length()<1e-8){zeroNormals++;continue;}if(face.normalize().dot(average.normalize())<-.1){oppositeNormals++;bad++;}
     }if(bad)affected.push({name:mesh.name,triangles:bad});
    });return{path:inputs[i].path,triangles,oppositeNormals,zeroNormals,affected};
   });
   const source=parsed[2];source.scene.updateMatrixWorld(true);let sourcePart;source.scene.traverse(n=>{if(source.parser.associations.get(n)?.nodes===12)sourcePart=n;});
   const rows=[],stats=[];const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(380,300);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
   for(const mode of ['Source original','Imported original','Nonmetal fallback','Double sided only','Recompute normals only','Unlit white']){
    const original=mode==='Source original'?sourcePart:parsed[3].scene;original.updateWorldMatrix(true,true);
    const model=original.clone(true);model.matrixAutoUpdate=false;model.matrix.copy(original.matrixWorld);model.matrixWorldNeedsUpdate=true;
    const group=new T.Group();group.add(model);group.updateMatrixWorld(true);const box=new T.Box3().setFromObject(group),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());group.position.set(-center.x,-box.min.y,-center.z);group.updateMatrixWorld(true);
    model.traverse(n=>{if(!n.isMesh)return;const m=n.material=n.material.clone();
     if(mode==='Imported original'){
      const normalMatrix=new T.Matrix3().getNormalMatrix(n.matrixWorld),normal=n.geometry.attributes.normal,pos=n.geometry.attributes.position;let topN=[];
      for(let i=0;i<pos.count;i++){const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(n.matrixWorld);if(Math.abs(p.y-size.y)<.001)topN.push(new T.Vector3().fromBufferAttribute(normal,i).applyMatrix3(normalMatrix).normalize().y);}
      stats.push({mesh:n.name,material:m.name,color:m.color.getHexString(),metalness:m.metalness,roughness:m.roughness,side:m.side,map:!!m.map,vertexColors:m.vertexColors,topNormalsY:[...new Set(topN.map(x=>+x.toFixed(3)))]});
     }
     if(mode==='Nonmetal fallback'&&!m.name)m.metalness=0;
     if(mode==='Double sided only')m.side=T.DoubleSide;
     if(mode==='Recompute normals only'){n.geometry=n.geometry.clone();n.geometry.computeVertexNormals();}
     if(mode==='Unlit white')n.material=new T.MeshBasicMaterial({color:m.color,side:T.DoubleSide});
    });
    const world=new T.Scene();world.background=new T.Color('#697585');world.add(group,new T.HemisphereLight(0xffffff,0x8791a1,2.5));const key=new T.DirectionalLight(0xffffff,3);key.position.set(3,5,5);world.add(key);const fill=new T.DirectionalLight(0xffffff,1.5);fill.position.set(-4,3,-2);world.add(fill);
    const camera=new T.PerspectiveCamera(32,380/300,.001,1000),target=new T.Vector3(0,size.y/2,0);camera.position.copy(target).add(new T.Vector3(1,.8,1.5).normalize().multiplyScalar(size.length()/2/Math.sin(32*Math.PI/360)*1.12));camera.lookAt(target);renderer.render(world,camera);
    rows.push({mode,image:renderer.domElement.toDataURL('image/png')});
   }renderer.dispose();return {rows,stats,normalAudit};
  },inputs);
  await page.setContent('<body style="margin:0;background:#17151c;color:white;font:18px Arial;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px"></body>');
  await page.evaluate(rows=>{for(const r of rows){const d=document.createElement('div'),img=new Image();img.src=r.image;img.style.width='100%';const label=document.createElement('div');label.textContent=r.mode;d.append(label,img);document.body.append(d);}},report.rows);
  await page.screenshot({path:'qa/project-workspace/glb-surface-diagnosis.png',fullPage:true});console.log(JSON.stringify({sources:inputs.map(({base64,...r})=>r),stats:report.stats,normalAudit:report.normalAudit},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
