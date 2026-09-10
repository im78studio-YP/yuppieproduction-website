(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
  const $=id=>document.getElementById(id),core=window.YPCompare;
  const openButton=document.createElement('button');openButton.id='projectCompare';openButton.type='button';openButton.className='btn';openButton.textContent='เปรียบเทียบ A/B';$('projectSave').before(openButton);
  const dialog=document.createElement('dialog');dialog.className='project-dialog compare-dialog';dialog.setAttribute('aria-labelledby','compareTitle');
  dialog.innerHTML='<div class="compare-heading"><h2 id="compareTitle">เปรียบเทียบแบบ A/B</h2><button class="btn" id="compareClose" type="button">กลับไปออกแบบ</button></div><p>มุมมองเดียวกันและสเกลภาพเท่ากัน · เลือกแบบไปเตรียมส่งงานได้โดยเก็บอีกแบบไว้</p><div id="compareCards" class="compare-cards"></div><p id="compareStatus" role="status" aria-live="polite"></p><button class="btn" id="compareRetry" type="button">สร้างภาพทั้งคู่ใหม่</button><h3>สรุปความต่าง</h3><div class="compare-table-wrap"><table><thead><tr><th scope="col">รายการ</th><th scope="col">แบบ A</th><th scope="col">แบบ B</th></tr></thead><tbody id="compareRows"></tbody></table></div><p class="compare-note">เน้นแถวที่ต่างกัน จำนวนอุปกรณ์นับตามวัตถุในแบบ (ชุดเฟอร์นิเจอร์นับเป็น 1 วัตถุ) ไม่ใช่ BOM หรือใบเสนอราคา แม้จำนวนเท่ากัน ตำแหน่ง ขนาดรายชิ้น และพื้นผิวอาจต่างกัน ควรตรวจภาพประกอบด้วย</p>';
  document.body.append(dialog);
  let project=null,signature='',frame=null,pending=null,token='',generation=0,busy=false,urls=[];
  const status=(message,error=false)=>{$('compareStatus').textContent=message;$('compareStatus').dataset.error=String(error);};
  function setBusy(value){busy=value;$('compareRetry').disabled=value;for(const b of dialog.querySelectorAll('[data-choose]'))b.disabled=value;dialog.setAttribute('aria-busy',String(value));}
  function release(){generation++;if(pending){clearTimeout(pending.timer);pending.reject(new Error('ยกเลิกการสร้างภาพ'));pending=null;}frame?.remove();frame=null;for(const url of urls)URL.revokeObjectURL(url);urls=[];}
  function stillCurrent(){const now=YPProjectWorkspace.capture();if(core.signature(now)!==signature)throw new Error('แบบเปลี่ยนหลังเปิดเปรียบเทียบ กรุณาปิดแล้วเปิดเปรียบเทียบใหม่');}
  function message(event){
    const data=event.data;if(event.source!==frame?.contentWindow||data?.channel!=='yp-compare'||data.token!==token||!pending)return;
    if(!['ready','error','result','measured'].includes(data.type))return;
    if(data.type!=='ready'&&data.id!==pending.id&&data.id!==undefined)return;
    const task=pending;pending=null;clearTimeout(task.timer);data.type==='error'?task.reject(new Error(data.message||'สร้างภาพไม่ได้')):task.resolve(data);
  }
  window.addEventListener('message',message);
  function waitFor(id){return new Promise((resolve,reject)=>{pending={id,resolve,reject,timer:setTimeout(()=>{pending=null;reject(new Error('สร้างภาพเกินเวลาที่กำหนด กรุณาลองใหม่'));},45000)};});}
  async function render(){
    release();const run=generation;setBusy(true);status('กำลังเตรียมภาพเปรียบเทียบ…');
    for(const image of dialog.querySelectorAll('.compare-card img')){image.hidden=true;image.removeAttribute('src');}
    try{
      stillCurrent();token=crypto.randomUUID();const url=new URL(location.href);url.searchParams.set('comparePreview','1');url.searchParams.set('compareToken',token);url.hash='';
      const ready=waitFor('ready');frame=document.createElement('iframe');frame.className='compare-render-frame';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.src=url.href;document.body.append(frame);await ready;
      const measured={};
      for(const slot of ['A','B']){
        if(!project.variants[slot])continue;
        status('กำลังจัดกรอบภาพแบบ '+slot+'…');const id=token+'-measure-'+slot,response=waitFor(id);
        frame.contentWindow.postMessage({channel:'yp-compare',token,type:'measure',id,snapshot:project.variants[slot]},location.protocol==='file:'?'*':location.origin);
        const result=await response;if(run!==generation)return;stillCurrent();
        if(!result.bounds)throw new Error('ไม่ได้รับขนาดชิ้นงานแบบ '+slot);measured[slot]=result.bounds;
      }
      // Fit the larger measured design, then reuse its scale for both images.
      const cameras=core.cameras(project,measured);
      for(const slot of ['A','B']){
        if(!project.variants[slot])continue;
        status('กำลังสร้างภาพแบบ '+slot+'…');const id=token+'-'+slot,response=waitFor(id);
        frame.contentWindow.postMessage({channel:'yp-compare',token,type:'render',id,snapshot:project.variants[slot],camera:cameras[slot]},location.protocol==='file:'?'*':location.origin);
        const result=await response;if(run!==generation)return;stillCurrent();
        if(!(result.blob instanceof Blob)||result.blob.type!=='image/png'||!result.blob.size)throw new Error('ไม่ได้รับภาพแบบ '+slot);
        const src=URL.createObjectURL(result.blob);urls.push(src);const image=$('compareImage'+slot);image.src=src;image.hidden=false;
      }
      status('ภาพพร้อมแล้ว · เลือกแบบที่ต้องการไปตรวจและเตรียมส่งงาน');
    }catch(error){if(run===generation){for(const image of dialog.querySelectorAll('.compare-card img'))image.hidden=true;status('สร้างภาพเปรียบเทียบไม่สำเร็จ: '+error.message+' · ยังดูข้อมูลหรือเลือกแบบไปตรวจต่อได้',true);}}
    finally{if(run===generation){frame?.remove();frame=null;setBusy(false);}}
  }
  async function choose(slot){
    if(busy)return;
    try{stillCurrent();setBusy(true);if(!await YPProjectWorkspace.activate(slot))throw new Error('เลือกแบบไม่สำเร็จ');dialog.close();YPHandoffUI.open();}
    catch(error){status(error.message,true);}finally{setBusy(false);}
  }
  function open(){
    if(dialog.open)return;
    try{project=YPProjectWorkspace.capture();signature=core.signature(project);}catch(error){alert(error.message);return;}
    const data=core.compare(project),cards=$('compareCards');cards.replaceChildren();$('compareRows').replaceChildren();
    for(const slot of ['A','B']){
      const card=document.createElement('section');card.className='compare-card';const heading=document.createElement('h3');heading.textContent='แบบ '+slot+(slot===project.active?' · กำลังแก้ไข':'');card.append(heading);
      if(!data[slot]){const note=document.createElement('p');note.textContent='ยังไม่มีแบบ '+slot+' · กลับไปกด “ทำสำเนาเป็น '+slot+'” แล้วปรับเป็นอีกทางเลือก';card.append(note);}
      else{const image=document.createElement('img');image.id='compareImage'+slot;image.hidden=true;image.alt='ภาพเปรียบเทียบแบบ '+slot;card.append(image);const text=document.createElement('p');text.textContent=data[slot].size+' · '+data[slot].count+' วัตถุ';card.append(text);const button=document.createElement('button');button.className='btn pri';button.type='button';button.dataset.choose=slot;button.textContent='เลือกแบบ '+slot+' ไปเตรียมส่งงาน';button.onclick=()=>choose(slot);card.append(button);}
      cards.append(card);
    }
    for(const row of data.rows){const tr=document.createElement('tr');tr.classList.toggle('different',row.different);for(const [i,text] of [row.label,row.a,row.b].entries()){const cell=document.createElement(i===0?'th':'td');if(i===0)cell.scope='row';cell.textContent=text;tr.append(cell);}$('compareRows').append(tr);}
    dialog.showModal();$('compareClose').focus();
    if(!data.A||!data.B){status('มีแบบเดียว ยังเปรียบเทียบความต่างไม่ได้ ไม่มีการสร้างแบบใหม่ให้อัตโนมัติ');$('compareRetry').disabled=true;setBusy(false);$('compareRetry').disabled=true;}
    else render();
  }
  $('compareClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{release();setBusy(false);project=null;});
  document.addEventListener('keydown',event=>{if(dialog.open)event.stopPropagation();},true);
  $('compareRetry').onclick=()=>{if(!busy&&project?.variants.A&&project?.variants.B)render();};openButton.onclick=open;window.YPCompareUI={open};
})();
