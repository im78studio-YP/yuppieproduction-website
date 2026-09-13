(function(root){
 'use strict';
 // The controller owns a draft only. It never accesses or changes the editor's S.
 function create(host,{changed,getSpec}){
  const section=document.createElement('section');section.className='wizard-logo';
  section.innerHTML='<h3>โลโก้ของคุณ</h3><p class="wizard-note">เห็นแบรนด์ของคุณบนบูธได้ทันทีในพรีวิว · ข้ามได้ หากยังไม่มีไฟล์</p><label class="btn pri wizard-logo-upload" for="wizard-logo-file">อัปโหลด / เปลี่ยนโลโก้<input id="wizard-logo-file" type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg"></label><p class="wizard-note">PNG / SVG โปร่งใสแนะนำ · รองรับ JPG / WebP · ไม่เกิน 10 MB</p><div class="wizard-logo-sample" hidden><img id="wizard-logo-image" alt="โลโก้ที่อัปโหลด พื้นตารางคือส่วนโปร่งใส"></div><p id="wizard-logo-status" class="wizard-note" role="status" aria-live="polite"></p><label id="wizard-logo-warning" hidden><input id="wizard-logo-opaque" type="checkbox"> ไฟล์นี้มีพื้นหลังติดมา ยืนยันใช้พร้อมพื้นหลัง (ระบบไม่ลบให้อัตโนมัติ)</label><button id="wizard-logo-reset" class="btn" type="button" hidden>ใช้โลโก้เดิมของแบบตั้งต้น</button>';
  host.prepend(section);const $=id=>section.querySelector('#'+id),file=$('wizard-logo-file');
  let candidate=null,busy=false,accepted=false,token=0,error='',cache=new Map();
  function targets(spec){return (spec.objects||[]).filter(root.YPLogoReplacement.isLogo);}
  function mainAvailable(spec){return spec.type!=='island'&&Number(spec.logoScale)>0;}
  const mainLocked=spec=>spec.sceneItemState?.[SCENE_ASSET_IDS.brand]?.locked===true;
  function blocked(){return busy||!!candidate&&!candidate.transparent&&!accepted;}
  function refresh(){
   const spec=getSpec(),logos=targets(spec),editable=logos.filter(o=>!o.locked),main=mainAvailable(spec)&&!mainLocked(spec),count=editable.length+(main?1:0);
   section.querySelector('.wizard-logo-sample').hidden=!candidate;
   if(candidate)$('wizard-logo-image').src=candidate.data;
   $('wizard-logo-reset').hidden=!candidate&&!busy&&!error;
   $('wizard-logo-warning').hidden=!candidate||candidate.transparent;
   $('wizard-logo-opaque').checked=accepted;
   $('wizard-logo-status').textContent=busy?'กำลังตรวจไฟล์โลโก้…':error||((candidate?candidate.name+' · ':'เก็บโลโก้เดิมของแบบ · ')+(count?'ใช้กับ '+count+' ตำแหน่งโลโก้ ไม่เปลี่ยนจอหรือโปสเตอร์':'แบบนี้ยังไม่มีตำแหน่งโลโก้ที่แสดงได้ เลือกเทมเพลตที่มีโลโก้เพื่อดูบนบูธ')+(logos.length!==editable.length?' · ข้าม '+(logos.length-editable.length)+' ตำแหน่งที่ล็อกไว้':''));
  }
  function reset(){token++;candidate=null;busy=false;accepted=false;error='';cache.clear();file.value='';refresh();}
  file.onchange=async()=>{
   const f=file.files[0];if(!f)return;const current=++token;busy=true;error='';refresh();changed();
   try{
    if(f.size>10*1024*1024)throw Error('ไฟล์ใหญ่เกิน 10 MB');
    if(!['image/png','image/svg+xml','image/webp','image/jpeg'].includes(f.type))throw Error('รองรับ PNG, SVG, JPG และ WebP');
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('อ่านไฟล์ไม่สำเร็จ'));r.readAsDataURL(f);});
    if(current!==token)return;const decoded=await root.YPLogoReplacement.decode(data);if(current!==token)return;
    candidate={...decoded,name:f.name.replace(/[<>\u0000]/g,'').slice(0,160)||'โลโก้ของคุณ',id:'wizard-logo-'+crypto.randomUUID()};accepted=decoded.transparent;cache.clear();
   }catch(e){if(current!==token)return;error='ใช้ไฟล์นี้ไม่ได้: '+e.message+' · ยังเก็บโลโก้ก่อนหน้าไว้';}
   finally{if(current===token){busy=false;refresh();changed();}}
  };
  $('wizard-logo-opaque').onchange=()=>{accepted=$('wizard-logo-opaque').checked;refresh();changed();};
  $('wizard-logo-reset').onclick=()=>{reset();changed();};
  function apply(spec){
   if(!candidate||blocked())return spec;
   // Keep the image available for later placements even if this blank booth has none.
   if(!mainLocked(spec)){spec.logo=candidate.data;spec.logoAR=candidate.image.width/candidate.image.height;spec.logoVisibleBounds=null;spec.logoHasTransparency=candidate.transparent;spec.logoColorMode='original';spec.logoAcc=null;}
   for(const obj of targets(spec)){
    if(obj.locked)continue;
    const key=obj.size.w+':'+obj.size.h;
    if(!cache.has(key))cache.set(key,root.YPLogoReplacement.fit(candidate.image,obj.size));
    obj.logoSlot={version:1,kind:'logo'};
    obj.appearance={...obj.appearance,mode:'original',color:null,textureData:cache.get(key),textureName:candidate.name,textureId:candidate.id+'-'+key};
   }
   return spec;
  }
  const summary=()=>candidate&&!blocked()?candidate.name+' · ใช้โลโก้ที่อัปโหลด':'เก็บโลโก้เดิมของแบบ';
  return {reset,refresh,blocked,apply,summary};
 }
 root.YPWizardLogo={create};
})(globalThis);
