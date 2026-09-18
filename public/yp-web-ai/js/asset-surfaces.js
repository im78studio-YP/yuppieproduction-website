(function(global){
 'use strict';
 const caches=new WeakMap(),presets={matte:{roughness:.85,metalness:0},gloss:{roughness:.16,metalness:0},metal:{roughness:.27,metalness:.9}};
 function sanitize(values){
  if(!Array.isArray(values))return[];
  return values.slice(0,256).flatMap(v=>{
   if(!v||!/^p(?:\.\d+)*:m\d+$/.test(v.key)||!Array.isArray(v.triangles))return[];
   const triangles=[...new Set(v.triangles.filter(n=>Number.isSafeInteger(n)&&n>=0&&n<2000000))].sort((a,b)=>a-b).slice(0,100000);
   if(!triangles.length)return[];
   const mode=['inherit','original','tint','solid'].includes(v.mode)?v.mode:'inherit',color=/^#[0-9a-f]{6}$/i.test(v.color||'')?v.color.toLowerCase():'#ffffff';
   const sticker=global.YPAssetFaceStickers?.clean(v.sticker||{});
   if(sticker&&Object.hasOwn(global.YPAssetFaceStickers.faces,v.sticker?.projectionFace||''))sticker.projectionFace=v.sticker.projectionFace;
   return[{key:v.key,triangles,mode,color,finish:Object.hasOwn(presets,v.finish)?v.finish:'original',...(sticker?.data?{sticker}: {})}];
  });
 }
 // Adjacency is welded by positions, not GLB indices: UV seams and hard-normal splits remain selectable.
 function topology(T,entry){
  const g=entry.node.geometry,slotKey=(Array.isArray(entry.node.material)?'multi:':'single:')+entry.slot;let slots=caches.get(g);if(!slots){slots=new Map();caches.set(g,slots);}if(slots.has(slotKey))return slots.get(slotKey);
  const p=g.attributes.position,idx=g.index,count=Math.floor((idx?idx.count:p.count)/3),triangles=new Map(),edges=new Map();
  g.computeBoundingBox();const eps=Math.max(g.boundingBox.getSize(new T.Vector3()).length()*1e-7,1e-8);
  const vertex=i=>new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i):i),key=v=>v.toArray().map(x=>Math.round(x/eps)).join(',');
  for(let t=0;t<count;t++){
   if(Array.isArray(entry.node.material)&&g.groups.length&&!g.groups.some(gr=>gr.materialIndex===entry.slot&&t*3>=gr.start&&t*3+2<gr.start+gr.count))continue;
   const points=[vertex(t*3),vertex(t*3+1),vertex(t*3+2)],normal=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));if(normal.lengthSq()<eps**4)continue;normal.normalize();
   const keys=points.map(key),edgeKeys=keys.map((k,i)=>[k,keys[(i+1)%3]].sort().join('|'));triangles.set(t,{normal,edges:edgeKeys});
   edgeKeys.forEach(k=>{if(!edges.has(k))edges.set(k,[]);edges.get(k).push(t);});
  }
  const out={triangles,edges};slots.set(slotKey,out);return out;
 }
 function region(T,entry,seed,mode='plane'){
  const {triangles,edges}=topology(T,entry),first=triangles.get(seed);if(!first)return[];if(mode==='triangle')return[seed];
  const found=new Set([seed]),queue=[seed],cos=Math.cos((mode==='smooth'?25:5)*Math.PI/180);
  for(let i=0;i<queue.length&&found.size<100000;i++){const tri=triangles.get(queue[i]);for(const edge of tri.edges)for(const id of edges.get(edge)||[]){if(found.has(id))continue;const next=triangles.get(id);if(next.normal.dot(mode==='smooth'?tri.normal:first.normal)<cos)continue;found.add(id);queue.push(id);}}
  return [...found].sort((a,b)=>a-b);
 }
 function subset(T,entry,ids){
  const source=entry.node.geometry,valid=topology(T,entry).triangles,indices=source.index,chosen=ids.filter(id=>valid.has(id));if(!chosen.length)return null;
  const g=new T.BufferGeometry();for(const [name,a] of Object.entries(source.attributes)){
   if(!['position','normal','uv','uv1','color','tangent'].includes(name))continue;
   const values=[];for(const id of chosen)for(let k=0;k<3;k++){const i=indices?indices.getX(id*3+k):id*3+k;for(let c=0;c<a.itemSize;c++)values.push(a.getComponent(i,c));}g.setAttribute(name,new T.Float32BufferAttribute(values,a.itemSize));
  }if(!g.attributes.normal)g.computeVertexNormals();return g;
 }
 function projection(T,root,entry,g,settings){
  if(settings.projectionFace){
   const f=global.YPAssetFaceStickers.faces[settings.projectionFace],bounds=modelBounds(T,root),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),dims={w:size.x,h:size.y,d:size.z},w=settings.w||dims[f.w],h=settings.h||dims[f.h],matrix=root.matrixWorld.clone().invert().multiply(entry.node.matrixWorld),u=new T.Vector3(...f.u),v=new T.Vector3(...f.v),p=g.attributes.position,uv=[];
   for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix).sub(center);uv.push(q.dot(u)/w+.5,q.dot(v)/h+.5);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return{w,h};
  }
  root.updateWorldMatrix(true,true);const matrix=root.matrixWorld.clone().invert().multiply(entry.node.matrixWorld),nm=new T.Matrix3().getNormalMatrix(matrix),p=g.attributes.position,n=g.attributes.normal,normal=new T.Vector3();
  for(let i=0;i<n.count;i++)normal.add(new T.Vector3().fromBufferAttribute(n,i).applyMatrix3(nm));if(normal.lengthSq()<1e-10)normal.fromBufferAttribute(n,0).applyMatrix3(nm);normal.normalize();
  const up=Math.abs(normal.y)>.9?new T.Vector3(0,0,-1):new T.Vector3(0,1,0),u=up.clone().cross(normal).normalize(),v=normal.clone().cross(u).normalize(),points=[];let minU=Infinity,maxU=-Infinity,minV=Infinity,maxV=-Infinity;
  for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix),x=q.dot(u),y=q.dot(v);points.push([x,y]);minU=Math.min(minU,x);maxU=Math.max(maxU,x);minV=Math.min(minV,y);maxV=Math.max(maxV,y);}
  const w=settings.w||Math.max(.01,maxU-minU),h=settings.h||Math.max(.01,maxV-minV),cx=(minU+maxU)/2,cy=(minV+maxV)/2;
  g.setAttribute('uv',new T.Float32BufferAttribute(points.flatMap(([x,y])=>[(x-cx)/w+.5,(y-cy)/h+.5]),2));return{w,h};
 }
 function clear(root){const old=[];root.traverse(n=>{if(n.userData.assetSurfaceOverlay)old.push(n);});old.forEach(n=>{n.removeFromParent();n.geometry.dispose();if(n.userData.ownsSurfaceTexture)n.material.map?.dispose();n.material.dispose();});}
 function modelBounds(T,root){root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),bounds=new T.Box3();root.traverse(m=>{if(!m.isMesh||m.userData.systemHelper||!m.visible)return;const matrix=inverse.clone().multiply(m.matrixWorld),p=m.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix));});return bounds;}
 // Convert only the editor draft. Keep original projection coordinates and image settings;
 // the saved/live object is untouched until the single Save action.
 function migrate(T,root,entries,appearance){
  const converted=[],remaining={},bounds=modelBounds(T,root),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),dims={w:size.x,h:size.y,d:size.z},inverse=root.matrixWorld.clone().invert();
  for(const [face,s] of Object.entries(appearance.stickers||{})){
   if(!s.data)continue;const f=global.YPAssetFaceStickers.faces[face];if(!f){remaining[face]=s;continue;}const direction=new T.Vector3(...f.n),u=new T.Vector3(...f.u),v=new T.Vector3(...f.v),w=s.w||dims[f.w],h=s.h||dims[f.h],patches=[];
   for(const e of entries){const g=e.node.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index,matrix=inverse.clone().multiply(e.node.matrixWorld),nm=new T.Matrix3().getNormalMatrix(matrix),triangles=[];
    for(const id of topology(T,e).triangles.keys()){
     const points=[0,1,2].map(k=>{const i=idx?idx.getX(id*3+k):id*3+k;return{point:new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix).sub(center),normal:n?new T.Vector3().fromBufferAttribute(n,i).applyMatrix3(nm).normalize():direction.clone()};});
     if(points.reduce((sum,q)=>sum.add(q.normal),new T.Vector3()).normalize().dot(direction)<.65)continue;
     const xs=points.map(q=>q.point.dot(u)),ys=points.map(q=>q.point.dot(v));if(Math.max(...xs)<-w/2||Math.min(...xs)>w/2||Math.max(...ys)<-h/2||Math.min(...ys)>h/2)continue;triangles.push(id);
    }
    if(triangles.length)patches.push({key:e.key,triangles,mode:'inherit',color:'#ffffff',finish:'original',sticker:{...s,projectionFace:face}});
   }
   if(!patches.length)remaining[face]=s;else converted.push(...patches);
  }
  if(Object.keys(remaining).length)throw Error('ยังเชื่อมภาพเดิมบางด้านไม่ได้ จึงไม่ได้เปลี่ยนงาน กรุณาตรวจโมเดล');
  const all=[...converted,...sanitize(appearance.surfaces)];if(all.length>256)throw Error('พื้นที่แก้ไขเกิน 256 กลุ่ม จึงไม่ได้เปลี่ยนข้อมูลเดิม');return sanitize(all);
 }
 function apply(renderer,root,entries,values){
  clear(root);const T=renderer.THREE;
  const patches=sanitize(values);for(const [layer,patch] of patches.entries()){
   const e=entries.find(e=>e.key===patch.key);if(!e)continue;
   const add=(geometry,material,ownsTexture=false,parent=e.node)=>{material.transparent=true;material.polygonOffset=true;material.polygonOffsetFactor=-3;material.polygonOffsetUnits=-3;material.depthWrite=false;const m=new T.Mesh(geometry,material);m.name='asset-selected-surface';m.userData={systemHelper:true,assetSurfaceOverlay:true,ownsSurfaceTexture:ownsTexture,objectId:root.userData.objectId};m.raycast=()=>{};m.receiveShadow=true;m.renderOrder=4+(layer+(ownsTexture?.5:0))/(patches.length+1);parent.add(m);};
   if(patch.mode!=='inherit'||patch.finish!=='original'){
    const g=subset(T,e,patch.triangles);if(!g)continue;const base=patch.mode==='original'?e.original:(Array.isArray(e.node.material)?e.node.material[e.slot]:e.node.material);let mat;
    if(patch.mode==='solid')mat=new T.MeshStandardMaterial({color:patch.color,side:base.side,roughness:.72,metalness:.02});
    else{mat=base.clone();if(patch.mode==='tint')mat.color?.set(patch.color);}
    if(presets[patch.finish]){if(!mat.isMeshStandardMaterial){const old=mat;mat=new T.MeshStandardMaterial({color:old.color,map:old.map,side:old.side});old.dispose();}Object.assign(mat,presets[patch.finish]);}add(g,mat);
   }
   if(patch.sticker?.data){const image=renderer.wallStickerImageSource(patch.sticker.data);if(!image)continue;const g=subset(T,e,patch.triangles);if(!g)continue;const {w,h}=projection(T,root,e,g,patch.sticker),texture=renderer.artworkTexture(image,w,h,patch.sticker);texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;
    // Transparent border outside the projected rectangle, instead of stretched edge pixels.
    const mat=new T.MeshStandardMaterial({map:texture,color:'#ffffff',roughness:.52,metalness:0,transparent:true,alphaTest:.01,side:T.DoubleSide});
    mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#ifdef USE_MAP\nif(vMapUv.x<0.0||vMapUv.x>1.0||vMapUv.y<0.0||vMapUv.y>1.0) discard;\n#endif\n#include <map_fragment>');};mat.customProgramCacheKey=()=> 'asset-surface-rect-v1';
    if(patch.sticker.projectionFace){g.applyMatrix4(root.matrixWorld.clone().invert().multiply(e.node.matrixWorld));const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*.0003,p.getY(i)+n.getY(i)*.0003,p.getZ(i)+n.getZ(i)*.0003);add(g,mat,true,root);}else add(g,mat,true);
   }
  }
 }
 function createEditor({renderer,root,parts,object,dialog,canvas,onMode,onPick,initialSurfaces}){
  const T=renderer.THREE,box=document.createElement('section');box.className='asset-surface-tools';
  box.innerHTML='<label for="assetPickMode">โหมดเลือก</label><select id="assetPickMode"><option value="part">เลือกชิ้นส่วน</option><option value="surface">เลือกพื้นผิว</option></select><div data-surface-controls hidden><label>ขอบเขตที่เลือก<select id="assetSurfaceRegion"><option value="plane">ผิวราบที่ต่อกัน</option><option value="smooth">ผิวโค้งต่อเนื่อง · หยุดที่มุมหัก</option><option value="triangle">สามเหลี่ยมเดียว · เก็บรายละเอียด</option></select></label><label><input type="checkbox" id="assetSurfaceAdd"> เพิ่ม / ถอนพื้นที่จากที่เลือก</label><p data-surface-info role="status">คลิกพื้นผิวบนภาพ 3D · สีฟ้าคือพื้นที่ที่เลือก</p><button class="btn sm" data-surface-clear type="button">ล้างการเลือก</button><label>สีเฉพาะพื้นที่<select id="assetSurfaceMode"><option value="inherit">ตามชิ้นส่วนเดิม</option><option value="original">วัสดุต้นฉบับ</option><option value="solid">สีล้วน</option><option value="tint">ย้อมสี</option></select></label><input id="assetPatchColor" type="color" value="#ffffff" aria-label="สีพื้นที่ที่เลือก"><label>วัสดุเฉพาะพื้นที่<select id="assetSurfaceFinish"><option value="original">ตามวัสดุเดิม</option><option value="matte">ผิวด้าน</option><option value="gloss">ผิวมัน</option><option value="metal">โลหะ</option></select></label><label>สติ๊กเกอร์เฉพาะพื้นที่<input type="file" id="assetSurfaceImage" accept="image/png,image/jpeg,image/webp"></label><label>การจัดภาพ<select id="assetSurfaceFit"><option value="single">เต็มภาพ · ไม่ตัดภาพ</option><option value="cover">เต็มพื้นที่ · ครอปส่วนเกิน</option><option value="repeat">ลายซ้ำ</option></select></label><div class="surface-number-grid">'+[['w','กว้าง (ม.)'],['h','สูง (ม.)'],['offsetX','แนวนอน − ซ้าย / + ขวา (ม.)'],['offsetY','แนวตั้ง − ลง / + ขึ้น (ม.)'],['patternSize','ขนาดลายซ้ำ (ม.)']].map(([k,label])=>'<label>'+label+'<input type="number" data-surface-number="'+k+'" step="0.01" placeholder="อัตโนมัติ" min="'+(k.startsWith('offset')?'-30':'0.01')+'" max="30"></label>').join('')+'</div><button type="button" class="btn sm" data-surface-rotate>หมุนภาพ 90°</button><button type="button" class="btn sm" data-surface-remove-image>ลบภาพเฉพาะพื้นที่</button><button type="button" class="btn sm" data-surface-reset>คืนการตั้งค่าพื้นที่ที่เลือก</button><label><input type="checkbox" data-surface-highlight checked> แสดงไฮไลต์พื้นที่</label><p class="note">ทดลองก่อนบันทึก · ผิวโค้งใช้การฉายภาพ อาจยืดบริเวณโค้ง · ไม่แก้ไฟล์ต้นฉบับ</p></div>';
  dialog.querySelector('[data-part-info]').before(box);const $=s=>box.querySelector(s),info=$('[data-surface-info]'),selection=new Map();let draft=sanitize(initialSurfaces||object.appearance.surfaces),highlights=[],alive=true,pending=false,activePatch=-1,activeBatch=[];
  const controls=$('[data-surface-controls]'),pick=$('#assetPickMode'),imageName=document.createElement('small');$('#assetSurfaceImage').after(imageName);
  const editing=()=>pick.value==='surface',imageSettings=()=>({...global.YPAssetFaceStickers.clean(settings.sticker||{}),...(settings.sticker?.projectionFace?{projectionFace:settings.sticker.projectionFace}:{})});let settings={mode:'inherit',color:'#ffffff',finish:'original'};
  const gallery=document.createElement('label');gallery.textContent='พื้นที่และสติ๊กเกอร์ที่มีอยู่';const savedList=document.createElement('select');savedList.id='assetSavedSurfaces';gallery.append(savedList);controls.prepend(gallery);const preview=document.createElement('img');preview.className='surface-image-preview';preview.alt='ภาพสติ๊กเกอร์ที่กำลังแก้ไข';imageName.after(preview);
  const advanced=document.createElement('details'),summary=document.createElement('summary');summary.textContent='ปรับขอบเขตการเลือก';advanced.className='surface-selection-options';advanced.append(summary,$('#assetSurfaceRegion').parentElement,$('#assetSurfaceAdd').parentElement,$('[data-surface-clear]'));
  const colorPanel=document.createElement('div'),stickerPanel=document.createElement('div'),tabs=document.createElement('div');colorPanel.className=stickerPanel.className='surface-tool-panel';tabs.className='surface-tool-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','เครื่องมือพื้นผิว');
  colorPanel.append($('#assetSurfaceMode').parentElement,$('#assetPatchColor'),$('#assetSurfaceFinish').parentElement);
  stickerPanel.append($('#assetSurfaceImage').parentElement,$('#assetSurfaceFit').parentElement,$('.surface-number-grid'),$('[data-surface-rotate]'),$('[data-surface-remove-image]'));
  for(const [key,label] of [['color','สี / วัสดุ'],['sticker','สติ๊กเกอร์']]){const button=document.createElement('button');button.type='button';button.className='btn';button.dataset.surfaceTab=key;button.textContent=label;button.onclick=()=>showPanel(key);tabs.append(button);}
  controls.replaceChildren(gallery,info,$('[data-surface-highlight]').parentElement,advanced,tabs,colorPanel,stickerPanel,$('[data-surface-reset]'),$('.note'));
  const uploadButton=document.createElement('button');uploadButton.type='button';uploadButton.className='btn';uploadButton.onclick=()=>$('#assetSurfaceImage').click();$('#assetSurfaceImage').before(uploadButton);$('#assetSurfaceImage').hidden=true;
  function showPanel(key){colorPanel.hidden=key!=='color';stickerPanel.hidden=key!=='sticker';tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.surfaceTab===key)));}showPanel('color');
  function selectPatch(i){const p=draft[i];if(!p)return;activePatch=i;activeBatch=[i];selection.clear();selection.set(p.key,new Set(p.triangles));settings=structuredClone(p);onPick?.(parts.find(e=>e.key===p.key));showPanel(p.sticker?.data?'sticker':'color');syncFields();}
  savedList.onchange=()=>{if(savedList.value!=='')selectPatch(Number(savedList.value));};
  const removeHighlights=()=>{highlights.forEach(m=>{m.removeFromParent();m.geometry.dispose();m.material.dispose();});highlights=[];};
  function showSelection(){removeHighlights();let count=0;for(const [key,ids] of selection){count+=ids.size;if(!$('[data-surface-highlight]').checked||!editing())continue;const e=parts.find(p=>p.key===key),g=subset(T,e,[...ids]);if(!g)continue;const m=new T.Mesh(g,new T.MeshBasicMaterial({color:0x00cfe0,transparent:true,opacity:.3,side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}));m.userData.systemHelper=true;m.raycast=()=>{};m.renderOrder=8;e.node.add(m);highlights.push(m);}info.textContent=count?'เลือก '+count+' สามเหลี่ยม / '+selection.size+' ชิ้นส่วน · ทดลองก่อนบันทึก':'คลิกพื้นผิวบนภาพ 3D · สีฟ้าคือพื้นที่ที่เลือก';
   pick.disabled=pending;controls.querySelectorAll('select,input,button').forEach(el=>{if(['assetSurfaceRegion','assetSurfaceAdd','assetSavedSurfaces'].includes(el.id)||el.hasAttribute('data-surface-clear')||el.hasAttribute('data-surface-highlight')||el.hasAttribute('data-surface-tab')){el.disabled=pending;return;}el.disabled=!count||pending;});
  }
  function syncFields(){savedList.replaceChildren(new Option('คลิกบนอุปกรณ์ หรือเลือกพื้นที่ที่บันทึกไว้',''));draft.forEach((p,i)=>savedList.add(new Option((i+1)+'. '+(p.sticker?.name||'สี / วัสดุ')+(p.sticker?.projectionFace?' · ด้าน'+global.YPAssetFaceStickers.faces[p.sticker.projectionFace].label:''),String(i))));savedList.value=activePatch>=0?String(activePatch):'';$('#assetSurfaceMode').value=settings.mode;$('#assetPatchColor').value=settings.color;$('#assetSurfaceFinish').value=settings.finish;const s=imageSettings();uploadButton.textContent=s.data?'เปลี่ยนภาพสติ๊กเกอร์':'อัปโหลดภาพสติ๊กเกอร์';preview.hidden=!s.data;if(s.data)preview.src=s.data;else preview.removeAttribute('src');imageName.textContent=s.data?'ภาพปัจจุบัน: '+(s.name||'สติ๊กเกอร์'):'พื้นที่นี้ยังไม่มีสติ๊กเกอร์';$('#assetSurfaceFit').value=s.mode;box.querySelectorAll('[data-surface-number]').forEach(el=>{el.value=global.YPAssetFaceStickers.uiOffset(el.dataset.surfaceNumber,s[el.dataset.surfaceNumber])??'';if(el.dataset.surfaceNumber==='patternSize')el.parentElement.hidden=s.mode!=='repeat';});showSelection();}
  function refresh(){removeHighlights();apply(renderer,root,parts,draft);showSelection();}
  function commitSelection(reset=false){
   if(!selection.size)return;if(activeBatch.length){if(reset){for(const index of [...activeBatch].sort((a,b)=>b-a))draft.splice(index,1);activePatch=-1;activeBatch=[];}else for(const index of activeBatch){const current=draft[index];draft[index]={...structuredClone(settings),key:current.key,triangles:current.triangles};}}
   else if(!reset){if(draft.length+selection.size>256){info.textContent='พื้นที่แก้ไขครบ 256 กลุ่มแล้ว กรุณาแก้กลุ่มเดิม';return;}activeBatch=[];for(const [key,ids] of selection){draft.push({...structuredClone(settings),key,triangles:[...ids]});activeBatch.push(draft.length-1);}activePatch=activeBatch.length===1?activeBatch[0]:-1;}draft=sanitize(draft);refresh();syncFields();
  }
  pick.onchange=()=>{controls.hidden=!editing();onMode(editing(),pick.value);canvas.style.cursor=editing()?global.YPAssetGlowPath.selectionCursor:'';showSelection();};
  $('#assetSurfaceMode').onchange=e=>{settings.mode=e.target.value;commitSelection();};$('#assetPatchColor').oninput=e=>{settings.color=e.target.value;if(['inherit','original'].includes(settings.mode))settings.mode='solid';commitSelection();};$('#assetSurfaceFinish').onchange=e=>{settings.finish=e.target.value;commitSelection();};
  $('#assetSurfaceFit').onchange=e=>{settings.sticker={...imageSettings(),mode:e.target.value};commitSelection();};box.querySelectorAll('[data-surface-number]').forEach(el=>el.onchange=()=>{settings.sticker={...imageSettings(),[el.dataset.surfaceNumber]:el.value===''?null:global.YPAssetFaceStickers.uiOffset(el.dataset.surfaceNumber,Number(el.value))};commitSelection();});
  $('[data-surface-rotate]').onclick=()=>{const s=imageSettings();settings.sticker={...s,rotation:(s.rotation+90)%360};commitSelection();};
  $('[data-surface-remove-image]').onclick=()=>{delete settings.sticker;commitSelection();};$('[data-surface-reset]').onclick=()=>{settings={mode:'inherit',color:'#ffffff',finish:'original'};commitSelection(true);};
  $('[data-surface-clear]').onclick=()=>{selection.clear();activePatch=-1;activeBatch=[];syncFields();};$('[data-surface-highlight]').onchange=showSelection;
  $('#assetSurfaceImage').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file||!selection.size||pending)return;if(!/^image\/(png|jpeg|webp)$/.test(file.type)){info.textContent='รองรับ PNG, JPG และ WebP';return;}pending=true;showSelection();let failed=false;try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});const img=new Image();img.src=data;await img.decode();if(!alive)return;renderer.wallStickerImages.set(data,img);settings.sticker={...imageSettings(),data,name:file.name,id:Date.now().toString(36)};commitSelection();}catch{failed=true;}finally{pending=false;if(alive){showSelection();if(failed)info.textContent='เปิดภาพไม่สำเร็จ กรุณาเลือกไฟล์ภาพใหม่';}}};
  function click(hit){if(!editing())return false;if(pending)return true;if(!hit)return true;const entry=parts.find(e=>e.node===hit.object&&e.slot===(hit.face?.materialIndex||0));if(!entry||!Number.isInteger(hit.faceIndex))return true;
   onPick?.(entry);
   const ids=region(T,entry,hit.faceIndex,$('#assetSurfaceRegion').value);if(!ids.length)return true;
   if(!$('#assetSurfaceAdd').checked){selection.clear();const index=draft.findLastIndex(p=>p.key===entry.key&&p.triangles.includes(hit.faceIndex));if(index>=0){selectPatch(index);return true;}settings={mode:'inherit',color:'#ffffff',finish:'original'};}activePatch=-1;activeBatch=[];
   const chosen=selection.get(entry.key)||new Set(),remove=ids.every(id=>chosen.has(id));ids.forEach(id=>remove?chosen.delete(id):chosen.add(id));if(chosen.size)selection.set(entry.key,chosen);else selection.delete(entry.key);syncFields();return true;
  }
  refresh();syncFields();return{click,editing,refresh,data:()=>sanitize(draft),pending:()=>pending,setScope(scope){pick.value=scope;pick.onchange();},clearAll(){draft=[];selection.clear();activePatch=-1;activeBatch=[];refresh();syncFields();},selectPart(entry){pick.value='surface';pick.onchange();const existing=draft.findLastIndex(p=>p.key===entry.key&&p.sticker?.data);if(existing>=0)selectPatch(existing);else{selection.clear();activePatch=-1;activeBatch=[];settings={mode:'inherit',color:'#ffffff',finish:'original'};syncFields();info.textContent='คลิกพื้นผิวบนโมเดลที่ต้องการติดภาพ';}},dispose(){alive=false;removeHighlights();clear(root);box.remove();}};
 }
 const key=obj=>sanitize(obj.appearance?.surfaces).map(p=>({...p,sticker:p.sticker?{...p.sticker,data:!!p.sticker.data}:null}));
 global.YPAssetSurfaces={sanitize,topology,region,subset,apply,clear,createEditor,key,migrate};
})(globalThis);
