(function(){
  'use strict';const library=YPCornerTemplates;
  function artwork(t,sideWall=false){
    const c=document.createElement('canvas');c.width=sideWall?900:1800;c.height=720;const g=c.getContext('2d');
    g.fillStyle=t.customArtwork?t.background:t.primary;g.fillRect(0,0,c.width,c.height);
    if(t.customArtwork)return c.toDataURL('image/png');
    g.fillStyle=t.secondary;g.fillRect(0,0,c.width,18);
    if(sideWall){g.save();g.beginPath();g.rect(90,80,640,610);g.clip();g.strokeStyle=t.secondary;g.lineWidth=24;for(let i=-720;i<1000;i+=62){g.beginPath();g.moveTo(i,80);g.lineTo(i+610,690);g.stroke();}g.restore();}
    return c.toDataURL('image/png');
  }
  function panelArtwork(kind){
    const c=document.createElement('canvas');c.width=900;c.height=900;const g=c.getContext('2d');
    if(kind==='diagonal-white'){g.fillStyle='#f3f4ee';g.beginPath();g.moveTo(0,0);g.lineTo(900,0);g.lineTo(0,870);g.closePath();g.fill();}
    else if(kind==='slanted'){g.fillStyle='#e6e5de';g.fillRect(0,0,900,900);g.fillStyle='#999f9e';g.beginPath();g.moveTo(50,30);g.lineTo(850,30);g.lineTo(850,870);g.lineTo(720,870);g.closePath();g.fill();g.strokeStyle='#ffffff';g.lineWidth=18;g.stroke();}
    else if(kind==='garden'){g.fillStyle='#305426';g.fillRect(0,0,900,900);for(let i=0;i<2400;i++){const x=(i*137.53)%900,y=(i*89.37)%900;g.fillStyle=['#426b2f','#5c8137','#739849','#284923'][i%4];g.beginPath();g.ellipse(x,y,8+i%9,4+i%6,i*.7,0,Math.PI*2);g.fill();}}
    else if(kind==='beauty'){const bg=g.createLinearGradient(0,0,900,900);bg.addColorStop(0,'#f8d5e6');bg.addColorStop(1,'#b2448e');g.fillStyle=bg;g.fillRect(0,0,900,900);for(let i=0;i<32;i++){g.fillStyle='#ffffff30';g.beginPath();g.arc(i*131%900,i*211%900,12+i%29,0,Math.PI*2);g.fill();}for(let i=0;i<3;i++){g.fillStyle=['#d371ae','#bb468f','#edb6d4'][i];g.fillRect(240+i*150,400-i*45,110,310+i*45);g.fillStyle='#eadfe6';g.fillRect(269+i*150,330-i*45,52,70);}}
    else if(kind==='green-info'){g.fillStyle='#f4f7f1';g.fillRect(0,0,900,900);for(let i=0;i<3;i++){g.fillStyle='#579862';g.beginPath();g.arc(170+i*280,390,69,0,Math.PI*2);g.fill();g.fillStyle='#ffffff';g.font='bold 60px sans-serif';g.textAlign='center';g.fillText(['+','↗','@'][i],170+i*280,411);}g.fillStyle='#9db7a0';for(let i=0;i<4;i++)g.fillRect(90,590+i*60,720-i*45,12);}
    else if(kind==='green-wave'){g.fillStyle='#c4dca9';g.fillRect(0,0,900,900);for(let i=0;i<20;i++){g.strokeStyle=i%2?'#ffffff':'#84b468';g.lineWidth=3;g.beginPath();g.moveTo(0,200+i*23);g.bezierCurveTo(300,650+i*12,630,60+i*20,900,430+i*16);g.stroke();}}
    else{const colors=kind==='blue-facets'?['#0069ac','#22a5d7','#9fe4ef','#317ec0','#dcf7fa']:['#fbfbef','#e3e9de','#cfd9cc','#ffffff'];g.fillStyle=colors[0];g.fillRect(0,0,900,900);for(let row=0;row<6;row++)for(let col=0;col<6;col++){const x=col*180-80,y=row*180;g.fillStyle=colors[(row*3+col)%colors.length];g.beginPath();g.moveTo(x,y);g.lineTo(x+240,y+30);g.lineTo(x+100,y+210);g.closePath();g.fill();}}
    return c.toDataURL('image/png');
  }
  function snapshot(id,options={}){
    const t={...library.templates.find(t=>t.id===id)},out=library.build(id,JSON.parse(INITIAL_BOOTH_SPEC_JSON),OBJECT_CATALOG);
    t.objects.forEach((o,i)=>{if(o.graphic)Object.assign(out.spec.objects[i].appearance,{mode:'original',textureData:panelArtwork(o.graphic),textureName:o.graphic,textureId:id+'-'+o.graphic});});
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
  const entry=document.createElement('section');entry.id='cornerTemplateSubmenu';entry.className='starter-entry';entry.innerHTML='<h3>เทมเพลตหัวมุม 3×6 ม.</h3><p>'+library.templates.length+' แบบ · เลือกหัวมุมซ้าย–ขวาเพื่อสลับผังอัตโนมัติ</p><button type="button" class="btn pri" id="cornerTemplatesOpen">เลือกเทมเพลตหัวมุม '+library.templates.length+' แบบ</button>';
  document.getElementById('cornerSideWrap').after(entry);
  const dialog=document.createElement('dialog');dialog.id='cornerTemplatesDialog';dialog.className='project-dialog inline-template-dialog';dialog.setAttribute('aria-labelledby','cornerTemplatesTitle');
  dialog.innerHTML='<div class="starter-heading"><h2 id="cornerTemplatesTitle">หัวมุม · กว้าง 6 × ลึก 3 ม.</h2><button type="button" class="btn" id="cornerTemplatesClose" aria-label="ปิด">×</button></div><p>สัดส่วนประมาณจากภาพอ้างอิง ไม่ใช่แบบผลิต · ใช้โลโก้ YP ตั้งต้น</p><label for="cornerTemplateSide">ด้านเปิดของบูธ </label><select id="cornerTemplateSide"><option value="left">หัวมุมซ้าย — เปิดหน้า + ซ้าย</option><option value="right">หัวมุมขวา — เปิดหน้า + ขวา</option></select><p>เทมเพลตจะใช้ในแบบ A/B ที่กำลังเลือกอยู่ โดยถามยืนยันก่อนแทนที่ และไม่เปลี่ยนอีกแบบ</p><section class="template-feedback" id="cornerFeedback" hidden><p id="cornerStatus" role="status" aria-live="polite"></p><div id="cornerFeedbackActions" class="inline-template-actions"></div></section><div class="inline-template-grid" id="cornerCards"></div>';
  document.body.append(dialog);const side=dialog.querySelector('select'),feedback=document.getElementById('cornerFeedback'),status=document.getElementById('cornerStatus'),actions=document.getElementById('cornerFeedbackActions');let busy=false,opener;
  const setBusy=v=>{busy=v;dialog.setAttribute('aria-busy',String(v));for(const b of dialog.querySelectorAll('button,select'))b.disabled=v;};
  const close=()=>{if(!busy){dialog.close();opener?.focus();}};
  function feedbackResult(result){feedback.hidden=false;status.textContent=result.message;actions.replaceChildren();dialog.scrollTo({top:0,behavior:'instant'});}
  async function apply(t){if(busy)return;setBusy(true);feedbackResult({message:'กำลังเตรียมแบบ… หากมีหน้าต่างยืนยัน กรุณายืนยันหรือยกเลิก'});try{const r=await YPProjectWorkspace.useTemplate({makeSnapshot:()=>snapshot(t.id,{cornerSide:side.value}),name:t.name,detailed:true});if(r.ok){setBusy(false);close();}else feedbackResult(r);}catch(e){feedbackResult({message:'ใช้เทมเพลตไม่สำเร็จ: '+e.message});}finally{setBusy(false);}}
  for(const t of library.templates){const card=document.createElement('article');card.className='inline-template-card';const img=document.createElement('img');img.dataset.template=t.id;img.alt=t.name;img.width=960;img.height=720;const h=document.createElement('h3');h.textContent=t.name;const p=document.createElement('p');p.textContent=t.description;const wrap=document.createElement('div');wrap.className='inline-template-actions';const b=document.createElement('button');b.className='btn pri';b.type='button';b.dataset.cornerTemplate=t.id;b.textContent='ใช้แบบนี้';b.onclick=()=>apply(t);wrap.append(b);card.append(img,h,p,wrap);document.getElementById('cornerCards').append(card);}
  const updateImages=()=>{for(const img of dialog.querySelectorAll('img[data-template]'))img.src='assets/corner-templates/'+img.dataset.template+'-'+side.value+'.png';};side.onchange=updateImages;
  const open=async()=>{opener=document.activeElement;await YPProjectWorkspace.enter();side.value=getBoothSpec().cornerSide||'right';updateImages();feedback.hidden=true;actions.replaceChildren();for(const b of dialog.querySelectorAll('[data-corner-template]'))b.textContent=YPProjectWorkspace.templateLabel();dialog.showModal();};
  document.getElementById('cornerTemplatesOpen').onclick=open;document.getElementById('cornerTemplatesClose').onclick=close;dialog.oncancel=e=>{e.preventDefault();close();};document.addEventListener('keydown',e=>{if(dialog.open)e.stopPropagation();},true);
  const syncType=type=>{entry.hidden=type!=='corner';};syncType(getBoothSpec().type);window.YPCornerTemplateUI={open,syncType};
})();
