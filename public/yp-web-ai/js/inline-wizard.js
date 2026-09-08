(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
  const library=window.YPInlineTemplates,host=document.getElementById('quickInlineTemplates');
  const fields=['primary','brandTouched','floor','carpet','tile','raise','addStorage'];
  host.innerHTML='<div class="quick-template-heading"><h3 id="quickTemplatesTitle">เริ่มจากแบบไหนดี?</h3><span>Inline · กว้าง 6 × ลึก 3 ม.</span></div><p class="quick-template-help">ออกแบบเอง หรือเลือกตัวอย่างแล้วปรับสี พื้น และห้องในขั้นถัดไป · ใช้โลโก้ YP ตั้งต้น เปลี่ยนภายหลังได้</p><div id="quickTemplateChoices" class="quick-template-choices" role="radiogroup" aria-labelledby="quickTemplatesTitle"></div><figure id="quickTemplatePreview" class="quick-template-preview" hidden><img id="quickTemplateImage" alt=""><figcaption><strong id="quickTemplateName"></strong><p id="quickTemplateDescription"></p></figcaption></figure><p id="quickTemplateStatus" class="quick-template-help" role="status" aria-live="polite"></p>';
  const choices=document.getElementById('quickTemplateChoices');
  function reset(draft){
    if(draft.templateBefore)Object.assign(draft,draft.templateBefore);
    delete draft.templateBefore;draft.templateId=null;
  }
  function select(id){
    const draft=quickSetupDraft;if(!draft||draft.boothType!=='inline'||draft.templateId===id)return;
    if(!id)reset(draft);
    else{
      const t=library.templates.find(t=>t.id===id);if(!t)return;
      if(!draft.templateBefore)draft.templateBefore=Object.fromEntries(fields.map(k=>[k,draft[k]]));
      Object.assign(draft,{templateId:id,primary:t.primary.toUpperCase(),brandTouched:true,floor:t.floor,carpet:t.carpet||'cream',tile:t.tile||'woodL',raise:0,addStorage:!!t.storage});
    }
    document.getElementById('quickRoomError').textContent='';updateQuickLayoutStep();
  }
  const manual=createQuickChoice({value:'manual',label:'ออกแบบเอง',detail:'ไม่ใช้เทมเพลต',selected:true,onSelect:()=>select(null)});
  manual.classList.add('quick-template-card','quick-template-manual');choices.append(manual);
  for(const t of library.templates){
    const button=createQuickChoice({value:t.id,label:t.name.replace(/^\d+ · /,''),detail:t.tagline,onSelect:()=>select(t.id)});button.classList.add('quick-template-card');
    const img=document.createElement('img');img.src='assets/inline-templates/'+t.id+'.png';img.alt='';img.width=320;img.height=240;button.prepend(img);choices.append(button);
  }
  bindQuickRadioKeys(choices);
  function update(draft){
    if(!draft)return;host.hidden=draft.boothType!=='inline';
    if(host.hidden&&draft.templateId)reset(draft);
    const selected=draft.templateId||'manual';
    choices.querySelectorAll('[role=radio]').forEach(b=>{const on=b.dataset.value===selected;b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1;});
    const t=library.templates.find(t=>t.id===draft.templateId),preview=document.getElementById('quickTemplatePreview');preview.hidden=!t;
    if(t){const img=document.getElementById('quickTemplateImage');img.src='assets/inline-templates/'+t.id+'.png';img.alt='ภาพตัวอย่าง '+t.name;document.getElementById('quickTemplateName').textContent=t.name;document.getElementById('quickTemplateDescription').textContent=t.description;}
    document.getElementById('quickTemplateStatus').textContent=t?'เลือก '+t.name+' แล้ว · ยังไม่เปลี่ยนงานจริงจนกดสร้างบูธ':'ไม่ใช้เทมเพลต · เลือกผังอุปกรณ์เพิ่มเติมหลังจบ Wizard ได้';
  }
  async function complete(draft,initialWizard){
    const t=library.templates.find(t=>t.id===draft.templateId);if(!t||draft.boothType!=='inline')throw new Error('กรุณาเลือกเทมเพลต Inline อีกครั้ง');
    return YPProjectWorkspace.useTemplate({initialWizard,name:t.name,makeSnapshot:()=>{
      const result=YPInlineTemplateBridge.snapshot(t.id,{primary:draft.primary}),s=result.spec;
      Object.assign(s,{cat:draft.businessCategoryId,customBusinessCategory:draft.businessCategoryId==='other'?String(draft.customBusinessCategory||'').trim():'',primary:draft.primary,colTouched:true,
        floor:draft.floor,carpet:draft.carpet,tile:draft.tile,raise:Number(draft.raise)||0,stSize:draft.addStorage?'a':'none'});
      if(draft.addStorage){s.stW=1.2;s.stD=1.2;s.stHmode=2.4;s.stHv=2.4;s.stPos='right';s.stDoor='left';s.doorTouched=true;}
      YPProjectStore.validateSpec(s);return result;
    }});
  }
  window.YPInlineWizard={update,complete};
  update(quickSetupDraft);
})();
