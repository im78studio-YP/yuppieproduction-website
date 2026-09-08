(function(){
  'use strict';const library=YPCornerTemplates;
  function artwork(t,sideWall=false){
    const c=document.createElement('canvas');c.width=sideWall?900:1800;c.height=720;const g=c.getContext('2d');
    g.fillStyle=t.primary;g.fillRect(0,0,c.width,c.height);g.fillStyle=t.secondary;g.fillRect(0,0,c.width,18);
    if(sideWall){g.save();g.beginPath();g.rect(90,80,640,610);g.clip();g.strokeStyle=t.secondary;g.lineWidth=24;for(let i=-720;i<1000;i+=62){g.beginPath();g.moveTo(i,80);g.lineTo(i+610,690);g.stroke();}g.restore();}
    return c.toDataURL('image/png');
  }
  function snapshot(id,options={}){
    const t={...library.templates.find(t=>t.id===id)},out=library.build(id,JSON.parse(INITIAL_BOOTH_SPEC_JSON),OBJECT_CATALOG);
    if(/^#[\da-f]{6}$/i.test(options.primary||'')){const original=t.primary;t.primary=options.primary;out.spec.primary=t.primary;for(const o of out.spec.objects)if(o.appearance?.color===original)o.appearance.color=t.primary;}
    out.spec.wallStickerFaces=['back','left'];
    for(const face of ['back','left'])Object.assign(out.spec.wallStickers[face],{data:artwork(t,face==='left'),name:t.name+' · '+face,id:1,ar:face==='back'?2.5:1.25,w:face==='back'?6:3,h:2.4,mode:'cover'});
    out.spec=library.mirror(out.spec,options.cornerSide||'right');YPProjectStore.validateSpec(out.spec);return out;
  }
  function switchSide(side){
    const state=window.YPProjectWorkspace?.state();if(state&&(!state.ready||state.busy||state.pendingDraft))throw new Error('กรุณารอระบบพร้อม และจัดการร่างเดิมก่อนสลับหัวมุม');
    const out=YPProjectBridge.capture();if(out.spec.cornerSide===side)return;
    out.spec=library.mirror(out.spec,side);YPProjectStore.validateSpec(out.spec);YPProjectBridge.restore(out);window.YPProjectWorkspace?.changed();
  }
  window.YPCornerTemplateBridge={snapshot,switchSide};if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
  const entry=document.createElement('section');entry.id='cornerTemplateSubmenu';entry.className='starter-entry';entry.innerHTML='<h3>เทมเพลตหัวมุม 3×6 ม.</h3><p>โครงไม้ · มุมนั่งคุย · บาร์ 4 ที่นั่ง<br>เลือกหัวมุมซ้าย–ขวาเพื่อสลับผังอัตโนมัติ</p><button type="button" class="btn pri" id="cornerTemplatesOpen">เลือกเทมเพลตหัวมุม</button>';
  document.getElementById('cornerSideWrap').after(entry);
  const dialog=document.createElement('dialog');dialog.id='cornerTemplatesDialog';dialog.className='project-dialog inline-template-dialog';dialog.setAttribute('aria-labelledby','cornerTemplatesTitle');
  dialog.innerHTML='<div class="starter-heading"><h2 id="cornerTemplatesTitle">หัวมุม · กว้าง 6 × ลึก 3 ม.</h2><button type="button" class="btn" id="cornerTemplatesClose" aria-label="ปิด">×</button></div><p>สัดส่วนประมาณจากภาพอ้างอิง ไม่ใช่แบบผลิต · ใช้โลโก้ YP ตั้งต้น</p><label for="cornerTemplateSide">ด้านเปิดของบูธ </label><select id="cornerTemplateSide"><option value="left">หัวมุมซ้าย — เปิดหน้า + ซ้าย</option><option value="right">หัวมุมขวา — เปิดหน้า + ขวา</option></select><p>ระบบจะเก็บแบบปัจจุบันไว้ใน A/B อีกช่อง และถามก่อนแทนที่แบบที่มีอยู่</p><section class="template-feedback" id="cornerFeedback" hidden><p id="cornerStatus" role="status" aria-live="polite"></p><div id="cornerFeedbackActions" class="inline-template-actions"></div></section><div class="inline-template-grid" id="cornerCards"></div>';
  document.body.append(dialog);const side=dialog.querySelector('select'),feedback=document.getElementById('cornerFeedback'),status=document.getElementById('cornerStatus'),actions=document.getElementById('cornerFeedbackActions');let busy=false,opener;
  const setBusy=v=>{busy=v;dialog.setAttribute('aria-busy',String(v));for(const b of dialog.querySelectorAll('button,select'))b.disabled=v;};
  const close=()=>{if(!busy){dialog.close();opener?.focus();}};
  function feedbackResult(result){feedback.hidden=false;status.textContent=result.message;actions.replaceChildren();if(window.YPProjectWorkspace?.state().pendingDraft)for(const [choice,label] of [['recover','เปิดร่างเดิม'],['current','ใช้แบบปัจจุบัน']]){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=label;b.onclick=async()=>{if(busy)return;setBusy(true);try{const r=await YPProjectWorkspace.resolveTemplateDraft(choice);feedbackResult(r.ok?{message:'พร้อมแล้ว กด “ใช้แบบนี้” เพื่อเลือกเทมเพลต'}:r);}catch(e){feedbackResult({message:e.message});}finally{setBusy(false);}};actions.append(b);}dialog.scrollTo({top:0,behavior:'instant'});}
  async function apply(t){if(busy)return;setBusy(true);feedbackResult({message:'กำลังเตรียมแบบ… หากมีหน้าต่างยืนยัน กรุณายืนยันหรือยกเลิก'});try{const r=await YPProjectWorkspace.useTemplate({makeSnapshot:()=>snapshot(t.id,{cornerSide:side.value}),name:t.name,detailed:true});if(r.ok){setBusy(false);close();}else feedbackResult(r);}catch(e){feedbackResult({message:'ใช้เทมเพลตไม่สำเร็จ: '+e.message});}finally{setBusy(false);}}
  for(const t of library.templates){const card=document.createElement('article');card.className='inline-template-card';const img=document.createElement('img');img.dataset.template=t.id;img.alt=t.name;img.width=960;img.height=720;const h=document.createElement('h3');h.textContent=t.name;const p=document.createElement('p');p.textContent=t.description;const wrap=document.createElement('div');wrap.className='inline-template-actions';const b=document.createElement('button');b.className='btn pri';b.type='button';b.dataset.cornerTemplate=t.id;b.textContent='ใช้แบบนี้';b.onclick=()=>apply(t);wrap.append(b);card.append(img,h,p,wrap);document.getElementById('cornerCards').append(card);}
  const updateImages=()=>{for(const img of dialog.querySelectorAll('img[data-template]'))img.src='assets/corner-templates/'+img.dataset.template+'-'+side.value+'.png';};side.onchange=updateImages;
  const open=()=>{opener=document.activeElement;side.value=getBoothSpec().cornerSide||'right';updateImages();feedback.hidden=true;actions.replaceChildren();dialog.showModal();};
  document.getElementById('cornerTemplatesOpen').onclick=open;document.getElementById('cornerTemplatesClose').onclick=close;dialog.oncancel=e=>{e.preventDefault();close();};document.addEventListener('keydown',e=>{if(dialog.open)e.stopPropagation();},true);
  const syncType=type=>{entry.hidden=type!=='corner';};syncType(getBoothSpec().type);window.YPCornerTemplateUI={open,syncType};
})();
