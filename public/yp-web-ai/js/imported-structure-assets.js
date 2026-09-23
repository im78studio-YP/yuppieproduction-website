(function(root){
  'use strict';
  // Authored GLBs: keep source axes/materials and store dimensions in metres (X/Z/Y).
  const entries=[
    ['facade-u-3x3','Facade_U_3x3m','structure',3.04,3.02,.4],
    ['top-panel','Top_Panel','structure',3,.1,.2],
    ['triangle-tray-wall','Triangle_Tray_wall_200x240x10cm','display',2,.1,2.4],
    ['tray-wall','Tray_wall_200x240x30cm','display',2,.3,2.4],
    ['wall-shelf-01','Wall_Shelf_01','display',1,.3,2.4],
    ['shelf-01','Shelf_01','display',1.2,.45,2],
    ['counter-circle-01','Counter_Circle_01','reception',3.078,3.3,.9],
    ['counter-circle-02','Counter_Circle_02','reception',2.798,3,.9],
    ['counter-circle-03','Counter_Circle_03','reception',1.2,.694,.816],
    ['counter-type-yp03','Counter_Type_YP03','reception',1.52,.61,.85],
    ['counters-set-04','Counters_Set_04 · เคาน์เตอร์','reception',2.05,.6,1],
    ['standee-acrylic-box','Standee_ArcylicBox','display',.4,.4,.95],
    ['standee-sq01','Standee_SQ01','display',.82,.82,.45],
    ['standee-sq02','Standee_SQ02 · ชั้นโชว์','display',1.3,.7,1.6],
    ['wall-100x240','Wall_100x240x30CM','structure',1,.3,2.4],
    ['s-beam-01','S_Beam 01','structure',5.4,1.64,.2]
  ];
  root.YPImportedStructureAssets=entries.map(([id,name,category,w,d,h])=>({
    catalogId:'imported-'+id,name,category,type:'custom',icon:'▯',size:{w,d,h},unitPrice:0,color:'#f5f5f5',
    modelUrl:'assets/structure-imports/'+id+'.glb',thumbUrl:'assets/catalog-thumbnails/imported-'+id+'.webp',
    sceneAssetType:['wall-shelf-01','shelf-01','standee-sq02'].includes(id)?'Shelf':['counter-circle-01','counter-circle-02','counter-circle-03','counter-type-yp03','counters-set-04'].includes(id)?'Counter':id==='s-beam-01'?'Beam':id==='facade-u-3x3'?'Fascia':category==='structure'?'Structure':'Product Display',sceneAssetCategory:category,
    placementPolicy:{preferredTarget:'floor',allowedTargets:['floor','wall','ceiling','storage-room','structure','asset','free'],requiresSurface:false,defaultSpawn:'front-staging',allowOutsideBooth:true},
    capabilities:['floorPlaceable','free3DPlaceable','surfaceSnappable','resizable','scalable','rotatable','styleable'],
    transformPolicy:{canResize:true,canScale:true,defaultMode:'resize',productionSensitive:false}
  }));
})(globalThis);
