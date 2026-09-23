const $=id=>document.getElementById(id), frame=$('editor');
let config, prepared, busy=false, editorReady=false, editing=false, importedProject=null, view='scene';
const message=text=>$('status').textContent=text;
function showView(next){
  view=next;
  for(const name of ['scene','reference','result']){
    const active=name===next,button=$('tab-'+name),panel=$(name+'Panel');
    button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    panel.classList.toggle('active',active);panel.setAttribute('aria-hidden',String(!active));panel.inert=!active;
    // Keep the 3D iframe measured even while viewing a still: no camera resize.
    if(name!=='scene')panel.hidden=!active;
  }
  $('stageLabel').textContent=next==='scene'?'ภาพ 3D · ลากเพื่อหมุน / ล้อเมาส์เพื่อซูม':next==='reference'?'ภาพต้นฉบับ · ยังไม่ใช่ภาพเรนเดอร์':'ผลภาพนำเสนอจาก OpenAI';
  $('downloadBefore').hidden=next!=='reference'||!$('before').getAttribute('src');
  $('downloadAfter').hidden=next!=='result'||!$('after').getAttribute('src');
}
document.querySelectorAll('[data-view]').forEach((button,index,buttons)=>{
  button.onclick=()=>showView(button.dataset.view);
  button.onkeydown=event=>{let n;if(event.key==='ArrowRight')n=(index+1)%buttons.length;else if(event.key==='ArrowLeft')n=(index+buttons.length-1)%buttons.length;else if(event.key==='Home')n=0;else if(event.key==='End')n=buttons.length-1;else return;event.preventDefault();showView(buttons[n].dataset.view);buttons[n].focus();};
});
document.querySelectorAll('[data-open-scene]').forEach(button=>button.onclick=()=>showView('scene'));
function updateSceneInfo(){
  const d=frame.contentDocument,type=d.getElementById('tagType')?.textContent||'บูธทดลอง',size=d.getElementById('tagSize')?.textContent||'';
  $('sceneInfo').textContent=type+' · '+size;$('sourceMeta').textContent=size;
  if(!importedProject)$('sourceName').textContent=type;
}
function clearReference(){
  prepared=null;$('confirm').checked=false;
  for(const id of ['before','after']){$(id).hidden=true;$(id).removeAttribute('src');}
  $('emptyBefore').hidden=false;$('emptyAfter').hidden=false;
  $('downloadBefore').hidden=true;$('downloadAfter').hidden=true;
}
function installCameraLayout(){
  const d=frame.contentDocument,style=d.createElement('style');style.id='render-studio-layout';
  style.textContent=`:root{--header-h:0px!important}body>header{display:none!important}html,body{height:100%;overflow:hidden!important}#workspace{height:100dvh!important;min-height:0!important}
  .render-studio-camera #workspace{display:block!important}.render-studio-camera #dockPanel,.render-studio-camera .dock-rail,.render-studio-camera .vtop,.render-studio-camera #objectToolbar,.render-studio-camera .three-hint,.render-studio-camera .view-controls-hint{display:none!important}
  .render-studio-camera .stage{height:100%!important;padding:0!important}.render-studio-camera .viewer{height:100%!important;border:0!important;border-radius:0!important;display:flex!important;flex-direction:column!important}
  .render-studio-camera #view,.render-studio-camera .three-shell{min-height:0!important}.render-studio-camera #view{height:100%!important}.render-studio-camera .three-tools{max-width:calc(100% - 100px);border-radius:9px;background:#29232ee6}.render-studio-camera .three-tools button{font-size:11px;padding:7px 9px}`;
  d.head.append(style);d.documentElement.classList.add('render-studio-camera');
  frame.contentWindow.dispatchEvent(new Event('resize'));
}
$('edit').onclick=()=>{
  editing=!editing;clearReference();showView('scene');$('workspace').classList.toggle('is-editing',editing);
  frame.contentDocument.documentElement.classList.toggle('render-studio-camera',!editing);
  $('edit').textContent=editing?'เสร็จแล้ว · กลับไปเรนเดอร์':'แก้แบบบูธ';$('edit').setAttribute('aria-pressed',String(editing));
  requestAnimationFrame(()=>frame.contentWindow.dispatchEvent(new Event('resize')));
  if(!editing){updateSceneInfo();message('แก้แบบแล้ว · เตรียมภาพต้นฉบับใหม่ก่อนเรนเดอร์');}
  controls();
};
$('import').onclick=()=>$('project').click();
$('saveProject').onclick=async()=>{
  busy=true;controls();
  try{const w=frame.contentWindow,store=w.YPProjectStore,snapshot=w.YPProjectBridge.capture();
    const project=importedProject?store.capture(importedProject,snapshot):store.create(snapshot,'บูธทดลองเรนเดอร์');
    const text=await store.toText(project),url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');
    a.href=url;a.download='Yuppie-Render-Studio.ypbooth.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    message('ส่งไฟล์แบบให้ดาวน์โหลดแล้ว · เปิดกลับมาแก้ต่อได้');
  }catch(error){message('บันทึกแบบไม่สำเร็จ: '+error.message);}finally{busy=false;controls();}
};
function controls(){
  $('prepare').disabled=!editorReady||busy;$('project').disabled=!editorReady||busy;
  for(const id of ['import','saveProject','edit'])$(id).disabled=!editorReady||busy;
  $('render').disabled=busy||!prepared||!config?.enabled||config.remaining<1||!$('confirm').checked;
  $('confirmRow').hidden=!config?.enabled||!prepared;
  const preparePrimary=!config?.enabled||!prepared;
  $('prepare').classList.toggle('primary',preparePrimary);$('prepare').classList.toggle('secondary',!preparePrimary);
  $('prepareLabel').textContent=busy?'กำลังทำงาน…':prepared?'อัปเดตภาพต้นฉบับ · ฟรี':'เตรียมภาพต้นฉบับ · ฟรี';
}
async function refresh(){
  const response=await fetch('/api/status');if(!response.ok)throw Error('ตรวจสถานะเซิร์ฟเวอร์ไม่ได้');config=await response.json();
  $('mode').textContent=config.enabled?'ทดสอบภายใน · มีค่าใช้จ่าย':'ทดสอบภายใน · ยังไม่เชื่อมบริการ';
  $('settings').textContent=`${config.model} · High · ครั้งละ 1 ภาพ · คงโครงสร้างและแบรนด์`;
  $('gate').textContent=!config.keyConfigured?'ยังไม่มี OPENAI_API_KEY ฝั่งเซิร์ฟเวอร์ — ห้ามใส่คีย์ในหน้าเว็บหรือแชต':!config.approved?'พบคีย์แล้ว แต่ยังไม่อนุมัติเปิดการทดสอบแบบมีค่าใช้จ่าย':`เหลือการทดลองทีม ${config.remaining} คำขอ`;
  $('report').textContent=JSON.stringify({package:prepared?{id:prepared.id,stateHash:prepared.snapshot.stateHash,width:prepared.width,height:prepared.height}:null,jobs:config.jobs},null,2);
  $('connectionTitle').textContent=config.enabled?'พร้อมทดสอบสร้างภาพ':'ทดลองจัดมุมได้ฟรี';
  $('connectionText').textContent=config.enabled?`เหลือ ${config.remaining} คำขอสำหรับทีม · ตรวจต้นฉบับก่อนยืนยัน`:'เตรียมและดาวน์โหลดต้นฉบับได้ ส่วนสร้างภาพรอเชื่อมบริการก่อน';
  $('actionHint').textContent=config.enabled?'ส่งครั้งละ 1 ภาพ · ไม่ส่งซ้ำอัตโนมัติ':'ยังไม่เชื่อมบริการ · ไม่มีค่าเรนเดอร์';
  $('historyList').replaceChildren();
  for(const job of config.jobs.filter(job=>job.status==='complete')){
    const button=document.createElement('button');button.className='btn';button.textContent='ดูภาพ · '+new Date(job.startedAt).toLocaleString('th-TH');
    button.onclick=()=>{$('after').src=job.imageUrl;$('after').hidden=false;$('emptyAfter').hidden=true;$('downloadAfter').href=job.imageUrl;showView('result');message('ภาพจากประวัติ · อาจเป็นคนละแบบกับต้นฉบับปัจจุบัน');};
    $('historyList').append(button);
  }
  controls();return config;
}
frame.addEventListener('load',async()=>{
  try{await frame.contentWindow.YPProjectBridge.ready;frame.contentWindow.YPQuickSetupBridge.close();installCameraLayout();frame.style.visibility='visible';editorReady=true;updateSceneInfo();controls();message('จัดมุมที่ต้องการ แล้วเตรียมภาพต้นฉบับ');}catch{message('โหลดบูธไม่สำเร็จ กรุณาเปิดหน้าทดสอบใหม่');}
});
$('confirm').onchange=controls;
$('project').onchange=async()=>{
  const file=$('project').files[0];if(!file)return;
  busy=true;clearReference();showView('scene');controls();
  try{if(file.size>150*1024*1024)throw Error('ไฟล์ใหญ่เกิน 150 MB');const w=frame.contentWindow,project=w.YPProjectStore.isolateAssets(w.YPProjectStore.fromText(await file.text()));await w.YPProjectBridge.restore(project.variants[project.active]);importedProject=project;$('sourceName').textContent=project.name;updateSceneInfo();message('เปิดสำเนาแล้ว · จัดมุมกล้องและเตรียมภาพใหม่');}
  catch(error){message('เปิดไฟล์ไม่สำเร็จ: '+error.message);}finally{busy=false;controls();}
};
$('prepare').onclick=async()=>{
  busy=true;clearReference();controls();message('กำลังเตรียมภาพต้นฉบับ…');
  try{
    const w=frame.contentWindow,snapshot=await w.createAtomicRenderSnapshot();
    const image=await w.createCleanScreenshot({snapshot,download:false,aspectRatio:w.renderPackageAspectRatio(snapshot),minLongEdge:1536,maxLongEdge:2048,maxBytes:4*1024*1024,includeDataUrl:true,camera:snapshot.camera,validateState:()=>w.assertAtomicRenderSnapshot(snapshot)});
    w.assertAtomicRenderSnapshot(snapshot);
    // Only selected facts: do not forward free-form scene prompts or staging instructions.
    const p=snapshot.payload,design=JSON.stringify({boothType:p.boothType,width:p.width,depth:p.depth,height:p.height,brand:p.brand,camera:snapshot.camera,assetCount:snapshot.spec.objects.length});
    prepared={id:crypto.randomUUID(),image:image.dataUrl.split(',')[1],design,snapshot,width:image.width,height:image.height};
    $('before').src=image.dataUrl;$('before').hidden=false;$('emptyBefore').hidden=true;$('downloadBefore').href=image.dataUrl;$('downloadBefore').hidden=false;
    $('after').hidden=true;$('emptyAfter').hidden=false;$('downloadAfter').hidden=true;
    updateSceneInfo();showView('reference');message(`ต้นฉบับพร้อม · ${image.width} × ${image.height} px\nยังไม่ส่งออกจากเครื่องและไม่มีค่าเรนเดอร์`);await refresh();
  }catch(error){message('เตรียมภาพไม่สำเร็จ: '+error.message);}finally{busy=false;controls();}
};
$('render').onclick=async()=>{
  if($('render').disabled)return;
  busy=true;controls();
  try{
    frame.contentWindow.assertAtomicRenderSnapshot(prepared.snapshot);
    const {id,image,design}=prepared;
    message('กำลังส่ง 1 คำขอ · อย่าปิดหน้าทดสอบ');
    const response=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json','X-Lab-Token':config.token},body:JSON.stringify({id,image,design})});
    const result=await response.json();if(!response.ok)throw Error(result.error);
    for(;;){
      await new Promise(resolve=>setTimeout(resolve,2000));await refresh();const job=config.jobs.find(j=>j.id===id);
      if(!job)throw Error('ไม่พบงาน กรุณาตรวจประวัติ ห้ามส่งซ้ำ');
      if(job.status==='running'){message('กำลังสร้างภาพ… ระบบจะไม่ส่งคำขอซ้ำ');continue;}
      if(job.status!=='complete')throw Error(job.error+' · อาจมีค่าใช้จ่ายแล้ว ต้องตรวจ Usage ก่อนทดลองใหม่');
      $('after').src=job.imageUrl;$('after').hidden=false;$('emptyAfter').hidden=true;$('downloadAfter').href=job.imageUrl;$('downloadAfter').hidden=false;
      showView('result');$('review').open=true;
      message(`ได้รับภาพแล้ว · ${(job.elapsedMs/1000).toFixed(1)} วินาที · กรุณาตรวจความตรงแบบ / โลโก้ / ความสวย`);break;
    }
  }catch(error){message('หยุด: '+error.message+' · ไม่ส่งซ้ำอัตโนมัติ');}
  finally{prepared=null;$('confirm').checked=false;busy=false;await refresh().catch(()=>{});controls();}
};
refresh().catch(error=>message(error.message));
