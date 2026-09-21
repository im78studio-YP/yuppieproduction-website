(function(root){
 'use strict';
 const templates=[{id:'photo360-circle-stage',name:'01 · Photo Backdrop 360 — Circle Stage',width:6,depth:3,height:2.4,
  tagline:'ผนังโค้ง R 3.50 ม. · สติ๊กเกอร์ BD_01 · แท่นวงกลม',
  description:'ผนังโค้งพร้อมสติ๊กเกอร์ Yuppie ลายวงกลมชมพู–ขาว พื้นพรมเทาดำไม่ยกพื้น และแท่นถ่ายภาพ Ø1.00 × สูง 0.10 ม. ด้านหน้า'}];
 function build(id,initial){
  const t=templates.find(t=>t.id===id);if(!t)throw Error('ไม่พบเทมเพลต Photo Backdrop 360');
  const art=root.YPPhoto360Artwork;if(!art?.data)throw Error('ไม่พบสติ๊กเกอร์ BD_01.png');
  const spec=structuredClone(initial),arcLength=2*3.5*Math.asin(6/(2*3.5));
  Object.assign(spec,{W:6,D:3,H:2.4,type:'photo360',wallRadius:3.5,view:'three',objects:[],sceneItemState:{},
   floor:'carpet',carpet:'grey',raise:0,carpetTextureData:null,carpetTextureName:'',carpetTextureMode:'builtin',carpetTextureActiveId:'',
   floorStickerData:null,stSize:'none',logoScale:0,nameScale:0,sideLogo:false,lights:true,lightWall:'back',lightCol:'white',
   wallCol:'white',wallPaintOverrides:{back:'#111111'},wallMat:'sticker',wallStickerFaces:['back'],wallStickers:{back:{data:art.data,name:art.name,id:20260921,
    ar:art.aspect,w:arcLength,h:2.4,lock:false,rotation:0,mode:'cover',patternSize:1.2,offsetX:0,offsetY:0}},
   photo360Template:{id:t.id,name:t.name,version:1}});
  // The photo360 renderer supplies its curved wall and front-centre circular platform.
  // The logo belongs to the approved sticker; do not overlay a second logo/sign.
  return {spec,assets:[]};
 }
 root.YPPhoto360Templates={templates,build};
})(globalThis);
