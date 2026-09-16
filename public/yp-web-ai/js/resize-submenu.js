(function(root){
 'use strict';
 if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
 const button=document.getElementById('btnResizeObject');if(!button)return;
 const panel=document.createElement('section');panel.id='resizeSubmenu';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','resizeSubmenuTitle');
 panel.innerHTML=`<header><strong id="resizeSubmenuTitle">เปลี่ยนขนาด</strong><button type="button" class="btn" id="resizeSubmenuClose" aria-label="ปิดเมนูเปลี่ยนขนาด">×</button></header>
 <p id="resizeSubmenuName"></p><label for="resizeSubmenuMode">วิธีเปลี่ยนขนาด</label><select id="resizeSubmenuMode" style="width:100%;margin:8px 0;padding:10px;background:#0d0c10;color:white;border:1px solid #62465d;border-radius:6px"><option value="resize">ปรับกว้าง–ลึก–สูง</option><option value="scale">ย่อ–ขยายทั้งชิ้น (รักษาสัดส่วน)</option></select><div class="resize-numeric-fields">${[['w','กว้าง'],['d','ลึก'],['h','สูง']].map(([axis,label])=>`<label for="resizeValue${axis}">${label} (ม.)<span><input id="resizeValue${axis}" data-resize-axis="${axis}" type="number" min="${MIN_ASSET_DIMENSION}" max="${MAX_ASSET_DIMENSION}" step="0.01" inputmode="decimal" enterkeyhint="done" aria-describedby="resizeSubmenuStatus"><button type="button" class="btn" data-resize-reset="${axis}" aria-label="รีเซ็ต${label}เป็นขนาดเริ่มต้น" title="รีเซ็ต${label}เป็นขนาดเริ่มต้น">↶</button></span></label>`).join('')}</div>
 <label class="resize-ratio"><input type="checkbox" id="resizeSubmenuLock"> ล็อกสัดส่วน</label>
 <fieldset class="resize-anchor"><legend>จุดยึดขณะเปลี่ยนขนาด</legend><div class="resize-anchor-layout"><div id="resizeAnchorGrid" role="group" aria-label="จุดยึดซ้าย กลาง ขวา และบน กลาง ล่าง">${[1,.5,0].map((y,row)=>[0,.5,1].map((x,col)=>`<button type="button" class="btn" data-anchor-x="${x}" data-anchor-y="${y}" aria-label="ยึด${['บน','กลาง','ล่าง'][row]}${['ซ้าย','กลาง','ขวา'][col]}" aria-pressed="false" title="${['บน','กลาง','ล่าง'][row]}${['ซ้าย','กลาง','ขวา'][col]}">●</button>`).join('')).join('')}</div><div><label for="resizeAnchorDepth">แนวความลึก</label><select id="resizeAnchorDepth"><option value="1">หน้า</option><option value="0.5" selected>กลาง</option><option value="0">หลัง</option></select><p id="resizeAnchorLabel" aria-live="polite"></p><small>◆ จุดสีฟ้าอยู่กับที่<br>ตามกรอบขนาดของชิ้นงาน</small></div></div></fieldset>
 <p class="resize-hint" id="resizeSubmenuHint"></p>
 <p id="resizeSubmenuStatus" role="status" aria-live="polite"></p>
 <footer><button type="button" class="btn" id="resizeSubmenuDrag">ลากจุดปรับขนาด ↗</button><button type="button" class="btn" id="resizeSubmenuDone">เสร็จสิ้น</button></footer>`;
 document.body.append(panel);
 const style=document.createElement('style');style.textContent=`#resizeSubmenu{position:fixed;z-index:180;width:350px;max-width:calc(100vw - 24px);box-sizing:border-box;padding:16px;border:1px solid #824362;border-radius:14px;background:#17131b;color:#faf5f9;box-shadow:0 12px 40px #0006;max-height:calc(100dvh - 24px);overflow:auto;text-align:left}#resizeSubmenu[hidden]{display:none}#resizeSubmenu header,#resizeSubmenu footer{display:flex;align-items:center;justify-content:space-between;gap:8px}#resizeSubmenu p{font-size:12px;margin:10px 0;line-height:1.5}#resizeSubmenu .resize-hint{font-size:11px;color:#baaebb}.resize-numeric-fields{display:grid;gap:8px;grid-template-columns:repeat(3,minmax(0,1fr))}.resize-numeric-fields label{font-size:12px;display:grid;gap:6px}.resize-numeric-fields span{display:flex;gap:3px}.resize-numeric-fields input{width:100%;min-width:0;box-sizing:border-box;padding:8px 4px;background:#0d0c10;border:1px solid #62465d;border-radius:6px;color:white;font-size:16px}.resize-numeric-fields .btn{padding:6px;min-width:28px}.resize-ratio{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12px}#resizeSubmenu :focus-visible{outline:2px solid #ff3297;outline-offset:2px}#resizeSubmenuStatus{min-height:18px;color:#f59ac7}#resizeSubmenuStatus[data-error=true]{color:#ffb084}#resizeSubmenu input[aria-invalid=true]{border-color:#ff8a80}#resizeSubmenu input[data-dirty=true]{border-color:#efb655}@media(max-width:600px){#resizeSubmenu{padding:12px}.resize-numeric-fields .btn{min-height:44px}#resizeSubmenu footer .btn{min-height:44px}}`;
 document.head.append(style);
 style.textContent+=`.resize-anchor{border:1px solid #62465d;border-radius:9px;margin:12px 0 0;padding:9px}.resize-anchor legend{font-size:12px}.resize-anchor-layout{display:grid;grid-template-columns:132px minmax(0,1fr);gap:12px;align-items:center}#resizeAnchorGrid{display:grid;grid-template-columns:repeat(3,44px)}#resizeAnchorGrid button{width:44px;height:36px;padding:0;border-radius:3px;color:#8c8293}#resizeAnchorGrid button[aria-pressed=true]{background:#133c42;border-color:#25f3e3;color:#25f3e3}.resize-anchor-layout label,.resize-anchor-layout small{font-size:11px}.resize-anchor-layout small{color:#68dfd7}.resize-anchor-layout select{display:block;width:100%;padding:7px;background:#0d0c10;color:white;border:1px solid #62465d;border-radius:5px}#resizeAnchorLabel{margin:6px 0;font-size:11px}@media(max-width:600px){#resizeAnchorGrid button{height:44px}.resize-anchor-layout select{min-height:44px}}`;
 const input=axis=>document.getElementById('resizeValue'+axis),lock=document.getElementById('resizeSubmenuLock'),status=document.getElementById('resizeSubmenuStatus'),mode=document.getElementById('resizeSubmenuMode');
 let session=null,applying=false;
 const depth=document.getElementById('resizeAnchorDepth');
 function fillAnchor(obj){const a=YPResizeAnchor.get(obj);panel.querySelectorAll('[data-anchor-x]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.anchorX===a.x&&+b.dataset.anchorY===a.y)));depth.value=String(a.z);document.getElementById('resizeAnchorLabel').textContent=['ซ้าย','กลาง','ขวา'][a.x*2]+' · '+['ล่าง','กลาง','บน'][a.y*2]+' · '+['หลัง','กลาง','หน้า'][a.z*2];}
 function chooseAnchor(a){const obj=eligible();if(!session||!obj)return;const previous=objectSnapshot();if(JSON.stringify(a)===JSON.stringify(YPResizeAnchor.get(obj)))return;YPResizeAnchor.set(obj,a);recordObjectHistory(previous);sync();fillAnchor(obj);message('เลือกจุดยึดแล้ว · ชิ้นงานยังไม่เปลี่ยนขนาด');position();}
 panel.querySelectorAll('[data-anchor-x]').forEach(b=>b.onclick=()=>{const obj=eligible();if(obj)chooseAnchor({...YPResizeAnchor.get(obj),x:+b.dataset.anchorX,y:+b.dataset.anchorY});});
 depth.onchange=()=>{const obj=eligible();if(obj)chooseAnchor({...YPResizeAnchor.get(obj),z:+depth.value});};
 function eligible(){const obj=objectById(objectEditor.selectedId);return obj&&selectedObjectIds().length===1&&!objectLocked(obj)&&(obj.transformPolicy?.canResize||obj.transformPolicy?.canScale)?obj:null;}
 function stamp(obj){return JSON.stringify({size:obj.size,position:obj.position,rotation:[obj.rotationX,obj.rotationY,obj.rotationZ],transform:obj.transform,policy:obj.transformPolicy,active:root.YPProjectWorkspace?.state().active});}
 function message(text,error=false){status.textContent=text;status.dataset.error=String(error);}
 function fill(obj){const scaled=mode.value==='scale';for(const a of ['w','d','h']){input(a).value=String(+(Number(obj.size[a])*(scaled?sceneObjectScaleValue(obj):1)).toFixed(3));input(a).min=scaled?obj.size[a]*obj.transformPolicy.minScale:MIN_ASSET_DIMENSION;input(a).max=scaled?obj.size[a]*obj.transformPolicy.maxScale:MAX_ASSET_DIMENSION;input(a).dataset.dirty='false';input(a).setAttribute('aria-invalid','false');}session.stamp=stamp(obj);
  lock.disabled=scaled;lock.checked=scaled||document.getElementById('assetSizeLock').checked;fillAnchor(obj);
  document.getElementById('resizeSubmenuHint').textContent=scaled?'ขนาดหลังย่อ–ขยาย ก่อนหมุน · กด Enter เพื่อใช้ค่า · ↶ คืน Scale 100% · เปลี่ยนทุกด้านตามสัดส่วน · ช่วง '+Math.round(obj.transformPolicy.minScale*100)+'–'+Math.round(obj.transformPolicy.maxScale*100)+'%':'ขนาดชิ้นงานก่อนหมุน/Scale · '+MIN_ASSET_DIMENSION+'–'+MAX_ASSET_DIMENSION+' ม. · Enter ใช้ค่า · ↶ คืนขนาดเริ่มต้น (เมื่อล็อกสัดส่วน ทุกด้านเปลี่ยนตาม) · ปิดเมนูไม่ใช้ค่าค้าง';
  panel.querySelectorAll('[data-resize-reset]').forEach(b=>{const a=b.dataset.resizeReset,label={w:'กว้าง',d:'ลึก',h:'สูง'}[a],text=scaled?'คืน Scale ทั้งชิ้นเป็น 100%':'รีเซ็ต'+label+'เป็นขนาดเริ่มต้น '+(obj.originalSize?.[a]??objectCatalogDef(obj.catalogId)?.size?.[a]??obj.size[a])+' ม.';b.title=text;b.setAttribute('aria-label',text);});
 }
 function position(){if(panel.hidden)return;const rect=button.getBoundingClientRect(),height=panel.offsetHeight,width=panel.offsetWidth;
  panel.style.left=Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px';panel.style.top=Math.max(12,Math.min(rect.top-height-10,innerHeight-height-12))+'px';}
 function close(focus=false){panel.hidden=true;session=null;button.setAttribute('aria-expanded','false');if(focus)button.focus();}
 function open(){
  if(!panel.hidden){close(true);return;}
  if(document.querySelector('dialog[open],.modal.show'))return;
  // System surfaces keep their original dedicated settings flow.
  if(!objectById(objectEditor.selectedId)){toggleObjectResizeMode();return;}
  const obj=eligible();if(!obj)return;mode.options[0].disabled=!obj.transformPolicy.canResize;mode.options[1].disabled=!obj.transformPolicy.canScale;mode.value=obj.transformPolicy.canResize?'resize':'scale';
  if(!setObjectTransformMode(mode.value))return;session={id:obj.id};fill(obj);
  document.getElementById('resizeSubmenuName').textContent=selectedAssetName(obj);message('เลือกช่องขนาดที่ต้องการแก้');
  panel.hidden=false;button.setAttribute('aria-expanded','true');position();input('w').focus();input('w').select();
 }
 function commit(axis){
  const obj=eligible(),field=input(axis);if(!session||!obj||obj.id!==session.id){close();return;}
  if(stamp(obj)!==session.stamp){fill(obj);message('ขนาดต้นฉบับเปลี่ยนแล้ว โหลดค่าล่าสุดให้ กรุณากรอกใหม่',true);return;}
  try{
   const raw=field.value.trim(),value=Number(raw);if(!raw||!Number.isFinite(value)||value<=0)throw Error('กรอกขนาดเป็นตัวเลขมากกว่า 0');
   if(mode.value==='scale'){
    if(!obj.transformPolicy.canScale)throw Error('Asset นี้ไม่อนุญาตให้ย่อ–ขยายทั้งชิ้น');
    const factor=value/obj.size[axis],policy=obj.transformPolicy;
    if(factor<policy.minScale-1e-8||factor>policy.maxScale+1e-8)throw Error('ขนาดนี้เกินช่วงย่อ–ขยาย '+Math.round(policy.minScale*100)+'–'+Math.round(policy.maxScale*100)+'%');
    if(Math.abs(factor-sceneObjectScaleValue(obj))<.00005){fill(obj);message('ขนาดเท่าเดิม');return;}
    applying=true;let success;try{success=setSelectedObjectScale(factor);}finally{applying=false;}
    if(!success)throw Error('ไม่สามารถใช้ขนาดนี้ได้ ตำแหน่งหรือโครงสร้างไม่รองรับ');
    fill(obj);message('ย่อ–ขยายทั้งชิ้นแล้ว · Undo ย้อนกลับได้');position();return;
   }
   if(!obj.transformPolicy.canResize)throw Error('Asset นี้รองรับเฉพาะย่อ–ขยายทั้งชิ้น');
   if(value<MIN_ASSET_DIMENSION||value>MAX_ASSET_DIMENSION)throw Error('กรอกขนาดระหว่าง '+MIN_ASSET_DIMENSION+'–'+MAX_ASSET_DIMENSION+' เมตร');
   const ratio=value/obj.size[axis];if(lock.checked&&['w','d','h'].some(a=>obj.size[a]*ratio<MIN_ASSET_DIMENSION-1e-8||obj.size[a]*ratio>MAX_ASSET_DIMENSION+1e-8))throw Error('เมื่อล็อกสัดส่วน ทุกด้านต้องอยู่ในช่วง '+MIN_ASSET_DIMENSION+'–'+MAX_ASSET_DIMENSION+' เมตร');
   if(isDownlightBeamObject(obj)&&axis==='w'&&(value<.5||value>Math.min(MAX_ASSET_DIMENSION,S.W)))throw Error('ความกว้างคานต้องไม่น้อยกว่า 0.50 ม. และไม่เกินความกว้างบูธ');
   const previous=JSON.stringify(obj.size),target=assetDimensionValue(value);if(Math.abs(target-obj.size[axis])<1e-8){field.value=String(obj.size[axis]);field.dataset.dirty='false';field.setAttribute('aria-invalid','false');message('ขนาดเท่าเดิม');return;}
   const dirtyOthers=['w','d','h'].filter(a=>a!==axis&&input(a).dataset.dirty==='true').map(a=>[a,input(a).value]);
   document.getElementById('assetSizeLock').checked=lock.checked;applying=true;
   try{updateSelectedObjectSize(axis,value);}finally{applying=false;}
   if(JSON.stringify(obj.size)===previous)throw Error('ไม่สามารถใช้ขนาดนี้ได้ ตำแหน่งหรือโครงสร้างไม่รองรับ');
   fill(obj);if(!lock.checked)for(const [a,raw] of dirtyOthers){input(a).value=raw;input(a).dataset.dirty='true';}
   message('ใช้ขนาดแล้ว · Undo ย้อนกลับได้'+(lock.checked?' · ปรับทุกด้านตามสัดส่วน':''));position();
  }catch(e){field.setAttribute('aria-invalid','true');message(e.message,true);}
 }
 function reset(axis){
  const obj=eligible();if(!session||!obj||obj.id!==session.id){close();return;}
  // Use the same validation, fixed anchor, ratio lock and Undo path as Enter.
  input(axis).value=String(mode.value==='scale'?obj.size[axis]:(obj.originalSize?.[axis]??objectCatalogDef(obj.catalogId)?.size?.[axis]??obj.size[axis]));
  commit(axis);
 }
 button.onclick=open;button.textContent='↗ เปลี่ยนขนาด ▾';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-expanded','false');
 mode.onchange=()=>{const obj=eligible();if(!session||!obj)return;applying=true;let success;try{success=setObjectTransformMode(mode.value);}finally{applying=false;}if(!success){close();return;}fill(obj);message('เปลี่ยนวิธีแล้ว · ค่าที่ยังไม่ยืนยันไม่ได้ถูกนำไปใช้');position();};
 for(const a of ['w','d','h']){
  input(a).addEventListener('input',()=>{input(a).dataset.dirty='true';input(a).setAttribute('aria-invalid','false');message('ยังไม่ใช้ค่า · กด Enter เพื่อใช้ค่า · ↶ คืนขนาดเริ่มต้น');});
  input(a).addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();e.stopPropagation();commit(a);}});
  panel.querySelector(`[data-resize-reset="${a}"]`).onclick=()=>reset(a);
 }
 for(const id of ['resizeSubmenuClose','resizeSubmenuDone','resizeSubmenuDrag'])document.getElementById(id).onclick=()=>close(true);
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}});
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!button.contains(e.target))close();},true);
 root.addEventListener('resize',position);root.addEventListener('scroll',position,true);
 root.addEventListener('yp:asset-editor-sync',()=>{
  if(!session||applying)return;const obj=eligible();if(!obj||obj.id!==session.id||objectEditor.transformMode!==mode.value||mode.value==='resize'&&!obj.transformPolicy.canResize||mode.value==='scale'&&!obj.transformPolicy.canScale){close();return;}
  if(stamp(obj)!==session.stamp){fill(obj);message('อัปเดตเป็นขนาดล่าสุดแล้ว');}position();
 });
 root.YPResizeSubmenu={open,close};
})(globalThis);
