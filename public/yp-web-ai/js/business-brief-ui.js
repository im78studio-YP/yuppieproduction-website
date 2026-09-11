(function(global){
 'use strict';
 if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
 const api=global.YPBusinessBrief,controls={editor:new Map(),wizard:new Map()};
 function form(mode){
  const section=document.createElement('section');section.className='business-brief-form sec';section.id=mode==='editor'?'businessBriefFields':'quickBusinessBriefFields';
  const title=document.createElement('h3');title.textContent='เล่าโจทย์ธุรกิจเพิ่มเติม';section.append(title);
  const note=document.createElement('p');note.className='note';note.textContent='ไม่บังคับ · ช่วยให้ภาพ AI ตรงงานขึ้น ไม่ย้ายหรือเพิ่มอุปกรณ์ในแบบ 3D';section.append(note);
  for(const field of api.fields){
   const label=document.createElement('label'),input=document.createElement('input');input.id=(mode==='editor'?'businessBrief-':'quickBusinessBrief-')+field.key;
   label.htmlFor=input.id;label.textContent=field.label;input.type='text';input.maxLength=240;input.placeholder=field.placeholder;input.autocomplete='off';
   input.addEventListener('input',()=>{
    if(mode==='wizard'){if(quickSetupDraft)quickSetupDraft.businessBrief=api.normalize({...quickSetupDraft.businessBrief,[field.key]:input.value});return;}
    const state=global.YPProjectWorkspace?.state();if(state?.busy||state?.pendingDraft)return;
    S.businessBrief=api.normalize({...S.businessBrief,[field.key]:input.value});updatePromptPreview();global.YPProjectWorkspace?.changed();
   });
   input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();e.stopPropagation();input.blur();}});
   controls[mode].set(field.key,input);section.append(label,input);
  }
  return section;
 }
 document.getElementById('settingsGeneral').after(form('editor'));
 document.getElementById('quickBusinessCustomWrap').after(form('wizard'));
 const review=document.createElement('section');review.id='businessBriefReview';review.className='business-brief-review';
 review.innerHTML='<div class="business-brief-heading"><h3>โจทย์ธุรกิจที่ AI จะใช้</h3><button type="button" class="btn sm" id="businessBriefEdit">แก้ข้อมูลธุรกิจ</button></div><p id="businessBriefCategory"></p><dl id="businessBriefSummary"></dl><p class="note" id="businessBriefPermission"></p><details><summary>ดูแนวทางพื้นฐานตามหมวดธุรกิจ</summary><p id="businessBriefTheme"></p><ul id="businessBriefSuggestions"></ul></details><p class="note">โจทย์เฉพาะมีน้ำหนักเหนือคำแนะนำหมวด · คงโครงสร้างและของเดิม เติมเฉพาะสิ่งที่อนุญาตในภาพ AI ไม่เพิ่มใน 3D หรือ BOQ</p>';
 document.getElementById('promptProjectSummary').after(review);
 document.getElementById('businessBriefEdit').onclick=()=>{const button=document.querySelector('.dock-tool[data-dock-page="business"]');showDockPage('business',button);controls.editor.get('product').focus();};
 function fill(map,value){const brief=api.normalize(value);for(const [key,input] of map)if(document.activeElement!==input)input.value=brief[key];}
 function sync(payload){
  fill(controls.editor,S.businessBrief);
  const context=payload?.businessContext||api.capture(S,businessCategoryLabel(S)),options=payload?.aiEnhancementOptions||S.aiStaging||{},data=api.describe(context,options,(S.objects||[]).map(o=>objectCatalogDef(o.catalogId)?.name||o.label||''));
  document.getElementById('businessBriefCategory').textContent=context.categoryLabel||'ยังไม่เลือกหมวด';
  const dl=document.getElementById('businessBriefSummary');dl.replaceChildren();
  for(const field of api.fields){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=field.label;dd.textContent=data.brief[field.key]||'ยังไม่ได้ระบุ';dl.append(dt,dd);}
  document.getElementById('businessBriefPermission').textContent=data.enabled?'AI ใช้โจทย์นี้เฉพาะหมวดองค์ประกอบที่คุณเปิดอนุญาต ด้านล่างเป็นแนวทาง ไม่ใช่รายการที่จะเพิ่มทั้งหมด':'ปิดการเติมองค์ประกอบ AI อยู่ · ใช้โจทย์เป็นบริบทเท่านั้น ไม่เพิ่มสิ่งใหม่';
  document.getElementById('businessBriefTheme').textContent=data.theme;
  const list=document.getElementById('businessBriefSuggestions');list.replaceChildren();for(const text of data.suggestions){const li=document.createElement('li');li.textContent=text;list.append(li);}
 }
 const syncWizard=()=>fill(controls.wizard,quickSetupDraft?.businessBrief);
 const style=document.createElement('style');style.textContent='.business-brief-form h3,.business-brief-review h3{margin:0 0 8px;font-size:15px}.business-brief-form label{display:block;font-size:12px;color:var(--tx2);margin:14px 0 6px}.business-brief-form input{width:100%;min-width:0;box-sizing:border-box;padding:11px 12px;border:1px solid var(--bd,#413547);border-radius:9px;background:var(--bg,#100d14);color:var(--tx,#fff);font:inherit;font-size:13px}.business-brief-form input:focus{outline:2px solid #f72585;outline-offset:2px}.business-brief-form .note,.business-brief-review .note{font-size:12px;line-height:1.65;color:var(--tx2)}.business-brief-review{padding:16px;margin:12px 0;border:1px solid #503042;border-radius:12px;background:#19121b;overflow-wrap:anywhere}.business-brief-heading{display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center}.business-brief-review dl{margin:12px 0}.business-brief-review dt{font-size:11px;color:var(--tx3);margin-top:10px}.business-brief-review dd{margin:3px 0 0;font-size:13px;white-space:pre-wrap}.business-brief-review details{font-size:12px;line-height:1.7}.business-brief-review summary{cursor:pointer;color:#ff8fc2}.business-brief-review ul{padding-left:20px}.business-brief-review li{margin-bottom:5px}#quickBusinessBriefFields{margin:18px 0 0;padding:16px;border:1px solid var(--bd,#413547);border-radius:12px}';document.head.append(style);
 global.YPBusinessBriefUI={sync,syncWizard};sync();syncWizard();
})(globalThis);
