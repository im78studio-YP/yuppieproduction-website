(function(){
  'use strict';
  const library=window.YPInlineTemplates;
  // Embedded artwork is portable and also works when opening the editor via file://.
  function artwork(t){
    const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=720;
    const c=canvas.getContext('2d');c.fillStyle=t.background;c.fillRect(0,0,1800,720);
    c.fillStyle=t.primary;
    if(t.id==='gallery'){c.fillRect(0,0,220,720);c.fillRect(1580,0,220,720);c.fillStyle=t.secondary;c.fillRect(270,340,1260,12);}
    if(t.id==='tasting'){for(let x=0;x<1800;x+=90)c.fillRect(x,0,42,62);c.fillStyle=t.secondary;c.beginPath();c.arc(1400,500,320,0,Math.PI*2);c.fill();}
    if(t.id==='meeting'){c.fillRect(0,510,1800,210);c.fillStyle=t.secondary;for(let x=70;x<1750;x+=55)c.fillRect(x,520,8,200);}
    if(t.id==='technology'){c.strokeStyle=t.secondary;c.lineWidth=4;for(let x=60;x<1800;x+=100){c.beginPath();c.moveTo(x,0);c.lineTo(x+250,720);c.stroke();}c.fillStyle=t.background;c.fillRect(230,100,1050,460);c.strokeRect(230,100,1050,460);c.fillStyle='#74d8cf';c.font='bold 34px sans-serif';c.fillText('LIVE PRESENTATION',310,450);}
    if(t.id==='retail'){c.fillRect(0,0,1800,65);c.fillRect(1330,0,470,720);c.fillStyle=t.secondary;for(let x=80;x<1300;x+=400)c.fillRect(x,520,300,8);}
    c.fillStyle=t.ink;c.font='500 24px sans-serif';c.textAlign='center';c.fillText(t.graphic,t.storage?660:900,t.id==='technology'?48:300);c.globalAlpha=.6;c.font='18px sans-serif';c.fillText('SAMPLE BRAND  /  INLINE 6 × 3 M',t.storage?660:900,675);
    return canvas.toDataURL('image/png');
  }
  function snapshot(id,options={}){
    const result=library.build(id,JSON.parse(INITIAL_BOOTH_SPEC_JSON),OBJECT_CATALOG),original=library.templates.find(v=>v.id===id),t={...original};
    if(/^#[0-9a-f]{6}$/i.test(options.primary||'')){
      t.primary=options.primary;result.spec.primary=options.primary;if(!result.spec.logo)result.spec.logoColor=options.primary;
      for(const o of result.spec.objects)if(o.appearance?.color?.toLowerCase()===original.primary.toLowerCase())o.appearance.color=options.primary;
    }
    result.spec.wallStickerFaces=['back'];Object.assign(result.spec.wallStickers.back,{data:artwork(t),name:t.name+' • ตัวอย่างกราฟิก',id:1,ar:2.5,w:6,h:2.4,mode:'cover'});
    YPProjectStore.validateSpec(result.spec);return result;
  }
  window.YPInlineTemplateBridge={snapshot};
  if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
  const entry=document.createElement('section');entry.className='starter-entry';
  entry.innerHTML='<h3>ตัวอย่างบูธ Inline 3×6 ม.</h3><p>5 ผังพร้อมวัสดุและกราฟิกตัวอย่าง แก้ไขทุกชิ้นต่อได้</p><button class="btn pri" id="inlineTemplatesOpen" type="button">เลือกเทมเพลต 5 แบบ</button><small>หน้ากว้าง 6 ม. × ลึก 3 ม. · เปิดด้านหน้า</small>';
  entry.id='inlineTemplateSubmenu';document.getElementById('oType').after(entry);
  const dialog=document.createElement('dialog');dialog.className='project-dialog inline-template-dialog';dialog.setAttribute('aria-labelledby','inlineTemplatesTitle');
  dialog.innerHTML='<div class="starter-heading"><h2 id="inlineTemplatesTitle">Inline · 6 × 3 ม. / 18 ตร.ม.</h2><button class="btn" id="inlineTemplatesClose" type="button" aria-label="ปิดเทมเพลต">×</button></div><p>เลือกแบบตั้งต้นใหม่ทั้งชุด: ขนาด ผัง สี และแบรนด์สมมติ ไม่ใช่การจัดอุปกรณ์ทับงานเดิม</p><p id="inlineTemplateDestination"></p><div class="inline-template-grid"></div><p>แบบแนวคิดเบื้องต้น ไม่ใช่แบบผลิตหรือใบเสนอราคา ต้องตรวจระยะใช้งาน โครงสร้าง และกฎผู้จัดงานก่อนผลิต กราฟิกผนังเป็นภาพตัวอย่าง เปลี่ยนได้ในเมนูผนัง/สติ๊กเกอร์</p><p id="inlineTemplateStatus" role="status" aria-live="polite"></p>';
  document.body.append(dialog);
  const grid=dialog.querySelector('.inline-template-grid');let opener;
  function close(){dialog.close();opener?.focus();}
  library.templates.forEach(t=>{
    const card=document.createElement('article');card.className='inline-template-card';
    const img=document.createElement('img');img.src='assets/inline-templates/'+t.id+'.png';img.alt='ภาพโมเดลจริง '+t.name;img.width=960;img.height=720;img.loading='lazy';
    img.onerror=()=>{img.hidden=true;};
    const title=document.createElement('h3');title.textContent=t.name;
    const tag=document.createElement('strong');tag.textContent=t.tagline;
    const description=document.createElement('p');description.textContent=t.description;
    const apply=document.createElement('button');apply.className='btn pri';apply.type='button';apply.textContent='ใช้แบบนี้';apply.dataset.template=t.id;
    apply.onclick=async()=>{
      for(const b of grid.querySelectorAll('button'))b.disabled=true;
      try{const ok=await YPProjectWorkspace.useTemplate({makeSnapshot:()=>snapshot(t.id),name:t.name});if(ok)close();else document.getElementById('inlineTemplateStatus').textContent='ยังไม่เปลี่ยนแบบ การยืนยันถูกยกเลิกหรือระบบยังไม่พร้อม กรุณาลองอีกครั้ง';}
      catch(error){document.getElementById('inlineTemplateStatus').textContent=error.message;}
      finally{for(const b of grid.querySelectorAll('button'))b.disabled=false;}
    };
    const actions=document.createElement('div');actions.className='inline-template-actions';actions.append(apply);card.append(img,title,tag,description,actions);grid.append(card);
  });
  async function open(){opener=document.activeElement;await YPProjectWorkspace.enter();const state=YPProjectWorkspace.state();document.getElementById('inlineTemplateDestination').textContent='จะใช้ในแบบ '+state.active+' ที่กำลังเลือกอยู่ โดยถามยืนยันก่อนแทนที่ และไม่เปลี่ยนอีกแบบ';for(const b of grid.querySelectorAll('button[data-template]'))b.textContent=YPProjectWorkspace.templateLabel();document.getElementById('inlineTemplateStatus').textContent='';dialog.showModal();}
  document.getElementById('inlineTemplatesOpen').onclick=open;document.getElementById('inlineTemplatesClose').onclick=close;
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  document.addEventListener('keydown',e=>{if(dialog.open)e.stopPropagation();},true);
  function syncType(type){entry.hidden=type!=='inline';}
  syncType(window.getBoothSpec().type);
  window.YPInlineTemplateUI={open,syncType};
})();
