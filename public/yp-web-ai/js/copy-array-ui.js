(function(root){
 'use strict';
 if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
 const dialog=document.createElement('dialog');dialog.id='copyArrayDialog';dialog.setAttribute('aria-labelledby','copyArrayTitle');
 dialog.innerHTML=`<form id="copyArrayForm"><header><strong id="copyArrayTitle">ทำสำเนาตามแกน</strong><button type="button" class="btn" id="copyArrayClose" aria-label="ปิด">×</button></header>
 <p id="copyArraySource"></p><div class="copy-array-grid">
 <label>แกนของบูธ<select id="copyArrayAxis"><option value="x">X · ซ้าย–ขวา</option><option value="y">Y · ขึ้น–ลง</option><option value="z">Z · หลัง–หน้า</option></select></label>
 <label>ทิศทาง<select id="copyArrayDirection"><option value="1">+ บวก</option><option value="-1">− ลบ</option></select></label>
 <label>จำนวนสำเนา (ไม่รวมต้นฉบับ)<input id="copyArrayCount" type="number" min="1" max="100" step="1" value="1" required></label>
 <label>วิธีวัดระยะ<select id="copyArrayMode"><option value="gap">ช่องว่างขอบถึงขอบ</option><option value="step">ระยะเลื่อนต่อชิ้น</option></select></label>
 <label>ระยะห่าง<input id="copyArrayDistance" type="number" min="0" step="any" value="10" required></label>
 <label>หน่วย<select id="copyArrayUnit"><option value="cm">เซนติเมตร</option><option value="m">เมตร</option></select></label></div>
 <p id="copyArraySummary" role="status" aria-live="polite"></p><p id="copyArrayWarning"></p>
 <small>สีชมพูโปร่งใส = สำเนาที่จะสร้าง · ขอบวัดจากกรอบครอบวัตถุตามแกนบูธ รวมการหมุนและ Scale<br>สำเนาปลดจุดยึดเดิม · วางซ้อน/นอกบูธได้ · Undo ครั้งเดียวทั้งชุด</small>
 <footer><button type="button" class="btn" id="copyArrayCancel">ยกเลิก · Esc</button><button type="submit" class="btn pri" id="copyArrayConfirm">สร้างสำเนา · Enter</button></footer></form>`;
 document.body.append(dialog);
 const style=document.createElement('style');style.textContent=`#copyArrayDialog{position:fixed;inset:auto 20px 100px auto;margin:0;width:min(410px,calc(100vw - 24px));box-sizing:border-box;max-height:calc(100dvh - 40px);overflow:auto;padding:18px;background:#17121b;color:#f5eff6;border:1px solid #904466;border-radius:14px;box-shadow:0 12px 48px #0006}#copyArrayDialog::backdrop{background:#0001}#copyArrayDialog header,#copyArrayDialog footer{display:flex;justify-content:space-between;align-items:center;gap:10px}#copyArrayDialog footer{margin-top:16px}#copyArrayDialog p{font-size:12px;line-height:1.5;margin:10px 0}#copyArrayDialog small{font-size:11px;line-height:1.5;color:#bcaebe;display:block}.copy-array-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.copy-array-grid label{display:grid;gap:5px;font-size:11px}.copy-array-grid input,.copy-array-grid select{box-sizing:border-box;width:100%;min-width:0;height:38px;padding:6px 9px;background:#0d0c10;border:1px solid #57405b;border-radius:7px;color:#fff;font:inherit;font-size:13px}#copyArrayDialog :focus-visible{outline:2px solid #ff3297;outline-offset:2px}#copyArrayWarning{color:#ffce85}#copyArraySummary{color:#f798c8}@media(max-width:600px){#copyArrayDialog{inset:auto 12px 12px 12px;width:auto;padding:14px;max-height:66dvh}}`;
 document.head.append(style);
 const $=id=>document.getElementById('copyArray'+id);let session=null;
 const stamp=()=>JSON.stringify({objects:S.objects,graph:S.assetAttachmentGraph,W:S.W,D:S.D,H:S.H,raise:S.raise,active:root.YPProjectWorkspace?.state().active});
 function clearGhost(){if(!session?.ghost)return;session.ghost.removeFromParent();for(const m of session.materials||[])m.dispose();for(const g of session.geometries||[])g.dispose();session.ghost=null;}
 function close(){clearGhost();session=null;dialog.close();document.getElementById('btnDuplicateObject')?.focus();}
 function error(message){$('Summary').textContent=message;$('Confirm').disabled=true;clearGhost();}
 function options(){return Object.fromEntries(['Axis','Direction','Mode','Unit','Count','Distance'].map(k=>[k.toLowerCase(),$(k).value]));}
 function preview(plan){
  clearGhost();const s=session,T=s.renderer.THREE;s.ghost=new T.Group();s.ghost.name='copy-array-preview';s.ghost.userData.editorHelper=true;s.materials=[];s.geometries=[];
  const mat=new T.MeshBasicMaterial({color:'#ff3297',transparent:true,opacity:.30,depthWrite:false,side:T.DoubleSide});s.materials.push(mat);
  const lightPreview=s.meshCount*plan.offsets.length>1500;
  for(const offset of plan.offsets)for(const entry of s.entries){
   let node;
   if(lightPreview){const box=entry.bounds,size=box.getSize(new T.Vector3()),geo=new T.BoxGeometry(size.x,size.y,size.z);s.geometries.push(geo);node=new T.Mesh(geo,mat);box.getCenter(node.position);}
   else{node=entry.node.clone(true);entry.node.matrixWorld.decompose(node.position,node.quaternion,node.scale);const remove=[];node.traverse(part=>{if(part.isLight||part.isLine||part.isSprite)remove.push(part);if(part.isMesh){part.material=mat;part.castShadow=false;part.receiveShadow=false;}part.raycast=()=>{};part.userData={editorHelper:true};});remove.forEach(part=>part.removeFromParent());}
   node.position.add(new T.Vector3(offset.x,offset.y,offset.z));node.raycast=()=>{};s.ghost.add(node);
  }
  s.renderer.scene.add(s.ghost);return lightPreview;
 }
 function update(){
  if(!session)return;
  try{
   if(stamp()!==session.stamp)throw Error('แบบต้นฉบับเปลี่ยนแล้ว กรุณาปิดและเปิดทำสำเนาใหม่');
   const p=YPCopyArray.plan(session.sources,session.bounds,options());session.plan=p;const simple=preview(p);
   $('Summary').textContent=`เพิ่ม ${p.total} ชิ้น (${p.offsets.length} ชุด) · เลื่อนทีละ ${Math.abs(p.step).toFixed(3)} ม. · รวมต้นฉบับ ${session.sources.length+p.total} ชิ้น${simple?' · ใช้พรีวิวกรอบเพื่อลดภาระเครื่อง':''}`;
   const b=session.bounds,last=p.offsets.at(-1),min={...b.min},max={...b.max};for(const a of ['x','y','z']){min[a]+=Math.min(last[a],p.offsets[0][a]);max[a]+=Math.max(last[a],p.offsets[0][a]);}
   const outside=min.x<0||min.y<0||min.z<0||max.x>S.W||max.y>S.H+(Number(S.raise)||0)/100||max.z>S.D;
   let overlaps=Math.abs(p.step)<p.extent-.0001;
   const T=session.renderer.THREE;for(const offset of p.offsets){const box=new T.Box3(new T.Vector3(b.min.x+offset.x,b.min.y+offset.y,b.min.z+offset.z),new T.Vector3(b.max.x+offset.x,b.max.y+offset.y,b.max.z+offset.z));if(session.obstacles.some(other=>box.intersectsBox(other)))overlaps=true;}
   $('Warning').textContent=[outside?'มีสำเนาอยู่นอกขอบ/เหนือความสูงบูธ — สร้างได้ตามตำแหน่งที่กำหนด':'',overlaps?'กรอบสำเนาอาจซ้อนกับวัตถุอื่น — เป็นคำเตือน ไม่ห้ามวาง':''].filter(Boolean).join(' · ');
   $('Confirm').disabled=false;
  }catch(e){error(e.message);}
 }
 async function open(){
  if(session||document.querySelector('dialog[open]'))return;
  const state=root.YPProjectWorkspace?.state();if(state&&(!state.ready||state.busy||state.pendingDraft))return announceCatalog('โปรเจกต์ยังไม่พร้อม กรุณาจัดการหน้าต่างที่ค้างก่อน','error');
  const ids=selectedObjectIds(),sources=ids.map(objectById).filter(Boolean);
  if(!sources.length)return announceCatalog('เลือกอุปกรณ์ในบูธก่อนทำสำเนา','error');
  if(sources.some(o=>objectLocked(o)))return announceCatalog('มีวัตถุที่ล็อกอยู่ กรุณาปลดล็อกก่อน','error');
  const renderer=await loadThreeRenderer();if(session||ids.join('|')!==selectedObjectIds().join('|'))return;renderer.boothGroup.updateMatrixWorld(true);
  const T=renderer.THREE,bounds=new T.Box3(),entries=[],obstacles=[];let meshCount=0;
  for(const source of sources){const node=renderer.objectMeshes.get(source.id);if(!node)return announceCatalog('กำลังโหลดวัตถุ กรุณาลองใหม่','error');const box=new T.Box3().setFromObject(node);if(box.isEmpty())return announceCatalog('ยังอ่านกรอบวัตถุไม่ได้','error');bounds.union(box);entries.push({node,bounds:box});node.traverse(part=>{if(part.isMesh)meshCount++;});}
  for(const [id,node] of renderer.objectMeshes)if(!ids.includes(id)&&node.visible)obstacles.push(new T.Box3().setFromObject(node));
  session={sources:structuredClone(sources),renderer,entries,meshCount,obstacles,bounds:{min:{x:bounds.min.x,y:bounds.min.y,z:bounds.min.z},max:{x:bounds.max.x,y:bounds.max.y,z:bounds.max.z}},stamp:stamp()};
  $('Source').textContent=sources.length===1?selectedAssetName(sources[0]):`เลือก ${sources.length} ชิ้น · คัดลอกเป็นชุดโดยคงระยะภายใน`;
  if(innerWidth<=600)closeDockPanel(false);
  dialog.showModal();update();$('Count').focus();$('Count').select();
 }
 $('Form').onsubmit=e=>{
  e.preventDefault();if(!session||$('Confirm').disabled)return;
  try{
   if(stamp()!==session.stamp)throw Error('แบบต้นฉบับเปลี่ยนแล้ว กรุณาปิดและเปิดทำสำเนาใหม่');
   if(session.sources.some(o=>objectLocked(objectById(o.id))))throw Error('มีวัตถุที่ถูกล็อกแล้ว');
   const plan=YPCopyArray.plan(session.sources,session.bounds,options());plan.objects.forEach(o=>{normalizeSceneObjectModel(o);normalizeObjectAIRule(o,objectCatalogDef(o.catalogId));});
   close();mutateObjects(()=>S.objects.push(...plan.objects),plan.objects.at(-1).id);announceCatalog(`สร้างสำเนา ${plan.total} ชิ้นแล้ว · Undo ครั้งเดียวทั้งชุด`,'success');
  }catch(e){error(e.message);}
 };
 for(const k of ['Axis','Direction','Mode','Count','Distance'])$(k).addEventListener('input',update);
 $('Unit').onchange=()=>{const n=Number($('Distance').value);if(Number.isFinite(n)&&$('Distance').value!=='')$('Distance').value=String(n*($('Unit').value==='m'?.01:100));update();};
 ['Close','Cancel'].forEach(k=>$(k).onclick=close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 addEventListener('resize',()=>{if(dialog.open&&innerWidth<=600)closeDockPanel(false);});
 dialog.addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='Enter'&&e.target.tagName!=='BUTTON'){e.preventDefault();$('Form').requestSubmit();}});
 for(const id of ['btnDuplicateObject','assetListDuplicate']){const b=document.getElementById(id);b.textContent='ทำสำเนา ▾';b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls',dialog.id);}
 root.YPCopyArrayUI={open,close,update};
})(globalThis);
