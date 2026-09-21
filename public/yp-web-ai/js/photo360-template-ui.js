(function(){
 'use strict';
 const library=YPPhoto360Templates;
 function snapshot(id){const out=library.build(id,JSON.parse(INITIAL_BOOTH_SPEC_JSON));YPProjectStore.validateSpec(out.spec);return out;}
 window.YPPhoto360TemplateBridge={snapshot};
 if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
 const entry=document.createElement('section');entry.id='photo360TemplateSubmenu';entry.className='starter-entry';
 entry.innerHTML='<h3>เทมเพลต Photo Backdrop 360</h3><p>6 × 3 × 2.4 ม. · ผนังโค้ง R 3.50 ม. · สติ๊กเกอร์ BD_01</p><button type="button" class="btn pri" id="photo360TemplatesOpen">เลือกเทมเพลต Photo Backdrop 360</button>';
 document.getElementById('oType').after(entry);
 const dialog=document.createElement('dialog');dialog.id='photo360TemplatesDialog';dialog.className='project-dialog inline-template-dialog';dialog.setAttribute('aria-labelledby','photo360TemplatesTitle');
 dialog.innerHTML='<div class="starter-heading"><h2 id="photo360TemplatesTitle">Photo Backdrop 360 · 6 × 3 × 2.4 ม.</h2><button type="button" class="btn" id="photo360TemplatesClose" aria-label="ปิดเทมเพลต Photo Backdrop 360">×</button></div><p>สติ๊กเกอร์ BD_01 ลายวงกลมชมพู–ขาวบนผนังโค้ง พร้อมแท่นถ่ายภาพวงกลม · ปรับแต่งต่อได้</p><p>ใช้กับแบบ A/B ที่กำลังเลือก โดยถามยืนยันก่อนแทนที่ และไม่เปลี่ยนอีกแบบ</p><p id="photo360TemplateStatus" role="status" aria-live="polite"></p><div class="inline-template-grid" id="photo360TemplateCards"></div>';
 document.body.append(dialog);
 let busy=false,opener;const status=document.getElementById('photo360TemplateStatus');
 function setBusy(value){busy=value;for(const b of dialog.querySelectorAll('button'))b.disabled=value;}
 function close(){if(!busy){dialog.close();opener?.focus();}}
 async function apply(t){
  if(busy)return;setBusy(true);status.textContent='กำลังเตรียมเทมเพลต…';
  try{const result=await YPProjectWorkspace.useTemplate({makeSnapshot:()=>snapshot(t.id),name:t.name,detailed:true});
   if(result.ok){setBusy(false);close();}else status.textContent=result.message;
  }catch(e){status.textContent='ใช้เทมเพลตไม่สำเร็จ: '+e.message;}finally{setBusy(false);}
 }
 for(const t of library.templates){
  const card=document.createElement('article');card.className='inline-template-card';
  const img=document.createElement('img');img.src='assets/photo360-templates/'+t.id+'.png';img.alt=t.name;img.width=960;img.height=600;
  const h=document.createElement('h3');h.textContent=t.name;const p=document.createElement('p');p.textContent=t.description;
  const actions=document.createElement('div');actions.className='inline-template-actions';const button=document.createElement('button');button.type='button';button.className='btn pri';button.dataset.photo360Template=t.id;button.textContent='ใช้แบบนี้';button.onclick=()=>apply(t);actions.append(button);card.append(img,h,p,actions);document.getElementById('photo360TemplateCards').append(card);
 }
 async function open(){opener=document.activeElement;await YPProjectWorkspace.enter();status.textContent='';for(const b of dialog.querySelectorAll('[data-photo360-template]'))b.textContent=YPProjectWorkspace.templateLabel();dialog.showModal();}
 document.getElementById('photo360TemplatesOpen').onclick=open;document.getElementById('photo360TemplatesClose').onclick=close;
 dialog.oncancel=e=>{e.preventDefault();close();};document.addEventListener('keydown',e=>{if(dialog.open)e.stopPropagation();},true);
 const syncType=type=>{entry.hidden=type!=='photo360';};syncType(getBoothSpec().type);
 window.YPPhoto360TemplateUI={open,syncType};
})();
