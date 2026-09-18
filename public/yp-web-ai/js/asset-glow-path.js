(function(global){
 'use strict';
 const selectionCursor='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M2 2 L2 25 L8 19 L13 29 L18 26 L13 17 L22 17 Z" fill="#ff303b" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/></svg>')+'") 2 2, pointer';
 function create({T,mount,canvas,camera,parts,getEntry,onChange,onMessage}){
  const originalCursor=canvas.style.cursor;
  const api=global.YPAssetEdgeGlow,box=document.createElement('div');box.className='asset-glow-path';
  box.innerHTML='<label for="assetGlowPathMode">แนวไฟ</label><select id="assetGlowPathMode"><option value="all">รอบขอบทั้งหมด</option><option value="selected">เลือกขอบทีละเส้น</option><option value="custom">กำหนดจุดบนผิวเอง</option></select><div class="asset-glow-path-actions"><button type="button" class="btn" id="assetGlowPathEdit" aria-pressed="false">เริ่มเลือกแนวไฟ</button><button type="button" class="btn" id="assetGlowPathBreak">จบช่วง / เริ่มช่วงใหม่</button><button type="button" class="btn" id="assetGlowPathUndo">ย้อนเส้นล่าสุด</button><button type="button" class="btn" id="assetGlowPathClear">ล้างแนวที่เลือก</button></div><p id="assetGlowPathHint" class="note" role="status" aria-live="polite"></p>';
  mount.querySelector('label[for=assetPartGlowColor]').before(box);
  const $=id=>box.querySelector('#'+id),mode=$('assetGlowPathMode'),edit=$('assetGlowPathEdit'),hint=$('assetGlowPathHint');
  const ray=new T.Raycaster(),cache=new WeakMap(),viewHint=canvas.parentElement.querySelector('p'),originalHint=viewHint?.textContent;let route=[],editing=false,enabled=false,anchor=null,guides=null,hover=null,marker=null,disposed=false;
  const visible=node=>{for(let n=node;n;n=n.parent)if(!n.visible)return false;return true;};
  const targets=()=>[...new Set(parts.map(e=>e.node))].filter(visible);
  function remove(node){if(!node)return;node.removeFromParent();node.geometry.dispose();node.material.dispose();}
  function clearGuides(){remove(guides);remove(hover);remove(marker);guides=hover=marker=null;}
  function candidates(){const e=getEntry();let bySlot=cache.get(e.node);if(!bySlot){bySlot=new Map();cache.set(e.node,bySlot);}if(!bySlot.has(e.slot)){const geometry=api.edgesFor(T,e),out=[];
   if(geometry){const p=geometry.attributes.position;for(let i=0;i+1<p.count;i+=2)out.push([[p.getX(i),p.getY(i),p.getZ(i)],[p.getX(i+1),p.getY(i+1),p.getZ(i+1)]]);geometry.dispose();}bySlot.set(e.slot,out);}return bySlot.get(e.slot);}
  function line(points,color){const geometry=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),node=new T.LineSegments(geometry,new T.LineBasicMaterial({color,depthTest:true,transparent:true,opacity:.9,depthWrite:false}));node.userData.systemHelper=true;node.raycast=()=>{};node.renderOrder=8;getEntry().node.add(node);return node;}
  function refresh(){
   const all=mode.value==='all';mode.disabled=!enabled;edit.disabled=!enabled||all;edit.textContent=editing?'หยุดเลือกแนวไฟ':'เริ่มเลือกแนวไฟ';edit.setAttribute('aria-pressed',String(editing));
   $('assetGlowPathBreak').hidden=mode.value!=='custom';$('assetGlowPathBreak').disabled=!enabled||!anchor;
   $('assetGlowPathUndo').disabled=$('assetGlowPathClear').disabled=!enabled||(!route.length&&!anchor)||all;
   hint.textContent=all?'เปิดไฟตามขอบทั้งหมดของชิ้นส่วน':(mode.value==='selected'?'คลิกขอบเพื่อเพิ่ม/ยกเลิก · เส้นเหลืองคือขอบที่ชี้':'คลิกจุดบนผิวเดียวกันต่อเนื่องเพื่อวางแนวไฟ · ไม่ต้องมีขอบเดิม')+' · '+route.length+' เส้น'+(editing?' · ลากเพื่อหมุนภาพได้':' · กดเริ่มเลือกแนวไฟก่อน');
   canvas.style.cursor=editing?selectionCursor:originalCursor;
   if(viewHint)viewHint.textContent=editing?(mode.value==='selected'?'คลิกขอบเพื่อเพิ่ม/ยกเลิกแนวไฟ · ลากหมุนภาพ':'คลิกจุดต่อกันบนผิวชิ้นส่วนที่เลือก · ลากหมุนภาพ'):originalHint;
  }
  function start(value){editing=value;anchor=null;clearGuides();if(editing&&mode.value==='selected')guides=line(candidates().flat(),0x798999);refresh();}
  function changed(){onChange();refresh();}
  mode.onchange=()=>{start(false);route=[];if(mode.value!=='all'&&enabled)start(true);changed();};
  edit.onclick=()=>start(!editing);
  $('assetGlowPathBreak').onclick=()=>{anchor=null;remove(marker);marker=null;refresh();};
  $('assetGlowPathUndo').onclick=()=>{route.pop();anchor=null;remove(marker);marker=null;changed();};
  $('assetGlowPathClear').onclick=()=>{route=[];anchor=null;remove(marker);marker=null;changed();};
  function project(point,rect){const p=point.clone().project(camera);return {x:(p.x+1)*rect.width/2+rect.left,y:(1-p.y)*rect.height/2+rect.top,z:p.z};}
  function nearest(event){
   const e=getEntry(),rect=canvas.getBoundingClientRect(),threshold=event.pointerType==='touch'?22:13;let best=null;
   camera.updateMatrixWorld();e.node.updateWorldMatrix(true,false);
   ray.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),camera);
   const occluders=targets();
   for(const pair of candidates()){
    const a=e.node.localToWorld(new T.Vector3(...pair[0])),b=e.node.localToWorld(new T.Vector3(...pair[1])),point=new T.Vector3();
    ray.ray.distanceSqToSegment(a,b,new T.Vector3(),point);const p=project(point,rect);if(p.z<-1||p.z>1)continue;
    const distance=Math.hypot(p.x-event.clientX,p.y-event.clientY);if(distance>threshold||best&&distance>=best.distance)continue;
    const check=new T.Raycaster();check.setFromCamera(new T.Vector2((p.x-rect.left)/rect.width*2-1,1-(p.y-rect.top)/rect.height*2),camera);
    const hit=check.intersectObjects(occluders,false)[0];if(hit&&hit.distance+.002<check.ray.origin.distanceTo(point))continue;
    best={pair,distance};
   }return best?.pair;
  }
  function move(event){if(!editing||mode.value!=='selected'||event.buttons)return;const pair=nearest(event);remove(hover);hover=pair?line(pair,0xffbf40):null;}
  canvas.addEventListener('pointermove',move);
  function onSurface(e,p,normal,tolerance){
   const world=e.node.localToWorld(p.clone()),direction=normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(e.node.matrixWorld)),scale=e.node.getWorldScale(new T.Vector3()),epsilon=tolerance*Math.max(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z));
   const check=new T.Raycaster(world.clone().addScaledVector(direction,epsilon*4),direction.negate(),0,epsilon*8);
   return check.intersectObject(e.node,false).some(hit=>(hit.face?.materialIndex||0)===e.slot&&hit.point.distanceTo(world)<epsilon*2);
  }
  function click(event,hit){
   if(!editing)return false;
   const e=getEntry();
   if(mode.value==='selected'){
    const pair=nearest(event);if(!pair){onMessage('ไม่พบขอบที่ชี้ ลองหมุนภาพ หรือใช้โหมดกำหนดจุดบนผิวเอง');return true;}
    const key=api.segmentKey(pair),i=route.findIndex(p=>api.segmentKey(p)===key);
    if(i>=0)route.splice(i,1);else if(route.length<512)route.push(pair.map(p=>[...p]));changed();return true;
   }
   if(!hit||hit.object!==e.node||(hit.face?.materialIndex||0)!==e.slot){onMessage('คลิกบนผิวชิ้นส่วนที่เลือกอยู่เท่านั้น หรือเปลี่ยนชิ้นส่วนจากรายการ');return true;}
   const p=e.node.worldToLocal(hit.point.clone()),normal=hit.face.normal.clone().normalize();
   e.node.geometry.computeBoundingBox();const diagonal=e.node.geometry.boundingBox.getSize(new T.Vector3()).length(),tolerance=Math.max(diagonal*1e-5,1e-6);
   if(anchor){
    if(p.distanceTo(anchor.point)<tolerance){onMessage('เลือกจุดถัดไปให้ห่างจากจุดเริ่ม');return true;}
    if(Math.abs(anchor.normal.dot(normal))<.999||Math.abs(p.clone().sub(anchor.point).dot(anchor.normal))>tolerance){onMessage('กำหนดแนวบนผิวระนาบเดียวกันก่อน หรือกดจบช่วงเพื่อเริ่มบนผิวอื่น');return true;}
    // Sample the surface to reject a chord through a hole or outside the selected panel.
    for(let i=1;i<24;i++)if(!onSurface(e,anchor.point.clone().lerp(p,i/24),anchor.normal,tolerance)){onMessage('เส้นนี้พาดผ่านช่องว่างหรือออกนอกผิว กรุณาแบ่งเป็นช่วงสั้นลง');return true;}
    if(route.length>=512){onMessage('กำหนดได้สูงสุด 512 เส้นต่อชิ้นส่วน');return true;}
    route.push([anchor.point.toArray(),p.toArray()]);
   }
   anchor={point:p,normal};remove(marker);marker=new T.Points(new T.BufferGeometry().setFromPoints([p]),new T.PointsMaterial({color:0xffbf40,size:9,sizeAttenuation:false,depthTest:true}));marker.raycast=()=>{};marker.userData.systemHelper=true;e.node.add(marker);changed();onMessage('เพิ่มจุดแล้ว · คลิกจุดถัดไป หรือกดจบช่วง / เริ่มช่วงใหม่');return true;
  }
  return{click,settings:()=>({pathMode:mode.value,segments:api.segments(route)}),incomplete:()=>!!(enabled&&anchor&&!route.length),
   select(value,on){enabled=on;mode.value=value?.pathMode||'all';route=api.segments(value?.segments);start(false);},
   setEnabled(on){enabled=on;if(!on)start(false);refresh();},
   dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('pointermove',move);clearGuides();canvas.style.cursor=originalCursor;box.remove();}
  };
 }
 global.YPAssetGlowPath={create,selectionCursor};
})(globalThis);
