(function(root){
  'use strict';
  // Authored layouts, metres. Back wall z=0; the only open side is z=3.
  const p=(catalogId,x,z,w,d,h,color,rotationY=0)=>({catalogId,x,z,size:{w,d,h},color,rotationY});
  const chair=(x,z,rotation=0)=>p('chair-standard',x,z,.5,.5,.85,'#ded8cc',rotation);
  const templates=[
    {id:'gallery',name:'01 · Form Gallery',brand:'FORM',purpose:'display',tagline:'โชว์สินค้าแบบแกลเลอรี',
      description:'ชั้นโชว์ริมผนังซ้าย–หลัง พร้อมแท่นสินค้ากลางบูธและจุดต้อนรับด้านขวา',
      primary:'#376b66',secondary:'#c6a774',background:'#eae8df',ink:'#233f3a',floor:'tile',tile:'woodL',graphic:'DESIGN OBJECTS / NEW COLLECTION',
      objects:[p('shelf-standard',.65,.38,1,.45,1.55,'#c6a774'),p('shelf-standard',5.35,.38,1,.45,1.55,'#c6a774'),p('shelf-standard',.38,1.55,.9,.4,1.55,'#c6a774',90),p('display-standard',2.15,1.12,.85,.7,1.1,'#376b66'),p('display-standard',3.35,1.12,.7,.7,.8,'#b7c4b4'),p('counter-standard',4.92,2.32,1.2,.6,1,'#376b66'),p('plant-medium',5.5,1.28,.5,.5,1.25,null)]},
    {id:'tasting',name:'02 · The Tasting Bar',brand:'PANTRY',purpose:'sales',tagline:'สาธิตและชิมสินค้า',
      description:'บาร์ชิมยาวด้านหน้าซ้าย มีพื้นที่พนักงานด้านหลัง และโต๊ะยืนคุยฝั่งขวา',
      primary:'#b84e32',secondary:'#d8b387',background:'#f2dfbd',ink:'#733621',floor:'tile',tile:'woodL',graphic:'TASTE / DISCOVER / TAKE HOME',
      objects:[p('counter-standard',1.02,2.15,1.6,.65,1,'#b84e32'),p('counter-standard',2.7,2.15,1.6,.65,1,'#b84e32'),p('shelf-standard',.82,.4,1.25,.45,1.5,'#d8b387'),p('shelf-standard',2.35,.4,1.25,.45,1.5,'#d8b387'),p('table-standard',4.85,1.1,1,.65,1.05,'#b84e32'),p('plant-medium',5.52,.42,.5,.5,1.25,null)]},
    {id:'meeting',name:'03 · Partner Lounge',brand:'PARTNER',purpose:'meeting',tagline:'เจรจาธุรกิจ 2 กลุ่ม',
      description:'โต๊ะประชุมสองชุด ชุดละ 2 ที่นั่ง เว้นแนวเดินกลาง พร้อมเคาน์เตอร์ลงทะเบียนหน้า',
      primary:'#243f63',secondary:'#b9a88d',background:'#e4e6e8',ink:'#243f63',floor:'carpet',carpet:'cream',graphic:'CONVERSATIONS THAT BUILD PARTNERSHIPS',
      objects:[p('table-standard',1.4,1.38,1.2,.65,.75,'#b9a88d'),chair(1.4,.65),chair(1.4,2.1,180),p('table-standard',4.5,1.38,1.2,.65,.75,'#b9a88d'),chair(4.5,.65),chair(4.5,2.1,180),p('counter-standard',.6,2.52,.8,.5,1,'#243f63'),p('plant-medium',3,.45,.5,.5,1.35,null)]},
    {id:'technology',name:'04 · Next Demo Lab',brand:'NEXT',purpose:'display',tagline:'พรีเซนต์และทดลองเทคโนโลยี',
      description:'โซนพรีเซนต์พร้อมที่นั่ง 4 ที่ฝั่งซ้าย และโต๊ะทดลองสินค้าสองจุดฝั่งขวา',
      primary:'#74d8cf',secondary:'#74d8cf',background:'#17233e',ink:'#ffffff',floor:'carpet',carpet:'navy',graphic:'LIVE DEMO / CONNECTED IDEAS',
      objects:[p('counter-standard',.7,.48,.65,.5,1.08,'#384ddb'),p('screen-43',2.25,.4,1.75,.3,1.7,null),chair(1.85,1.28,180),chair(2.65,1.28,180),chair(1.85,2.05,180),chair(2.65,2.05,180),p('counter-standard',4.65,.72,1.45,.6,1,'#74d8cf'),p('counter-standard',4.65,2.22,1.45,.6,1,'#384ddb')]},
    {id:'retail',name:'05 · Select Store',brand:'SELECT',purpose:'sales',tagline:'ขายสินค้า พร้อมห้องเก็บของ',
      description:'ชั้นสินค้าด้านหลัง แท่นเลือกซื้อกลางบูธ แคชเชียร์หน้าซ้าย และห้องเก็บของ 1.2×1.2 ม. หลังขวา',
      primary:'#633c63',secondary:'#c19b79',background:'#eee4dc',ink:'#633c63',floor:'tile',tile:'woodD',graphic:'CURATED GOODS / EVERYDAY FINDS',storage:true,
      objects:[p('shelf-standard',.85,.4,1.25,.45,1.65,'#c19b79'),p('shelf-standard',2.3,.4,1.25,.45,1.65,'#c19b79'),p('counter-standard',.95,2.35,1.3,.6,1,'#633c63'),p('display-standard',3.15,1.65,.7,.6,1,'#c19b79'),p('display-standard',4.45,2.25,.75,.6,1.15,'#633c63')]}
  ];
  const raised=(catalogId,x,z,w,d,h,color,y=0,rotationY=0)=>({...p(catalogId,x,z,w,d,h,color,rotationY),y});
  const panel=(x,z,w,d,h,color,y=0)=>raised('panel-standard',x,z,w,d,h,color,y);
  const detailed=(part,design)=>({...part,structure:{design}});
  templates.push({id:'timber-ribbon',name:'06 · Timber Ribbon',brand:'EXHIBITION BRAND',purpose:'meeting',tagline:'ซุ้มระแนงไม้โค้ง + ป้ายขาว + เคาน์เตอร์สวน',
    description:'อ้างอิงซุ้มไม้โค้งด้านซ้าย ป้ายขาวยื่นด้านบนขวา จอติดผนัง โต๊ะเจรจา 4 ที่นั่ง ตู้โชว์หน้าขวา และเคาน์เตอร์ช่องต้นไม้หน้าซ้าย ไม่ใส่พุ่มไม้แขวน',
    primary:'#21598c',secondary:'#b99a72',background:'#ede6d9',ink:'#21598c',floor:'tile',tile:'woodL',graphic:'',reference:true,
    objects:[
      // Separate curved ribs keep the ceiling open and every piece editable.
      ...Array.from({length:7},(_,i)=>detailed(raised('portal-ribbon',2.19,1.9+i*.095,4.06,.045,2.25,null),'timber-rib')),
      panel(4.65,.38,1.98,.12,2.28,'#b99a72'),
      detailed(raised('canopy-ribbon',4.66,1.53,2.12,2.32,.70,null,1.70),'timber-folded-canopy'),
      {...raised('brand-artwork-copy',4.66,2.697,1.91,.012,.52,null,1.78),graphic:'header'},
      panel(2.87,.39,1.43,.13,.86,'#b99a72',1.13),panel(2.87,.463,1.29,.028,.72,'#17232c',1.2),
      {...raised('brand-artwork-copy',2.87,.484,1.17,.012,.6,null,1.26),graphic:'screen'},
      {...raised('brand-artwork-copy',5.64,1.28,1.43,.012,1.02,null,.85,-90),graphic:'poster'},
      panel(5.7,1.28,.09,1.61,1.19,'#b99a72',.77),
      detailed(raised('table-standard',4.3,1.39,.86,.86,.73,null),'timber-glass-table'),
      detailed(raised('chair-standard',3.62,1.39,.55,.55,.81,null,0,90),'timber-shell-chair'),detailed(raised('chair-standard',4.98,1.39,.55,.55,.81,null,0,-90),'timber-shell-chair'),
      detailed(raised('chair-standard',4.3,.76,.55,.55,.81,null),'timber-shell-chair'),detailed(raised('chair-standard',4.3,2.05,.55,.55,.81,null,0,180),'timber-shell-chair'),
      // An actual open recess holds the planter inside the counter.
      detailed(raised('panel-standard',1.13,2.39,1.82,.62,.93,null),'timber-counter'),
      detailed(raised('planter-grass',.83,2.45,.80,.30,.56,null,.12),'timber-grass'),
      {...raised('brand-artwork-copy',1.57,2.722,.55,.012,.24,null,.34),graphic:'counter'},
      raised('glass-panel',1.14,2.38,1.28,.42,.018,null,.977),detailed(raised('chair-standard',1.18,1.65,.55,.55,.81,null),'timber-shell-chair'),
      panel(5.46,2.52,.64,.6,.77,'#ffffff'),raised('display-glass-case',5.46,2.52,.64,.6,.28,null,.77)
    ]});
  function build(id,initial,catalog){
    const t=templates.find(v=>v.id===id);if(!t)throw new Error('ไม่พบเทมเพลต');
    const spec=structuredClone(initial);
    Object.assign(spec,{W:6,D:3,H:2.4,type:'inline',brand:initial.logo?initial.brand:t.brand,cat:t.id==='tasting'?'food':initial.cat,
      primary:t.primary,secondary:t.secondary,colTouched:true,secTouched:true,wallCol:'white',wallMat:'paint',floor:t.floor,tile:t.tile||'woodL',carpet:t.carpet||'cream',
      logoScale:initial.logo?35:0,nameScale:initial.logo?0:22,logoColor:initial.logo?initial.logoColor:t.ink,logoColorTouched:true,logoWallU:t.storage?2.2:3,logoWallY:1.95,logoPos:t.storage?'left':'center',
      stSize:t.storage?'a':'none',stPos:'right',stDoor:'left',doorTouched:true,stDoorType:'swing',stHmode:2.4,stHv:2.4,
      designPurpose:t.purpose,inlineTemplate:{id:t.id,version:1,name:t.name},objects:[],view:'three'});
    if(t.reference)Object.assign(spec,{logoScale:initial.logo?16:0,nameScale:initial.logo?0:12,logoWallU:1.35,logoWallY:2.02});
    spec.objects=t.objects.map((o,i)=>{
      const item=catalog.find(c=>c.catalogId===o.catalogId);if(!item)throw new Error('ไม่พบอุปกรณ์ '+o.catalogId);
      return {id:'inline-'+id+'-'+i,type:item.type,catalogId:o.catalogId,locked:false,geometryMode:'parametric',position:{x:o.x,y:o.y||0,z:o.z},rotationX:0,rotationY:o.rotationY,rotationZ:0,orientation:'horizontal',size:{...o.size},unitPrice:item.unitPrice,
        ...(o.structure?{structure:{...o.structure}}:{}),appearance:o.color?{mode:'solid',color:o.color}:{mode:'original'}};
    });
    return {spec,assets:[]};
  }
  root.YPInlineTemplates={templates,build};
})(globalThis);
