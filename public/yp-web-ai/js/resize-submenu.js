(function(root){
 'use strict';
 if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
 const button=document.getElementById('btnResizeObject');if(!button)return;
 const panel=document.createElement('section');panel.id='resizeSubmenu';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','resizeSubmenuTitle');
 panel.innerHTML=`<header><strong id="resizeSubmenuTitle">เปลี่ยนขนาด</strong><button type="button" class="btn" id="resizeSubmenuClose" aria-label="ปิดเมนูเปลี่ยนขนาด">×</button></header>
 <p id="resizeSubmenuName"></p><div class="resize-numeric-fields">${[['w','กว้าง'],['d','ลึก'],['h','สูง']].map(([axis,label])=>`<label for="resizeValue${axis}">${label} (ม.)<span><input id="resizeValue${axis}" data-resize-axis="${axis}" type="number" min="0.01" max="5" step="0.01" inputmode="decimal" enterkeyhint="done" aria-describedby="resizeSubmenuStatus"><button type="button" class="btn" data-resize-apply="${axis}" aria-label="ใช้ค่า${label}" title="ใช้ค่า${label}">✓</button></span></label>`).join('')}</div>
 <label class="resize-ratio"><input type="checkbox" id="resizeSubmenuLock"> ล็อกสัดส่วน</label>
 <p class="resize-hint">กด Enter หรือ ✓ เพื่อใช้ค่าในช่องนั้น · 0.01–5.00 ม.<br>เป็นขนาดชิ้นงานก่อนหมุน/Scale · ปิดเมนูจะไม่ใช้ค่าที่ยังค้าง</p>
 <p id="resizeSubmenuStatus" role="status" aria-live="polite"></p>
 <footer><button type="button" class="btn" id="resizeSubmenuDrag">ลากจุดปรับขนาด ↗</button><button type="button" class="btn" id="resizeSubmenuDone">เสร็จสิ้น</button></footer>`;
 document.body.append(panel);
 const style=document.createElement('style');style.textContent=`#resizeSubmenu{position:fixed;z-index:180;width:350px;max-width:calc(100vw - 24px);box-sizing:border-box;padding:16px;border:1px solid #824362;border-radius:14px;background:#17131b;color:#faf5f9;box-shadow:0 12px 40px #0006;max-height:calc(100dvh - 24px);overflow:auto;text-align:left}#resizeSubmenu[hidden]{display:none}#resizeSubmenu header,#resizeSubmenu footer{display:flex;align-items:center;justify-content:space-between;gap:8px}#resizeSubmenu p{font-size:12px;margin:10px 0;line-height:1.5}#resizeSubmenu .resize-hint{font-size:11px;color:#baaebb}.resize-numeric-fields{display:grid;gap:8px;grid-template-columns:repeat(3,minmax(0,1fr))}.resize-numeric-fields label{font-size:12px;display:grid;gap:6px}.resize-numeric-fields span{display:flex;gap:3px}.resize-numeric-fields input{width:100%;min-width:0;box-sizing:border-box;padding:8px 4px;background:#0d0c10;border:1px solid #62465d;border-radius:6px;color:white;font-size:16px}.resize-numeric-fields .btn{padding:6px;min-width:28px}.resize-ratio{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12px}#resizeSubmenu :focus-visible{outline:2px solid #ff3297;outline-offset:2px}#resizeSubmenuStatus{min-height:18px;color:#f59ac7}#resizeSubmenuStatus[data-error=true]{color:#ffb084}#resizeSubmenu input[aria-invalid=true]{border-color:#ff8a80}#resizeSubmenu input[data-dirty=true]{border-color:#efb655}@media(max-width:600px){#resizeSubmenu{padding:12px}.resize-numeric-fields .btn{min-height:44px}#resizeSubmenu footer .btn{min-height:44px}}`;
 document.head.append(style);
 const input=axis=>document.getElementById('resizeValue'+axis),lock=document.getElementById('resizeSubmenuLock'),status=document.getElementById('resizeSubmenuStatus');
 let session=null,applying=false;
 function eligible(){const obj=objectById(objectEditor.selectedId);return obj&&selectedObjectIds().length===1&&!objectLocked(obj)&&obj.transformPolicy?.canResize?obj:null;}
 function stamp(obj){return JSON.stringify({size:obj.size,active:root.YPProjectWorkspace?.state().active});}
 function message(text,error=false){status.textContent=text;status.dataset.error=String(error);}
 function fill(obj){for(const a of ['w','d','h']){input(a).value=String(+Number(obj.size[a]).toFixed(3));input(a).dataset.dirty='false';input(a).setAttribute('aria-invalid','false');}session.stamp=stamp(obj);}
 function position(){if(panel.hidden)return;const rect=button.getBoundingClientRect(),height=panel.offsetHeight,width=panel.offsetWidth;
  panel.style.left=Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px';panel.style.top=Math.max(12,Math.min(rect.top-height-10,innerHeight-height-12))+'px';}
 function close(focus=false){panel.hidden=true;session=null;button.setAttribute('aria-expanded','false');if(focus)button.focus();}
 function open(){
  if(!panel.hidden){close(true);return;}
  if(document.querySelector('dialog[open],.modal.show'))return;
  // System surfaces keep their original dedicated settings flow.
  if(!objectById(objectEditor.selectedId)){toggleObjectResizeMode();return;}
  if(!setObjectTransformMode('resize'))return;const obj=eligible();if(!obj)return;
  session={id:obj.id};fill(obj);lock.checked=document.getElementById('assetSizeLock').checked;
  document.getElementById('resizeSubmenuName').textContent=selectedAssetName(obj);message('เลือกช่องขนาดที่ต้องการแก้');
  panel.hidden=false;button.setAttribute('aria-expanded','true');position();input('w').focus();input('w').select();
 }
 function commit(axis){
  const obj=eligible(),field=input(axis);if(!session||!obj||obj.id!==session.id){close();return;}
  if(stamp(obj)!==session.stamp){fill(obj);message('ขนาดต้นฉบับเปลี่ยนแล้ว โหลดค่าล่าสุดให้ กรุณากรอกใหม่',true);return;}
  try{
   const raw=field.value.trim(),value=Number(raw);if(!raw||!Number.isFinite(value)||value<MIN_ASSET_DIMENSION||value>MAX_ASSET_DIMENSION)throw Error('กรอกขนาดระหว่าง 0.01–5.00 เมตร');
   const ratio=value/obj.size[axis];if(lock.checked&&['w','d','h'].some(a=>obj.size[a]*ratio<MIN_ASSET_DIMENSION-1e-8||obj.size[a]*ratio>MAX_ASSET_DIMENSION+1e-8))throw Error('เมื่อล็อกสัดส่วน ทุกด้านต้องอยู่ในช่วง 0.01–5.00 เมตร');
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
 button.onclick=open;button.textContent='↗ เปลี่ยนขนาด ▾';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-expanded','false');
 for(const a of ['w','d','h']){
  input(a).addEventListener('input',()=>{input(a).dataset.dirty='true';input(a).setAttribute('aria-invalid','false');message('ยังไม่ใช้ค่า · กด Enter หรือ ✓ ในช่องที่แก้');});
  input(a).addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();e.stopPropagation();commit(a);}});
  panel.querySelector(`[data-resize-apply="${a}"]`).onclick=()=>commit(a);
 }
 for(const id of ['resizeSubmenuClose','resizeSubmenuDone','resizeSubmenuDrag'])document.getElementById(id).onclick=()=>close(true);
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}});
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!button.contains(e.target))close();},true);
 root.addEventListener('resize',position);root.addEventListener('scroll',position,true);
 root.addEventListener('yp:asset-editor-sync',()=>{
  if(!session||applying)return;const obj=eligible();if(!obj||obj.id!==session.id||objectEditor.transformMode!=='resize'){close();return;}
  if(stamp(obj)!==session.stamp){fill(obj);message('อัปเดตเป็นขนาดล่าสุดแล้ว');}position();
 });
 root.YPResizeSubmenu={open,close};
})(globalThis);
