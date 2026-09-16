(function(global){
  'use strict';
  function create(host,canRotate){
    let touch=matchMedia('(pointer:coarse)').matches;
    const bar=document.createElement('div');bar.className='view-controls-guide';
    const hint=document.createElement('span');hint.className='view-controls-hint';bar.append(hint);
    function update(){
      const rotate=canRotate();
      hint.textContent=touch?(rotate?'ลากพื้นที่ว่าง: หมุน · สองนิ้ว: ซูม':'มุมมองด้านตรง · สองนิ้ว: ซูม'):(rotate?'ลากพื้นที่ว่าง: หมุน · ล้อเมาส์: ซูม · คลิกวัตถุ: เลือก':'มุมมองด้านตรง · ล้อเมาส์: ซูม · คลิกวัตถุ: เลือก');
    }
    const detect=e=>{const next=e.pointerType==='touch';if(touch!==next){touch=next;update();}};
    host.addEventListener('pointerdown',detect,true);update();
    return {element:bar,update,dispose(){host.removeEventListener('pointerdown',detect,true);bar.remove();}};
  }
  global.YPViewControlsGuide={create};
})(globalThis);
