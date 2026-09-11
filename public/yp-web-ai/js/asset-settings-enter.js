(function(){
 'use strict';
 const modal=document.getElementById('mAssetSettings'),name=document.getElementById('assetSettingsName');if(!modal||!name)return;
 const fields=new Map(),drafts=new Map();let selectedId=null;
 const status=document.createElement('p');status.id='assetValueStatus';status.className='note';status.setAttribute('role','status');status.setAttribute('aria-live','polite');name.after(status);
 const hint=document.createElement('p');hint.className='note';hint.textContent='พิมพ์ค่าแล้วกด Enter เพื่อใช้ค่า · Esc คืนค่าในช่อง · ค่าที่ยังไม่กด Enter จะไม่ถูกบันทึกเมื่อปิด';status.before(hint);
 const section=document.createElement('section');section.className='asset-settings-section';section.innerHTML='<h3>ตำแหน่งและมุมหมุน</h3><div id="assetNumericPosition" class="asset-settings-grid"></div><div id="assetNumericRotation" class="asset-settings-grid" style="margin-top:12px"></div><p class="note">ตำแหน่งจุดกึ่งกลางฐาน หน่วยเมตร · มุมหมุนหน่วยองศา<br>กรอกตำแหน่งหรือมุมหมุนจะปลดจุดยึดของชิ้นนี้ เพื่อใช้ค่าที่กำหนดได้โดยไม่เด้งกลับ</p>';
 document.getElementById('assetAttachmentSection').before(section);
 const detail=document.createElement('section');detail.className='asset-settings-section';detail.innerHTML='<h3>รายละเอียดโครงสร้าง</h3><div id="assetNumericDetails" class="asset-settings-grid"></div>';section.after(detail);
 const style=document.createElement('style');style.textContent='#mAssetSettings input[aria-invalid=true]{border-color:#ff6b7c;box-shadow:0 0 0 1px #ff6b7c}#mAssetSettings input[data-pending=true]{border-color:#f5ba53}#assetValueStatus{min-height:18px;text-align:left}#assetValueStatus[data-error=true]{color:#ff8b98}#assetNumericDetails{grid-template-columns:repeat(2,minmax(0,1fr))}';document.head.append(style);
 const valueText=n=>String(+Number(n||0).toFixed(3));
 function message(text,error=false){status.textContent=text;status.dataset.error=String(error);}
 function register(input,config){fields.set(input.id,{input,...config});input.setAttribute('aria-describedby','assetValueStatus');input.setAttribute('enterkeyhint','done');input.onchange=null;input.addEventListener('input',()=>{drafts.set(input.id,input.value);input.dataset.pending='true';input.setAttribute('aria-invalid','false');message('ยังไม่บันทึก · กด Enter เพื่อใช้ค่า');});}
 function numericField(parent,id,label,config){const box=document.createElement('div');box.className='asset-settings-field';const caption=document.createElement('label');caption.htmlFor=id;caption.textContent=label;const input=document.createElement('input');input.id=id;input.type='number';input.step=config.step||'0.01';input.inputMode='decimal';box.append(caption,input);parent.append(box);register(input,config);return input;}
 function number(raw){if(!String(raw).trim())throw Error('กรุณากรอกตัวเลขก่อนกด Enter');const n=Number(raw);if(!Number.isFinite(n))throw Error('กรุณากรอกตัวเลขที่ถูกต้อง');return n;}
 function range(n,min,max){if(n<min||n>max)throw Error(`กรอกค่าระหว่าง ${min}–${max}`);return n;}
 function single(obj){if(obj.groupId||selectedSceneItemIds().length!==1)throw Error('เลือกทีละ 1 ชิ้น และ Ungroup ก่อนแก้ตำแหน่งหรือมุมหมุน');}
 function changeObject(obj,fn){const before=objectSnapshot();fn();recordObjectHistory(before);sync();syncAssetSettingsForm();}
 register(name,{get:o=>o.label||selectedAssetName(o),apply:(o,raw)=>{const text=String(raw).trim();if(!text)throw Error('กรุณาตั้งชื่อวัตถุ หรือกด Esc เพื่อคืนชื่อเดิม');updateSelectedObjectName(text);}});
 ['W','D','H'].forEach(key=>register(document.getElementById('assetSize'+key),{get:o=>valueText(o.size[key.toLowerCase()]),apply:(o,raw)=>{
  const axis=key.toLowerCase(),n=range(number(raw),MIN_ASSET_DIMENSION,MAX_ASSET_DIMENSION);
  if(!o.transformPolicy?.canResize)throw Error('อุปกรณ์นี้ไม่รองรับการปรับขนาดจริง');
  if(document.getElementById('assetSizeLock').checked){const ratio=n/o.size[axis];Object.values(o.size).forEach(v=>range(v*ratio,MIN_ASSET_DIMENSION-1e-8,MAX_ASSET_DIMENSION+1e-8));}
  if(isDownlightBeamObject(o)&&axis==='w')range(n,.5,Math.min(MAX_ASSET_DIMENSION,S.W));
  updateSelectedObjectSize(axis,n);
 }}));
 register(document.getElementById('assetSurfaceHex'),{get:o=>(o.appearance?.color||'#f5f5f5').toUpperCase(),apply:(o,raw)=>{if(!/^#?[0-9a-f]{6}$/i.test(raw.trim()))throw Error('ใช้รหัสสี 6 หลัก เช่น #F5F5F5');updateSelectedObjectColor(raw);}});
 ['x','y','z'].forEach(axis=>{
  numericField(document.getElementById('assetNumericPosition'),'assetPosition'+axis.toUpperCase(),axis.toUpperCase()+' (ม.)',{step:'0.01',get:o=>valueText(o.position[axis]),disabled:o=>!!o.groupId||o.transformPolicy?.canMove===false,apply:(o,raw)=>{single(o);const n=number(raw);if(n===o.position[axis])return;changeObject(o,()=>{releaseObjectAttachment(o);if(isDownlightBeamObject(o))o.structure.wallAttached=false;o.position[axis]=n;});}});
  numericField(document.getElementById('assetNumericRotation'),'assetRotation'+axis.toUpperCase(),'หมุน '+axis.toUpperCase()+' (°)',{step:'1',get:o=>valueText(o['rotation'+axis.toUpperCase()]),disabled:o=>!!o.groupId||o.capabilities?.rotatable===false,apply:(o,raw)=>{single(o);const n=number(raw);changeObject(o,()=>{releaseObjectAttachment(o);if(isDownlightBeamObject(o))o.structure.wallAttached=false;o['rotation'+axis.toUpperCase()]=n;});}});
 });
 numericField(document.getElementById('assetNumericDetails'),'assetDetailThickness','ความหนาโครง (ม.)',{get:o=>valueText(o.structure?.thickness),show:o=>isEntranceFrameObject(o)||isDownlightBeamObject(o),apply:(o,raw)=>{const n=range(number(raw),MIN_ASSET_DIMENSION,Math.min(MAX_ASSET_DIMENSION,o.size.h,o.size.d));changeObject(o,()=>{o.structure.thickness=n;if(isEntranceFrameObject(o))normalizeEntranceFrameObject(o);else normalizeDownlightBeamObject(o);});}});
 numericField(document.getElementById('assetNumericDetails'),'assetDetailLightCount','จำนวนดาวน์ไลท์ (ดวง)',{step:'1',get:o=>String(o.structure?.lightCount||1),show:o=>isDownlightBeamObject(o),apply:(o,raw)=>{const n=range(number(raw),1,12);if(!Number.isInteger(n))throw Error('จำนวนไฟต้องเป็นจำนวนเต็ม');changeObject(o,()=>{o.structure.lightCount=n;normalizeDownlightBeamObject(o);});}});
 function syncFields(obj){if(selectedId!==obj.id){drafts.clear();message('');selectedId=obj.id;}
  let detailsVisible=false;fields.forEach((field,id)=>{const show=!field.show||field.show(obj);if(field.show){field.input.parentElement.hidden=!show;if(show)detailsVisible=true;}
   if(field.disabled||id.startsWith('assetPosition')||id.startsWith('assetRotation')||id.startsWith('assetDetail'))field.input.disabled=objectLocked(obj)||!!field.disabled?.(obj);
   field.input.value=drafts.has(id)?drafts.get(id):field.get(obj);field.input.dataset.pending=String(drafts.has(id));if(!drafts.has(id))field.input.setAttribute('aria-invalid','false');
  });detail.hidden=!detailsVisible;
 }
 function commit(id){const field=fields.get(id),obj=objectById(objectEditor.selectedId);if(!field||!obj||obj.id!==selectedId||objectLocked(obj)||field.input.disabled)return;
  const raw=field.input.value;try{drafts.delete(id);field.apply(obj,raw);syncFields(obj);field.input.setAttribute('aria-invalid','false');message('บันทึกแล้ว · '+(id==='assetSettingsName'?selectedAssetName(obj):field.input.value)+' · Undo เพื่อย้อนกลับ'+(drafts.size?' · ยังมี '+drafts.size+' ช่องรอกด Enter':''));field.input.focus();field.input.select();}
  catch(error){drafts.set(id,raw);field.input.value=raw;field.input.dataset.pending='true';field.input.setAttribute('aria-invalid','true');message(error.message,true);}
 }
 // Block legacy change handlers: clicking elsewhere must not apply a half-typed value.
 modal.addEventListener('change',event=>{if(fields.has(event.target.id))event.stopImmediatePropagation();},true);
 modal.addEventListener('keydown',event=>{const id=event.target.id;if(!fields.has(id)||event.isComposing)return;
  if(event.key==='Enter'){event.preventDefault();event.stopImmediatePropagation();commit(id);}
  else if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();drafts.delete(id);const obj=objectById(objectEditor.selectedId);if(obj)syncFields(obj);message('คืนค่าเดิมในช่องแล้ว');}
 },true);
 window.YPAssetSettingsEnter={sync:syncFields,reset(){drafts.clear();selectedId=null;message('');},commit};
})();
