(async function(){
  'use strict';
  const url=new URL(location.href),id=url.searchParams.get('useTemplate');
  if(!id||url.searchParams.get('comparePreview')==='1')return;
  const cornerSide=url.searchParams.get('cornerSide')==='left'?'left':'right';
  const groups=[{library:window.YPInlineTemplates,bridge:window.YPInlineTemplateBridge,folder:'inline-templates'},{library:window.YPPeninsularTemplates,bridge:window.YPPeninsularTemplateBridge,folder:'peninsular-templates'},{library:window.YPCornerTemplates,bridge:window.YPCornerTemplateBridge,folder:'corner-templates'},{library:window.YPIslandTemplates,bridge:window.YPIslandTemplateBridge,folder:'island-templates'}];
  const group=groups.find(g=>g.library?.templates.some(t=>t.id===id)),template=group?.library.templates.find(t=>t.id===id);
  // Consume the navigation request once: refresh must not reapply the template.
  url.searchParams.delete('useTemplate');url.searchParams.delete('cornerSide');try{history.replaceState(null,'',url.href);}catch{/* file:// may restrict history changes. */}
  const dialog=document.createElement('dialog');dialog.className='project-dialog';dialog.id='templateEntryDialog';dialog.setAttribute('aria-labelledby','templateEntryTitle');
  dialog.innerHTML='<h2 id="templateEntryTitle"></h2><img id="templateEntryImage" alt="" style="width:100%;border-radius:8px" hidden><p id="templateEntryStatus" role="status" aria-live="polite" aria-atomic="true"></p><div class="project-dialog-actions" id="templateEntryActions"></div><div class="project-dialog-actions" style="margin-top:12px"><button type="button" class="btn" id="templateEntryClose">ปิด / ยังไม่ใช้แบบนี้</button></div>';
  document.body.append(dialog);
  const title=dialog.querySelector('h2'),status=document.getElementById('templateEntryStatus'),actions=document.getElementById('templateEntryActions'),close=document.getElementById('templateEntryClose');let busy=false,attempted=false;
  title.textContent=template?template.name:'ไม่พบเทมเพลตนี้';
  if(template){const img=document.getElementById('templateEntryImage');img.src='assets/'+group.folder+'/'+template.id+(group.folder==='corner-templates'?'-'+cornerSide:'')+'.png';img.alt=template.name;img.hidden=false;}
  function setBusy(value){busy=value;dialog.setAttribute('aria-busy',String(value));for(const b of dialog.querySelectorAll('button'))b.disabled=value;}
  function button(label,handler,key){const b=document.createElement('button');b.className='btn pri';b.type='button';b.textContent=label;b.id=key;b.disabled=busy;b.onclick=handler;actions.append(b);}
  function feedback(message){status.textContent=message;actions.replaceChildren();
    if(!template)return;
    button(YPProjectWorkspace.templateLabel({initialWizard:true}),apply,'templateEntryApply');
  }
  async function apply(){
    if(busy||!template||!dialog.open)return;attempted=true;setBusy(true);status.textContent='กำลังเตรียมแบบที่เลือก…';actions.replaceChildren();
    try{
      const workspace=window.YPProjectWorkspace;
      if(!workspace?.state().ready){feedback('ระบบโปรเจกต์ยังโหลดไม่เสร็จ รอสักครู่แล้วกด “ใช้แบบนี้” อีกครั้ง');return;}
      const result=await workspace.useTemplate({makeSnapshot:()=>group.bridge.snapshot(id,{cornerSide}),name:template.name,initialWizard:true,detailed:true});
      if(result.ok){window.YPQuickSetupBridge.close();dialog.close();document.getElementById('projectName')?.focus();}
      else feedback(result.message);
    }catch(error){feedback('ใช้เทมเพลตไม่สำเร็จ: '+error.message);}finally{setBusy(false);}
  }
  close.onclick=()=>{if(!busy)dialog.close();};dialog.oncancel=e=>{if(busy)e.preventDefault();};
  document.addEventListener('keydown',e=>{if(dialog.open)e.stopPropagation();},true);
  await YPProjectWorkspace.enter();
  window.YPQuickSetupBridge.close();
  dialog.showModal();feedback(template?'กำลังเตรียมตัวออกแบบ…':'ลิงก์นี้ไม่ตรงกับเทมเพลตที่มีอยู่ กรุณากลับไปเลือกจากหน้ารวมเทมเพลต');
  if(!template)return;
  if(dialog.open&&!attempted)await apply();
})();
