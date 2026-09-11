(function(root){
 'use strict';
 const clone=v=>structuredClone(v);
 const categories={structure:'โครงสร้าง',counter:'เคาน์เตอร์',seating:'โต๊ะ–เก้าอี้',branding:'ป้ายและจอ',decor:'ของตกแต่ง'};
 function category(o){
  const s=(o.catalogId+' '+o.type+' '+(o.structure?.design||'')).toLowerCase();
  if(/brand|artwork|television|screen|monitor|logo/.test(s))return 'branding';
  if(/counter|reception/.test(s))return 'counter';
  if(/chair|table|sofa|stool|ottoman|pillow|coffee/.test(s))return 'seating';
  if(/plant|grass|flower|foliage|bottle|helix|display|shelf|plinth|pod/.test(s))return 'decor';
  return 'structure';
 }
 function expand(objects,ids){const wanted=new Set(ids),groups=new Set(objects.filter(o=>wanted.has(o.id)&&o.groupId).map(o=>o.groupId));return objects.filter(o=>wanted.has(o.id)||(o.groupId&&groups.has(o.groupId))).map(o=>o.id);}
 function build({base,donor,selected=[],removed=[],area,type,offset={x:0,y:0,z:0},key='mix'}){
  if(!base?.spec||!donor?.spec)throw Error('กรุณาเลือกแบบหลักและแบบเสริม');
  if(!area||!['W','D','H'].every(k=>Number.isFinite(area[k]))||area.W<1||area.D<1||area.W>30||area.D>30||area.H<2.4||area.H>4.9)throw Error('พื้นที่ต้องกว้าง/ลึก 1–30 ม. และสูง 2.4–4.9 ม.');
  if(!['inline','corner','penin','island'].includes(type))throw Error('เลือกรูปแบบบูธที่รองรับ');
  if(!['x','y','z'].every(k=>Number.isFinite(offset[k])))throw Error('พิกัดต้องเป็นตัวเลข');
  const out=clone(base),drop=new Set(expand(base.spec.objects,removed)),take=new Set(expand(donor.spec.objects,selected));
  out.spec.objects=out.spec.objects.filter(o=>!drop.has(o.id));
  const imported=clone(donor.spec.objects.filter(o=>take.has(o.id))),map=new Map(),groupMap=new Map();
  imported.forEach((o,i)=>{map.set(o.id,key+'-part-'+i);if(o.groupId&&!groupMap.has(o.groupId))groupMap.set(o.groupId,key+'-group-'+groupMap.size);});
  const assets=new Map();for(const o of imported)if(o.catalogId.startsWith('my-asset-')){const a=donor.assets.find(a=>a.id===o.catalogId);if(!a)throw Error('ไฟล์ประกอบของแบบเสริมไม่ครบ');if(!assets.has(a.id))assets.set(a.id,{...clone(a),id:'my-asset-'+key+'-'+assets.size});}
  // Imported parts retain world coordinates, but never inherit a live attachment to an unrelated base wall/room.
  for(const o of imported){o.id=map.get(o.id);delete o.attachment;if(o.groupId)o.groupId=groupMap.get(o.groupId);if(assets.has(o.catalogId))o.catalogId=assets.get(o.catalogId).id;for(const axis of ['x','y','z'])o.position[axis]+=offset[axis];}
  out.assets.push(...assets.values());out.spec.objects.push(...imported);
  if(new Set(out.spec.objects.map(o=>o.id)).size!==out.spec.objects.length)throw Error('รหัสชิ้นส่วนซ้ำ กรุณาเปิดหน้าผสมใหม่');
  Object.assign(out.spec,area,{type,view:'three'});
  out.spec.boothTemplate={id:key,type,name:'เทมเพลตผสม',version:1};
  out.spec.templateMix={base:base.spec.boothTemplate?.id||'personal',donor:donor.spec.boothTemplate?.id||'personal',importedIds:imported.map(o=>o.id)};
  // Regenerated helper caches must not point at removed source objects.
  out.spec.sceneAssetRegistry={version:2,assets:[]};out.spec.sceneSnapData={version:1,anchors:[],surfaces:[]};
  if(out.spec.assetAttachmentGraph?.attachments)out.spec.assetAttachmentGraph.attachments=out.spec.assetAttachmentGraph.attachments.filter(a=>!JSON.stringify(a).split('"').some(v=>drop.has(v)));
  for(const id of drop)if(out.spec.sceneItemState)delete out.spec.sceneItemState[id];
  const warnings=[];
  if(imported.length===0)warnings.push('ยังไม่ได้เลือกชิ้นส่วนจากแบบเสริม');
  let outside=0;for(const o of out.spec.objects){const a=(o.rotationY||0)*Math.PI/180,hw=(Math.abs(Math.cos(a))*o.size.w+Math.abs(Math.sin(a))*o.size.d)/2,hd=(Math.abs(Math.sin(a))*o.size.w+Math.abs(Math.cos(a))*o.size.d)/2;
   if(o.position.x-hw<-.05||o.position.x+hw>area.W+.05||o.position.z-hd<-.05||o.position.z+hd>area.D+.05||o.position.y<0||o.position.y+o.size.h>area.H+.05)outside++;}
  if(outside)warnings.push(outside+' ชิ้นอาจเกินพื้นที่ สามารถย้ายหรือปรับต่อได้ ไม่มีการบังคับขยับ');
  if(imported.length)warnings.push('ชิ้นนำเข้าเป็นอิสระจากจุดยึดเดิม และอาจซ้อนกัน ตรวจและจัดวางต่อในตัวออกแบบ');
  return {snapshot:out,warnings,imported:imported.length};
 }
 root.YPTemplateMixerCore={category,categories,expand,build};
})(globalThis);
