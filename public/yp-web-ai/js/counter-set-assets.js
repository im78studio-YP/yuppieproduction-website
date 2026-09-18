(function(root){
 'use strict';
 // Counter_Set_01.glb: complete source assemblies, left-to-right; subparts preserved.
 const entries=[
  ['01','มุมมนฐานสูง',1.2,.6,.95],
  ['02','ทรงเหลี่ยม',1.2,.6,.9],
  ['03','มุมมน',1.2,.6,.9],
  ['04','แผงโค้ง',1.2,.55,1.05],
  ['05','ตัว L',1.5,1.5,.9],
  ['06','กรอบหน้าสูง',1.2,.6,.9],
  ['07','ทรงสอบ',1.2,.65,.8],
  ['08','สองระดับ',1.8,.6,.91]
 ];
 const define=(entries,set,offset=0)=>entries.map(([number,label,w,d,h])=>({
  catalogId:'counter-set-'+set+'-'+number,name:'Counter '+String(Number(number)+offset).padStart(2,'0')+' · '+label,category:'reception',tags:['เคาน์เตอร์'],
  type:'custom',icon:'▣',size:{w,d,h},unitPrice:0,color:'#f5f5f5',
  modelUrl:'assets/counter-imports/counter-set-'+set+'-'+number+'.glb',thumbUrl:'assets/catalog-thumbnails/counter-set-'+set+'-'+number+'.webp?v=1',
  sceneAssetType:'Counter',sceneAssetCategory:'reception',sceneListGroup:'reception',
  placementPolicy:{preferredTarget:'floor',allowedTargets:['floor','wall','ceiling','storage-room','structure','asset','free'],requiresSurface:false,defaultSpawn:'front-staging',allowOutsideBooth:true},
  capabilities:['floorPlaceable','free3DPlaceable','surfaceSnappable','resizable','scalable','rotatable','styleable'],
  transformPolicy:{canResize:true,canScale:true,defaultMode:'resize',productionSensitive:false}
 }));
 root.YPCounterSetAssets=define(entries,'01');
 // The separate L-shaped top is retained with its cabinet as one complete counter.
 root.YPCounterSet02Assets=define([
  ['01','หน้าเอียงกรอบสูง',2.05,.7,1.1],
  ['02','ตัว L เคาน์เตอร์สูง',2.2,1.8,1.1],
  ['03','ตัว L พร้อมท็อป',1.85,1.25,.95],
  ['04','มุมมนคิ้วฐาน',1.2,.6,.9],
  ['05','กรอบมุมมน',1.2,.6,.9],
  ['06','ลายทแยง',1.2,.65,.9]
 ],'02',8);
})(globalThis);
