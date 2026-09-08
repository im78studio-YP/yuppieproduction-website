/* Portable, data-only project format. No renderer or DOM dependency. */
(function(root){
  'use strict';
  const FORMAT='yuppie-booth-project',VERSION=1,MAX_BYTES=150*1024*1024;
  const clone=value=>structuredClone(value);
  function checkTree(value,depth=0){
    if(depth>40)throw new Error('ข้อมูลซ้อนกันลึกเกินไป');
    if(typeof value==='number'&&!Number.isFinite(value))throw new Error('พบค่าตัวเลขไม่ถูกต้อง');
    if(typeof value==='string'&&(/[<>\u0000]/.test(value)||/^(?:blob:|https?:|javascript:)/i.test(value)))throw new Error('ไฟล์ต้องเก็บข้อมูลไว้ภายใน ไม่รองรับลิงก์หรือโค้ดภายนอก');
    if(Array.isArray(value)&&value.length>20000)throw new Error('ข้อมูลในแบบมากเกินขีดจำกัด');
    if(value&&typeof value==='object')for(const [key,item] of Object.entries(value)){
      if(['__proto__','constructor','prototype'].includes(key))throw new Error('พบคีย์ข้อมูลที่ไม่อนุญาต');
      checkTree(item,depth+1);
    }
  }
  function validateSpec(spec){
    if(!spec||spec.version!==3||!Array.isArray(spec.objects))throw new Error('ไม่รองรับโครงสร้างแบบบูธนี้');
    checkTree(spec);
    function checkImages(value){
      if(!value||typeof value!=='object')return;
      for(const [key,item] of Object.entries(value)){
        if(typeof item==='string'&&item&&(key==='logo'||key==='photo'||key==='data'||/Data$/.test(key))&&!/^data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml|avif|bmp|x-icon);base64,[A-Za-z0-9+/\r\n]*={0,2}$/i.test(item))throw new Error('รูปภาพต้องฝังไว้ในไฟล์โปรเจกต์');
        if(item&&typeof item==='object')checkImages(item);
      }
    }
    checkImages(spec);
    for(const key of ['primary','secondary','logoBaseColor','logoColor'])if(spec[key]!==undefined&&!/^#[\da-f]{6}$/i.test(spec[key]))throw new Error('ค่าสีไม่ถูกต้อง');
    for(const key of ['W','D','H'])if(typeof spec[key]!=='number'||spec[key]<=0||spec[key]>100)throw new Error('ขนาดบูธไม่ถูกต้อง');
    if(!['three','plan','photo'].includes(spec.view))throw new Error('มุมมองไม่ถูกต้อง');
    const ids=new Set();
    for(const obj of spec.objects){
      if(!obj||typeof obj.id!=='string'||ids.has(obj.id)||typeof obj.catalogId!=='string')throw new Error('รายการวัตถุหรือรหัสวัตถุไม่ถูกต้อง');
      ids.add(obj.id);
      if(!Number.isFinite(obj.unitPrice)||obj.unitPrice<0)throw new Error('ข้อมูลประเมินราคาวัตถุไม่ครบ');
      if(!obj.position||!obj.size)throw new Error('วัตถุไม่มีตำแหน่งหรือขนาด');
      for(const key of ['x','y','z'])if(!Number.isFinite(obj.position[key]))throw new Error('ตำแหน่งวัตถุไม่ถูกต้อง');
      for(const key of ['w','d','h'])if(!Number.isFinite(obj.size[key])||obj.size[key]<=0)throw new Error('ขนาดวัตถุไม่ถูกต้อง');
    }
    return spec;
  }
  function create(snapshot,name='บูธของฉัน'){
    return {format:FORMAT,version:VERSION,id:root.crypto?.randomUUID?.()||'project-'+Date.now(),name,
      active:'A',variants:{A:clone(snapshot),B:null},updatedAt:new Date().toISOString()};
  }
  function capture(project,snapshot){project.variants[project.active]=clone(snapshot);project.updatedAt=new Date().toISOString();return project;}
  function duplicate(project,snapshot){
    capture(project,snapshot);const target=project.active==='A'?'B':'A';
    project.variants[target]=clone(snapshot);project.active=target;return target;
  }
  function validate(project){
    if(!project||project.format!==FORMAT||project.version!==VERSION)throw new Error('กรุณาเลือกไฟล์ .ypbooth.json ที่บันทึกจากเว็บนี้ (รุ่น 1)');
    if(!['A','B'].includes(project.active)||!project.variants?.[project.active])throw new Error('ไม่พบแบบที่ใช้งานอยู่');
    if(typeof project.name!=='string'||project.name.length>80)throw new Error('ชื่อโปรเจกต์ไม่ถูกต้อง');
    checkTree(project.name);
    for(const slot of ['A','B']){
      const snapshot=project.variants[slot];if(!snapshot)continue;
      validateSpec(snapshot.spec);
      if(!Array.isArray(snapshot.assets)||snapshot.assets.length>500)throw new Error('ข้อมูล My Asset ไม่ถูกต้อง');
      const ids=new Set();
      for(const asset of snapshot.assets){
        if(!asset||typeof asset.id!=='string'||!asset.id.startsWith('my-asset-')||ids.has(asset.id)||!(asset.file instanceof Blob)||asset.file.size<12||asset.file.size>MAX_BYTES)throw new Error('ไฟล์ My Asset ไม่ครบหรือขนาดไม่ถูกต้อง');
        ids.add(asset.id);checkTree({id:asset.id,name:asset.name,size:asset.size});
        if(typeof asset.name!=='string'||!asset.size||!['w','d','h'].every(k=>Number.isFinite(asset.size[k])&&asset.size[k]>0))throw new Error('รายละเอียด My Asset ไม่ถูกต้อง');
      }
      for(const obj of snapshot.spec.objects)if(obj.catalogId.startsWith('my-asset-')&&!ids.has(obj.catalogId))throw new Error('ไฟล์ไม่ครบ: ไม่พบ My Asset '+obj.catalogId);
    }
    return project;
  }
  async function toText(project){
    validate(project);const file=clone(project);
    for(const snapshot of Object.values(file.variants))if(snapshot)for(const asset of snapshot.assets){
      const bytes=new Uint8Array(await asset.file.arrayBuffer());let binary='';
      for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
      asset.data=btoa(binary);delete asset.file;
    }
    const text=JSON.stringify(file);
    if(new Blob([text]).size>MAX_BYTES)throw new Error('ไฟล์เกิน 150 MB กรุณาลดขนาดรูปหรือ My Asset ก่อนบันทึก');
    return text;
  }
  function fromText(text){
    if(new Blob([text]).size>MAX_BYTES)throw new Error('ไฟล์เกิน 150 MB');
    const file=JSON.parse(text);checkTree(file);
    if(file.format!==FORMAT||file.version!==VERSION)throw new Error('ไม่ใช่ไฟล์โปรเจกต์รุ่นที่รองรับ');
    for(const slot of ['A','B']){
      const snapshot=file.variants?.[slot];if(!snapshot)continue;
      if(!Array.isArray(snapshot.assets))throw new Error('ไม่มีข้อมูลไฟล์ประกอบ');
      for(const asset of snapshot.assets){
        if(typeof asset.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(asset.data))throw new Error('ข้อมูลไฟล์ GLB เสียหาย');
        const binary=atob(asset.data),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
        if(bytes.length<12||new DataView(bytes.buffer).getUint32(0,true)!==0x46546c67||new DataView(bytes.buffer).getUint32(4,true)!==2||new DataView(bytes.buffer).getUint32(8,true)!==bytes.length)throw new Error('My Asset ไม่ใช่ไฟล์ GLB รุ่น 2 ที่สมบูรณ์');
        asset.file=new Blob([bytes],{type:'model/gltf-binary'});delete asset.data;
      }
    }
    return validate(file);
  }
  // Imported models must not replace an unrelated My Asset with the same ID.
  function isolateAssets(project){
    for(const slot of ['A','B']){
      const snapshot=project.variants[slot];if(!snapshot)continue;
      const map=new Map(snapshot.assets.map((asset,index)=>[asset.id,'my-asset-import-'+(root.crypto?.randomUUID?.()||Date.now()+'-'+Math.random())+'-'+slot+'-'+index]));
      const remap=value=>{if(!value||typeof value!=='object')return;for(const key of Object.keys(value)){if(typeof value[key]==='string'&&map.has(value[key]))value[key]=map.get(value[key]);else if(value[key]&&typeof value[key]==='object')remap(value[key]);}};
      remap(snapshot.spec);snapshot.assets.forEach(asset=>{asset.id=map.get(asset.id);});
    }
    return project;
  }
  function database(){return new Promise((resolve,reject)=>{
    const request=indexedDB.open('yp-booth-projects-v1',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('drafts');
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(new Error('กรุณาปิดแท็บเก่าที่เปิดเว็บนี้แล้วลองใหม่'));
  });}
  async function draft(mode,value){
    const db=await database();return new Promise((resolve,reject)=>{
      const tx=db.transaction('drafts',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('drafts');
      const request=mode==='get'?store.get('latest'):store.put(value,'latest');
      tx.oncomplete=()=>{db.close();resolve(request.result);};
      tx.onabort=tx.onerror=()=>{db.close();reject(tx.error||new Error('บันทึกไม่สำเร็จ'));};
    });
  }
  root.YPProjectStore={FORMAT,VERSION,MAX_BYTES,clone,create,capture,duplicate,validate,validateSpec,toText,fromText,isolateAssets,
    readDraft:()=>draft('get'),writeDraft:value=>draft('put',value)};
})(globalThis);
