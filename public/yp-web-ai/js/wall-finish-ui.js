(function(){
 'use strict';
 const faceFromId=id=>String(id||'').match(/^(?:structure\.wall\.|branding\.graphic\.wall\.)(back|left|right)$/)?.[1]||null;
 let editingFace=null;
 const section=document.getElementById('settingsWall');if(!section)return;
 const note=document.createElement('p');note.className='note';note.id='wallFinishHint';note.setAttribute('role','status');section.querySelector('.sech').after(note);
 const label=section.querySelector('.lbl');if(label)label.textContent='สีผนังทุกด้าน';
 const controls=new Map();
 for(const face of WALL_FACES){const row=document.querySelector('#oWallFaceFinish [data-face="'+face.k+'"]');if(!row)continue;
  const box=document.createElement('div');box.className='wall-face-paint';const color=document.createElement('input');color.type='color';color.id='wallPaint-'+face.k;color.setAttribute('aria-label','สี'+face.n);
  const hex=document.createElement('input');hex.type='text';hex.id='wallPaintHex-'+face.k;hex.maxLength=7;hex.setAttribute('aria-label','รหัสสี'+face.n);hex.setAttribute('enterkeyhint','done');hex.placeholder='#RRGGBB';
  const follow=document.createElement('button');follow.className='btn sm';follow.type='button';follow.textContent='ตามธีม';follow.title='ยกเลิกสีเฉพาะด้านนี้ กลับไปใช้สีตามธีมหรือสีส่วนกลาง';
  const hint=document.createElement('small');hint.className='note';hint.textContent='เลือกสี หรือกรอกรหัสแล้วกด Enter · สีเฉพาะด้านนี้ไม่ถูกธีมทับ';
  color.onchange=()=>paint(face.k,color.value);hex.oninput=()=>{hex.dataset.pending='true';hex.setAttribute('aria-invalid','false');};hex.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();paint(face.k,hex.value);}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hex.dataset.pending='false';hex.setAttribute('aria-invalid','false');syncUI();}};
  follow.onclick=()=>{const before=objectSnapshot();if(S.wallPaintOverrides)delete S.wallPaintOverrides[face.k];hex.dataset.pending='false';recordObjectHistory(before);sync();};
  box.append(color,hex,follow,hint);row.append(box);controls.set(face.k,{row,color,hex,follow});
 }
 function paint(face,value){const entry=controls.get(face),v=String(value).trim();if(!/^#?[\da-f]{6}$/i.test(v)){entry.hex.setAttribute('aria-invalid','true');note.textContent='กรอกรหัสสี 6 หลัก เช่น #F5F5F5 แล้วกด Enter';return false;}
  if(!typ().walls.includes(face))return false;const before=objectSnapshot();S.wallPaintOverrides={...(S.wallPaintOverrides||{}),[face]:(v.startsWith('#')?v:'#'+v).toLowerCase()};
  // Painting removes the sticker layer from view, never the uploaded image data.
  S.wallStickerFaces=(S.wallStickerFaces||[]).filter(k=>k!==face);S.wallMat='paint';
  if(objectEditor.selectedId===registryWallGraphicId(face))setObjectSelection([registryWallId(face)],registryWallId(face));
  entry.hex.dataset.pending='false';entry.hex.setAttribute('aria-invalid','false');recordObjectHistory(before);sync();note.textContent='ใช้สี'+WALL_FACES.find(f=>f.k===face).n+'แล้ว · เก็บภาพสติ๊กเกอร์เดิมไว้ สามารถเลือกกลับได้';return true;
 }
 function syncUI(){controls.forEach(({row,color,hex,follow},face)=>{const value=wallFaceColor(S,face),custom=/^#[\da-f]{6}$/i.test(S.wallPaintOverrides?.[face]||'');color.value=value;if(hex.dataset.pending!=='true')hex.value=value.toUpperCase();follow.disabled=!custom;row.dataset.editing=String(editingFace===face);});}
 function openFace(face){if(!controls.has(face)||!typ().walls.includes(face))return false;editingFace=face;showDockPage('finish',document.querySelector('.dock-tool[data-dock-page="finish"]'));syncUI();
  const title=WALL_FACES.find(f=>f.k===face).n;note.textContent='กำลังตั้งค่า'+title+' · เลือกทาสีหรือสติ๊กเกอร์ได้ โครงสร้างยังล็อกอยู่'+(!sceneItemVisible(registryWallId(face))?' · ผนังระบบด้านนี้ถูกซ่อน ต้องแสดงผนังก่อนจึงจะเห็นสี':'' );
  requestAnimationFrame(()=>{const row=controls.get(face).row;row.scrollIntoView({block:'center',behavior:'smooth'});row.querySelector('.wall-face-options button')?.focus({preventScroll:true});});return true;
 }
 const style=document.createElement('style');style.textContent='.wall-face-paint{grid-column:1/-1;display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:7px;align-items:center}.wall-face-paint input[type=color]{width:40px;height:34px;padding:3px;background:var(--bg3);border:1px solid var(--line);border-radius:7px}.wall-face-paint input[type=text]{width:100%;min-width:0;padding:8px;border:1px solid var(--line);border-radius:7px;background:var(--bg3);color:var(--tx)}.wall-face-paint .note{grid-column:1/-1;font-size:10px}.wall-face-paint [aria-invalid=true]{border-color:#ff607a!important}.wall-face-row[data-editing=true]{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc)}';document.head.append(style);
 window.YPWallFinishUI={faceFromId,openFace,paint,sync:syncUI};syncUI();
})();
