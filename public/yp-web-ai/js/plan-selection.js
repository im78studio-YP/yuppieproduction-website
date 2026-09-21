(function(global){
 'use strict';
 // Coordinates use SVG units so selection stays accurate with responsive/letterboxed plans.
 function bind(container){
  container._planSelectionDispose?.();let state=null;
  const point=event=>{const matrix=container.querySelector('svg')?.getScreenCTM();return matrix?new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()):null;};
  function targets(rect){
   const ids=new Set();
   container.querySelectorAll('.plan-object,[data-scene-id="branding.logo.main"]').forEach(node=>{
    const polygon=node.querySelector('.plan-footprint'),id=node.dataset.objectId||node.dataset.sceneId;
    if(!polygon||!sceneItemSelectable(id))return;
    const points=Array.from(polygon.points);
    if(!points.length||!points.every(p=>p.x>=rect.x&&p.x<=rect.x+rect.w&&p.y>=rect.y&&p.y<=rect.y+rect.h))return;
    const obj=objectById(id);
    (obj?.groupId?groupObjectIds(obj.groupId):[id]).forEach(candidate=>{if(sceneItemVisible(candidate)&&sceneItemSelectable(candidate))ids.add(candidate);});
   });return [...ids];
  }
  function clear(){const old=state;state=null;if(!old)return;old.overlay.remove();if(container.hasPointerCapture(old.pointerId))container.releasePointerCapture(old.pointerId);return old;}
  function cancel(event){if(!state)return;event?.preventDefault();event?.stopImmediatePropagation();container._planIgnoreClickUntil=Date.now()+300;clear();}
  const key=event=>{if(event.key==='Escape')cancel(event);};window.addEventListener('keydown',key,true);
  container._planSelectionDispose=()=>{clear();window.removeEventListener('keydown',key,true);container.onpointerdown=container.onpointermove=container.onpointerup=container.onpointercancel=container.onlostpointercapture=null;};
  return{
   down(event){
    const sceneNode=event.target.closest?.('.plan-scene-item'),floor=sceneNode&&['structure.floor.main','branding.graphic.floor'].includes(sceneNode.dataset.sceneId);
    if(event.button!==0||event.isPrimary===false||!event.target.closest?.('svg')||event.target.closest('.plan-object,.plan-logo-placement')||sceneNode&&!floor)return false;
    const start=point(event),svg=container.querySelector('svg');if(!start)return false;
    const overlay=document.createElementNS('http://www.w3.org/2000/svg','g');overlay.setAttribute('pointer-events','none');overlay.classList.add('plan-marquee');
    overlay.innerHTML='<rect fill="#f72585" fill-opacity=".12" stroke="#ff7ab8" stroke-width="1.2" stroke-dasharray="4 3"/><text fill="#fff" stroke="#17111c" stroke-width="3" paint-order="stroke" font-size="10"></text>';svg.append(overlay);
    state={pointerId:event.pointerId,start,clientX:event.clientX,clientY:event.clientY,overlay,moved:false,ids:[],clickedId:floor?sceneNode.dataset.sceneId:null,additive:!!(event.shiftKey||event.ctrlKey||event.metaKey||objectEditor.multiSelect),base:(event.shiftKey||event.ctrlKey||event.metaKey||objectEditor.multiSelect)?selectedSceneItemIds().slice():[]};
    container.setPointerCapture(event.pointerId);event.preventDefault();return true;
   },
   move(event){
    if(!state||event.pointerId!==state.pointerId)return false;const p=point(event);if(!p)return true;
    if(!state.moved&&Math.hypot(event.clientX-state.clientX,event.clientY-state.clientY)<4)return true;state.moved=true;
    const rect={x:Math.min(p.x,state.start.x),y:Math.min(p.y,state.start.y),w:Math.abs(p.x-state.start.x),h:Math.abs(p.y-state.start.y)};
    const box=state.overlay.querySelector('rect');for(const [k,v]of Object.entries({x:rect.x,y:rect.y,width:rect.w,height:rect.h}))box.setAttribute(k,v);
    state.ids=targets(rect);const label=state.overlay.querySelector('text');label.setAttribute('x',rect.x+3);label.setAttribute('y',Math.max(12,rect.y-4));label.textContent='เลือก '+new Set([...state.base,...state.ids]).size+' ชิ้น';event.preventDefault();return true;
   },
   up(event){
    if(!state||event.pointerId!==state.pointerId)return false;
    if(event.type==='pointercancel'||event.type==='lostpointercapture'){cancel();return true;}
    this.move(event);const old=clear();container._planIgnoreClickUntil=Date.now()+300;
    if(!old.moved&&old.clickedId){selectSceneItem(old.clickedId,{additive:old.additive});return true;}
    setObjectSelection([...old.base,...(old.moved?old.ids:[])]);logoEditor.selected=objectEditor.selectedId===SCENE_ASSET_IDS.brand;
    syncObjectControls();if(threeRenderer)threeRenderer.setSceneSelection(selectedSceneItemIds(),objectEditor.selectedId);render();openSelectionEditor();return true;
   }
  };
 }
 global.YPPlanSelection={bind};
})(globalThis);
