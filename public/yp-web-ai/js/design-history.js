(function(root){
 'use strict';
 // Session-only edit history. File/Blob references stay with the snapshots so
 // undoing deletion/reset can restore uploaded GLBs as well as their surfaces.
 function signature(snapshot){
  const s={...snapshot.spec};if(s.aiRendering)s.aiRendering={...s.aiRendering};
  for(const key of ['view','logoVisibleBounds','sceneAssetRegistry','sceneSnapData'])delete s[key];
  if(s.aiRendering)for(const key of ['camera','cameraViewType','preview','renderPackage'])delete s.aiRendering[key];
  return JSON.stringify({spec:s,assets:(snapshot.assets||[]).map(a=>({id:a.id,name:a.name,size:a.size,tags:a.tags,catalogPromotion:a.catalogPromotion,file:a.file&&{name:a.file.name,size:a.file.size,type:a.file.type,lastModified:a.file.lastModified}}))},(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(k=>[k,value[k]])):value);
 }
 function create(limit=50,maxBytes=64*1024*1024){
  let active='A';const banks=new Map(),copy=structuredClone;
  const bank=()=>banks.get(active);
  function activate(slot,snapshot){active=slot;if(!banks.has(slot))banks.set(slot,{past:[],future:[],current:copy(snapshot),key:signature(snapshot)});else {bank().current=copy(snapshot);bank().key=signature(snapshot);}}
  function record(snapshot){const b=bank();if(!b)return false;const key=signature(snapshot);if(b.key===key){b.current=copy(snapshot);return false;}
   b.past.push({value:b.current,bytes:b.key.length*2});while(b.past.length>1&&(b.past.length>limit||b.past.reduce((sum,s)=>sum+s.bytes,0)>maxBytes))b.past.shift();b.current=copy(snapshot);b.key=key;b.future=[];return true;}
  function move(direction,restore){const b=bank(),from=direction==='undo'?b?.past:b?.future,to=direction==='undo'?b?.future:b?.past;if(!from?.length)return false;
   const next=copy(from.at(-1).value);restore(next); // Do not consume history if restoration fails.
   from.pop();to.push({value:b.current,bytes:b.key.length*2});b.current=next;b.key=signature(next);return true;}
  return {activate,record,move,reset(slot,snapshot){banks.clear();activate(slot,snapshot);},state(){const b=bank();return{active,undo:b?.past.length||0,redo:b?.future.length||0};},current:()=>bank()?.current,key:()=>bank()?.key,signature};
 }
 function mount({bridge,available,onRestored}){
  const engine=create(),restart=document.getElementById('projectReset'),host=document.createElement('span');host.className='design-history-actions';host.setAttribute('role','group');host.setAttribute('aria-label','ประวัติการแก้ไขบูธ');
  host.innerHTML='<button id="projectUndo" type="button" class="btn sm" title="ย้อนกลับ (Ctrl/Cmd+Z)" disabled>↶ ย้อนกลับ</button><button id="projectRedo" type="button" class="btn sm" title="ทำซ้ำ (Ctrl/Cmd+Shift+Z หรือ Ctrl+Y)" disabled>↷ ทำซ้ำ</button>';restart.after(host);
  let pending=null,pendingKey='',timer=0,held=false,restoring=false,initialized=false;
  function state(){const s=engine.state(),different=pending&&pendingKey!==engine.key();return{...s,undo:s.undo+(different?1:0),redo:different?0:s.redo};}
  function update(){const s=state(),enabled=initialized&&available()&&!restoring;
   for(const [id,count] of [['projectUndo',s.undo],['btnUndoObject',s.undo],['projectRedo',s.redo],['btnRedoObject',s.redo]]){const b=document.getElementById(id);if(b)b.disabled=!enabled||!count;}
  }
  function flush(){clearTimeout(timer);if(pending){engine.record(pending);pending=null;pendingKey='';}update();}
  function observe(){if(!initialized||restoring||!available())return;pending=bridge.capture();pendingKey=signature(pending);clearTimeout(timer);if(!held)timer=setTimeout(flush,450);update();}
  function navigate(direction){if(!initialized||!available()||held||restoring)return false;flush();restoring=true;
   try{const moved=engine.move(direction,snapshot=>{
     const current=bridge.capture();snapshot.spec.view=current.spec.view;
     if(snapshot.spec.aiRendering&&current.spec.aiRendering){snapshot.spec.aiRendering.camera=current.spec.aiRendering.camera;snapshot.spec.aiRendering.cameraViewType=current.spec.aiRendering.cameraViewType;}
     bridge.restore(snapshot);
    });if(moved)onRestored();return moved;
   }catch(error){console.error('History restore failed',error);return false;}finally{restoring=false;update();}
  }
  document.getElementById('projectUndo').onclick=()=>navigate('undo');document.getElementById('projectRedo').onclick=()=>navigate('redo');
  // Flush the preceding action before a new gesture; coalesce a full drag/slider.
  document.addEventListener('pointerdown',()=>{flush();held=true;},true);
  const end=()=>{held=false;setTimeout(flush,0);};document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);window.addEventListener('blur',end);
  document.addEventListener('click',()=>{if(!held)setTimeout(flush,0);});
  document.addEventListener('change',()=>{if(!held)setTimeout(flush,0);});
  document.addEventListener('focusout',()=>{if(!held)setTimeout(flush,0);});
  return {observe,flush,update,state,undo:()=>navigate('undo'),redo:()=>navigate('redo'),
   reset(slot,snapshot){pending=null;clearTimeout(timer);engine.reset(slot,snapshot);initialized=true;update();},
   applied(kind,slot,before,after){flush();if(kind==='reset')engine.reset(slot,after);else{engine.activate(slot,kind==='edit'?before:after);if(kind==='edit')engine.record(after);}initialized=true;update();}
  };
 }
 root.YPDesignHistory={create,signature,mount};
})(globalThis);
