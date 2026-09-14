(function(root){
 'use strict';
 if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
 const actions=['btnRotateObject','btnFlipObjectX','btnFlipObjectY','btnFlipObjectZ'].map(id=>document.getElementById(id));
 if(actions.some(node=>!node))return;
 const trigger=document.createElement('button');trigger.id='btnRotateMenu';trigger.type='button';trigger.className='btn';trigger.textContent='↻ หมุน ▾';
 trigger.title='หมุนและกลับด้าน';trigger.setAttribute('aria-label','หมุน');trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','rotateSubmenu');
 actions[0].before(trigger);
 const menu=document.createElement('div');menu.id='rotateSubmenu';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-labelledby',trigger.id);
 // Move the original controls intact: handlers, selection policies and Undo stay shared.
 for(const action of actions){action.setAttribute('role','menuitem');action.tabIndex=-1;menu.append(action);}
 document.body.append(menu);
 const style=document.createElement('style');style.textContent=`#rotateSubmenu{position:fixed;z-index:180;width:210px;max-width:calc(100vw - 24px);box-sizing:border-box;padding:8px;background:#17131b;border:1px solid #824362;border-radius:12px;box-shadow:0 12px 36px #0006;display:grid;gap:4px}#rotateSubmenu[hidden]{display:none}#rotateSubmenu .btn{width:100%;min-height:44px;text-align:left;justify-content:flex-start;padding:10px 12px;font-size:13px}#rotateSubmenu .btn:before{content:none}#rotateSubmenu .btn:focus-visible,#btnRotateMenu:focus-visible{outline:2px solid #ff3297;outline-offset:2px}#btnRotateMenu[aria-expanded=true]{border-color:#f72585;background:#f7258526;color:#ff99c5}@media(max-width:360px){.canvas-object-toolbar #btnRotateMenu{width:auto;min-width:65px;font-size:10px}}`;
 // Rotation and all three mirror axes live together, including in the basic toolbar.
 style.textContent+='body[data-editor-level=basic] #rotateSubmenu #btnFlipObjectX,body[data-editor-level=basic] #rotateSubmenu #btnFlipObjectY{display:flex!important}';
 document.head.append(style);let selected=null;
 const signature=()=>JSON.stringify({ids:selectedSceneItemIds(),primary:objectEditor.selectedId,active:root.YPProjectWorkspace?.state().active});
 function close(focus=false){menu.hidden=true;selected=null;trigger.setAttribute('aria-expanded','false');if(focus&&!trigger.disabled)trigger.focus();}
 function position(){if(menu.hidden)return;const rect=trigger.getBoundingClientRect(),height=menu.offsetHeight,width=menu.offsetWidth;
  menu.style.left=Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px';menu.style.top=Math.max(12,Math.min(rect.top-height-8,innerHeight-height-12))+'px';}
 function sync(){trigger.disabled=actions.every(action=>action.disabled);if(!menu.hidden){if(trigger.disabled||selected!==signature()){close();return;}position();}}
 function open(last=false){sync();if(trigger.disabled||document.querySelector('dialog[open],.modal.show'))return;root.YPResizeSubmenu?.close();selected=signature();menu.hidden=false;trigger.setAttribute('aria-expanded','true');position();const enabled=actions.filter(a=>!a.disabled);(last?enabled.at(-1):enabled[0])?.focus();}
 trigger.onclick=()=>menu.hidden?open():close(true);
 trigger.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open(event.key==='ArrowUp');}});
 menu.addEventListener('click',event=>{if(actions.some(action=>action.contains(event.target)&&!action.disabled))close(true);});
 menu.addEventListener('keydown',event=>{
  const enabled=actions.filter(action=>!action.disabled),index=enabled.indexOf(document.activeElement);
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
  else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const target=event.key==='Home'?0:event.key==='End'?enabled.length-1:(index+(event.key==='ArrowDown'?1:-1)+enabled.length)%enabled.length;enabled[target]?.focus();}
  else if(event.key==='Tab')close(true);
 });
 document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!trigger.contains(event.target))close();},true);
 root.addEventListener('yp:asset-editor-sync',sync);root.addEventListener('resize',position);root.addEventListener('scroll',position,true);sync();
 root.YPRotateSubmenu={open,close};
})(globalThis);
