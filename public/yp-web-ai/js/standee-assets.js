(function(root){
 'use strict';
 // Standee Set.glb: ten complete assemblies, exported separately with original materials.
 const entries=[
  ['01','โต๊ะโชว์ทรง U',1.5,.6,.9],
  ['02','เคาน์เตอร์ทรงสอบ',2,.75,.9],
  ['03','แท่นเหลี่ยม',.4,.4,.65],
  ['04','แท่นเหลี่ยมมีคิ้ว',.4,.4,.65],
  ['05','แท่นกลม',.4,.4,.65],
  ['06','แท่นกลมมีคิ้ว',.4,.4,.65],
  ['07','เคาน์เตอร์มุมมน',1.2,.6,.9],
  ['08','ฐานโชว์ทรงกลม',1.2,1.2,.2],
  ['09','ฐานโชว์สี่เหลี่ยม',2,1,.15],
  ['10','เคาน์เตอร์มุมมนสีม่วง',1.2,.6,.9]
 ];
 root.YPStandeeAssets=entries.map(([number,label,w,d,h])=>({
  catalogId:'standee-'+number,name:'Standee '+number+' · '+label,category:'display',type:'custom',icon:'▣',size:{w,d,h},unitPrice:0,color:'#f5f5f5',
  modelUrl:'assets/standee-imports/standee-'+number+'.glb',thumbUrl:'assets/catalog-thumbnails/standee-'+number+'.webp?v=1',
  sceneAssetType:'Product Display',sceneAssetCategory:'display',sceneListGroup:'display',
  placementPolicy:{preferredTarget:'floor',allowedTargets:['floor','wall','ceiling','storage-room','structure','asset','free'],requiresSurface:false,defaultSpawn:'front-staging',allowOutsideBooth:true},
  capabilities:['floorPlaceable','free3DPlaceable','surfaceSnappable','resizable','scalable','rotatable','styleable'],
  transformPolicy:{canResize:true,canScale:true,defaultMode:'resize',productionSensitive:false}
 }));
})(globalThis);
