// Inspect/export top-level product assemblies, retaining every mesh within each stand.
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const profile=process.argv.includes('--counter-set-02')?{file:'Counter_Set_02.glb',assembly:'Assembly-12',prefix:'counter-set-02-',title:'Counter Set 02 · ',directory:'counter-imports',contact:'counter-set-02-contact.png'}:process.argv.includes('--counter-set')?{file:'Counter_Set_01.glb',assembly:'Assembly-10',prefix:'counter-set-01-',title:'Counter Set 01 · ',directory:'counter-imports',contact:'counter-set-01-contact.png'}:{file:'Standee Set.glb',assembly:'Assembly-13',prefix:'standee-',title:'Standee ',directory:'standee-imports',contact:'standee-contact.png'};
const source='D:/YP Job/2026/CoWork/Website_TeamYuppie/Asset/Counters/'+profile.file;
const writeVerified=async(file,bytes)=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file+'.tmp',bytes);const digest=b=>crypto.createHash('md5').update(b).digest('hex');if(digest(await fs.readFile(file+'.tmp'))!==digest(bytes))throw Error('Write verification failed');await fs.rename(file+'.tmp',file);};
(async()=>{
 const bytes=await fs.readFile(source),sourceHash=crypto.createHash('sha256').update(bytes).digest('hex');
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:950}});
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async ({base64,profile})=>{
   const T=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js'),{GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');
   const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),gltf=await new GLTFLoader().parseAsync(bytes.buffer,''),scene=gltf.scene;
   scene.updateMatrixWorld(true);const assembly=scene.getObjectByName(profile.assembly);if(!assembly)throw Error('Missing source assembly');
   let groups=assembly.children.filter(n=>{let mesh=false;n.traverse(c=>{if(c.isMesh)mesh=true;});return mesh;});
   if(profile.file==='Counter_Set_02.glb'){
    // Source nodes 15 (cabinet) and 21 (top) form one L counter, despite separate assembly nodes.
    const members=[15,21].map(id=>groups.find(n=>gltf.parser.associations.get(n)?.nodes===id));
    if(members.some(n=>!n))throw Error('Missing L counter parts');
    const [body,top]=members.map(n=>new T.Box3().setFromObject(n));
    if(Math.abs(body.max.y-top.min.y)>.002||Math.abs(body.min.x-top.min.x)>.06||Math.abs(body.max.x-top.max.x)>.06||Math.abs(body.min.z-top.min.z)>.06||Math.abs(body.max.z-top.max.z)>.06)throw Error('L counter top does not meet cabinet');
    const joined=new T.Group();joined.name='L counter with top';joined.userData.sourceNodes=[15,21];assembly.add(joined);members.forEach(n=>joined.add(n));
    groups=groups.filter(n=>!members.includes(n)).concat(joined);scene.updateMatrixWorld(true);
   }
   groups.sort((a,b)=>new T.Box3().setFromObject(a).min.x-new T.Box3().setFromObject(b).min.x);
   const render=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});render.setSize(320,240);render.outputColorSpace=T.SRGBColorSpace;render.toneMapping=T.ACESFilmicToneMapping;
   const out=[];
   for(let i=0;i<groups.length;i++){
    const original=groups[i],model=original.clone(true);model.matrixAutoUpdate=false;model.matrix.copy(original.matrixWorld);model.matrixWorldNeedsUpdate=true;
    const wrapper=new T.Group();wrapper.name=profile.title+String(i+1).padStart(2,'0');wrapper.add(model);wrapper.updateMatrixWorld(true);
    const b=new T.Box3().setFromObject(wrapper),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());wrapper.position.set(-center.x,-b.min.y,-center.z);wrapper.updateMatrixWorld(true);
    const world=new T.Scene();world.background=new T.Color('#697585');world.add(wrapper,new T.HemisphereLight(0xffffff,0x8791a1,2.5));
    const key=new T.DirectionalLight(0xffffff,3);key.position.set(3,5,5);world.add(key);const fill=new T.DirectionalLight(0xffffff,1.5);fill.position.set(-4,3,-2);world.add(fill);
    const camera=new T.PerspectiveCamera(32,4/3,.001,1000),radius=size.length()/2,target=new T.Vector3(0,size.y/2,0);
    camera.position.copy(target).add(new T.Vector3(1,.8,1.5).normalize().multiplyScalar(radius/Math.sin(32*Math.PI/360)*1.12));camera.lookAt(target);
    render.render(world,camera);const thumbnail=render.domElement.toDataURL('image/webp',.92).split(',')[1];
    const exported=await new GLTFExporter().parseAsync(wrapper,{binary:true,onlyVisible:true});
    // Roundtrip the exported GLB, not just its source bounds.
    const parsed=await new GLTFLoader().parseAsync(exported,''),box=new T.Box3().setFromObject(parsed.scene),actual=box.getSize(new T.Vector3());
    if(actual.distanceTo(size)>.00001||Math.abs(box.min.y)>.00001)throw Error('Export bounds mismatch '+i);
    let meshCount=0;model.traverse(n=>{if(n.isMesh)meshCount++;});
    const buffer=new Uint8Array(exported);let binary='';for(let j=0;j<buffer.length;j+=8192)binary+=String.fromCharCode(...buffer.subarray(j,j+8192));
    out.push({id:profile.prefix+String(i+1).padStart(2,'0'),sourceNode:gltf.parser.associations.get(original)?.nodes,meshCount,size:{w:+size.x.toFixed(3),d:+size.z.toFixed(3),h:+size.y.toFixed(3)},thumbnail,glb:btoa(binary)});
   }
   render.dispose();render.forceContextLoss();return out;
  },{base64:bytes.toString('base64'),profile});
  await page.setContent('<html><body style="margin:0;padding:16px;background:#17151c;color:white;font:16px Arial;display:grid;grid-template-columns:repeat(4,1fr);gap:12px"></body></html>');
  await page.evaluate(rows=>{for(const r of rows){const card=document.createElement('div'),img=new Image();img.src='data:image/webp;base64,'+r.thumbnail;img.style.width='100%';const title=document.createElement('div');title.textContent=r.id+' · '+r.size.w+' × '+r.size.d+' × '+r.size.h+' m · '+r.meshCount+' meshes';card.append(img,title);document.body.append(card);}},result);
  await page.screenshot({path:'qa/project-workspace/'+profile.contact,fullPage:true});
  if(process.argv.includes('--export'))for(const r of result){await writeVerified('public/yp-web-ai/assets/'+profile.directory+'/'+r.id+'.glb',Buffer.from(r.glb,'base64'));await writeVerified('public/yp-web-ai/assets/catalog-thumbnails/'+r.id+'.webp',Buffer.from(r.thumbnail,'base64'));}
  console.log(JSON.stringify({sourceHash,items:result.map(({thumbnail,glb,...r})=>r)},null,2));
  if(crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex')!==sourceHash)throw Error('Source file changed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
