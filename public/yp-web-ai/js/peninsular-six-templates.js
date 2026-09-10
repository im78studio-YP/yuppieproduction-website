(function(root){
 'use strict';
 const p=(catalogId,x,z,w,d,h,color,y=0,extra={})=>({catalogId,position:{x,y,z},size:{w,d,h},color,...extra});
 const panel=(x,z,w,d,h,color,y=0)=>p('panel-standard',x,z,w,d,h,color,y);
 const custom=(id,design,x,z,w,d,h,color,y=0,rotationY=0)=>p(id,x,z,w,d,h,null,y,{structure:{design,color,...(design==='timber-glass-table'?{glassRim:true}:{})},rotationY});
 const art=(graphic,x,z,w,h,y,rotationY=0)=>p('brand-artwork-copy',x,z,w,.012,h,null,y,{graphic,rotationY});
 const screen=(key,x,z,w,h,y)=>[panel(x,z,w,.08,h,'#151b22',y),art('six-'+key,x,z+.047,w-.08,h-.08,y+.04)];
 const seats=(x,z)=>[custom('table-standard','timber-glass-table',x,z,.88,.88,.74),...[[-.72,0,90],[.72,0,-90],[0,-.68,0],[0,.68,180]].map(([dx,dz,r])=>custom('chair-standard','timber-shell-chair',x+dx,z+dz,.56,.56,.83,null,0,r))];
 const pod=(x,z,w,h,color,y=0)=>custom('panel-rounded','six-display-pod',x,z,w,.38,h,color,y);
 const blue='#087eae',black='#222327';
 root.YPPeninsularSixTemplates=[
  {id:'penin-blue-horizon-6',name:'16 · Blue Horizon',width:6,depth:6,height:3.6,logoScale:0,logoU:3,logoY:3.1,customBack:true,
   primary:blue,secondary:'#f6f5ef',background:'#edeae1',floor:'tile',tile:'woodL',graphic:'',purpose:'meeting',
   tagline:'6×6 ม. · ซุ้มน้ำเงินเฉียงและเคาน์เตอร์ L',description:'ตามภาพซุ้มน้ำเงิน–ขาว: ผนังหลังเฉียง ป้ายบนโค้ง ซุ้มด้านขวาสามชั้น ชั้นโชว์มุมมน โต๊ะกลมกระจก 2 ชุด และเคาน์เตอร์ L หน้าซ้าย · สูงประมาณ 3.6 ม.',
   objects:[
    panel(3,.18,6,.30,2.95,'#eeeae0'),
    custom('panel-standard','six-blue-sweep',3,.39,5.9,.18,3.6,blue),
    custom('fascia-curved','six-blue-crown',3,.55,5.9,.72,.72,blue,2.88),
    art('six-blue-brand',3.05,.945,4.3,.50,2.99),
    ...screen('technology',.91,.55,1.12,.64,1.35),...screen('gold',3.65,.366,.95,.59,2.19),...screen('technology',4.70,.366,.95,.59,2.19),
    p('planter-grass',4.58,.58,1.0,.34,.57,null),
    ...[[-.21,'#f6f5ef'],[0,'#6e737a'],[.21,blue]].map(([dx,c])=>custom('portal-ribbon','six-side-bridge',5.27+dx,3.04,5.3,.17,3.05,c,0,90)),
    panel(5.19,2.95,.73,4.85,.12,'#ffffff',2.94),
    ...[4.82,5.03,5.24].map(x=>panel(x,.66,.11,.19,2.86,blue)),
    pod(5.27,5.78,.91,.79,blue,.72),art('six-blue-name',5.27,5.977,.8,.2,1.65),
    panel(4.08,5.24,.24,.30,.57,blue),panel(4.08,5.24,.53,.49,.045,blue),pod(4.08,5.24,.84,1.38,blue,.57),
    ...seats(1.59,3.57),...seats(3.72,1.63),
    p('counter-corner-round',1.68,5.14,2.65,1.28,.96,'#ffffff'),
    art('six-information',1.83,5.794,1.88,.24,.48),
    custom('chair-standard','timber-shell-chair',1.55,4.8,.55,.55,.83),
   ]},
  {id:'penin-noir-mobile-6',name:'17 · Noir Mobile Pavilion',width:6,depth:6,height:3.6,logoScale:0,logoU:3,logoY:2.1,customBack:true,
   primary:'#246bd7',secondary:black,background:'#e6e5e2',floor:'tile',tile:'conc',graphic:'',purpose:'display',
   tagline:'6×6 ม. · ซุ้มดำเส้นไฟและ Mobile Store',description:'ตามภาพบูธ HANDA: ซุ้มดำโค้งเสาเอียง เส้นไฟขาว คานไฟเหนือศีรษะ จอแนวตั้ง ตู้โชว์สีน้ำเงิน โต๊ะโชว์กลาง เคาน์เตอร์กรอบไฟ และเลานจ์หลังบูธ · สูงประมาณ 3.6 ม.',
   objects:[
    panel(3,.18,6,.30,3.45,'#d7d7d4'),
    custom('panel-standard','six-noir-portal',3,5.25,5.82,.44,3.6,black),
    custom('panel-standard','six-noir-portal',3,.53,5.82,.38,3.47,black),
    ...[.49,5.35].map(x=>custom('panel-standard','six-lit-beam',x,2.8,.34,4.6,.15,'#ffffff',3.27)),
    art('six-handa',3.88,5.518,1.16,.25,3.24),art('six-website',1.70,5.518,1.85,.13,3.26),
    art('six-handa',.98,.729,1.04,.27,2.97),art('six-handa-dark',3.1,.339,1.6,.70,1.76),
    ...screen('inventors',1.39,.376,1.40,1.86,.91),
    ...screen('technology',.34,5.485,.37,1.03,1.99),...screen('digital',.34,5.485,.37,.98,.95),
    pod(3.59,.46,.65,2.26,black,.63),pod(4.43,.46,.65,2.26,black,.63),
    ...screen('mobile',4.0,.72,1.28,1.93,.73),
    panel(3.67,.89,1.54,.18,.31,'#246bd7',2.13),art('six-mobile-label',3.67,.991,1.40,.22,2.18),
    panel(4.28,1.11,1.54,.18,.31,'#246bd7',1.23),art('six-mobile-label',4.28,1.211,1.40,.22,1.28),
    p('lounge-sofa',1.83,1.05,1.92,.74,.86,'#edece7'),
    custom('table-standard','timber-glass-table',1.94,2.13,.73,.73,.52),
    ...[.95,5.04].flatMap(x=>[panel(x,3.0,1.02,.57,.94,'#246bd7'),p('display-glass-case',x,3.0,1.02,.57,.27,null,.94),art('six-devices',x,3.298,.87,.18,1.04)]),
    panel(3.37,3.32,2.12,.79,.84,'#326dd2'),panel(3.37,3.32,2.20,.86,.06,'#e4e5e7',.84),
    ...screen('product',3.04,3.23,.91,.69,.9),
    custom('panel-rounded','six-lit-counter',4.1,4.55,1.55,.59,.95,'#eeeeea'),art('six-store',4.1,4.857,1.15,.3,.40),
    custom('panel-rounded','six-lit-counter',2.09,5.28,1.4,.58,.76,black),art('six-handa',2.09,5.578,.93,.27,.25),
    custom('panel-standard','six-brochure',2.99,5.21,.39,.43,1.46,black),
   ]}
 ];
})(globalThis);
