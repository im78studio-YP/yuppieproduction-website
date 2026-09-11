(function(){
 'use strict';if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
 const dialog=document.createElement('dialog');dialog.id='assetReplace';dialog.setAttribute('aria-labelledby','replaceTitle');
 dialog.innerHTML=`<header><div><h2 id="replaceTitle">เปลี่ยนอุปกรณ์</h2><p id="replaceSource"></p></div><button class="btn" id="replaceClose" aria-label="ปิด">×</button></header>
 <div class="replace-body"><section class="replace-preview"><iframe title="พรีวิวอุปกรณ์ใหม่ในบูธ" id="replaceFrame"></iframe><p id="replaceStatus" role="status" aria-live="polite"></p><button class="btn" id="replaceRetry" hidden>ลองโหลดพรีวิวอีกครั้ง</button></section>
 <section class="replace-library"><label for="replaceSearch">ค้นหาในคลังอุปกรณ์</label><input id="replaceSearch" type="search" placeholder="ชื่ออุปกรณ์ เช่น เคาน์เตอร์"><label for="replaceCategory">หมวดอุปกรณ์</label><select id="replaceCategory"></select><div id="replaceCatalog"></div></section></div>
 <footer><div><b id="replaceChoice">เลือกอุปกรณ์ใหม่จากคลัง</b><p>คงจุดกึ่งกลางฐานและมุมหมุนเดิม · ใช้ขนาดจริงของชิ้นใหม่<br>สี โลโก้ และรูปทรงใช้ของชิ้นใหม่ · ยกเลิกจุดยึดกับชิ้นเดิม แต่ไม่ลบชิ้นอื่น</p></div><div class="replace-actions"><button class="btn" id="replaceCancel">ยกเลิก</button><button class="btn primary" id="replaceConfirm" disabled>ยืนยันเปลี่ยนอุปกรณ์</button></div></footer>`;
 document.body.append(dialog);
 const $=id=>dialog.querySelector('#'+id),clone=v=>structuredClone(v);let session=null;
 const close=()=>{if(session?.timer)clearTimeout(session.timer);session=null;$('replaceFrame').removeAttribute('src');dialog.close();document.getElementById('btnReplaceObject')?.focus();};
 ['replaceClose','replaceCancel'].forEach(id=>$(id).onclick=close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 // Keep editor shortcuts from deleting or moving the original behind this modal.
 addEventListener('keydown',e=>{if(!dialog.open)return;if(e.key==='Escape'){e.preventDefault();close();}if(e.key!=='Tab')e.stopImmediatePropagation();},true);
 function status(message){$('replaceStatus').textContent=message;}
 function renderCatalog(){
  const query=$('replaceSearch').value.trim().toLocaleLowerCase(),category=$('replaceCategory').value;const list=$('replaceCatalog');list.replaceChildren();
  const items=session.items.filter(item=>(!category||item.category===category)&&(item.name||'').toLocaleLowerCase().includes(query));
  if(!items.length){list.textContent='ไม่พบอุปกรณ์ ลองเปลี่ยนคำค้นหรือเลือกทุกหมวด';return;}
  items.forEach(item=>{const b=document.createElement('button');b.type='button';b.className='catalog-item';b.dataset.replaceId=item.catalogId;b.setAttribute('aria-pressed',String(session.next?.catalogId===item.catalogId));
   const media=document.createElement('span');media.className='catalog-icon';media.textContent=item.icon||'◇';if(item.thumbUrl){const img=document.createElement('img');img.className='catalog-thumb';img.src=item.thumbUrl;img.alt='';img.loading='lazy';img.onerror=()=>img.remove();media.append(img);}
   const copy=document.createElement('span');copy.className='catalog-copy';const name=document.createElement('b');name.textContent=item.name;const size=document.createElement('small');size.textContent=`${item.size.w} × ${item.size.d} × ${item.size.h} ม.`;copy.append(name,size);b.append(media,copy);b.onclick=()=>choose(item);list.append(b);
  });
 }
 function pump(){
  const s=session;if(!s||!s.ready||s.busy||!s.pending)return;const pending=s.pending;s.pending=null;s.busy=true;s.sent=pending.revision;
  $('replaceFrame').contentWindow.postMessage({channel:'yp-mixer',token:s.token,type:'render',...pending},location.origin);
  clearTimeout(s.timer);s.timer=setTimeout(()=>{if(session===s){s.failed=true;$('replaceRetry').hidden=false;status('โหลดพรีวิวไม่สำเร็จ กดลองโหลดอีกครั้ง · แบบเดิมยังไม่เปลี่ยน');}},60000);
 }
 function queue(snapshot){session.revision++;session.pending={snapshot,revision:session.revision};session.failed=false;$('replaceConfirm').disabled=true;$('replaceRetry').hidden=true;status('กำลังสร้างพรีวิว · ยังไม่เปลี่ยนแบบจริง');pump();}
 function choose(item){
  try{const s=session,next=makeReplacementObject(s.source,item.catalogId);if(!next)throw Error('ไม่พบอุปกรณ์นี้ในคลัง');s.next=next;
   const snapshot=clone(s.snapshot);clearReplacementLinks(snapshot.spec,s.source.id);snapshot.spec.objects[snapshot.spec.objects.findIndex(o=>o.id===s.source.id)]=clone(next);
   if(item.file&&!snapshot.assets.some(a=>a.id===item.catalogId))snapshot.assets.push({id:item.catalogId,name:item.name,size:{...item.size},file:item.file});s.previewSnapshot=snapshot;
   $('replaceChoice').textContent=`${item.name} · ${next.size.w} × ${next.size.d} × ${next.size.h} ม.`;renderCatalog();queue(snapshot);
  }catch(e){status(e.message);$('replaceConfirm').disabled=true;}
 }
 function startFrame(){const s=session;s.ready=false;s.busy=false;s.failed=false;clearTimeout(s.timer);s.token=crypto.randomUUID();const url=new URL(location.href);url.search='';url.searchParams.set('comparePreview','1');url.searchParams.set('mixToken',s.token);$('replaceFrame').src=url.href;
  s.timer=setTimeout(()=>{if(session===s){s.failed=true;$('replaceRetry').hidden=false;status('โหลดพรีวิวไม่สำเร็จ กดลองโหลดอีกครั้ง');}},60000);
 }
 $('replaceRetry').onclick=()=>{const s=session;s.pending={snapshot:clone(s.previewSnapshot||s.snapshot),revision:++s.revision};status('กำลังโหลดพรีวิวอีกครั้ง');$('replaceRetry').hidden=true;startFrame();};
 addEventListener('message',e=>{const s=session,m=e.data;if(!s||e.origin!==location.origin||e.source!==$('replaceFrame').contentWindow||m?.channel!=='yp-mixer'||m.token!==s.token)return;
  if(m.type==='ready'){clearTimeout(s.timer);s.ready=true;pump();}
  else if(m.type==='rendered'||m.type==='error'){clearTimeout(s.timer);s.busy=false;if(m.revision===s.revision){
   s.failed=m.type==='error';$('replaceConfirm').disabled=!s.next||s.failed;$('replaceRetry').hidden=!s.failed;status(s.failed?'พรีวิวไม่สำเร็จ: '+m.message:s.next?'พรีวิวพร้อม · หมุนภาพเพื่อตรวจสอบ แล้วกดยืนยันเพื่อเปลี่ยน':'แบบปัจจุบัน · เลือกอุปกรณ์ใหม่จากคลัง');
   if(!s.failed&&s.next)$('replaceFrame').contentWindow.postMessage({channel:'yp-mixer',token:s.token,type:'highlight',ids:[s.source.id]},location.origin);
  }pump();}
 });
 $('replaceSearch').oninput=renderCatalog;$('replaceCategory').onchange=renderCatalog;
 $('replaceConfirm').onclick=()=>{const s=session;if(!s?.next||s.busy||s.failed||$('replaceConfirm').disabled)return;try{
  if(YPProjectWorkspace.state().active!==s.active)throw Error('แบบ A/B เปลี่ยนไปแล้ว กรุณาเลือกอุปกรณ์ใหม่');
  commitReplacementObject(s.sourceText,s.next);close();
 }catch(e){status(e.message);$('replaceConfirm').disabled=true;}};
 window.YPAssetReplaceUI={open(){
  const source=objectById(objectEditor.selectedId);if(!source||objectLocked(source)){announceCatalog('เลือกอุปกรณ์ที่ไม่ได้ล็อกก่อนเปลี่ยน','error');return false;}
  if(source.groupId||selectedSceneItemIds().length!==1){announceCatalog('เลือกอุปกรณ์เพียง 1 ชิ้น · ถ้าอยู่ใน Group ให้กด Ungroup ก่อน','error');return false;}
  const snapshot=YPProjectBridge.capture();session={source:clone(source),sourceText:JSON.stringify(source),snapshot,active:YPProjectWorkspace.state().active,items:allObjectCatalog().filter(i=>!i.hiddenFromCatalog),next:null,revision:0,ready:false,busy:false};
  const select=$('replaceCategory');select.replaceChildren(new Option('ทุกหมวด',''));const cats=[...new Set(session.items.map(i=>i.category))];cats.forEach(k=>select.add(new Option(FURNITURE_CATEGORIES.find(c=>c.k===k)?.n||'My Asset / อื่น ๆ',k)));
  select.value=objectCatalogDef(source.catalogId)?.category||'';$('replaceSearch').value='';$('replaceSource').textContent='แทนที่: '+selectedAssetName(source);$('replaceChoice').textContent='เลือกอุปกรณ์ใหม่จากคลัง';$('replaceConfirm').disabled=true;$('replaceRetry').hidden=true;
  renderCatalog();dialog.showModal();queue(clone(snapshot));startFrame();$('replaceSearch').focus();return true;
 }};
})();
