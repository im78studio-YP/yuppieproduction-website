(function(){
  'use strict';
  const engine=window.YPStarterLayouts,bridge=window.YPStarterBridge;
  if(!engine||!bridge)return;
  const $=id=>document.getElementById(id);
  const entry=document.createElement('section');entry.className='starter-entry';
  entry.innerHTML='<h3>บูธนี้เน้นอะไร?</h3><p>เลือกผังตั้งต้นตามการใช้งาน แล้วปรับทุกชิ้นต่อได้เอง</p><button class="btn pri" id="starterOpen" type="button">เลือกวัตถุประสงค์และดูผัง</button><small>โชว์สินค้า · ขายสินค้า · เจรจาธุรกิจ</small>';
  document.querySelector('#dockBusinessPage .panel-intro').after(entry);
  const dialog=document.createElement('dialog');dialog.className='project-dialog starter-dialog';dialog.setAttribute('aria-labelledby','starterTitle');
  dialog.innerHTML=`<div class="starter-heading"><h2 id="starterTitle">เริ่มจากผังที่เหมาะกับงาน</h2><button class="btn" id="starterClose" type="button" aria-label="ปิดและจัดวางเอง">×</button></div>
    <p>ใช้ขนาดบูธ ด้านเปิด และอุปกรณ์ในคลังปัจจุบัน โดยไม่เปลี่ยนแบรนด์ พื้น ผนัง หรือห้องเก็บของ</p>
    <fieldset class="starter-purpose"><legend>บูธนี้เน้นอะไร?</legend><div id="starterPurposes"></div></fieldset>
    <div class="starter-preview-grid"><div><div id="starterPreview" class="starter-preview"></div><small>ภาพด้านบน · แถบชมพูคือทางเปิด · พื้นที่ฟ้าคือพื้นที่เผื่อเดินเบื้องต้น</small></div>
      <div><h3>อุปกรณ์ที่จะจัดวาง</h3><ul id="starterItems"></ul><p id="starterFit" role="status" aria-live="polite"></p><p id="starterChanges"></p></div></div>
    <p class="starter-caution">ผังนี้เป็นจุดเริ่มต้นในการออกแบบ พื้นที่เผื่อเดิน 0.9 ม. เป็นค่าจัดผังเบื้องต้น ไม่ใช่การรับรองข้อกำหนดสถานที่หรือแบบผลิต ทีมงานต้องตรวจอีกครั้ง</p>
    <fieldset class="starter-destination"><legend>ต้องการใช้ผังที่ไหน?</legend><label><input type="radio" name="starterDestination" value="copy" checked> <span id="starterCopyLabel">สร้างในแบบ B และเก็บแบบ A ไว้</span></label><label><input type="radio" name="starterDestination" value="current"> <span id="starterCurrentLabel">ใช้กับแบบปัจจุบัน</span></label></fieldset>
    <div class="project-dialog-actions"><button class="btn pri" id="starterApply" type="button">ใช้ผังตั้งต้น</button><button class="btn" id="starterManual" type="button">ยังไม่ใช้ — จัดวางเอง</button></div><p id="starterStatus" role="status" aria-live="polite"></p>`;
  document.body.append(dialog);
  let purpose='display',plan=null,context=null,opener=null;
  for(const item of engine.PURPOSES){
    const label=document.createElement('label');label.className='starter-choice';
    const radio=document.createElement('input');radio.type='radio';radio.name='starterPurpose';radio.value=item.id;radio.checked=item.id===purpose;
    const text=document.createElement('span'),title=document.createElement('strong'),description=document.createElement('small');title.textContent=item.name;description.textContent=item.description;text.append(title,description);label.append(radio,text);$('starterPurposes').append(label);
    radio.onchange=()=>{purpose=item.id;update();};
  }
  function close(){dialog.close();opener?.focus();}
  function draw(){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox',`-.3 -.3 ${context.width+.6} ${context.depth+.6}`);svg.setAttribute('role','img');svg.setAttribute('aria-label','ตัวอย่างผัง '+engine.PURPOSES.find(p=>p.id===purpose).name+' มองจากด้านบน');
    const rect=(box,fill,stroke='none')=>{const r=document.createElementNS(ns,'rect');Object.entries({x:box.x0,y:box.z0,width:box.x1-box.x0,height:box.z1-box.z0,fill,stroke,'stroke-width':.03}).forEach(([k,v])=>r.setAttribute(k,v));svg.append(r);return r;};
    rect({x0:0,z0:0,x1:context.width,z1:context.depth},'#24232c','#706678');
    for(const box of plan.lanes||[])rect(box,'#254c5e');
    for(const box of context.obstacles)rect(box,'#66616c','#a9a2ad');
    if(context.room)rect(context.room,'#87818d','#e0dce4');
    for(const item of plan.placements){const element=rect(engine.rect(item.x,item.z,item.w,item.d),'#e8c28e','#392c25');const title=document.createElementNS(ns,'title');title.textContent=context.catalog.find(c=>c.catalogId===item.catalogId)?.name||item.catalogId;element.append(title);}
    const side=(name,x1,z1,x2,z2)=>{const line=document.createElementNS(ns,'line');Object.entries({x1,y1:z1,x2,y2:z2,stroke:context.walls.includes(name)?'#f5f1f4':'#f72585','stroke-width':.07}).forEach(([k,v])=>line.setAttribute(k,v));svg.append(line);};
    side('back',0,0,context.width,0);side('left',0,0,0,context.depth);side('right',context.width,0,context.width,context.depth);side('front',0,context.depth,context.width,context.depth);
    $('starterPreview').replaceChildren(svg);
  }
  function update(){
    context=bridge.context();plan=engine.plan(context,purpose);$('starterStatus').textContent='';
    const counts=new Map();for(const item of plan.placements)counts.set(item.catalogId,(counts.get(item.catalogId)||0)+1);
    $('starterItems').replaceChildren();for(const [id,count] of counts){const li=document.createElement('li');li.textContent=context.catalog.find(item=>item.catalogId===id).name+' × '+count;$('starterItems').append(li);}
    $('starterFit').textContent=plan.message+(plan.skipped.length?' · ไม่ใส่: '+plan.skipped.join(', '):'');
    $('starterFit').dataset.error=String(!plan.ok);
    $('starterChanges').textContent=`ขนาด ${context.width} × ${context.depth} ม. · คงอุปกรณ์ที่ต้องเก็บ ${context.keptIds.length} ชิ้น · แทนที่อุปกรณ์ที่ย้ายได้ ${context.removedIds.length} ชิ้น`;
    const state=window.YPProjectWorkspace?.state();$('starterApply').disabled=!plan.ok||!state?.ready||state.busy||state.pendingDraft;
    if(state?.pendingDraft)$('starterStatus').textContent='กรุณาเลือกเปิดร่างเดิมหรือใช้แบบปัจจุบันที่แถบร่างก่อน';
    const active=state?.active||'A',other=active==='A'?'B':'A';
    $('starterCopyLabel').textContent=`สร้างในแบบ ${other} และเก็บแบบ ${active} ปัจจุบันไว้`+(state?.hasOther?` (จะแทนที่แบบ ${other} เดิมหลังยืนยัน)`:'');
    $('starterCurrentLabel').textContent=`ใช้กับแบบ ${active} ปัจจุบัน`;
    draw();
  }
  function open(){
    if(dialog.open)return;opener=document.activeElement;
    const current=window.getBoothSpec().designPurpose;if(engine.PURPOSES.some(p=>p.id===current))purpose=current;
    dialog.querySelectorAll('[name=starterPurpose]').forEach(r=>{r.checked=r.value===purpose;});dialog.querySelector('[name=starterDestination][value=copy]').checked=true;
    update();dialog.showModal();dialog.querySelector('[name=starterPurpose]:checked').focus();
  }
  $('starterOpen').onclick=open;$('starterClose').onclick=close;$('starterManual').onclick=close;dialog.oncancel=event=>{event.preventDefault();close();};
  document.addEventListener('keydown',event=>{if(dialog.open)event.stopPropagation();},true);
  $('starterApply').onclick=async()=>{
    if(!plan?.ok)return;
    const selectedPlan=plan,copy=dialog.querySelector('[name=starterDestination]:checked').value==='copy',removedCount=context.removedIds.length;
    dialog.close();
    const ok=await window.YPProjectWorkspace.useStarter({makeSnapshot:()=>bridge.snapshot(selectedPlan),newVariant:copy,purposeName:engine.PURPOSES.find(p=>p.id===purpose).name,removedCount});
    if(ok){document.querySelector('.dock-tool[data-dock-page="business"]')?.focus();}
    else{open();$('starterStatus').textContent='ยังไม่ได้ใช้ผังใหม่ แบบเดิมยังอยู่ หากมีข้อผิดพลาดให้ตรวจข้อความที่แถบโปรเจกต์';}
  };
  window.addEventListener('yp:quick-setup-complete',event=>{if(!event.detail?.templateId)open();});
  window.YPStarterLayoutUI={open};
})();
