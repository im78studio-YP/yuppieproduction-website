(function(root){
 'use strict';
 const id='tv-samsung-40',image='assets/furniture/tv-samsung-40/screen.jpg';
 const hash='c28d043c301c298af8e967d7fb91982a756c241f864f0e4708d12913b0187fa9';
 const definition={catalogId:id,category:'media',type:'screen',name:'ทีวี 40 นิ้ว',icon:'▣',size:{w:.91,d:.10,h:.55},unitPrice:0,color:'#111111',modelUrl:'assets/furniture/tv-samsung-40/model.glb',thumbUrl:image,tvDisplay:true,capabilities:['floorPlaceable','free3DPlaceable','surfaceSnappable','resizable','rotatable','styleable']};
 const definition65={...definition,catalogId:'tv-65',name:'ทีวี 65 นิ้ว',size:{w:1.46,d:.10,h:.80},capabilities:[...definition.capabilities]};
 const isTV=item=>item?.catalogId===id||item?.tvDisplay===true||item?.catalogPromotion===id;
 async function recognize(record){
  // Exact file identity only: another user's TV or similarly named GLB is untouched.
  if(record.catalogPromotion===id)return record;
  if(record.file?.size!==113360||!root.crypto?.subtle)return record;
  const digest=await crypto.subtle.digest('SHA-256',await record.file.arrayBuffer());
  if(Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('')===hash)record.catalogPromotion=id;
  return record;
 }
 async function recognizeProject(project){
  for(const snapshot of Object.values(project?.variants||{}))for(const asset of snapshot?.assets||[])await recognize(asset);
  return project;
 }
 function template(spec,t){
  // Fresh snapshots only, after index-based artwork decoration. Saved drafts are never migrated here.
  const groups=new Map(),remove=new Set(),done=new Set();
  const add=(key,i)=>{if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);};
  t.objects.forEach((o,i)=>{if(o.tv)add('authored-'+o.tv,i);if(o.tvRole==='frame')add('pair-'+i,i);if(o.tvRole==='screen')add('pair-'+(i-1),i);if(o.graphic==='screen'||o.waveArtwork==='screen'){add('art-'+i,i-1);add('art-'+i,i);}});
  for(const [a,b] of root.YPTemplateTVGroups?.pairs[t.id]||[]){add('legacy-'+a,a);add('legacy-'+a,b);}
  function convert(i){const o=spec.objects[i];if(!o||done.has(i))return;done.add(i);Object.assign(o,{catalogId:id,type:'screen',geometryMode:'model',appearance:{mode:'original'},label:'ทีวี',unitPrice:o.unitPrice||0});delete o.structure;delete o.logoSlot;delete o.logoFinish;delete o.transformPolicy;delete o.groupId;}
  for(const indices of groups.values()){
   const unique=[...new Set(indices)].sort((a,b)=>a-b);if(unique.length<2||done.has(unique[0]))continue;
   convert(unique[0]);unique.slice(1).forEach(i=>remove.add(i));
  }
  t.objects.forEach((o,i)=>{if(o.catalogId==='screen-43')convert(i);});
  spec.objects=spec.objects.filter((o,i)=>!remove.has(i));return spec;
 }
 function appearance(renderer,group,obj){
  const T=renderer.THREE,screens=[];
  group.traverse(part=>{if(!part.isMesh)return;
   part.userData.tvDisplay=true;
   if(part.userData.sharedAsset){part.geometry=part.geometry.clone();delete part.userData.sharedAsset;}
   const screen=part.name==='3DGeom-4'||part.name==='tv-screen'||(Array.isArray(part.material)?part.material:[part.material]).some(m=>m?.name==='TV');
   part.material=screen?new T.MeshBasicMaterial({color:'#ffffff',side:T.DoubleSide}):new T.MeshStandardMaterial({color:'#101114',roughness:.4,metalness:.15});
   if(screen){
    // The supplied GLB has UVs outside 0..1 (u=1..2, v=-4..-3).
    // Map its physical display rectangle directly, not the original tiled texture.
    if(part.name==='3DGeom-4'){
     part.geometry.computeBoundingBox();const b=part.geometry.boundingBox,p=part.geometry.attributes.position,uv=[];
     for(let i=0;i<p.count;i++)uv.push((p.getX(i)-b.min.x)/(b.max.x-b.min.x),1-(p.getZ(i)-b.min.z)/(b.max.z-b.min.z));
     part.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    }
    part.material.name='TV';part.material.polygonOffset=true;part.material.polygonOffsetFactor=-1;part.material.polygonOffsetUnits=-2;part.castShadow=false;screens.push(part);
   }
  });
  const buildId=renderer.buildId;
  new T.TextureLoader().load(obj.appearance?.textureData||image,texture=>{
   if(renderer.buildId!==buildId||!group.parent){texture.dispose();return;}
   texture.colorSpace=T.SRGBColorSpace;
   // GLTF UVs use a top-left origin; the fallback plane uses Three's bottom-left origin.
   texture.flipY=screens[0]?.name==='tv-screen';
   screens.forEach(mesh=>{mesh.material.map=texture;mesh.material.needsUpdate=true;});
   renderer.renderer.render(renderer.scene,renderer.camera);
  });
 }
 function fallback(T,s){
  const g=new T.Group(),body=new T.Mesh(new T.BoxGeometry(s.w,s.h,s.d),new T.MeshStandardMaterial());body.position.y=s.h/2;g.add(body);
  const screen=new T.Mesh(new T.PlaneGeometry(s.w*.968,s.h*.94),new T.MeshBasicMaterial());screen.name='tv-screen';screen.position.set(0,s.h*.51,s.d/2+.001);g.add(screen);return g;
 }
 function settings(item,obj){
  const tv=isTV(item),$=id=>document.getElementById(id);
  $('assetAppearanceOptions').style.display=tv?'none':'';document.querySelector('#mAssetSettings .asset-settings-color').style.display=tv?'none':'';
  $('assetChooseSticker').textContent=tv?'เปลี่ยนภาพหน้าจอ':'อัปโหลดสติ๊กเกอร์';
  $('assetRemoveSticker').textContent=tv?'ใช้ภาพจอเริ่มต้น':'ลบสติ๊กเกอร์';$('assetResetSurface').textContent=tv?'คืนภาพจอเริ่มต้น':'คืนพื้นผิวเดิม';
  if(tv){const stand=root.YPTVStands?.isStand(item);$('assetStickerPreview').src=obj.appearance.textureData||(stand?root.YPTVStands.screenImage(item.catalogId):image);$('assetStickerPreview').classList.add('show');$('assetSurfaceNote').textContent=stand?'เปลี่ยนเฉพาะภาพบนหน้าจอ · สีกรอบ ตัวตู้ และฐานคงตามแบบ':'เปลี่ยนเฉพาะภาพบนหน้าจอ · กรอบและตัวเครื่องคงสีดำ';}
 }
 root.YPTVAsset={id,image,definition,definition65,isTV,recognize,recognizeProject,template,appearance,fallback,settings};
})(globalThis);
