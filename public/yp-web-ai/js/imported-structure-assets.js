(function(root){
  'use strict';
  // Authored GLBs: keep source axes/materials and store dimensions in metres (X/Z/Y).
  const entries=[
    ['facade-u-3x3','Facade_U_3x3m','structure',3.04,3.02,.4],
    ['top-panel','Top_Panel','structure',3,.1,.2],
    ['triangle-tray-wall','Triangle_Tray_wall_200x240x10cm','display',2,.1,2.4],
    ['tray-wall','Tray_wall_200x240x30cm','display',2,.3,2.4],
    ['wall-shelf-01','Wall_Shelf_01','display',1,.3,2.4],
    ['wall-100x240','Wall_100x240x30CM','structure',1,.3,2.4],
    ['s-beam-01','S_Beam 01','structure',5.4,1.64,.2]
  ];
  root.YPImportedStructureAssets=entries.map(([id,name,category,w,d,h])=>({
    catalogId:'imported-'+id,name,category,type:'custom',icon:'▯',size:{w,d,h},unitPrice:0,color:'#f5f5f5',
    modelUrl:'assets/structure-imports/'+id+'.glb',thumbUrl:'assets/catalog-thumbnails/imported-'+id+'.webp',
    sceneAssetType:id==='wall-shelf-01'?'Shelf':id==='s-beam-01'?'Beam':id==='facade-u-3x3'?'Fascia':category==='structure'?'Structure':'Product Display',sceneAssetCategory:category,
    placementPolicy:{preferredTarget:'floor',allowedTargets:['floor','wall','ceiling','storage-room','structure','asset','free'],requiresSurface:false,defaultSpawn:'front-staging',allowOutsideBooth:true},
    capabilities:['floorPlaceable','free3DPlaceable','surfaceSnappable','resizable','scalable','rotatable','styleable'],
    transformPolicy:{canResize:true,canScale:true,defaultMode:'resize',productionSensitive:false}
  }));
})(globalThis);
