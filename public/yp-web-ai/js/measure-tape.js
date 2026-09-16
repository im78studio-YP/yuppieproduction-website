(function(global){
 'use strict';
 const metrics=(a,b)=>({distance:Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z),width:Math.abs(b.x-a.x),depth:Math.abs(b.z-a.z),height:Math.abs(b.y-a.y)});
 const format=value=>Number(value).toFixed(3);
 // Use the displayed floor grid's origin/spacing, not the independent object-placement snap switch.
 function snapFloorGrid(point,grid){
  if(!grid?.enabled||!(grid.step>0)||!point)return null;
  const {step,width,depth,y}=grid;
  if(Math.abs(point.y-y)>.012||point.x<-.000001||point.z<-.000001||point.x>width+.000001||point.z>depth+.000001)return null;
  const snap=(value,length)=>Number((Math.max(0,Math.min(Math.floor(length/step+.000001),Math.round(value/step)))*step).toFixed(6));
  return{x:snap(point.x,width),y,z:snap(point.z,depth)};
 }
 // UI axes match the viewport gizmo: X=width, Y=depth, Z=height (Three.js Y).
 const axisKey=mode=>({x:'x',y:'z',z:'y'})[mode];
 // Classify the measured world-space direction, not its screen projection or selected mode.
 function alignedAxis(a,b){
  if(!a||!b)return 'free';
  const d=metrics(a,b),length=d.distance;
  if(!Number.isFinite(length)||length<1e-6)return 'free';
  const tolerance=Math.min(.0005,length*.001);
  if(Math.hypot(d.depth,d.height)<=tolerance)return 'x';
  if(Math.hypot(d.width,d.height)<=tolerance)return 'y';
  if(Math.hypot(d.width,d.depth)<=tolerance)return 'z';
  return 'free';
 }
 function constrain(a,point,mode){const key=axisKey(mode);return key?{...a,[key]:point[key]}:{...point};}
 function axisParameter(a,origin,direction,mode){
  const key=axisKey(mode);if(!key)return null;
  const dot=direction[key],denominator=1-dot*dot;if(denominator<1e-5)return null;
  const offset={x:origin.x-a.x,y:origin.y-a.y,z:origin.z-a.z};
  const along=offset.x*direction.x+offset.y*direction.y+offset.z*direction.z;
  return (offset[key]-dot*along)/denominator;
 }
 function edges(anchors){
  const groups=new Map(),out=[];
  for(const a of anchors)if(a.kind==='corner'&&a.id.includes('.anchor.corner.')){if(!groups.has(a.targetId))groups.set(a.targetId,[]);groups.get(a.targetId).push(a);}
  for(const corners of groups.values())for(let i=0;i<corners.length;i++)for(let j=i+1;j<corners.length;j++){
   const a=corners[i],b=corners[j],ac=a.id.split('.').slice(-3),bc=b.id.split('.').slice(-3);
   if(ac.filter((v,k)=>v!==bc[k]).length===1)out.push([a,b]);
  }
  return out;
 }
 function create(r,config){
  const T=r.THREE,host=r.host,canvas=r.renderer.domElement,button=document.getElementById('btnMeasureTape');
  const overlay=document.createElement('div');overlay.className='measure-overlay';overlay.hidden=true;
  overlay.innerHTML='<svg aria-hidden="true"><line class="measure-shadow"/><line class="measure-line"/><circle class="measure-a" r="5"/><circle class="measure-b" r="5"/></svg><span class="measure-label"></span>';
  const panel=document.createElement('section');panel.className='measure-panel';panel.hidden=true;panel.setAttribute('aria-label','เทปวัดระยะ');
  panel.innerHTML='<header><b>เทปวัดระยะ</b><button type="button" class="btn" data-measure="close" aria-label="ออกจากโหมดวัดระยะ">×</button></header><p class="measure-status" role="status" aria-live="polite"></p><div class="measure-values"></div><div class="measure-actions"><button type="button" class="btn" data-measure="clear">ล้าง / วัดใหม่</button><button type="button" class="btn" data-measure="close">เสร็จสิ้น</button></div><small>แตะ 2 จุด · Esc ออก · เมาส์ขวาหมุน / ล้อซูม<br>Snap มุม/ขอบ = กรอบชิ้นงาน · วัดผิว = ผิวโมเดลจริง</small>';
  const modes=document.createElement('div');modes.className='measure-modes';modes.setAttribute('role','group');modes.setAttribute('aria-label','ล็อกแนววัดระยะ');
  modes.innerHTML=[['free','อิสระ'],['x','X กว้าง'],['y','Y ลึก'],['z','Z สูง']].map(([mode,label])=>`<button type="button" class="btn" data-measure-axis="${mode}" aria-pressed="${mode==='free'}">${label}</button>`).join('');
  panel.querySelector('header').after(modes);
  const floorButton=document.createElement('button');floorButton.type='button';floorButton.className='btn measure-floor';floorButton.textContent='↓ วัดลงพื้นบูธตรงจุด A';floorButton.hidden=true;
  modes.after(floorButton);
  host.append(overlay,panel);
  const svg=overlay.querySelector('svg'),lines=svg.querySelectorAll('line'),circles=svg.querySelectorAll('circle'),label=overlay.querySelector('.measure-label'),status=panel.querySelector('.measure-status'),values=panel.querySelector('.measure-values');
  let enabled=false,a=null,b=null,hover=null,pressed=null,revision='',anchors=[],segments=[],meshes=[],savedCursor='',lastValue='',mode='free';
  const visible=node=>{for(let n=node;n;n=n.parent)if(!n.visible)return false;return true;};
  function say(text){if(status.textContent!==text)status.textContent=text;}
  function refresh(){
   revision=r.currentKey;anchors=config.anchors();segments=edges(anchors);meshes=[];
   r.boothGroup.traverse(node=>{if(node.isMesh&&!node.userData?.systemHelper&&!node.userData?.anchorGuide&&!/hit-target|scene-ground/.test(node.name))meshes.push(node);});
  }
  function reset(){if(pressed!==null&&canvas.hasPointerCapture(pressed))canvas.releasePointerCapture(pressed);a=b=hover=null;pressed=null;lastValue='';values.replaceChildren();overlay.hidden=true;say('เลือกจุดเริ่ม A บนชิ้นงานหรือพื้น');}
  function close(){enabled=false;reset();panel.hidden=true;overlay.hidden=true;host.classList.remove('measure-mode');canvas.style.cursor=savedCursor;button?.setAttribute('aria-pressed','false');}
  function open(){if(r.pointerDrag)return false;if(enabled){close();return false;}config.start?.();savedCursor=canvas.style.cursor;enabled=true;panel.hidden=false;host.classList.add('measure-mode');canvas.style.cursor='crosshair';button?.setAttribute('aria-pressed','true');reset();refresh();return true;}
  function project(point){const p=point.clone().project(r.camera);return{x:(p.x+1)*host.clientWidth/2,y:(1-p.y)*host.clientHeight/2,z:p.z};}
  function floorPoint(){return a?new T.Vector3(a.x,config.floorY(),a.z):null;}
  function pickAxis(event,targets,rect,threshold){
   const key=axisKey(mode),direction=new T.Vector3();direction[key]=1;
   const t=axisParameter(a,r.raycaster.ray.origin,r.raycaster.ray.direction,mode);
   if(t===null)return null; // A view straight down the chosen axis cannot resolve its length.
   let best=null;
   function offer(point,kind){
    const p=point.clone().project(r.camera);if(p.z < -1||p.z > 1)return;
    const distance=Math.hypot(event.clientX-(rect.left+(p.x+1)*rect.width/2),event.clientY-(rect.top+(1-p.y)*rect.height/2));
    if(distance<=threshold&&(!best||distance<best.distance))best={point,kind,distance};
   }
   if(mode==='z')offer(floorPoint(),'Snap พื้นบูธ · ล็อก Z');
   if(best)return best; // Prefer the exact floor datum over its near-coplanar finish meshes.
   // Intersect the actual axis through A, not a corner elsewhere in the scene.
   for(const sign of [-1,1]){
    const dir=direction.clone().multiplyScalar(sign),origin=a.clone().addScaledVector(dir,.002),ray=new T.Raycaster(origin,dir,0,200);
    for(const hit of ray.intersectObjects(targets,false)){
     const point=new T.Vector3().copy(constrain(a,hit.point,mode));offer(point,'Snap ผิวตามแกน '+mode.toUpperCase());
    }
   }
   if(best)return best;
   if(Math.abs(t)>200)return null;
   return{point:a.clone().addScaledVector(direction,t),kind:'ล็อกแกน '+mode.toUpperCase()};
  }
  function pick(event){
   if(revision!==r.currentKey)refresh();r.camera.updateMatrixWorld();r.boothGroup.updateMatrixWorld(true);r.setRayFromEvent(event);
   const targets=meshes.filter(visible),rect=canvas.getBoundingClientRect(),threshold=event.pointerType==='touch'?24:12,ray=new T.Raycaster();
   if(a&&mode!=='free')return pickAxis(event,targets,rect,threshold);
   const hit=r.raycaster.intersectObjects(targets,false)[0];
   const floor=hit?null:r.floorPoint(event);
   // Snap only the floor that the pointer can actually see; never through foreground objects.
   const grid=mode==='free'?config.floorGrid?.():null;
   const floorHit=!hit||(/floor/.test(hit.object.name)&&hit.face?.normal.clone().transformDirection(hit.object.matrixWorld).y>.99);
   const snapped=floorHit?snapFloorGrid(hit?.point||floor,grid):null;
   if(snapped)return{point:new T.Vector3(snapped.x,snapped.y,snapped.z),kind:'Snap กริดพื้น '+Math.round(grid.step*100)+' ซม.'};
   let best=null;
   function candidate(point,kind,limit){
    const p=point.clone().project(r.camera);if(p.z < -1||p.z > 1)return;
    const distance=Math.hypot(event.clientX-(rect.left+(p.x+1)*rect.width/2),event.clientY-(rect.top+(1-p.y)*rect.height/2));
    if(distance>limit||best&&distance>=best.distance)return;
    // Reject bounds hidden behind another visible physical surface.
    ray.setFromCamera(new T.Vector2(p.x,p.y),r.camera);const hit=ray.intersectObjects(targets,false)[0];
    if(hit&&hit.distance+.015<ray.ray.origin.distanceTo(point))return;
    best={point,kind,distance};
   }
   for(const anchor of anchors)candidate(new T.Vector3(anchor.position.x,anchor.position.y,anchor.position.z),anchor.kind==='corner'?'Snap มุมกรอบ':'Snap จุดกรอบ',threshold);
   if(!best)for(const [start,end] of segments){
    const s=new T.Vector3(start.position.x,start.position.y,start.position.z),e=new T.Vector3(end.position.x,end.position.y,end.position.z),point=new T.Vector3();
    if(s.distanceToSquared(e)<1e-12)continue;r.raycaster.ray.distanceSqToSegment(s,e,new T.Vector3(),point);candidate(point,'Snap ขอบกรอบ',threshold*.7);
   }
   if(best)return best;
   if(hit)return{point:hit.point.clone(),kind:'ผิวโมเดลจริง'};
   return floor&&floor.distanceTo(r.camera.position)<200?{point:floor.clone(),kind:'ระนาบพื้น'}:null;
  }
  function draw(){
   floorButton.hidden=mode!=='z';floorButton.disabled=!a;
   if(!enabled)return;if(revision!==r.currentKey){reset();refresh();say('แบบเปลี่ยนแล้ว กรุณาเลือกจุดวัดใหม่');}
   const end=b||hover?.point,start=a||end;overlay.hidden=!start;if(!start)return;
   const alignment=alignedAxis(a,end);overlay.dataset.axis=alignment;
   const p=project(start),q=end?project(end):p,onscreen=p.z>=-1&&p.z<=1&&q.z>=-1&&q.z<=1;
   svg.style.visibility=label.style.visibility=onscreen?'visible':'hidden';svg.setAttribute('viewBox',`0 0 ${host.clientWidth} ${host.clientHeight}`);
   circles.forEach((c,i)=>{c.setAttribute('cx',i?q.x:p.x);c.setAttribute('cy',i?q.y:p.y);c.style.display=i&&!a?'none':'';});
   for(const line of lines){line.setAttribute('x1',p.x);line.setAttribute('y1',p.y);line.setAttribute('x2',q.x);line.setAttribute('y2',q.y);line.style.display=a&&end?'':'none';}
   label.style.left=Math.max(40,Math.min(host.clientWidth-70,(p.x+q.x)/2))+'px';label.style.top=Math.max(18,Math.min(host.clientHeight-20,(p.y+q.y)/2-16))+'px';
   label.textContent=a&&end?(alignment==='free'?'':alignment.toUpperCase()+' · ')+format(metrics(a,end).distance)+' ม.':hover?.kind||'A';
   if(a&&end){
    const result=metrics(a,end),signature=JSON.stringify(result)+(b?'fixed':'preview');
    if(signature!==lastValue){lastValue=signature;values.replaceChildren();
     for(const [key,name] of [['distance','ระยะตรง'],['width','กว้าง'],['depth','ลึก'],['height','สูง']]){
      const copy=document.createElement('button');copy.type='button';copy.className='btn measure-copy';copy.dataset.metric=key;copy.disabled=!b;copy.textContent=name+' '+format(result[key])+' ม.';copy.title='คัดลอก'+name+' (เมตร)';
      copy.onclick=async()=>{try{await navigator.clipboard.writeText(format(result[key]));say('คัดลอก'+name+' '+format(result[key])+' ม. แล้ว');}catch{say('คัดลอกไม่ได้ กรุณาเลือกตัวเลข '+format(result[key])+' ม.');}};values.append(copy);
     }
    }
   }
  }
  function stop(event){event.preventDefault();event.stopImmediatePropagation();}
  function down(event){if(!enabled||event.target!==canvas||event.button!==0||event.isPrimary===false)return;stop(event);pressed=event.pointerId;canvas.setPointerCapture(event.pointerId);hover=pick(event);draw();}
  function move(event){if(!enabled||event.target!==canvas||event.buttons>1||event.isPrimary===false)return;stop(event);if(b)return;hover=pick(event);say(hover?(a?'เลือกจุดปลาย B · ':'เลือกจุดเริ่ม A · ')+hover.kind:a&&mode!=='free'?'หมุนมุมมองให้เห็นแนวแกน หรือใช้ปุ่มวัดลงพื้น':'เลื่อนเมาส์ไปบนชิ้นงานหรือพื้น');draw();}
  function up(event){if(!enabled||event.pointerId!==pressed)return;stop(event);pressed=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(b)return;
   hover=pick(event);if(!hover)return;if(!a){a=hover.point.clone();say('เลือกจุดปลาย B');}else{b=hover.point.clone();say('ตรึงเส้นแล้ว · กดค่าด้านล่างเพื่อคัดลอก');}draw();}
  function cancel(event){if(event.pointerId===pressed){pressed=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}}
  function chooseMode(next){mode=next;b=hover=null;lastValue='';values.replaceChildren();modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.measureAxis===mode)));say(a?'คงจุด A · เลือกจุด B '+(mode==='free'?'แบบอิสระ':'ตามแกน '+mode.toUpperCase()):'เลือกจุดเริ่ม A บนชิ้นงานหรือพื้น');draw();}
  modes.querySelectorAll('button').forEach(button=>button.onclick=()=>chooseMode(button.dataset.measureAxis));
  floorButton.onclick=()=>{if(!enabled||!a||mode!=='z')return;b=floorPoint();hover=null;say('วัดถึงระนาบพื้นบูธตรงจุด A · X/Y คงเดิม');draw();};
  function key(event){if(!enabled)return;if(event.key==='Escape'){stop(event);close();button?.focus();}else if(['x','y','z'].includes(event.key.toLowerCase())&&!event.ctrlKey&&!event.metaKey&&!event.altKey){stop(event);chooseMode(event.key.toLowerCase());}}
  host.addEventListener('pointerdown',down,true);host.addEventListener('pointermove',move,true);host.addEventListener('pointerup',up,true);host.addEventListener('pointercancel',cancel,true);document.addEventListener('keydown',key,true);
  panel.querySelector('[data-measure="clear"]').onclick=reset;panel.querySelectorAll('[data-measure="close"]').forEach(b=>b.onclick=close);
  return {open,close,update:draw,get enabled(){return enabled;},get result(){return a&&b?metrics(a,b):null;},dispose(){close();host.removeEventListener('pointerdown',down,true);host.removeEventListener('pointermove',move,true);host.removeEventListener('pointerup',up,true);host.removeEventListener('pointercancel',cancel,true);document.removeEventListener('keydown',key,true);overlay.remove();panel.remove();}};
 }
 global.YPMeasureTape={create,metrics,edges,constrain,axisParameter,snapFloorGrid,alignedAxis};
})(globalThis);
