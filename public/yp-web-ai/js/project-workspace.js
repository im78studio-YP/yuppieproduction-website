(async function(){
  'use strict';
  // Isolated comparison frames must never read or overwrite the customer's draft.
  if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
  const store=window.YPProjectStore,bridge=window.YPProjectBridge;
  if(!store||!bridge)return;
  const viewer=document.querySelector('.card.viewer');
  const bar=document.createElement('section');bar.className='project-bar';bar.setAttribute('aria-label','โปรเจกต์และแบบทางเลือก');
  bar.innerHTML=`<div class="project-identity"><label for="projectName">โปรเจกต์</label><input id="projectName" class="project-name" maxlength="80" value="บูธของฉัน" autocomplete="off"></div>
    <div class="project-variants" role="group" aria-label="แบบทางเลือก"><button class="btn on" id="projectA" type="button" aria-pressed="true">แบบ A</button><button class="btn" id="projectB" type="button" aria-pressed="false" disabled>แบบ B</button></div>
    <button class="btn" id="projectSave" type="button">บันทึกไฟล์</button><button class="btn" id="projectOpen" type="button">เปิดไฟล์</button>
    <button class="btn" id="projectWizard" type="button">เปิด Wizard</button>
    <button class="btn editor-level-toggle" id="editorLevelToggle" type="button" aria-pressed="false" title="แสดง Scale พิกัด XYZ การกลับด้าน และจุดยึดพื้นผิว">เครื่องมือขั้นสูง: ปิด</button>
    <div class="project-status" id="projectStatus" role="status" aria-live="polite">กำลังเตรียมระบบบันทึก…</div>
    <input id="projectFile" type="file" accept=".ypbooth.json,.json,application/json" hidden>`;
  viewer.prepend(bar);
  const recovery=document.createElement('div');recovery.className='project-recovery';recovery.hidden=true;
  recovery.innerHTML='<span id="projectRecoveryText"></span><button class="btn sm" id="projectRecover" type="button">เปิดร่างเดิม</button>';
  bar.after(recovery);
  const restart=document.createElement('button');restart.id='projectReset';restart.className='btn sm';restart.type='button';
  restart.textContent='เริ่มใหม่';restart.title='คืนค่าการออกแบบทั้งหมดของแบบที่กำลังแก้ไข';
  document.getElementById('tagSize').after(restart);
  const $=id=>document.getElementById(id),status=(message,error=false)=>{ $('projectStatus').textContent=message;$('projectStatus').dataset.error=String(error); };
  let project=null,timer=0,ready=false,loading=false,busy=false,pendingDraft=null,revision=0,savedRevision=0,writeQueue=Promise.resolve(),advanced=false;
  const dialog=document.createElement('dialog');dialog.className='project-dialog';dialog.setAttribute('aria-labelledby','projectDialogTitle');
  dialog.innerHTML='<h2 id="projectDialogTitle"></h2><p id="projectDialogText"></p><div class="project-dialog-actions"><button class="btn pri" id="projectConfirm" type="button">ยืนยัน</button><button class="btn" id="projectCancel" type="button">ยกเลิก</button></div>';
  document.body.append(dialog);
  // Resolve the saved draft before any editor or template interaction is possible.
  const entry=document.createElement('dialog');entry.id='projectEntryDialog';entry.className='project-dialog';
  entry.setAttribute('aria-labelledby','projectEntryTitle');entry.setAttribute('aria-describedby','projectEntryText');
  entry.innerHTML='<h2 id="projectEntryTitle">กำลังตรวจร่างที่บันทึกไว้…</h2><p id="projectEntryText" role="status" aria-live="polite">กรุณารอสักครู่ ยังไม่เปลี่ยนหรือเขียนทับงานเดิม</p><div class="project-dialog-actions" id="projectEntryActions" hidden><button class="btn pri" id="projectEntryRecover" type="button">เปิดร่างเดิม</button><button class="btn" id="projectEntryNew" type="button">เริ่มใหม่</button></div>';
  document.body.append(entry);entry.showModal();
  let releaseEntry,templateIntent=new URLSearchParams(location.search).has('useTemplate');
  const entryReady=new Promise(resolve=>{releaseEntry=resolve;});
  entry.oncancel=event=>event.preventDefault();
  window.addEventListener('keydown',event=>{if(entry.open&&(event.key==='Delete'||event.key==='Backspace'||((event.ctrlKey||event.metaKey)&&['s','z','y'].includes(event.key.toLowerCase())))){event.preventDefault();event.stopImmediatePropagation();}},true);
  function finishEntry(){if(entry.open)entry.close();if(!busy)releaseEntry();}
  function entryError(){if(pendingDraft)$('projectEntryText').textContent='ยังเปิดร่างไม่สำเร็จ ร่างเดิมยังเก็บไว้ กรุณาลองอีกครั้ง';}
  $('projectEntryRecover').onclick=async()=>{const ok=await run(recoverDraft);if(!ok)entryError();};
  $('projectEntryNew').onclick=async()=>{const ok=await run(startNewDraft);if(ok&&!templateIntent)window.YPQuickSetupBridge.open({start:'business'});};
  function ask(title,message,action){return new Promise(resolve=>{
    $('projectDialogTitle').textContent=title;$('projectDialogText').textContent=message;$('projectConfirm').textContent=action;
    const done=value=>{dialog.close();resolve(value);};$('projectConfirm').onclick=()=>done(true);$('projectCancel').onclick=()=>done(false);dialog.oncancel=event=>{event.preventDefault();done(false);};dialog.showModal();$('projectCancel').focus();
  });}
  // Keep editor Delete/Undo shortcuts from changing the scene under a dialog.
  document.addEventListener('keydown',event=>{
    if(entry.open&&!dialog.open&&event.key==='Tab'){
      const buttons=[...entry.querySelectorAll('button:not(:disabled)')].filter(button=>!button.closest('[hidden]'));
      const first=buttons[0],last=buttons[buttons.length-1];
      if(!first)event.preventDefault();
      else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    if(dialog.open||entry.open)event.stopPropagation();
  },true);
  function refresh(){
    if(!project)return;
    $('projectName').value=project.name;
    for(const slot of ['A','B']){const button=$('project'+slot);button.disabled=busy||!ready||!!pendingDraft;button.classList.toggle('on',project.active===slot);button.setAttribute('aria-pressed',String(project.active===slot));}
    for(const id of ['projectSave','projectOpen','projectWizard','projectName','projectRecover','projectReset'])$(id).disabled=busy;
    recovery.hidden=!pendingDraft;
    $('projectRecoveryText').hidden=!pendingDraft;
    $('projectRecover').hidden=!pendingDraft;
    for(const id of ['projectEntryRecover','projectEntryNew'])$(id).disabled=busy||!ready;
  }
  function snapshot(){store.capture(project,bridge.capture());return store.clone(project);}
  function queueWrite(value){const write=writeQueue.catch(()=>{}).then(()=>store.writeDraft(value));writeQueue=write;return write;}
  async function persist(){
    if(!ready||loading||pendingDraft)return false;
    clearTimeout(timer);const capturedRevision=revision;
    try{await queueWrite(snapshot());savedRevision=Math.max(savedRevision,capturedRevision);
      if(capturedRevision===revision)status('ร่างบันทึกในเบราว์เซอร์นี้แล้ว · กด “บันทึกไฟล์” เพื่อเก็บสำเนาในเครื่อง');return true;
    }catch(error){status('เก็บร่างไม่สำเร็จ: '+error.message+' · ใช้ “บันทึกไฟล์” เพื่อป้องกันงานหาย',true);return false;}
  }
  function changed(){
    if(!ready||loading)return;
    revision++;if(pendingDraft)return;
    status('มีการแก้ไข · กำลังรอบันทึกร่าง…');clearTimeout(timer);timer=setTimeout(persist,1200);
  }
  async function run(action,{detailed=false}={}){
    if(busy||!ready)return detailed?{ok:false,code:busy?'busy':'not-ready',message:busy?'กำลังทำรายการอื่นอยู่ กรุณารอให้เสร็จแล้วลองอีกครั้ง':'ระบบโปรเจกต์ยังโหลดไม่เสร็จ กรุณารอสักครู่แล้วลองอีกครั้ง'}:undefined;
    busy=true;refresh();
    try{const result=await action();return detailed?{ok:result===true,code:result===true?'success':'cancelled',message:result===true?'ทำรายการสำเร็จ':'ยกเลิกการยืนยันแล้ว ยังไม่ได้เปลี่ยนแบบ'}:result;}
    catch(error){const message='ทำรายการไม่สำเร็จ: '+error.message+' · แบบปัจจุบันยังอยู่';status(message,true);return detailed?{ok:false,code:error.code||'error',message}:false;}
    finally{busy=false;refresh();if(!pendingDraft&&!entry.open)releaseEntry();}
  }
  function apply(value){
    store.validate(value);loading=true;
    try{bridge.restore(value.variants[value.active]);project=value;revision++;refresh();}
    finally{loading=false;}
  }
  function download(text,name){
    const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');
    link.href=url;link.download=name.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_')+'.ypbooth.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  async function saveFile(){
    const captured=snapshot(),capturedRevision=revision;status('กำลังรวมแบบ A/B และไฟล์ประกอบ…');
    const text=await store.toText(captured);download(text,captured.name);
    if(capturedRevision===revision)savedRevision=revision;
    status('ส่งไฟล์ '+captured.name+'.ypbooth.json ให้เบราว์เซอร์ดาวน์โหลดแล้ว'+(capturedRevision!==revision?' · มีการแก้ไขเพิ่ม กรุณาบันทึกอีกครั้ง':''));
  }
  $('projectSave').onclick=()=>run(saveFile);
  $('projectOpen').onclick=()=>$('projectFile').click();
  $('projectWizard').onclick=()=>{if(!ready||busy)return;if(pendingDraft){status('กรุณาเลือกเปิดร่างเดิมหรือเริ่มใหม่ก่อนเปิด Wizard',true);return;}window.YPQuickSetupBridge.open();};
  $('projectFile').onchange=()=>run(async()=>{
    const file=$('projectFile').files[0];$('projectFile').value='';if(!file)return;
    if(file.size>store.MAX_BYTES)throw new Error('ไฟล์เกิน 150 MB');
    const incoming=store.isolateAssets(store.fromText(await file.text()));
    if(!await ask('เปิดโปรเจกต์ “'+incoming.name+'”?','แบบ A/B ปัจจุบันจะถูกแทนที่ หากต้องการเก็บไว้ให้ยกเลิกและกด “บันทึกไฟล์” ก่อน','เปิดโปรเจกต์'))return;
    apply(incoming);pendingDraft=null;recovery.hidden=true;await persist();
  });
  for(const slot of ['A','B'])$('project'+slot).onclick=()=>run(async()=>{
    if(pendingDraft||project.active===slot)return;
    snapshot();const next=store.clone(project);next.active=slot;
    // Selecting an unused slot starts an independent default design, not a copy.
    if(!next.variants[slot])next.variants[slot]=bridge.initialSnapshot();
    apply(next);await persist();
  });
  $('projectName').oninput=event=>{if(project){project.name=event.target.value.trim().slice(0,80)||'บูธของฉัน';changed();}};
  async function recoverDraft(){
    if(!pendingDraft)return true;
    if(revision>0&&!await ask('เปิดร่างเดิม?','การแก้ไขที่ทำหลังเปิดหน้านี้จะถูกแทนที่ สามารถยกเลิกแล้วบันทึกไฟล์ปัจจุบันก่อนได้','เปิดร่างเดิม'))return;
    apply(store.isolateAssets(store.clone(pendingDraft)));pendingDraft=null;recovery.hidden=true;await persist();finishEntry();return true;
  }
  async function startNewDraft(){
    if(!pendingDraft)return true;
    if(!await ask('เริ่มงานใหม่จากค่าเริ่มต้น?','ร่างอัตโนมัติเดิมทั้งแบบ A/B จะถูกแทนที่ หากต้องการเก็บไว้ ให้ยกเลิกแล้วเปิดร่างเดิมเพื่อบันทึกไฟล์ก่อน ไฟล์ที่ดาวน์โหลดและคลังอุปกรณ์ส่วนตัวจะไม่ถูกลบ','เริ่มใหม่'))return false;
    loading=true;
    try{bridge.reset();project=store.create(bridge.capture());}finally{loading=false;}
    pendingDraft=null;revision++;await persist();finishEntry();return true;
  }
  $('projectRecover').onclick=()=>run(recoverDraft);
  $('projectReset').onclick=()=>run(async()=>{
    const message=pendingDraft
      ?'ร่างอัตโนมัติเดิมทั้งโปรเจกต์จะถูกแทนที่ด้วยค่าเริ่มต้น หากต้องการเก็บร่างเดิม ให้ยกเลิกแล้วเปิดร่างเดิมและบันทึกไฟล์ก่อน'
      :'ขนาด รูปแบบบูธ วัสดุ สี โลโก้ แสง อุปกรณ์ และมุมกล้องในแบบ '+project.active+' จะกลับเป็นค่าเริ่มต้นทั้งหมด โดยไม่เปลี่ยนอีกแบบ A/B';
    if(!await ask('เริ่มแบบใหม่เป็นค่าเริ่มต้น?',message+' ไฟล์ที่ดาวน์โหลดและคลังอุปกรณ์ส่วนตัวจะไม่ถูกลบ','เริ่มใหม่'))return false;
    clearTimeout(timer);
    loading=true;
    try{bridge.reset();}finally{loading=false;}
    pendingDraft=null;revision++;snapshot();await persist();return true;
  });
  function setLevel(value){
    advanced=value;document.body.dataset.editorLevel=value?'advanced':'basic';
    $('editorLevelToggle').setAttribute('aria-pressed',String(value));$('editorLevelToggle').textContent='เครื่องมือขั้นสูง: '+(value?'เปิด':'ปิด');
    if(!value)bridge.basicMode();
    try{localStorage.setItem('yp-editor-level',value?'advanced':'basic');}catch{/* Preferences are optional. */}
  }
  $('editorLevelToggle').onclick=()=>setLevel(!advanced);
  // Preserve IDs and existing handlers; change only user-facing names.
  const labels={btnMoveSmart:'✥ ย้าย',btnResizeObject:'↗ เปลี่ยนขนาด',btnOpenAssetSettings:'ขนาดและพื้นผิว',btnUndoObject:'↶ ย้อนกลับ',btnRedoObject:'↷ ทำซ้ำ'};
  for(const [id,label] of Object.entries(labels)){const button=$(id);if(button){button.textContent=label;button.setAttribute('aria-label',label.replace(/^[^ก-๙]+/,''));}}
  const list=$('btnAssetList');if(list){list.lastChild.textContent=' รายการวัตถุ';list.setAttribute('aria-label','เปิดรายการวัตถุทั้งหมด');}
  const catalog=document.querySelector('.dock-tool[data-dock-page="catalog"]');if(catalog){catalog.querySelector('.dock-label').textContent='อุปกรณ์';catalog.setAttribute('aria-label','เลือกและจัดวางอุปกรณ์');catalog.title='เลือกและจัดวางอุปกรณ์';}
  const prompt=document.querySelector('.dock-tool[data-dock-page="prompt"]');if(prompt){prompt.querySelector('.dock-label').textContent='ภาพเสนอ';prompt.title='เตรียมภาพและคำสั่งสำหรับ AI';prompt.setAttribute('aria-label',prompt.title);}
  const attachment=$('assetAttachmentSection');if(attachment)attachment.querySelector('h3').textContent='จุดยึดกับพื้นผิว';
  for(const [id,text] of Object.entries({assetAttachmentDetach:'ปลดจุดยึด',assetAttachmentReattach:'ยึดกลับ',assetAttachmentChangeSurface:'เปลี่ยนพื้นผิวที่ยึด',assetAttachmentChangeAnchor:'เปลี่ยนจุดยึด'}))if($(id))$(id).textContent=text;
  try{setLevel(localStorage.getItem('yp-editor-level')==='advanced');}catch{setLevel(false);}
  window.YPProjectWorkspace={changed,
    enter:()=>{templateIntent=true;return entryReady;},
    templateLabel:()=> 'ใช้ในแบบ '+(project?.active||'A'),
    capture:()=>{
      if(!ready||busy||pendingDraft)throw new Error('กรุณารอระบบพร้อม และเลือกเปิดร่างเดิมหรือเริ่มใหม่ก่อน');
      return snapshot();
    },
    activate:slot=>run(async()=>{
      if(pendingDraft||!['A','B'].includes(slot)||!project.variants[slot])throw new Error('ยังเลือกแบบนี้ไม่ได้');
      if(project.active!==slot){snapshot();const next=store.clone(project);next.active=slot;apply(next);await persist();}
      return true;
    }),
    state:()=>({ready,busy,pendingDraft:!!pendingDraft,active:project?.active||'A',hasOther:!!project?.variants[project.active==='A'?'B':'A']}),
    resolveTemplateDraft:choice=>run(async()=>{
      if(choice==='recover')return recoverDraft();
      if(choice==='new'||choice==='current')return startNewDraft();
      throw new Error('กรุณาเลือกเปิดร่างเดิมหรือเริ่มใหม่');
    },{detailed:true}),
    useTemplate:({makeSnapshot,name,detailed=false})=>run(async()=>{
      if(pendingDraft)throw Object.assign(new Error('กรุณาเลือกเปิดร่างเดิมหรือเริ่มใหม่ในหน้าต่างเริ่มต้น'),{code:'pending-draft'});
      const target=project.active,other=target==='A'?'B':'A';
      const replacement=makeSnapshot();store.validateSpec(replacement.spec);const dimensions=replacement.spec;
      if(!await ask('แทนที่แบบ '+target+' ด้วยเทมเพลตนี้?', 'แบบ '+target+' ปัจจุบันจะถูกแทนที่ด้วย '+name+' ขนาดกว้าง '+dimensions.W+' × ลึก '+dimensions.D+' × สูง '+dimensions.H+' ม. โดยแบบ '+other+' ไม่เปลี่ยน หากต้องการเก็บแบบเดิม ให้ยกเลิกแล้วบันทึกไฟล์ก่อน','ยืนยันใช้ในแบบ '+target))return false;
      snapshot();const next=store.clone(project);
      next.active=target;next.variants[target]=replacement;apply(next);await persist();return true;
    },{detailed}),
    useStarter:({makeSnapshot,newVariant=true,purposeName='',removedCount=0})=>run(async()=>{
      if(pendingDraft)throw new Error('กรุณาเลือกเปิดร่างเดิมหรือเริ่มใหม่ก่อนเลือกผังตั้งต้น');
      const active=project.active,target=newVariant?(active==='A'?'B':'A'):active;
      if(newVariant&&project.variants[target]){
        if(!await ask('สร้างผังในแบบ '+target+' แทนแบบเดิม?', 'แบบ '+target+' เดิมจะถูกแทนที่ด้วยผัง '+purposeName+' โดยเก็บแบบ '+active+' ปัจจุบันไว้ หากต้องการเก็บทั้งสองแบบเดิม ให้ยกเลิกแล้วบันทึกไฟล์ก่อน','แทนที่แบบ '+target))return false;
      }else if(!newVariant&&removedCount){
        if(!await ask('จัดผังใหม่ในแบบ '+active+'?', 'อุปกรณ์ที่ย้ายได้ '+removedCount+' ชิ้นจะถูกแทนที่ด้วยผัง '+purposeName+' โครงสร้าง วัตถุที่ล็อก และวัตถุที่มีจุดยึดยังคงเดิม','ใช้ผังในแบบ '+active))return false;
      }
      const replacement=makeSnapshot();snapshot();const next=store.clone(project);
      next.active=target;next.variants[target]=replacement;apply(next);await persist();return true;
    })
  };
  window.addEventListener('beforeunload',event=>{if(ready&&revision>savedRevision){event.preventDefault();event.returnValue='';}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persist();});
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&!dialog.open&&!entry.open){event.preventDefault();run(saveFile);}});
  await bridge.ready;
  project=store.create(bridge.capture());refresh();
  try{
    const draft=await store.readDraft();
    if(draft){store.validate(draft);pendingDraft=draft;recovery.hidden=false;$('projectRecoveryText').textContent='พบร่าง “'+draft.name+'” · '+new Date(draft.updatedAt).toLocaleString('th-TH');
      window.YPQuickSetupBridge.close();status('เลือกเปิดร่างเดิมหรือเริ่มใหม่ · ยังไม่เขียนทับร่างเดิม');}
    else status('บันทึกไฟล์ลงเครื่องได้ · ร่างอัตโนมัติเก็บเฉพาะเบราว์เซอร์นี้ ไม่ใช่บนบัญชีออนไลน์');
  }catch(error){status('เปิดที่เก็บร่างไม่ได้: '+error.message+' · ยังใช้บันทึก/เปิดไฟล์ได้',true);}
  ready=true;refresh();
  if(pendingDraft){
    $('projectEntryTitle').textContent='พบงานที่บันทึกไว้';
    $('projectEntryText').textContent=$('projectRecoveryText').textContent+' — ต้องการทำงานต่อ หรือเริ่มงานใหม่? ยังไม่เขียนทับร่างเดิม';
    $('projectEntryActions').hidden=false;$('projectEntryRecover').focus();
  }else finishEntry();
})();
