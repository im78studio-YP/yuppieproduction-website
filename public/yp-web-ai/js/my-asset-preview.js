(function(global){
 'use strict';
 const pending=new WeakMap();let queue=Promise.resolve();
 const valid=value=>typeof value==='string'&&/^data:image\/(png|webp);base64,/.test(value);
 async function render(item){
  const [T,{GLTFLoader}]=await Promise.all([import('three'),import('three/addons/loaders/GLTFLoader.js')]);
  let root,renderer;
  try{
   const gltf=await new GLTFLoader().parseAsync(await item.file.arrayBuffer(),'');root=gltf.scene;
   if(!root)throw Error('ไม่พบโมเดล');
   root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());
   if(bounds.isEmpty()||!size.toArray().every(Number.isFinite)||size.length()===0)throw Error('ไม่พบขนาดโมเดล');
   const model=new T.Group();model.add(root);
   model.scale.set(size.x>0?item.size.w/size.x:1,size.y>0?item.size.h/size.y:1,size.z>0?item.size.d/size.z:1);
   model.updateMatrixWorld(true);bounds.setFromObject(model);const center=bounds.getCenter(new T.Vector3());
   model.position.sub(center);model.updateMatrixWorld(true);
   const radius=Math.max(bounds.getSize(size).length()/2,.01),camera=new T.PerspectiveCamera(35,1,radius/100,radius*100);
   camera.position.copy(new T.Vector3(1,.7,1.35).normalize().multiplyScalar(radius/Math.sin(35*Math.PI/360)*1.12));camera.lookAt(0,0,0);
   const scene=new T.Scene();scene.background=new T.Color('#e8ebef');scene.add(model,new T.HemisphereLight(0xffffff,0x667080,2.5));
   const key=new T.DirectionalLight(0xffffff,3);key.position.set(3,5,4);scene.add(key);
   const fill=new T.DirectionalLight(0xffffff,1.5);fill.position.set(-3,2,-2);scene.add(fill);
   renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(192,192,false);renderer.setPixelRatio(1);
   renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.render(scene,camera);
   return renderer.domElement.toDataURL('image/webp',.88);
  }finally{
   const geometries=new Set(),materials=new Set(),textures=new Set();
   root?.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const m of Array.isArray(node.material)?node.material:[node.material])if(m)materials.add(m);});
   materials.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)textures.add(v);});m.dispose();});
   textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});geometries.forEach(g=>g.dispose());
   renderer?.dispose();renderer?.forceContextLoss();
  }
 }
 function show(host,item,url){
  if(!host.isConnected)return;
  const img=document.createElement('img');img.alt='พรีวิว '+item.name;img.src=url;img.draggable=false;
  img.onerror=()=>{host.textContent='GLB';host.title='ไม่สามารถแสดงภาพพรีวิวได้';};host.replaceChildren(img);host.removeAttribute('aria-busy');host.title=item.name;
 }
 function attach(item,host,persist){
  if(valid(item.thumbUrl)){show(host,item,item.thumbUrl);return;}
  if(!item.file?.arrayBuffer)return;
  host.textContent='…';host.title='กำลังสร้างภาพพรีวิว';host.setAttribute('aria-busy','true');
  if(!pending.has(item)){
   const task=queue.then(()=>render(item)).then(async url=>{
    item.thumbUrl=url;
    try{await persist(item.catalogId,url);}catch{/* Keep a usable preview even when local storage is full. */}
    return url;
   }).catch(()=>null);
   pending.set(item,task);queue=task.then(()=>{});
  }
  pending.get(item).then(url=>{
   if(url)show(host,item,url);
   else if(host.isConnected){host.textContent='GLB';host.removeAttribute('aria-busy');host.title='สร้างภาพพรีวิวไม่สำเร็จ · ยังเพิ่มโมเดลได้ตามเดิม';}
  });
 }
 global.YPMyAssetPreview={attach,valid};
})(globalThis);
