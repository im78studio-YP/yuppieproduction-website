(function(global){
 'use strict';
 const faces={front:{label:'หน้า',u:[1,0,0],v:[0,1,0],n:[0,0,1],w:'w',h:'h'},back:{label:'หลัง',u:[-1,0,0],v:[0,1,0],n:[0,0,-1],w:'w',h:'h'},left:{label:'ซ้าย',u:[0,0,1],v:[0,1,0],n:[-1,0,0],w:'d',h:'h'},right:{label:'ขวา',u:[0,0,-1],v:[0,1,0],n:[1,0,0],w:'d',h:'h'},top:{label:'บน',u:[1,0,0],v:[0,0,-1],n:[0,1,0],w:'w',h:'d'},bottom:{label:'ล่าง',u:[1,0,0],v:[0,0,1],n:[0,-1,0],w:'w',h:'d'}};
 const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
 const supported=obj=>obj&&obj.type!=='brandCopy'&&!['tv-samsung-40','tv-65'].includes(obj.catalogId)&&!global.YPTVAsset?.isTV(obj)&&!global.YPTouchScreen?.isTouch(obj)&&!global.YPTVStands?.isStand(obj);
 function clean(value={}){
  return{data:typeof value.data==='string'&&/^data:image\//.test(value.data)?value.data:null,name:String(value.name||'').slice(0,120),id:String(value.id||''),
   w:value.w>0?clamp(value.w,.01,30,1):null,h:value.h>0?clamp(value.h,.01,30,1):null,
   mode:['single','cover','repeat'].includes(value.mode)?value.mode:'single',rotation:((Math.round((Number(value.rotation)||0)/90)*90)%360+360)%360,
   offsetX:clamp(value.offsetX,-30,30,0),offsetY:clamp(value.offsetY,-30,30,0),patternSize:clamp(value.patternSize,.01,30,1)};
 }
 function normalize(obj){
  if(!supported(obj))return;const a=obj.appearance;
  if(!a.stickers||typeof a.stickers!=='object'||Array.isArray(a.stickers)){
   a.stickers={};if(a.textureData)a.stickers.front=clean({data:a.textureData,name:a.textureName,id:a.textureId});
  }
  const out={};for(const face of Object.keys(faces))if(a.stickers[face])out[face]=clean(a.stickers[face]);a.stickers=out;
  // Keep the front-image alias for older integrations; never use it to wrap the model.
  a.textureData=out.front?.data||null;a.textureName=out.front?.name||'';a.textureId=out.front?.id||'';
 }
 const has=obj=>supported(obj)?Object.values(obj.appearance?.stickers||{}).some(s=>!!s.data):!!obj?.appearance?.textureData;
 const key=obj=>Object.entries(obj.appearance?.stickers||{}).map(([face,s])=>[face,s.id,!!s.data,s.w,s.h,s.mode,s.rotation,s.offsetX,s.offsetY,s.patternSize]);
 function geometry(T,root,face,settings){
  const f=faces[face],u=new T.Vector3(...f.u),v=new T.Vector3(...f.v),normal=new T.Vector3(...f.n);
  root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),meshes=[],bounds=new T.Box3();
  root.traverse(m=>{if(!m.isMesh||m.userData?.systemHelper||m.userData?.assetFaceSticker||m.visible===false)return;const matrix=inverse.clone().multiply(m.matrixWorld),p=m.geometry.attributes.position;
   if(!p)return;meshes.push({mesh:m,matrix});for(let i=0;i<p.count;i++)bounds.expandByPoint(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix));
  });if(bounds.isEmpty())return null;
  const center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),axisSize={w:size.x,h:size.y,d:size.z};
  const w=settings.w||axisSize[f.w],h=settings.h||axisSize[f.h],positions=[],normals=[],uv=[];
  function clip(poly,axis,bound,sign){const out=[];for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],da=sign*(a[axis]-bound),db=sign*(b[axis]-bound),insideA=da<=1e-9,insideB=db<=1e-9;
   if(insideA)out.push(a);if(insideA!==insideB){const t=da/(da-db);out.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t});}
  }return out;}
  for(const {mesh,matrix} of meshes){const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index,nm=new T.Matrix3().getNormalMatrix(matrix);
   for(let t=0;t<(idx?idx.count:p.count);t+=3){let poly=[0,1,2].map(k=>{const i=idx?idx.getX(t+k):t+k,point=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix);return{p:point,n:n?new T.Vector3().fromBufferAttribute(n,i).applyMatrix3(nm).normalize():normal.clone(),u:point.clone().sub(center).dot(u),v:point.clone().sub(center).dot(v)};});
    // Facing surfaces only. No UV dependency and no spill onto sides, back, top or bottom.
    const average=poly.reduce((sum,q)=>sum.add(q.n),new T.Vector3()).normalize();if(average.dot(normal)<.65)continue;
    poly=clip(poly,'u',-w/2,-1);if(!poly.length)continue;poly=clip(poly,'u',w/2,1);if(!poly.length)continue;
    poly=clip(poly,'v',-h/2,-1);if(!poly.length)continue;poly=clip(poly,'v',h/2,1);
    for(let i=1;i<poly.length-1;i++)for(const q of [poly[0],poly[i],poly[i+1]]){positions.push(...q.p.clone().addScaledVector(q.n,.0003).toArray());normals.push(...q.n.toArray());uv.push(q.u/w+.5,q.v/h+.5);}
   }
  }if(!positions.length)return null;
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return{geometry:g,w,h};
 }
 function apply(renderer,root,obj){
  normalize(obj);if(!supported(obj))return;const T=renderer.THREE;
  for(const [face,settings] of Object.entries(obj.appearance.stickers)){
   if(!settings.data)continue;const image=renderer.wallStickerImageSource(settings.data);if(!image)continue;
   const built=geometry(T,root,face,settings);if(!built)continue;
   const texture=renderer.artworkTexture(image,built.w,built.h,settings),material=new T.MeshStandardMaterial({color:'#ffffff',map:texture,transparent:true,alphaTest:.01,roughness:.52,metalness:0,side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
   const overlay=new T.Mesh(built.geometry,material);overlay.name='asset-face-sticker-'+face;overlay.userData={objectId:obj.id,systemHelper:true,assetFaceSticker:true,stickerFace:face};overlay.castShadow=false;overlay.receiveShadow=true;overlay.renderOrder=2;root.add(overlay);
  }
 }
 let activeFace='front',activeObjectId=null;
 function init(){
  const host=document.getElementById('assetFaceStickerControls');if(!host)return;
  host.innerHTML='<label class="asset-field">ด้านที่ติดสติ๊กเกอร์<select id="assetStickerFace">'+Object.entries(faces).map(([key,f])=>'<option value="'+key+'">'+f.label+'</option>').join('')+'</select></label><div class="note">ด้านอ้างอิงตามตัวอุปกรณ์ · ภาพและการตั้งค่าแยกกันแต่ละด้าน</div><div id="assetStickerTransform"><label class="asset-field">การจัดภาพ<select data-face-setting="mode"><option value="single">เต็มภาพ · ไม่ตัดภาพ</option><option value="cover">เต็มพื้นที่ · ครอปส่วนเกิน</option><option value="repeat">ลายซ้ำ</option></select></label><div class="asset-sticker-grid">'+[['w','กว้างภาพ (ม.)'],['h','สูงภาพ (ม.)'],['offsetX','เลื่อนซ้าย–ขวา (ม.)'],['offsetY','เลื่อนขึ้น–ลง (ม.)'],['patternSize','ขนาดลายซ้ำ (ม.)']].map(([key,label])=>'<label class="asset-field">'+label+'<input type="number" step="0.01" min="'+(key.startsWith('offset')?'-30':'0.01')+'" max="30" data-face-setting="'+key+'"></label>').join('')+'</div><div class="asset-settings-actions"><button type="button" class="btn sm" id="assetStickerRotate">หมุน 90°</button><button type="button" class="btn sm" id="assetStickerResetPlacement">คืนตำแหน่งภาพ</button></div></div>';
  document.getElementById('assetStickerFace').onchange=e=>{activeFace=e.target.value;syncAssetSettingsForm();};
  host.querySelectorAll('[data-face-setting]').forEach(input=>input.onchange=()=>change({[input.dataset.faceSetting]:input.value}));
  document.getElementById('assetStickerRotate').onclick=()=>{const obj=objectById(objectEditor.selectedId);change({rotation:((obj?.appearance?.stickers?.[activeFace]?.rotation||0)+90)%360});};
  document.getElementById('assetStickerResetPlacement').onclick=()=>change({w:null,h:null,offsetX:0,offsetY:0,rotation:0,mode:'single',patternSize:1});
 }
 function change(patch){const obj=objectById(objectEditor.selectedId);if(!supported(obj)||objectLocked(obj))return;normalizeSceneObjectModel(obj);const before=objectSnapshot();obj.appearance.stickers[activeFace]=clean({...obj.appearance.stickers[activeFace],...patch});normalize(obj);recordObjectHistory(before);sync();syncAssetSettingsForm();}
 function syncForm(obj){
  const host=document.getElementById('assetFaceStickerControls');if(!host)return;
  host.hidden=!supported(obj);if(!supported(obj))return;normalize(obj);if(activeObjectId!==obj.id){activeObjectId=obj.id;activeFace='front';}
  const settings=clean(obj.appearance.stickers[activeFace]),f=faces[activeFace],locked=objectLocked(obj);
  document.getElementById('assetStickerFace').value=activeFace;
  host.querySelectorAll('[data-face-setting]').forEach(input=>{const key=input.dataset.faceSetting;input.value=settings[key]??obj.size[key==='w'?f.w:f.h];input.disabled=locked||!settings.data;if(key==='patternSize')input.parentElement.hidden=settings.mode!=='repeat';});
  document.getElementById('assetStickerTransform').hidden=!settings.data;
  ['assetStickerRotate','assetStickerResetPlacement'].forEach(id=>document.getElementById(id).disabled=locked);
  const preview=document.getElementById('assetStickerPreview');preview.src=settings.data||'';preview.classList.toggle('show',!!settings.data);
  document.getElementById('assetChooseSticker').textContent='อัปโหลดภาพด้าน'+f.label;document.getElementById('assetRemoveSticker').textContent='ลบภาพด้าน'+f.label;document.getElementById('assetRemoveSticker').disabled=locked||!settings.data;
  document.getElementById('assetSurfaceNote').textContent='สีพื้นใช้กับทั้งชิ้น · สติ๊กเกอร์ติดเฉพาะด้าน'+f.label+' · ด้านอื่นคงวัสดุเดิม';
 }
 function setImage(obj,face,data,name,id){normalize(obj);obj.appearance.stickers[face]=clean({...obj.appearance.stickers[face],data,name,id});normalize(obj);}
 function remove(obj,all){normalize(obj);if(all)obj.appearance.stickers={};else delete obj.appearance.stickers[activeFace];normalize(obj);}
 global.YPAssetFaceStickers={faces,supported,clean,normalize,has,key,geometry,apply,init,syncForm,change,setImage,remove,currentFace:()=>activeFace};
})(globalThis);
