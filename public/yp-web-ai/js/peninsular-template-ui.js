(function(){
  'use strict';const library=YPPeninsularTemplates;
  function artwork(t){const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=720;const c=canvas.getContext('2d');c.fillStyle=t.background;c.fillRect(0,0,1800,720);
    if(t.id==='penin-adventure'){
      ['#8c9382','#6a746a','#454e4b'].forEach((color,k)=>{c.fillStyle=color;c.beginPath();c.moveTo(0,720);for(let i=0;i<=12;i++)c.lineTo(i*150,270+k*120+Math.sin(i*2.1+k)*90);c.lineTo(1800,720);c.fill();});
      c.fillStyle=t.primary;c.fillRect(0,0,1800,22);
    }else if(t.id==='penin-connect'){c.fillStyle='#354a50';c.fillRect(930,0,780,720);c.fillStyle=t.primary;c.fillRect(875,0,55,720);c.fillRect(1710,0,90,720);c.fillStyle='#c4d7d5';for(let y=365;y<650;y+=48)c.fillRect(70,y,620,6);}
    else if(t.id==='penin-blue-pavilion'){
      for(const [x,w] of [[390,380],[1020,690]]){c.save();c.beginPath();c.rect(x,220,w,440);c.clip();c.fillStyle='#e5f7fd';c.fillRect(x,220,w,440);
        const colors=['#36bcdf','#a7e8f4',t.primary,'#60cde9','#dcf5fc'];
        for(let row=0;row<5;row++)for(let col=0;col<7;col++){const px=x+col*115-60,py=180+row*115;c.fillStyle=colors[(row*3+col)%colors.length];c.beginPath();c.moveTo(px,py);c.lineTo(px+115,py+115);c.lineTo(px,py+115);c.closePath();c.fill();}
        c.restore();}
    }else{c.fillStyle='#c6ad82';c.fillRect(0,680,1800,40);['#aa713e','#b79447','#955451'].forEach((color,i)=>{c.fillStyle=color;c.fillRect(630+i*125,380,85,190);c.fillRect(650+i*125,345,45,40);c.fillStyle='#f5f0e3';c.fillRect(635+i*125,430,75,65);});}
    c.fillStyle=t.id==='penin-adventure'?'#ffffff':'#353a34';c.textAlign='center';c.font='24px sans-serif';c.fillText(t.graphic,t.id==='penin-adventure'?630:t.id==='penin-connect'?440:900,305);return canvas.toDataURL('image/png');}
  function snapshot(id,options={}){const t={...library.templates.find(t=>t.id===id)},result=library.build(id,JSON.parse(INITIAL_BOOTH_SPEC_JSON),OBJECT_CATALOG);
    if(/^#[\da-f]{6}$/i.test(options.primary||'')){const original=t.primary;t.primary=options.primary;result.spec.primary=t.primary;for(const o of result.spec.objects){if(o.appearance?.color===original)o.appearance.color=t.primary;if(o.structure?.color===original)o.structure.color=t.primary;}}
    result.spec.wallStickerFaces=['back'];Object.assign(result.spec.wallStickers.back,{data:artwork(t),name:t.name+' · กราฟิกตัวอย่าง',id:1,ar:2.5,w:6,h:2.4,mode:'cover'});YPProjectStore.validateSpec(result.spec);return result;}
  window.YPPeninsularTemplateBridge={snapshot};if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
  const entry=document.createElement('section');entry.id='peninsularTemplateSubmenu';entry.className='starter-entry';entry.innerHTML='<h3>เทมเพลต Peninsular 3×6 ม.</h3><p>'+library.templates.length+' แบบตามภาพอ้างอิง · เปิดหน้า ซ้าย และขวา</p><button type="button" class="btn pri" id="peninsularTemplatesOpen">เลือกเทมเพลต '+library.templates.length+' แบบ</button>';
  document.getElementById('oType').after(entry);
  const dialog=document.createElement('dialog');dialog.className='project-dialog inline-template-dialog';dialog.setAttribute('aria-labelledby','peninsularTemplatesTitle');
  dialog.innerHTML='<div class="starter-heading"><h2 id="peninsularTemplatesTitle">Peninsular · กว้าง 6 × ลึก 3 ม.</h2><button type="button" class="btn" id="peninsularTemplatesClose" aria-label="ปิด">×</button></div><p>ใช้โลโก้ YP ตั้งต้น · สัดส่วนรายชิ้นประมาณจากภาพอ้างอิง ไม่ใช่แบบผลิต</p><p>เลือกใช้ใน A/B อีกช่องเพื่อเก็บแบบปัจจุบันไว้ ระบบจะถามก่อนแทนที่งานที่มีอยู่หรือเปลี่ยนขนาด</p><section class="template-feedback" id="peninsularFeedback" hidden><p id="peninsularTemplateStatus" role="status" aria-live="polite" aria-atomic="true"></p><div class="inline-template-actions" id="peninsularFeedbackActions"></div></section><div class="inline-template-grid" id="peninsularCards"></div>';
  document.body.append(dialog);
  const grid=document.getElementById('peninsularCards'),feedback=document.getElementById('peninsularFeedback'),status=document.getElementById('peninsularTemplateStatus'),feedbackActions=document.getElementById('peninsularFeedbackActions');
  let opener,working=false,lastChoice=null;
  const close=()=>{dialog.close();opener?.focus();};
  function setWorking(value){working=value;dialog.setAttribute('aria-busy',String(value));for(const button of dialog.querySelectorAll('[data-penin-template],#peninsularFeedbackActions button'))button.disabled=value;}
  function clearFeedback(){feedback.hidden=true;status.textContent='';feedbackActions.replaceChildren();}
  function action(label,handler,id){const button=document.createElement('button');button.type='button';button.className='btn';button.textContent=label;button.id=id;button.onclick=handler;button.disabled=working;feedbackActions.append(button);}
  function showFeedback(result){
    feedback.hidden=false;feedback.dataset.code=result.code;status.textContent=result.message;feedbackActions.replaceChildren();
    if(result.code==='pending-draft'||window.YPProjectWorkspace?.state().pendingDraft){
      action('เปิดร่างเดิม',()=>resolveDraft('recover'),'peninsularRecoverDraft');
      action('ใช้แบบปัจจุบัน',()=>resolveDraft('current'),'peninsularKeepCurrent');
    }else if(result.code!=='working'){
      action(lastChoice?'ลองใช้แบบนี้อีกครั้ง':'ตรวจความพร้อมอีกครั้ง',()=>lastChoice?applyTemplate(lastChoice):checkReadiness(),'peninsularRetry');
    }
    if(dialog.open)dialog.scrollTo({top:0,behavior:'instant'});
  }
  function checkReadiness(){
    clearFeedback();const state=window.YPProjectWorkspace?.state();
    if(working)return showFeedback({code:'working',message:'กำลังดำเนินการ กรุณารอสักครู่'});
    if(!state?.ready)return showFeedback({code:'not-ready',message:'ระบบโปรเจกต์ยังโหลดไม่เสร็จ กรุณารอสักครู่แล้วตรวจอีกครั้ง'});
    if(state.busy)return showFeedback({code:'busy',message:'กำลังทำรายการอื่นอยู่ กรุณารอให้เสร็จแล้วตรวจอีกครั้ง'});
    if(state.pendingDraft)return showFeedback({code:'pending-draft',message:'พบร่างที่บันทึกไว้ เลือกเปิดร่างเดิมหรือใช้แบบปัจจุบันก่อนใช้เทมเพลต — ยังไม่เขียนทับร่างเดิม'});
  }
  async function resolveDraft(choice){
    if(working)return;setWorking(true);
    try{
      const result=await YPProjectWorkspace.resolveTemplateDraft(choice);
      if(result.ok)showFeedback({code:'ready',message:(choice==='recover'?'เปิดร่างเดิมแล้ว':'เลือกใช้แบบปัจจุบันแล้ว')+' — เลือกเทมเพลตที่ต้องการได้เลย'});
      else showFeedback(result);
    }catch(error){showFeedback({code:'error',message:'ทำรายการไม่สำเร็จ: '+error.message});}
    finally{setWorking(false);}
  }
  async function applyTemplate(t){
    if(working)return;lastChoice=t;clearFeedback();setWorking(true);
    showFeedback({code:'working',message:'กำลังเตรียม '+t.name+' หากมีหน้าต่างยืนยัน กรุณาเลือกยืนยันหรือยกเลิก'});
    try{
      const workspace=window.YPProjectWorkspace;
      const result=workspace?await workspace.useTemplate({makeSnapshot:()=>snapshot(t.id),name:t.name,detailed:true}):{ok:false,code:'not-ready',message:'ระบบโปรเจกต์ยังโหลดไม่เสร็จ กรุณารอสักครู่แล้วลองอีกครั้ง'};
      if(result.ok){clearFeedback();close();}else showFeedback(result);
    }catch(error){showFeedback({code:'error',message:'ใช้เทมเพลตไม่สำเร็จ: '+error.message});}
    finally{setWorking(false);}
  }
  for(const t of library.templates){
    const card=document.createElement('article');card.className='inline-template-card';
    const img=document.createElement('img');img.src='assets/peninsular-templates/'+t.id+'.png';img.alt=t.name;img.width=960;img.height=720;
    const h=document.createElement('h3');h.textContent=t.name;const desc=document.createElement('p');desc.textContent=t.description;
    const actions=document.createElement('div');actions.className='inline-template-actions';
    const button=document.createElement('button');button.type='button';button.className='btn pri';button.textContent='ใช้แบบนี้';button.dataset.peninTemplate=t.id;button.onclick=()=>applyTemplate(t);
    actions.append(button);card.append(img,h,desc,actions);grid.append(card);
  }
  const open=()=>{opener=document.activeElement;lastChoice=null;clearFeedback();if(!dialog.open)dialog.showModal();checkReadiness();};
  document.getElementById('peninsularTemplatesOpen').onclick=open;document.getElementById('peninsularTemplatesClose').onclick=close;
  dialog.oncancel=e=>{e.preventDefault();close();};document.addEventListener('keydown',e=>{if(dialog.open)e.stopPropagation();},true);
  const syncType=type=>{entry.hidden=type!=='penin';};syncType(getBoothSpec().type);window.YPPeninsularTemplateUI={open,syncType};
})();
