(function(){
  'use strict';
  const core=window.YPHandoffPackage,$=id=>document.getElementById(id);
  const modal=document.createElement('dialog');modal.className='project-dialog handoff-dialog';modal.setAttribute('aria-labelledby','handoffTitle');
  modal.innerHTML=`<h2 id="handoffTitle">เตรียมชุดส่งงาน</h2><p>ดาวน์โหลดไว้ส่งต่อด้วยตัวเอง · ยังไม่เชื่อม LINE และยังไม่ได้ส่งถึงทีม Yuppie</p>
    <form id="handoffForm"><label for="handoffVariant">แบบที่ต้องการส่ง</label><select id="handoffVariant" class="qi"><option value="A">แบบ A</option><option value="B">แบบ B</option></select><p id="handoffSelection"></p>
    <div class="handoff-fields">${Object.entries(core.fields).map(([key,label])=>`<label for="handoff-${key}">${label}${['contact','phone'].includes(key)?' *':''}${key==='notes'?`<textarea id="handoff-${key}" name="${key}" rows="3" maxlength="2000"></textarea>`:`<input id="handoff-${key}" name="${key}" type="${['eventDate','install','dismantle'].includes(key)?'date':key==='phone'?'tel':'text'}" maxlength="200" ${['contact','phone'].includes(key)?'required':''} autocomplete="${({contact:'name',phone:'tel',company:'organization'})[key]||'off'}">`}</label>`).join('')}</div>
    <p class="handoff-note">ข้อมูลติดต่อเก็บชั่วคราวในหน้านี้และใน ZIP ที่คุณดาวน์โหลด ไม่รวมในร่างอัตโนมัติ รีโหลดหน้าจะต้องกรอกใหม่ ไม่ต้องระบุข้อมูลที่ยังไม่ทราบ</p>
    <button class="btn pri" type="submit">ตรวจสรุปก่อนดาวน์โหลด</button></form>
    <section id="handoffReview" tabindex="-1" hidden><h3>ตรวจข้อมูลแบบที่เลือก</h3>
    <figure class="handoff-preview"><img id="handoffPreview" hidden alt="ภาพตัวอย่างแบบที่เลือก"><figcaption id="handoffPreviewCaption">ยังไม่มีภาพตัวอย่าง</figcaption><button id="handoffPreviewRefresh" class="btn sm" type="button">สร้างภาพตัวอย่างใหม่</button></figure>
    <section id="handoffChecks" aria-labelledby="handoffCheckTitle"><h3 id="handoffCheckTitle">จุดที่ต้องตรวจต่อ</h3><p id="handoffCheckScope"></p><ul id="handoffWarnings"></ul><p>คำเตือนไม่ห้ามดาวน์โหลด และจะรวมในชุดส่งงานให้ทีมตรวจต่อ</p></section>
    <div id="handoffSummary"></div><p>รวมเฉพาะแบบที่เลือก: ไฟล์แก้ไขต่อ (.ypbooth.json), ข้อมูลงาน (.json), สรุปและรายการวัตถุ (.html) และภาพบูธ (.png) หากเลือกแนบ</p><p>รายการวัตถุไม่ใช่ BOM ครบทุกวัสดุ และไม่ใช่ใบเสนอราคา ทีมงานต้องตรวจแบบและราคาก่อนผลิต</p><label><input id="handoffImage" type="checkbox" checked> แนบภาพบูธ 3D ที่ตรวจในหน้านี้</label><div class="project-dialog-actions"><button id="handoffDownload" class="btn pri" type="button">ดาวน์โหลดชุดส่งงาน (.zip)</button><button id="handoffEdit" class="btn" type="button">แก้ข้อมูล</button></div></section>
    <p id="handoffStatus" role="status" aria-live="polite"></p><button id="handoffClose" class="btn" type="button">กลับไปออกแบบ</button>`;
  document.body.append(modal);
  let captured=null,brief=null,busy=false,geometry=null,previewBlob=null,previewURL=null;
  const status=(text,error=false)=>{ $('handoffStatus').textContent=text;$('handoffStatus').dataset.error=String(error); };
  function lock(value){busy=value;modal.setAttribute('aria-busy',String(value));for(const control of modal.querySelectorAll('button,input,textarea,select'))control.disabled=value;}
  function clearPreview(){
    if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;previewBlob=null;
    $('handoffPreview').hidden=true;$('handoffPreview').removeAttribute('src');$('handoffPreviewCaption').textContent='ยังไม่มีภาพตัวอย่าง';
  }
  function validateSnapshot(){
    if(!captured||JSON.stringify(YPProjectBridge.capture().spec)!==JSON.stringify(captured.variants[captured.active].spec))throw new Error('แบบเปลี่ยนหลังตรวจสรุป กรุณากดแก้ข้อมูลแล้วตรวจสรุปใหม่');
  }
  async function makePreview(){
    clearPreview();validateSnapshot();const spec=captured.variants[captured.active].spec;
    $('handoffPreviewCaption').textContent='กำลังสร้างภาพแบบ '+captured.active+'…';
    try{
      const result=await window.exportCleanScreenshot({spec,minLongEdge:1536,maxLongEdge:1536,assetTimeoutMs:15000,download:false,validateState:validateSnapshot});
      if(!(result?.blob instanceof Blob)||!result.blob.size||result.blob.type!=='image/png')throw new Error('ไม่ได้รับภาพ PNG จากตัวเรนเดอร์');
      validateSnapshot();previewBlob=result.blob;previewURL=URL.createObjectURL(previewBlob);
      $('handoffPreview').src=previewURL;$('handoffPreview').alt='ภาพบูธ '+captured.name+' แบบ '+captured.active;$('handoffPreview').hidden=false;
      $('handoffPreviewCaption').textContent='แบบ '+captured.active+' · ภาพนี้จะอยู่ใน ZIP เมื่อเลือกแนบภาพ';
    }catch(error){$('handoffPreviewCaption').textContent='สร้างภาพไม่สำเร็จ · ยังตรวจข้อมูลและดาวน์โหลดแบบไม่มีภาพได้';throw new Error('แนบภาพไม่สำเร็จ: '+error.message+' — ลองสร้างภาพใหม่ หรือเอาเครื่องหมาย “แนบภาพบูธ” ออก');}
  }
  function edit(field='contact'){
    clearPreview();captured=null;geometry=null;$('handoffForm').hidden=false;$('handoffReview').hidden=true;status('');$('handoff-'+field)?.focus();
  }
  function showChecks(report){
    $('handoffCheckTitle').textContent='จุดที่ต้องตรวจต่อ '+report.warnings.length+' รายการ';$('handoffCheckScope').textContent=report.scope;
    const list=$('handoffWarnings');list.replaceChildren();
    if(!report.warnings.length){const li=document.createElement('li');li.textContent='ไม่พบคำเตือนจากรายการที่ตรวจ ยังต้องให้ทีมตรวจแบบก่อนผลิต';list.append(li);}
    for(const warning of report.warnings){
      const li=document.createElement('li'),text=document.createElement('span');text.textContent=warning.message;li.append(text);li.dataset.code=warning.code;
      if(warning.objectId||warning.field){const button=document.createElement('button');button.type='button';button.className='btn sm';button.textContent=warning.objectId?'เลือกวัตถุไปแก้':'กรอกข้อมูล';
        button.onclick=()=>{if(busy)return;if(warning.field){edit(warning.field);return;}
          try{validateSnapshot();YPProjectBridge.selectForHandoff(warning.objectId);modal.close();}catch(error){status(error.message,true);}};li.append(button);}
      list.append(li);
    }
  }
  function selection(){
    const p=YPProjectWorkspace.capture(),s=p.variants[p.active].spec;
    $('handoffVariant').value=p.active;for(const option of $('handoffVariant').options)option.disabled=!p.variants[option.value];
    $('handoffSelection').textContent=p.name+' · แบบ '+p.active+' · '+s.W+' × '+s.D+' × '+s.H+' ม. · วัตถุ '+s.objects.length+' ชิ้น';
  }
  function open(){
    if(modal.open)return;
    try{selection();}catch(error){alert(error.message);return;}
    clearPreview();$('handoffForm').hidden=false;$('handoffReview').hidden=true;status('');captured=null;geometry=null;modal.showModal();$('handoffVariant').focus();
  }
  $('handoffVariant').onchange=async()=>{
    const slot=$('handoffVariant').value;lock(true);
    try{if(!await YPProjectWorkspace.activate(slot))throw new Error('เลือกแบบไม่สำเร็จ กรุณาลองใหม่');status('แสดงแบบ '+slot+' ในหน้าต่างออกแบบแล้ว');}
    catch(error){status(error.message,true);}finally{lock(false);selection();}
  };
  $('handoffForm').onsubmit=async event=>{
    event.preventDefault();
    if(busy)return;
    try{
      brief=core.validateBrief(Object.fromEntries(new FormData($('handoffForm'))));captured=YPProjectWorkspace.capture();
      geometry=YPProjectBridge.handoffGeometry(captured.variants[captured.active].spec);
      const data=core.summary(captured,brief,geometry),box=$('handoffSummary');box.replaceChildren();showChecks(data.readiness);
      const title=document.createElement('p');title.textContent=data.projectName+' · แบบ '+data.selected+' · '+data.booth.width+' × '+data.booth.depth+' × '+data.booth.height+' ม. · '+data.equipment.length+' วัตถุ';box.append(title);
      const list=document.createElement('dl');for(const [key,label] of Object.entries(core.fields)){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=brief[key]||'ยังไม่ระบุ';list.append(dt,dd);}box.append(list);
      const items=document.createElement('details'),heading=document.createElement('summary');heading.textContent='ดูรายการวัตถุ '+data.equipment.length+' ชิ้น';items.append(heading);
      const ul=document.createElement('ul');for(const item of data.equipment){const li=document.createElement('li');li.textContent=item.name+' · '+item.size.w+' × '+item.size.d+' × '+item.size.h+' ม.';ul.append(li);}items.append(ul);box.append(items);
      $('handoffForm').hidden=true;$('handoffReview').hidden=false;$('handoffReview').focus({preventScroll:true});$('handoffReview').scrollIntoView({block:'start'});
      if($('handoffImage').checked){lock(true);status('กำลังเตรียมภาพตัวอย่าง…');await makePreview();}
      status('ตรวจภาพ ข้อมูล และคำเตือนก่อนดาวน์โหลด ข้อมูลยังไม่ถูกส่งถึงทีม');
    }catch(error){status(error.message,true);}finally{lock(false);}
  };
  $('handoffEdit').onclick=()=>edit();
  $('handoffPreviewRefresh').onclick=async()=>{if(busy||!captured)return;lock(true);try{await makePreview();status('สร้างภาพตัวอย่างใหม่แล้ว กรุณาตรวจภาพก่อนดาวน์โหลด');}catch(error){status(error.message,true);}finally{lock(false);}};
  $('handoffDownload').onclick=async()=>{
    if(busy||!captured)return;lock(true);
    try{
      validateSnapshot();const frozen=structuredClone(captured),details={...brief};
      let picture=null;
      if($('handoffImage').checked){
        if(!previewBlob){await makePreview();status('สร้างภาพแล้ว กรุณาตรวจภาพและกดดาวน์โหลดอีกครั้ง');return;}
        picture=previewBlob;
      }
      status('กำลังรวมชุดไฟล์…');const result=await core.build(frozen,details,picture,geometry),url=URL.createObjectURL(result.blob),link=document.createElement('a');
      link.href=url;link.download=(frozen.name+'-แบบ-'+frozen.active).replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_')+'-handoff.zip';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      status('ส่งชุดไฟล์ให้เบราว์เซอร์ดาวน์โหลดแล้ว'+(result.data.imageIncluded?' · มีภาพบูธ':' · ไม่มีภาพบูธ')+' — ตรวจในโฟลเดอร์ดาวน์โหลด ยังไม่ได้ส่งถึงทีม Yuppie');
    }catch(error){status(error.message,true);}finally{lock(false);}
  };
  $('handoffClose').onclick=()=>{if(!busy)modal.close();};modal.oncancel=event=>{if(busy)event.preventDefault();};
  modal.addEventListener('close',()=>{clearPreview();captured=null;geometry=null;});
  document.addEventListener('keydown',event=>{if(modal.open)event.stopPropagation();},true);
  window.YPHandoffUI={open};
})();
