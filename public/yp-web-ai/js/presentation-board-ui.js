(function(){
  'use strict';
  const button=document.getElementById('promptBoard'),status=document.getElementById('promptBoardStatus');
  if(!button)return;
  const field=document.getElementById('boardPrompt'),note=document.getElementById('promptBoardPreviewNote'),copyButton=document.getElementById('promptBoardTextCopy');
  let prepared=null;
  const designSignature=snapshot=>JSON.stringify(renderStatePayload(JSON.parse(serializeBoothSpec()),snapshot.camera));
  function refreshPreview(){
    if(!field||prepareRenderPackage.busy)return;
    if(prepared&&designSignature(prepared)!==JSON.stringify(prepared.payload)){
      prepared=null;status.textContent='แบบเปลี่ยนแล้ว กรุณาเตรียมชุดบอร์ดใหม่เพื่อให้ภาพและคำสั่งตรงกัน';
    }
    const snapshot=prepared||{...captureRenderDraft(),renderPackageId:'DRAFT — เตรียมชุดบอร์ดก่อนใช้งาน',stateHash:'pending'};
    field.value=YPPresentationBoard.prompt(snapshot);
    note.textContent=prepared?'คำสั่งเดียวกับ board-prompt.txt ใน ZIP ล่าสุด · '+prepared.renderPackageId:'คำสั่งร่างจากแบบปัจจุบัน · กดเตรียมชุดเพื่อรับคำสั่งและภาพอ้างอิงที่ตรงกัน';
  }
  function selectTab(board){
    for(const [name,on] of [['Image',!board],['Board',board]]){
      const tab=document.getElementById('prompt'+name+'Tab');
      tab.setAttribute('aria-selected',String(on));tab.classList.toggle('on',on);tab.tabIndex=on?0:-1;
      document.getElementById('prompt'+name+'Panel').hidden=!on;
    }
    updatePromptPreview();
  }
  for(const [name,board] of [['Image',false],['Board',true]]){
    const tab=document.getElementById('prompt'+name+'Tab');
    tab.onclick=()=>selectTab(board);
    tab.onkeydown=event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();const next=event.key==='Home'?false:event.key==='End'?true:!board;
      selectTab(next);document.getElementById('prompt'+(next?'Board':'Image')+'Tab').focus();
    };
  }
  copyButton.onclick=async()=>{
    if(prepareRenderPackage.busy)return;
    refreshPreview();
    try{await copyRenderPackagePrompt(field.value,field);status.textContent=prepared?'คัดลอก Prompt บอร์ดแล้ว · ใช้พร้อมภาพใน ZIP ชุดล่าสุด':'คัดลอก Prompt บอร์ดฉบับร่างแล้ว · ยังต้องเตรียมชุดเพื่อรับภาพอ้างอิง';}
    catch{status.textContent='คัดลอกไม่สำเร็จ กรุณาเลือกข้อความในช่องแล้วคัดลอกเอง';}
  };
  document.getElementById('promptImageTextCopy').onclick=async()=>{
    if(prepareRenderPackage.busy)return;
    updatePromptPreview();const imageField=document.getElementById('designPrompt'),imageStatus=document.getElementById('promptStatus');
    try{await copyRenderPackagePrompt(imageField.value,imageField);imageStatus.textContent='คัดลอก Prompt สร้างภาพแล้ว · ใช้คู่กับภาพอ้างอิงจากชุดสร้างภาพ';}
    catch{imageStatus.textContent='คัดลอกไม่สำเร็จ กรุณาเลือกข้อความในช่องแล้วคัดลอกเอง';}
  };
  async function prepare(){
    if(prepareRenderPackage.busy)return false;
    prepareRenderPackage.busy=true;button.disabled=true;copyButton.disabled=true;
    prepared=null;
    const renderButton=document.getElementById('promptCopy');renderButton.disabled=true;
    let renderer,previous,previousEnabled,previousRotate;
    try{
      status.textContent='กำลังเตรียมภาพอ้างอิงสำหรับบอร์ด…';
      renderer=await loadThreeRenderer();
      previous=renderer.cameraManifest();previousEnabled=renderer.controls.enabled;previousRotate=renderer.controls.enableRotate;
      renderer.controls.enabled=false;
      const snapshot=await createAtomicRenderSnapshot(),missing=renderPackageMissingFields(snapshot);
      if(missing.length)throw new Error('กรุณาตั้งค่า: '+missing.join(', '));
      // Export cameras may change; compare the design against the same frozen camera.
      const validate=()=>{
        const payload=renderStatePayload(JSON.parse(serializeBoothSpec()),snapshot.camera);
        if(JSON.stringify(payload)!==JSON.stringify(snapshot.payload))throw new Error('แบบมีการเปลี่ยนแปลง กรุณาเตรียมชุดบอร์ดใหม่');
      };
      const images=[];
      for(const [index,view] of YPPresentationBoard.views.entries()){
        validate();status.textContent='กำลังเตรียมภาพ '+(index+1)+'/6 · '+view.label;
        await renderer.setCameraView(view.id,{animate:false,commit:false});
        const image=await renderer.exportCleanScreenshot({download:false,minLongEdge:1536,maxLongEdge:1536,aspectRatio:4/3,assetTimeoutMs:20000,fileName:view.file,validateState:validate,renderPackageId:snapshot.renderPackageId,stateHash:snapshot.stateHash});
        validate();images.push({id:view.id,blob:image.blob,manifest:image.manifest});
      }
      status.textContent='กำลังรวมคำสั่ง ข้อมูลบูธ และภาพ 6 มุมเป็น ZIP…';
      const result=await YPPresentationBoard.build(snapshot,images);validate();
      prepared=snapshot;field.value=result.prompt;
      const url=URL.createObjectURL(result.blob),link=document.createElement('a');
      link.href=url;link.download='YUPPIE-Presentation-Board-'+snapshot.renderPackageId+'.zip';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      status.textContent='ดาวน์โหลดชุดพรีเซนเทชั่นบอร์ดแล้ว · แตก ZIP แล้วใช้ board-prompt.txt พร้อมภาพทั้ง 6 มุมใน AI';
      return true;
    }catch(error){console.error('Presentation board package failed',error);status.textContent='เตรียมชุดบอร์ดไม่สำเร็จ: '+error.message;return false;}
    finally{
      if(renderer&&previous){
        renderer.restoreTopViewHidden();renderer.applyCameraManifest(previous);renderer.controls.enabled=previousEnabled;renderer.controls.enableRotate=previousRotate;
        renderer.viewButtons.forEach((b,key)=>b.classList.toggle('on',key===previous.cameraViewType));
        renderer.updateCameraAspect(renderer.lastSize[0]/Math.max(1,renderer.lastSize[1]));
        renderer.renderer.render(renderer.scene,renderer.camera);
      }
      prepareRenderPackage.busy=false;button.disabled=false;copyButton.disabled=false;renderButton.disabled=false;refreshPreview();
    }
  }
  button.onclick=prepare;
  window.YPPresentationBoardUI={prepare,refreshPreview};
  refreshPreview();
})();
