(function(root){
  'use strict';
  const part=(catalogId,x,z,w,d,h,color,y=0,extra={})=>({catalogId,position:{x,y,z},size:{w,d,h},color,...extra});
  const panel=(x,z,w,d,h,color,y=0)=>part('panel-standard',x,z,w,d,h,color,y);
  const frame=(x,color)=>[panel(x,.39,1.25,.14,2.2,color,.1),panel(x,.48,1.07,.06,2.02,'#527b35',.19)];
  const templates=[
    {id:'penin-adventure',name:'01 · Adventure Gateway',tagline:'เคาน์เตอร์ใหญ่ + กรอบทางเข้า',description:'อ้างอิงภาพ 1: เคาน์เตอร์หน้าซ้าย ผนังกราฟิก จอหลัง และกรอบสีทองฝั่งขวาพร้อมจอเล็ก เปิดด้านข้างไว้',primary:'#c58b24',secondary:'#32363b',background:'#555b50',floor:'tile',tile:'woodL',graphic:'EXPLORE / CONNECT / DISCOVER',purpose:'display',
      objects:[part('counter-standard',1.85,2.12,2.8,.7,1.02,'#32363b'),part('entrance-frame',5.12,1.3,.72,1.9,2.4,'#c58b24',0,{structure:{projection:1.9,height:2.4,pierWidth:.72,thickness:.16,color:'#c58b24'}}),panel(.08,.36,.12,.1,2.4,'#c58b24'),panel(2.4,.36,4.7,.1,.1,'#c58b24',2.3),panel(3.82,.36,.92,.08,.55,'#151a24',1.3),panel(3.82,.41,.8,.025,.43,'#244271',1.36),panel(5.12,2.265,.54,.035,.35,'#151a24',1.42),panel(5.12,2.29,.46,.014,.27,'#244271',1.46),...Array.from({length:24},(_,i)=>panel(.57+i*.111,2.487,.022,.015,.86,'#20252b',.05))]},
    {id:'penin-connect',name:'02 · Connect & Demo',tagline:'ต้อนรับ + โต๊ะสาธิตพร้อมที่นั่ง',description:'อ้างอิงภาพ 2: เคาน์เตอร์ต้อนรับหน้าซ้าย โต๊ะสูงพร้อมเก้าอี้ 2 ตัวฝั่งขวา จอติดผนัง และเสาตกแต่งสีเขียวน้ำทะเล',primary:'#208c8b',secondary:'#a87a4c',background:'#edf0ed',floor:'tile',tile:'woodL',graphic:'CONNECT / EXPERIENCE / TALK TO US',purpose:'meeting',
      objects:[part('counter-standard',.98,2.06,1.35,.68,1,'#a87a4c'),part('high-table-stool-set',4.05,1.65,2.05,.8,1.08,null,0,{geometryMode:'model'}),panel(3,.43,.2,.25,2.4,'#208c8b'),panel(5.85,.43,.2,.25,2.4,'#208c8b'),panel(4.4,.37,1.35,.09,.78,'#151a24',1.36),panel(4.4,.425,1.2,.025,.63,'#dcebf2',1.44),part('plant-medium',.98,2.06,.28,.28,.45,null,1.04)]},
    {id:'penin-natural',name:'03 · Natural Showcase',tagline:'กรอบไม้ + แผงสีเขียว',description:'อ้างอิงภาพ 3: เคาน์เตอร์หน้าซ้าย กรอบไม้และแผงสีเขียวสองฝั่ง ผนังเล่าเรื่องสินค้าตรงกลาง และพื้นที่รับลูกค้าเปิดโล่ง',primary:'#997944',secondary:'#c6ad82',background:'#e7e1d5',floor:'tile',tile:'conc',graphic:'NATURALLY GOOD / MADE FOR EVERYDAY',purpose:'sales',
      objects:[part('counter-standard',1.04,2.12,1.65,.68,1,'#dfd2b8'),...frame(.75,'#c6ad82'),...frame(5.25,'#c6ad82'),panel(3,.38,3.35,.13,.16,'#333029',2.24),panel(.75,.525,.79,.025,.58,'#f4efdf',1.14),panel(5.25,.525,.79,.025,.58,'#f4efdf',1.14),panel(3.15,.36,.72,.18,.07,'#c6ad82',1.1),panel(3.95,.36,.72,.18,.07,'#c6ad82',.83)]}
  ];
  function build(id,initial,catalog){
    const t=templates.find(t=>t.id===id);if(!t)throw new Error('ไม่พบเทมเพลต Peninsular');
    const spec=structuredClone(initial);Object.assign(spec,{W:6,D:3,H:2.4,type:'penin',primary:t.primary,secondary:t.secondary,colTouched:true,secTouched:true,wallCol:'white',wallMat:'paint',floor:t.floor,tile:t.tile,carpet:'cream',raise:0,stSize:'none',logoWallU:t.id==='penin-adventure'?2:t.id==='penin-connect'?1.42:3,logoWallY:1.91,logoScale:t.id==='penin-connect'?24:30,nameScale:0,designPurpose:t.purpose,boothTemplate:{id:t.id,type:'penin',name:t.name,version:1},objects:[],view:'three'});
    spec.objects=t.objects.map((o,i)=>{const item=catalog.find(v=>v.catalogId===o.catalogId);if(!item)throw new Error('ไม่พบอุปกรณ์ '+o.catalogId);return {id:t.id+'-'+i,catalogId:item.catalogId,type:item.type,position:{...o.position},size:{...o.size},rotationX:0,rotationY:0,rotationZ:0,orientation:'horizontal',locked:false,unitPrice:item.unitPrice,geometryMode:o.geometryMode==='model'?'model':'parametric',appearance:o.color?{mode:'solid',color:o.color}:{mode:'original'},...(o.structure?{structure:{...o.structure}}:{})};});return {spec,assets:[]};
  }
  root.YPPeninsularTemplates={templates,build};
})(globalThis);
