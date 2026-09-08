(function(root){
  'use strict';
  const panel=(x,z,w,d,h,color,y=0)=>({catalogId:'panel-standard',position:{x,y,z},size:{w,d,h},color});
  const part=(catalogId,x,z,w,d,h,color,y=0,rotationY=0)=>({...panel(x,z,w,d,h,color,y),catalogId,rotationY});
  const templates=[{id:'corner-timber-lounge',name:'01 · Timber Lounge',tagline:'โครงไม้ + มุมนั่งคุย + เคาน์เตอร์บาร์',description:'ผนังโทนดำ–ไม้ ระแนงตกแต่ง เสาไม้แบ่งโซน มุมนั่งคุยด้านหน้า และเคาน์เตอร์บาร์พร้อมสตูล 4 ที่นั่ง เลือกหัวมุมซ้าย–ขวาเพื่อสลับผังได้',primary:'#333d38',secondary:'#c5a66e',background:'#333d38',floor:'tile',tile:'woodL',purpose:'meeting',
    objects:[panel(2.55,1.25,.4,.42,2.4,'#c5a66e'),panel(1.415,1.25,1.87,.38,.32,'#333d38',2.08),panel(.39,.76,.18,1.04,2.4,'#c5a66e'),
      ...Array.from({length:15},(_,i)=>panel(.66+i*.105,.39,.036,.07,2.04,'#c5a66e')),
      panel(2.55,1.478,.29,.025,.24,'#1d2928',1.18),part('counter-standard',4.3,.72,2.55,.52,.98,'#f1eee7'),
      ...[3.36,3.98,4.6,5.22].map(x=>part('bar-stool',x,1.37,.37,.37,.9,null,0,180)),
      panel(4.23,.36,1.12,.08,.65,'#151b1a',1.23),panel(4.23,.407,1,.014,.53,'#294644',1.29),part('panel-rounded',5.2,.42,.38,.045,.38,'#bea357',1.43),
      panel(.85,2.21,.54,.58,.44,'#26322d'),panel(2.08,2.21,.54,.58,.44,'#26322d'),part('table-standard',1.46,2.2,.54,.46,.51,'#d4c3a0'),
      part('chair-standard',1.36,.82,.44,.44,.78,'#a3a69b'),part('chair-standard',2.03,.82,.44,.44,.78,'#a3a69b')]}];
  function mirror(spec,side){
    if(!['left','right'].includes(side))throw new Error('กรุณาเลือกหัวมุมซ้ายหรือขวา');
    const out=structuredClone(spec);if(out.cornerSide===side)return out;
    if(out.assetAttachmentGraph?.attachments?.length)throw new Error('โปรดปลดจุดยึดชิ้นงานที่เพิ่มไว้ก่อนสลับหัวมุม เพื่อไม่ให้จุดยึดผิดตำแหน่ง');
    const flip=a=>(360-(Number(a)||0)%360)%360;
    for(const o of out.objects||[]){o.position.x=out.W-o.position.x;o.rotationY=flip(o.rotationY);o.rotationZ=flip(o.rotationZ);}
    const swap=face=>face==='left'?'right':face==='right'?'left':face;
    if(out.wallStickers)[out.wallStickers.left,out.wallStickers.right]=[out.wallStickers.right,out.wallStickers.left];
    if(out.wallStickerFaces)out.wallStickerFaces=out.wallStickerFaces.map(swap);
    if(out.logoWall==='back'||!out.logoWall){if(Number.isFinite(out.logoWallU))out.logoWallU=out.W-out.logoWallU;}else out.logoWall=swap(out.logoWall);
    if(out.stPos==='left'||out.stPos==='right')out.stPos=swap(out.stPos);
    if(out.stDoor==='left'||out.stDoor==='right')out.stDoor=swap(out.stDoor);
    out.cornerSide=side;return out;
  }
  function build(id,initial,catalog,side='right'){
    const t=templates.find(t=>t.id===id);if(!t)throw new Error('ไม่พบเทมเพลตบูธหัวมุม');
    let spec=structuredClone(initial);Object.assign(spec,{W:6,D:3,H:2.4,type:'corner',cornerSide:'right',primary:t.primary,secondary:t.secondary,colTouched:true,secTouched:true,wallCol:'white',wallMat:'paint',floor:t.floor,tile:t.tile,raise:0,stSize:'none',logoWall:'back',logoMount:'wall',sideLogo:false,logoWallU:4.2,logoWallY:1.98,logoScale:22,nameScale:0,designPurpose:t.purpose,boothTemplate:{id:t.id,type:'corner',name:t.name,version:1},objects:[],view:'three'});
    spec.objects=t.objects.map((o,i)=>{const item=catalog.find(c=>c.catalogId===o.catalogId);if(!item)throw new Error('ไม่พบอุปกรณ์ '+o.catalogId);return {id:t.id+'-'+i,catalogId:item.catalogId,type:item.type,position:{...o.position},size:{...o.size},rotationX:0,rotationY:o.rotationY||0,rotationZ:0,locked:false,orientation:'horizontal',geometryMode:'parametric',unitPrice:item.unitPrice,appearance:o.color?{mode:'solid',color:o.color}:{mode:'original'}};});
    if(side!=='right')spec=mirror(spec,side);return {spec,assets:[]};
  }
  root.YPCornerTemplates={templates,build,mirror};
})(globalThis);
