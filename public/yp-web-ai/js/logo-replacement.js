(function(root){
 'use strict';
 // Explicit template roles keep screens/posters out of bulk logo operations.
 function sourceFor(obj){
  for(const lib of [root.YPInlineTemplates,root.YPCornerTemplates,root.YPPeninsularTemplates,root.YPIslandTemplates]){
   for(const t of lib?.templates||[]){
    if(!obj.id?.startsWith(t.id+'-'))continue;
    const index=obj.id.slice(t.id.length+1);if(/^\d+$/.test(index))return t.objects[Number(index)]||null;
   }
  }
  return null;
 }
 function isLogo(obj){
  if(obj?.type!=='brandCopy')return false;
  if(obj.logoSlot)return obj.logoSlot.kind==='logo';
  if(obj.id?.startsWith('obj-brand-copy-')&&obj.appearance?.textureId?.startsWith('brand-copy-'))return true;
  // Read-only recognition for old projects. Never rewrite their artwork on load.
  return root.YPTemplateBranding.isLogoSource(sourceFor(obj));
 }
 const selected=()=>{const o=objectById(objectEditor.selectedId);return isLogo(o)?o:null;};
 // The registry locks system geometry by default, not its editable logo content.
 const mainLocked=()=>S.sceneItemState?.[SCENE_ASSET_IDS.brand]?.locked===true;
 const visibleMain=()=>S.type!=='island'&&Number(S.logoScale)>0;
 const stamp=o=>JSON.stringify(o?[o.position,o.size,o.rotationX,o.rotationY,o.rotationZ,o.appearance,o.logoFinish,o.locked]:[S.logo,S.logoType,S.logoShape,S.logoLight,S.logoScale,S.logoAR,S.logoWallU,S.logoWallY,S.logoFloorX,S.logoFloorZ,S.logoMount,S.logoWall]);
 function fit(image,size){
  const ratio=size.w/size.h,canvas=document.createElement('canvas');
  canvas.width=ratio>=1?1600:Math.max(1,Math.round(1600*ratio));canvas.height=ratio>=1?Math.max(1,Math.round(1600/ratio)):1600;
  const scale=Math.min(canvas.width/image.width,canvas.height/image.height)*.94,w=image.width*scale,h=image.height*scale;
  canvas.getContext('2d').drawImage(image,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
  return canvas.toDataURL('image/png');
 }
 async function decode(data){
  const image=new Image();image.src=data;await image.decode();
  if(!image.naturalWidth||image.naturalWidth*image.naturalHeight>24000000)throw new Error('ภาพใหญ่เกินไป กรุณาใช้ภาพไม่เกิน 24 ล้านพิกเซล');
  const c=document.createElement('canvas'),scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));
  c.width=Math.max(1,Math.round(image.naturalWidth*scale));c.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0,c.width,c.height);
  const pixels=x.getImageData(0,0,c.width,c.height).data;let minX=c.width,minY=c.height,maxX=-1,maxY=-1,transparent=false;
  for(let y=0;y<c.height;y++)for(let col=0;col<c.width;col++){
   const alpha=pixels[(y*c.width+col)*4+3];if(alpha<250)transparent=true;
   if(alpha>8){minX=Math.min(minX,col);maxX=Math.max(maxX,col);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  }
  if(maxX<0)throw new Error('ภาพนี้โปร่งใสทั้งหมด ไม่พบโลโก้');
  const cropped=document.createElement('canvas');cropped.width=maxX-minX+1;cropped.height=maxY-minY+1;
  cropped.getContext('2d').drawImage(c,minX,minY,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
  return {image:cropped,data:cropped.toDataURL('image/png'),transparent};
 }
 let dialog,session=null,loadId=0,opener;
 const $=id=>document.getElementById(id);
 function candidates(all){
  if(!all)return [session.target];
  return [...S.objects.filter(isLogo),...((visibleMain()||session.target===null)?[null]:[])];
 }
 function close(){loadId++;session=null;dialog.close();opener?.focus();}
 async function preview(data,name){
  const token=++loadId,current=session;$('logoReplaceConfirm').disabled=true;$('logoReplaceStatus').textContent='กำลังตรวจภาพ…';
  try{
   const candidate=await decode(data);if(token!==loadId||current!==session)return;
   session.candidate={...candidate,name};$('logoReplacePreview').src=candidate.data;$('logoReplacePreview').hidden=false;
   $('logoReplaceWarning').hidden=candidate.transparent;$('logoReplaceOpaque').checked=false;
   $('logoReplaceStatus').textContent=name+' · รักษาสัดส่วนภาพ ไม่เพิ่มแผ่นหลัง';$('logoReplaceConfirm').disabled=false;
  }catch(error){if(token===loadId&&current===session){session.candidate=null;$('logoReplaceStatus').textContent='เปิดภาพไม่สำเร็จ: '+error.message;}}
 }
 function open(){
  const id=objectEditor.selectedId,target=selected();
  if(id&&objectById(id)&&!target){announceCatalog('ชิ้นนี้เป็นภาพกราฟิก ไม่ใช่ตำแหน่งโลโก้ กรุณาเลือกโลโก้ก่อน','error');return;}
  if(target?objectLocked(target):mainLocked()){announceCatalog('โลโก้นี้ถูกล็อกอยู่ กรุณาปลดล็อกก่อน','error');return;}
  opener=document.activeElement;
  session={target,objects:S.objects,active:root.YPProjectWorkspace?.state().active,candidate:null,stamps:new Map(),refs:new Map()};
  for(const o of candidates(true)){const key=o?.id||'main';session.stamps.set(key,stamp(o));session.refs.set(key,o);}
  if(target){session.stamps.set(target.id,stamp(target));session.refs.set(target.id,target);}
  else{session.stamps.set('main',stamp(null));session.refs.set('main',null);}
  $('logoReplaceScope').value='selected';$('logoReplacePreview').hidden=true;$('logoReplaceFile').value='';$('logoReplaceConfirm').disabled=true;
  $('logoReplaceWarning').hidden=true;$('logoReplaceOpaque').checked=false;
  $('logoReplacePanel').checked=(target?.logoFinish||S).logoShape==='panel';
  $('logoReplaceTarget').textContent=target?'ตำแหน่ง: '+selectedAssetName(target):'ตำแหน่ง: โลโก้หลักของบูธ';
  $('logoReplaceAll').textContent='ทุกตำแหน่งโลโก้ ('+candidates(true).length+' จุด) · ไม่รวมจอ/โปสเตอร์';
  $('logoReplaceStatus').textContent='เลือกไฟล์เพื่อพรีวิวก่อนยืนยัน · ยังไม่เปลี่ยนแบบ';dialog.showModal();
 }
 function commit(){
  if(!session?.candidate)return;
  try{
   if(session.active!==root.YPProjectWorkspace?.state().active||session.objects!==S.objects)throw new Error('งานปัจจุบันเปลี่ยนแล้ว กรุณาเปิดการเปลี่ยนโลโก้ใหม่');
   const list=candidates($('logoReplaceScope').value==='all'),candidate=session.candidate;
   if(!candidate.transparent&&!$('logoReplaceOpaque').checked)throw new Error('ไฟล์นี้มีพื้นหลังติดมา กรุณาใช้ PNG โปร่งใส หรือยืนยันว่าต้องการใช้ภาพพร้อมพื้นหลัง');
   for(const o of list){
    const key=o?.id||'main';
    if(!session.stamps.has(key)||session.refs.get(key)!==o||stamp(o)!==session.stamps.get(key)||(o&&objectById(o.id)!==o))throw new Error('โลโก้เปลี่ยนระหว่างพรีวิว กรุณาปิดแล้วเปิดใหม่');
    if(o?objectLocked(o):mainLocked())throw new Error('มีโลโก้ที่ล็อกอยู่ กรุณาปลดล็อก หรือเลือกเปลี่ยนเฉพาะตำแหน่งนี้');
   }
   // Prepare everything before mutating: all targets form one Undo operation.
   const prepared=list.map(o=>({o,data:o?fit(candidate.image,o.size):candidate.data})),before=objectSnapshot(),panel=$('logoReplacePanel').checked;
   for(const {o,data} of prepared){
    if(o){
     o.logoSlot={version:1,kind:'logo'};o.appearance={...o.appearance,mode:'original',color:null,textureData:data,textureName:candidate.name,textureId:'logo-upload-'+crypto.randomUUID()};
     o.logoFinish={logoType:'diecut',...o.logoFinish,logoShape:o.logoFinish?.logoType==='backlit'?'cutout':panel?'panel':'cutout'};
    }else{
     S.logo=data;S.logoAR=candidate.image.width/candidate.image.height;S.logoVisibleBounds=null;S.logoHasTransparency=candidate.transparent;S.logoAcc=null;S.logoColorMode='original';
     S.logoShape=S.logoType==='backlit'?'cutout':panel?'panel':'cutout';
    }
   }
   recordObjectHistory(before);close();sync();refresh();announceCatalog('เปลี่ยนโลโก้ '+prepared.length+' ตำแหน่งแล้ว · ย้อนกลับได้ด้วย Ctrl+Z','success');
  }catch(error){$('logoReplaceStatus').textContent=error.message;}
 }
 function refresh(){
  if(!$('replaceSelectedLogo'))return;const o=selected(),other=!!objectById(objectEditor.selectedId)&&!o;
  $('replaceSelectedLogo').textContent=other?'เลือกตำแหน่งโลโก้ก่อน':o?'อัปโหลดแทนโลโก้ที่เลือก':'อัปโหลดโลโก้หลัก';
  $('replaceSelectedLogo').disabled=other||(o?objectLocked(o):mainLocked());
  $('logoReplaceHint').textContent=other?'ชิ้นนี้ไม่ใช่ตำแหน่งโลโก้ · ภาพจอและโปสเตอร์เปลี่ยนผ่านเครื่องมือพื้นผิวของชิ้นนั้น':o?'โลโก้ตัวอย่างเป็นตำแหน่งวางโลโก้ของคุณ · เปลี่ยนภาพโดยไม่เปลี่ยนโครงบูธ':'คลิกโลโก้ในภาพ 3D เพื่อเปลี่ยนเฉพาะตำแหน่งนั้น';
 }
 function onSelect(id){
  refresh();
  if(id!==SCENE_ASSET_IDS.brand&&!isLogo(objectById(id)))return;
  root.YPLogoFinishes.updateUI();refresh();
  showDockPage('signage',document.querySelector('.dock-tool[data-dock-page="signage"]'));
 }
 function install(){
  const section=document.createElement('div');section.innerHTML='<button class="btn pri" type="button" id="replaceSelectedLogo" style="width:100%;margin:10px 0">อัปโหลดแทนโลโก้ที่เลือก</button><p class="note" id="logoReplaceHint"></p>';
  $('settingsBrand').querySelector('.sech').after(section);$('replaceSelectedLogo').onclick=open;
  // Both entry points now address the selected logo rather than silently changing S.logo.
  $('btnLogo').onclick=open;
  const style=document.createElement('style');style.textContent='#logoReplaceDialog{width:min(560px,calc(100vw - 32px));max-height:90vh;overflow:auto;background:#110e16;color:#f7f3fa;border:1px solid #58334a;border-radius:16px;padding:24px}#logoReplaceDialog::backdrop{background:#0009}#logoReplaceDialog .logo-preview{height:170px;margin:16px 0;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(#36343b 0% 25%,#56525c 0% 50%) 50%/24px 24px;border-radius:8px}#logoReplacePreview{max-width:94%;max-height:150px;object-fit:contain}#logoReplaceDialog label{display:block;margin:12px 0}#logoReplaceDialog select{width:100%}#logoReplaceDialog .logo-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}#logoReplaceWarning{color:#ffd395}#logoReplaceDialog [hidden]{display:none!important}';document.head.append(style);
  dialog=document.createElement('dialog');dialog.id='logoReplaceDialog';dialog.setAttribute('aria-labelledby','logoReplaceTitle');
  dialog.innerHTML='<h2 id="logoReplaceTitle">เปลี่ยนโลโก้</h2><p id="logoReplaceTarget"></p><label>ไฟล์โลโก้ PNG / SVG / WebP / JPG<input id="logoReplaceFile" type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg"></label><button class="btn" type="button" id="logoReplaceExample">ใช้โลโก้ Yuppie โปร่งใส</button><div class="logo-preview"><img id="logoReplacePreview" alt="พรีวิวโลโก้ใหม่ พื้นตารางคือส่วนโปร่งใส" hidden></div><label>ใช้กับ<select id="logoReplaceScope"><option value="selected">เฉพาะตำแหน่งนี้</option><option value="all" id="logoReplaceAll">ทุกตำแหน่งโลโก้</option></select></label><label><input type="checkbox" id="logoReplacePanel"> เพิ่มแผ่นป้ายสี่เหลี่ยม (ไม่ใช้กับไฟเรืองหลัง)</label><div id="logoReplaceWarning" hidden>ไฟล์มีพื้นหลังทึบติดมา ระบบไม่ลบพื้นหลังให้เอง แนะนำ PNG/SVG โปร่งใส<label><input type="checkbox" id="logoReplaceOpaque"> ยืนยันใช้ภาพพร้อมพื้นหลังเดิม</label></div><p class="note">คงตำแหน่ง ขนาดพื้นที่ และรูปแบบไฟเดิม · ไม่เปลี่ยนแผงตกแต่ง จอ หรือโปสเตอร์</p><p id="logoReplaceStatus" role="status" aria-live="polite"></p><div class="logo-actions"><button class="btn" type="button" id="logoReplaceCancel">ยกเลิก</button><button class="btn pri" type="button" id="logoReplaceConfirm" disabled>ยืนยันเปลี่ยนโลโก้</button></div>';
  document.body.append(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  $('logoReplaceCancel').onclick=close;$('logoReplaceConfirm').onclick=commit;
  $('logoReplaceExample').onclick=()=>preview(root.YPDefaultLogo.data,'Yuppie Production โปร่งใส');
  $('logoReplaceFile').onchange=async e=>{
   const file=e.target.files[0];if(!file)return;
   // Invalidate the previous preview as soon as another file is chosen.
   const token=++loadId,current=session;session.candidate=null;$('logoReplaceConfirm').disabled=true;
   try{
    if(file.size>10*1024*1024)throw new Error('ขนาดไฟล์ต้องไม่เกิน 10 MB');
    if(!['image/png','image/svg+xml','image/webp','image/jpeg'].includes(file.type))throw new Error('ชนิดไฟล์ไม่รองรับ');
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('อ่านไฟล์ไม่สำเร็จ'));r.readAsDataURL(file);});
    if(token===loadId&&current===session)await preview(data,file.name);
   }catch(error){if(token===loadId&&current===session)$('logoReplaceStatus').textContent=error.message;}
  };
  refresh();
 }
 root.YPLogoReplacement={isLogo,sourceFor,fit,decode,open,refresh,onSelect};install();
})(globalThis);
