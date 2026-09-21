(function(root){
 'use strict';
 const templates=[
  {id:'backdrop-wall-only',name:'01 · Photo Backdrop — ไม่มีโลโก้ตั้งพื้น',width:6,depth:3,height:2.4,floorLogo:false,
   tagline:'กราฟิกผนัง Yuppie · พื้นที่ด้านหน้าโล่ง',description:'ผนังกราฟิก Yuppie Production พร้อมพื้นพรมเทาดำ ไม่ยกพื้น ไม่มีชิ้นโลโก้ตั้งพื้น'},
  {id:'backdrop-floor-logo',name:'02 · Photo Backdrop — มีโลโก้ตั้งพื้น',width:6,depth:3,height:2.4,floorLogo:true,
   tagline:'กราฟิกผนัง Yuppie · โลโก้ตั้งพื้นด้านหน้า',description:'ผนังและพื้นแบบเดียวกับเทมเพลตแรก เพิ่มโลโก้ Yuppie Production ตั้งพื้นกึ่งกลางด้านหน้า พร้อมฐานสีเข้ม'}
 ];
 function build(id,initial){
  const t=templates.find(item=>item.id===id);if(!t)throw Error('ไม่พบเทมเพลต Photo Backdrop');
  const spec=structuredClone(initial);
  // Build a detached, clean template. Never patch the customer's current design.
  Object.assign(spec,{objects:[],sceneItemState:{},wallStickers:{},wallStickerFaces:[],view:'three'});
  root.YPPhotoBackdropDefault.apply(spec);
  spec.logoScale=t.floorLogo?35:0;spec.nameScale=0;
  spec.sceneItemState['branding.logo.main']={visible:t.floorLogo};
  spec.photoBackdropTemplate={id:t.id,name:t.name,version:1};
  return {spec,assets:[]};
 }
 root.YPPhotoBackdropTemplates={templates,build};
})(globalThis);
