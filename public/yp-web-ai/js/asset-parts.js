(function(global){
 'use strict';
 const records=new WeakMap(),materials=m=>Array.isArray(m)?m:[m];
 const presets={matte:{roughness:.85,metalness:0},gloss:{roughness:.16,metalness:0},metal:{roughness:.27,metalness:.9}};
 function wholeMaterial(T,source,appearance,node){
  let m;if(appearance.mode==='solid'&&node?.name!=='ribbon-white-stripe'&&node?.name!=='step-fascia-accent')m=new T.MeshStandardMaterial({color:appearance.color||'#f5f5f5',roughness:.72,metalness:.02,side:source.side,flatShading:source.flatShading===true});
  else{m=source.clone();if(appearance.mode==='tint'&&appearance.color)m.color?.set(appearance.color);}
  if(presets[appearance.finish]){if(!m.isMeshStandardMaterial){const old=m;m=new T.MeshStandardMaterial({color:old.color,map:old.map,side:old.side,transparent:old.transparent,opacity:old.opacity,alphaTest:old.alphaTest});old.dispose();}Object.assign(m,presets[appearance.finish]);}return m;
 }
 function sanitize(value){
  const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
  for(const [key,v] of Object.entries(value).slice(0,2000)){
   if(!/^p(?:\.\d+)*:m\d+$/.test(key)||!v||!['inherit','original','tint','solid'].includes(v.mode))continue;
   const colored=v.mode==='tint'||v.mode==='solid';if(colored&&!/^#[0-9a-f]{6}$/i.test(v.color||''))continue;
   const edgeGlow=global.YPAssetEdgeGlow?.sanitize(v.edgeGlow);
   if(v.mode==='inherit'&&!edgeGlow)continue;
   out[key]={mode:v.mode,color:colored?v.color.toLowerCase():null,finish:Object.hasOwn(presets,v.finish)?v.finish:'original'};
   if(edgeGlow)out[key].edgeGlow=edgeGlow;
  }return out;
 }
 function capture(root){
  const entries=[];
  function walk(node,path){
   if(node.isMesh&&node.material&&!node.userData?.systemHelper&&!node.userData?.anchorGuide&&!/hit-target/.test(node.name)){
    materials(node.material).forEach((source,slot)=>{
     if(!source)return;
     entries.push({key:path+':m'+slot,node,slot,original:source,inherited:null,label:node.name||source.name||'ชิ้นส่วน '+(entries.length+1)});
    });
   }
   node.children.forEach((child,i)=>walk(child,path+'.'+i));
  }walk(root,'p');records.set(root,entries);
  const previous=root.userData.disposeResources;
  root.userData.disposeResources=()=>{previous?.();entries.forEach(e=>e.inherited?.dispose());records.delete(root);};
 }
 function seal(root){for(const e of records.get(root)||[]){e.inherited?.dispose();e.inherited=materials(e.node.material)[e.slot].clone();}}
 function materialFor(T,entry,override){
  if(!override||override.mode==='inherit')return entry.inherited.clone();
  const source=entry.original;
  if(override.mode==='original')return source.clone();
  let next;
  if(override.mode==='solid')next=new T.MeshStandardMaterial({color:override.color,roughness:.72,metalness:.02,side:source.side,flatShading:source.flatShading===true});
  else{next=source.clone();next.color?.set(override.color);}
  if(presets[override.finish]){
   // GLB surfaces normally use Standard/Physical materials. Upgrade Basic materials only when a finish is requested.
   if(!next.isMeshStandardMaterial){const old=next;next=new T.MeshStandardMaterial({color:old.color,map:old.map,side:old.side,transparent:old.transparent,opacity:old.opacity,alphaTest:old.alphaTest});old.dispose();}
   Object.assign(next,presets[override.finish]);
  }
  next.needsUpdate=true;return next;
 }
 function replace(entry,material){
  const old=materials(entry.node.material)[entry.slot];
  if(Array.isArray(entry.node.material)){entry.node.material=[...entry.node.material];entry.node.material[entry.slot]=material;}else entry.node.material=material;
  if(old!==entry.original&&old!==entry.inherited)old.dispose();
 }
 function apply(root,overrides,T){
  const data=sanitize(overrides);
  for(const e of records.get(root)||[])if(e.inherited){replace(e,materialFor(T,e,data[e.key]));global.YPAssetEdgeGlow?.update(T,e,data[e.key]?.edgeGlow);}
 }
 const entries=root=>records.get(root)||[];
 global.YPAssetParts={sanitize,capture,seal,apply,entries,wholeMaterial};
 if(typeof document==='undefined')return;

 let active=null,opening=false;
 async function open(){
  if(active||opening)return;
  const object=objectById(objectEditor.selectedId);if(!object||objectLocked(object))return;
  opening=true;const trigger=document.activeElement;
  try{
   const renderer=await loadThreeRenderer();
   if(!await renderer.waitForSceneAssets(15000,BoothSpec))throw Error('โมเดลยังโหลดไม่ครบ กรุณาลองใหม่');
   if(objectById(object.id)!==object||objectLocked(object))throw Error('อุปกรณ์ที่เลือกเปลี่ยนแล้ว กรุณาเปิดใหม่');
   let source=renderer.objectMeshes.get(object.id),parts=entries(source);
   const deadline=Date.now()+10000;
   while(parts.length&&parts.some(e=>!e.inherited)&&Date.now()<deadline){await new Promise(resolve=>setTimeout(resolve,50));source=renderer.objectMeshes.get(object.id);parts=entries(source);}
   if(objectEditor.selectedId!==object.id)return;
   if(!parts.length||parts.some(e=>!e.inherited))throw Error('อุปกรณ์นี้ยังไม่รองรับการแก้ชิ้นส่วน หรือพื้นผิวยังโหลดไม่ครบ');
   closeAssetSettings();launch(renderer,source,parts,object,trigger);
  }catch(error){announceCatalog(error.message||'เปิดตัวแก้ชิ้นส่วนไม่สำเร็จ','error');}
  finally{opening=false;}
 }
 function launch(r,source,sourceParts,object,trigger){
  const initialSurfaces=global.YPAssetSurfaces.migrate(r.THREE,source,sourceParts,object.appearance),appearanceDraft=structuredClone(object.appearance),originalLabel=object.label||'';
  appearanceDraft.stickers={};appearanceDraft.textureData=null;appearanceDraft.textureName='';appearanceDraft.textureId='';
  const T=r.THREE,dialog=document.createElement('dialog');dialog.className='asset-parts-dialog';dialog.setAttribute('aria-labelledby','assetPartsTitle');
  dialog.innerHTML='<header><div><small>PART EDITOR · ทดลองก่อนบันทึก</small><h2 id="assetPartsTitle"></h2></div><button type="button" class="btn" data-part-close aria-label="ยกเลิกและปิด">×</button></header><div class="asset-parts-body"><div class="asset-parts-view" aria-label="ภาพอุปกรณ์ 3D"><p>คลิกเลือกชิ้นส่วน · ลากหมุน · ล้อเมาส์ซูม</p><button class="btn" type="button" data-part-frame>จัดภาพพอดี</button></div><aside><p data-part-info></p><label for="assetPartList">ชิ้นส่วนในโมเดล</label><select id="assetPartList" size="6"></select><h3 data-part-name></h3><label for="assetPartMode">การใช้สี</label><select id="assetPartMode"><option value="inherit">ตามการตั้งค่าทั้งชิ้น</option><option value="original">วัสดุต้นฉบับ</option><option value="tint">ย้อมสี · คงลายเดิม</option><option value="solid">สีล้วน</option></select><label for="assetPartColor">สีเฉพาะชิ้นส่วน</label><input id="assetPartColor" type="color" value="#ffffff"><label for="assetPartFinish">ลักษณะวัสดุ</label><select id="assetPartFinish"><option value="original">ตามวัสดุเดิม</option><option value="matte">ผิวด้าน</option><option value="gloss">ผิวมัน</option><option value="metal">โลหะ</option></select><button class="btn" type="button" data-part-reset>คืนวัสดุต้นฉบับเฉพาะชิ้นนี้</button><p class="note">แก้เฉพาะอุปกรณ์ตัวนี้ ไม่เปลี่ยนต้นฉบับในคลัง<br>ยังไม่รองรับย้าย ย่อ–ขยาย หรือแยกเนื้อโมเดล</p><p data-part-status role="status" aria-live="polite"></p></aside></div><footer><button class="btn" type="button" data-part-close>ยกเลิก</button><button class="btn pri" type="button" data-part-save>บันทึกชิ้นส่วน</button></footer>';
  const $=s=>dialog.querySelector(s),viewport=$('.asset-parts-view'),list=$('#assetPartList'),mode=$('#assetPartMode'),color=$('#assetPartColor'),finish=$('#assetPartFinish'),status=$('[data-part-status]');
  dialog.querySelector('header small').textContent='ASSET EDITOR · ทดลองก่อนบันทึก';$('[data-part-save]').textContent='บันทึกการแก้ไข';
  const whole=document.createElement('section');whole.className='asset-whole-tools';whole.innerHTML='<label>ชื่ออุปกรณ์<input id="assetWholeName" maxlength="60"></label><label>สีทั้งอุปกรณ์<select id="assetWholeMode"><option value="original">วัสดุต้นฉบับ</option><option value="tint">ย้อมสี</option><option value="solid">สีล้วน</option></select></label><input id="assetWholeColor" type="color" aria-label="สีทั้งอุปกรณ์"><label>วัสดุทั้งอุปกรณ์<select id="assetWholeFinish"><option value="original">ตามวัสดุเดิม</option><option value="matte">ผิวด้าน</option><option value="gloss">ผิวมัน</option><option value="metal">โลหะ</option></select></label><p class="note">ส่วนที่ตั้งค่าแยกไว้ยังคงเดิม · ติดภาพโดยเลือกพื้นผิวบนโมเดล</p><button class="btn" type="button" id="assetWholeReset">คืนพื้นผิวทั้งหมดเป็นวัสดุต้นฉบับ</button>';
  $('[data-part-info]').before(whole);$('#assetWholeName').value=originalLabel;$('#assetWholeMode').value=appearanceDraft.mode||'original';$('#assetWholeColor').value=appearanceDraft.color||'#f5f5f5';$('#assetWholeFinish').value=appearanceDraft.finish||'original';
  const imageButton=document.createElement('button');imageButton.type='button';imageButton.className='btn';imageButton.textContent='เลือกผิวเพื่อติดหรือแก้สติ๊กเกอร์';imageButton.onclick=()=>surfaceEditor.selectPart(parts[selected]);finish.after(imageButton);
  const effect=document.createElement('fieldset');effect.className='asset-part-effect';effect.innerHTML='<legend>เอฟเฟกต์ไฟเรืองตามขอบ</legend><label class="asset-part-effect-toggle"><input id="assetPartGlow" type="checkbox"> เปิดไฟขอบชิ้นส่วนนี้</label><label for="assetPartGlowColor">สีไฟ</label><input id="assetPartGlowColor" type="color" value="#fff1c2"><label for="assetPartGlowIntensity">ความสว่าง <output id="assetPartGlowValue">1.0</output></label><input id="assetPartGlowIntensity" type="range" min="0.2" max="3" step="0.1" value="1"><p class="note">ตามขอบและรอยหักของโมเดลที่เลือก ไม่ใช่กรอบชมพู · เป็นเอฟเฟกต์ภาพ ไม่ส่องสว่างวัตถุรอบข้าง</p>';
  $('[data-part-reset]').before(effect);
  const glow=$('#assetPartGlow'),glowColor=$('#assetPartGlowColor'),glowIntensity=$('#assetPartGlowIntensity'),glowValue=$('#assetPartGlowValue');
  $('#assetPartsTitle').textContent='แก้ไขอุปกรณ์ · '+selectedAssetName(object);
  const baseline=JSON.stringify(object.appearance),draft=sanitize(object.appearance.parts);
  document.body.append(dialog);dialog.showModal();
  let gl,controls,observer,highlight,environment,pathEditor,surfaceEditor,selected=0,frameId=0,closed=false,down=null;
  const owned=new Set(),scene=new T.Scene();scene.background=new T.Color('#e5e8ec');
  const model=source.clone(true);model.position.set(0,0,0);model.rotation.set(0,0,0);model.scale.set(1,1,1);model.visible=true;
  // Cloned live effects share GPU resources: detach them without disposal, then build preview-owned copies.
  const clonedEffects=[];model.traverse(node=>{if(node.userData.partEdgeGlow||node.userData.assetSurfaceOverlay||node.userData.assetFaceSticker)clonedEffects.push(node);});clonedEffects.forEach(node=>node.removeFromParent());
  // Clone every material, but share read-only geometry and textures. Never dispose library resources.
  model.traverse(node=>{if(node.material){const clone=materials(node.material).map(m=>{const c=m.clone();owned.add(c);return c;});node.material=Array.isArray(node.material)?clone:clone[0];}if(node.isLight)node.visible=false;});
  function nodeAt(key){let n=model;for(const i of key.split(':')[0].split('.').slice(1))n=n.children[Number(i)];return n;}
  const parts=sourceParts.map(e=>{const original=e.original.clone(),inherited=e.inherited.clone();owned.add(original);owned.add(inherited);return{...e,node:nodeAt(e.key),original,inherited};});
  parts.forEach(e=>global.YPAssetEdgeGlow?.update(T,e,draft[e.key]?.edgeGlow));
  scene.add(model);scene.add(new T.HemisphereLight(0xffffff,0x596776,2));
  const keyLight=new T.DirectionalLight(0xffffff,3);keyLight.position.set(4,6,5);scene.add(keyLight);
  const fill=new T.DirectionalLight(0xffffff,1.5);fill.position.set(-3,3,-4);scene.add(fill);
  const camera=new T.PerspectiveCamera(40,1,.01,1000),ray=new T.Raycaster();
  const meshCount=new Set(parts.map(e=>e.node)).size;
  $('[data-part-info]').textContent=meshCount+' ชิ้น / '+parts.length+' กลุ่มวัสดุ · ใช้โหมดเลือกพื้นผิวเพื่อแก้เฉพาะแผง';
  parts.forEach((e,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=(i+1)+'. '+e.label+(Array.isArray(e.node.material)?' · วัสดุ '+(e.slot+1):'');list.append(option);});
  function dispose(){
   if(closed)return;closed=true;window.removeEventListener('keydown',guardKeys,true);cancelAnimationFrame(frameId);observer?.disconnect();controls?.dispose();
   surfaceEditor?.dispose();pathEditor?.dispose();if(highlight){highlight.geometry.dispose();highlight.material.dispose();}
   parts.forEach(e=>global.YPAssetEdgeGlow?.clear(e));owned.forEach(m=>m.dispose());environment?.dispose();gl?.dispose();gl?.forceContextLoss();dialog.close();dialog.remove();active=null;trigger?.isConnected&&trigger.focus();
  }
  active={close:dispose};
  function guardKeys(event){if(!dialog.open)return;if(event.key==='Escape'){event.preventDefault();dispose();}if(event.key!=='Tab')event.stopImmediatePropagation();}
  window.addEventListener('keydown',guardKeys,true);
  try{gl=new T.WebGLRenderer({antialias:true,alpha:false});gl.setPixelRatio(Math.min(devicePixelRatio,2));gl.outputColorSpace=T.SRGBColorSpace;gl.toneMapping=T.ACESFilmicToneMapping;viewport.append(gl.domElement);controls=new r.controls.constructor(camera,gl.domElement);controls.enableDamping=true;
   if(r.scene.environment)scene.environment=r.scene.environment;
   else{const studio=new T.Scene();studio.background=new T.Color('#e1e5ec');const generator=new T.PMREMGenerator(gl);environment=generator.fromScene(studio);scene.environment=environment.texture;generator.dispose();}
   function resize(){const width=viewport.clientWidth,height=viewport.clientHeight;gl.setSize(width,height);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();}
   function frame(){model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),radius=Math.max(size.length()/2,.1),distance=radius/Math.sin(Math.atan(Math.tan(camera.fov*Math.PI/360)*Math.min(1,camera.aspect)))*1.15;controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(1,.65,1.25).normalize().multiplyScalar(distance));camera.near=Math.max(.001,distance/1000);camera.far=Math.max(100,distance*20);camera.updateProjectionMatrix();controls.update();}
   observer=new ResizeObserver(resize);observer.observe(viewport);resize();frame();$('[data-part-frame]').onclick=frame;
   function choose(i){
    selected=i;const e=parts[i];list.value=String(i);$('[data-part-name]').textContent=list.options[i].textContent;
    const v=draft[e.key];mode.value=v?.mode||'inherit';color.value=v?.color||'#'+((v?.mode==='original'?e.original:e.inherited).color?.getHexString()||'ffffff');finish.value=v?.finish||'original';
    glow.checked=!!v?.edgeGlow?.enabled;glowColor.value=v?.edgeGlow?.color||'#fff1c2';glowIntensity.value=v?.edgeGlow?.intensity||1;glowValue.textContent=Number(glowIntensity.value).toFixed(1);glowColor.disabled=glowIntensity.disabled=!glow.checked;
    pathEditor?.select(v?.edgeGlow,glow.checked);
    finish.disabled=mode.value==='inherit'||mode.value==='original';
    if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();}
    highlight=new T.BoxHelper(e.node,0xff2591);highlight.material.depthTest=false;highlight.renderOrder=100;scene.add(highlight);
   }
   function update(){
    const e=parts[selected];let value=mode.value;
    if(value==='inherit'&&!glow.checked)delete draft[e.key];else draft[e.key]={mode:value,color:['inherit','original'].includes(value)?null:color.value,finish:finish.value};
    if(glow.checked)draft[e.key].edgeGlow={enabled:true,color:glowColor.value,intensity:Number(glowIntensity.value),...pathEditor?.settings()};
    pathEditor?.setEnabled(glow.checked);
    global.YPAssetEdgeGlow?.update(T,e,draft[e.key]?.edgeGlow);glowColor.disabled=glowIntensity.disabled=!glow.checked;glowValue.textContent=Number(glowIntensity.value).toFixed(1);
    const old=materials(e.node.material)[e.slot],next=materialFor(T,e,draft[e.key]);owned.delete(old);old.dispose();owned.add(next);
    if(Array.isArray(e.node.material)){e.node.material=[...e.node.material];e.node.material[e.slot]=next;}else e.node.material=next;
    if(value==='inherit'||value==='original')color.value='#'+(next.color?.getHexString()||'ffffff');
    finish.disabled=value==='inherit'||value==='original';status.textContent='ภาพทดลอง · ยังไม่บันทึกลงแบบหลัก';surfaceEditor?.refresh();
   }
   list.onchange=()=>choose(Number(list.value));mode.onchange=update;finish.onchange=update;color.oninput=()=>{if(['inherit','original'].includes(mode.value))mode.value='tint';update();};
   glow.onchange=glowColor.oninput=glowIntensity.oninput=update;
   pathEditor=global.YPAssetGlowPath.create({T,mount:effect,canvas:gl.domElement,camera,parts,getEntry:()=>parts[selected],onChange:update,onMessage:text=>{status.textContent=text;}});
   surfaceEditor=global.YPAssetSurfaces.createEditor({renderer:r,root:model,parts,object,dialog,canvas:gl.domElement,initialSurfaces,onPick:e=>{if(!e)return;choose(parts.indexOf(e));if(highlight)highlight.visible=false;gl.domElement.style.cursor=global.YPAssetGlowPath.selectionCursor;},onMode:(surface,scope)=>{pathEditor.select(draft[parts[selected].key]?.edgeGlow,glow.checked);if(highlight)highlight.visible=scope==='part';viewport.querySelector('p').textContent=surface?'คลิกเลือกพื้นผิวสีฟ้า · ลากหมุน · ล้อเมาส์ซูม':'คลิกเลือกชิ้นส่วน · ลากหมุน · ล้อเมาส์ซูม';dialog.classList.toggle('surface-picking',surface);dialog.dataset.scope=scope;}});
   $('#assetPickMode').add(new Option('ทั้งอุปกรณ์','whole'),0);
   function updateWhole(){appearanceDraft.mode=$('#assetWholeMode').value;appearanceDraft.color=$('#assetWholeColor').value;appearanceDraft.finish=$('#assetWholeFinish').value;for(const e of parts){owned.delete(e.inherited);e.inherited.dispose();e.inherited=wholeMaterial(T,e.original,appearanceDraft,e.node);owned.add(e.inherited);const old=materials(e.node.material)[e.slot],next=materialFor(T,e,draft[e.key]);owned.delete(old);old.dispose();owned.add(next);if(Array.isArray(e.node.material))e.node.material=e.node.material.map((m,i)=>i===e.slot?next:m);else e.node.material=next;}surfaceEditor.refresh();}
   $('#assetWholeMode').onchange=$('#assetWholeFinish').onchange=updateWhole;$('#assetWholeColor').oninput=()=>{if($('#assetWholeMode').value==='original')$('#assetWholeMode').value='solid';updateWhole();};
   $('#assetWholeReset').onclick=()=>{for(const key of Object.keys(draft))delete draft[key];parts.forEach(e=>global.YPAssetEdgeGlow.clear(e));surfaceEditor.clearAll();$('#assetWholeMode').value='original';$('#assetWholeFinish').value='original';updateWhole();choose(selected);if(highlight)highlight.visible=false;};
   $('[data-part-reset]').onclick=()=>{mode.value='original';finish.value='original';glow.checked=false;update();choose(selected);};
   gl.domElement.addEventListener('pointerdown',event=>{if(event.isPrimary!==false&&event.button===0)down={x:event.clientX,y:event.clientY};});
   gl.domElement.addEventListener('pointerup',event=>{if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>5){down=null;return;}down=null;const rect=gl.domElement.getBoundingClientRect();camera.updateMatrixWorld();model.updateMatrixWorld(true);ray.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),camera);const hits=ray.intersectObjects([...new Set(parts.map(e=>e.node))],false);const hit=hits.find(h=>{for(let n=h.object;n&&n!==scene;n=n.parent)if(!n.visible)return false;return true;});if(surfaceEditor?.click(hit))return;if(pathEditor?.click(event,hit))return;if(hit){const i=parts.findIndex(e=>e.node===hit.object&&e.slot===(hit.face?.materialIndex||0));if(i>=0){if($('#assetPickMode').value==='whole')surfaceEditor.setScope('part');choose(i);}}});
   gl.domElement.addEventListener('pointercancel',()=>{down=null;});
   function tick(){if(closed)return;controls.update();gl.render(scene,camera);frameId=requestAnimationFrame(tick);}choose(0);surfaceEditor.setScope('surface');if(initialSurfaces.length){$('#assetSavedSurfaces').value='0';$('#assetSavedSurfaces').onchange();}tick();
  }catch(error){dispose();throw error;}
  dialog.querySelectorAll('[data-part-close]').forEach(button=>button.onclick=dispose);dialog.addEventListener('cancel',event=>{event.preventDefault();dispose();});
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  $('[data-part-save]').onclick=()=>{
   if(surfaceEditor?.pending()){status.textContent='กำลังโหลดภาพ กรุณารอสักครู่';return;}
   if(pathEditor?.incomplete()){status.textContent='ยังมีเพียงจุดเริ่ม กรุณาเลือกจุดถัดไปให้ครบแนว หรือกดล้างแนวที่เลือก';return;}
   const current=objectById(object.id);
   if(current!==object||objectLocked(current)||JSON.stringify(current.appearance)!==baseline||(current.label||'')!==originalLabel){status.textContent='อุปกรณ์ถูกเปลี่ยนหรือล็อก กรุณายกเลิกแล้วเปิดใหม่';return;}
   const before=objectSnapshot();current.appearance={...appearanceDraft,parts:sanitize(draft),surfaces:surfaceEditor.data()};current.label=$('#assetWholeName').value.trim().slice(0,60);recordObjectHistory(before);dispose();sync();announceCatalog('บันทึกการแก้ไขอุปกรณ์แล้ว · Undo เพื่อย้อนกลับ','success');
  };
 }
 global.YPAssetParts.open=open;
 const button=document.createElement('button');button.id='assetEditParts';button.type='button';button.className='btn asset-settings-done';button.textContent='แก้ไขพื้นผิวและสติ๊กเกอร์ · 3D';button.onclick=open;
 document.getElementById('assetSettingsDone').before(button);
})(globalThis);
