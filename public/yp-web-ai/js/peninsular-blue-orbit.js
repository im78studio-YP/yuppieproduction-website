(function(global){
 'use strict';
 const blue='#0865a7',white='#f4f5f7',red='#d92e38';
 const p=(catalogId,x,z,w,d,h,y=0,extra={})=>({catalogId,position:{x,y,z},size:{w,d,h},...extra});
 const part=(key,x,z,w,d,h,y=0,extra={})=>p('panel-standard',x,z,w,d,h,y,{structure:{design:'orbit-'+key},...extra});
 const box=(x,z,w,d,h,y=0,color=white)=>p('panel-standard',x,z,w,d,h,y,{color});
 const logo=(x,z,w,h,y,rotationY=0,label='โลโก้ Yuppie')=>p('brand-artwork-copy',x,z,w,.012,h,y,{brandLogo:true,rotationY,label});
 const art=(key,x,z,w,h,y,rotationY=0)=>p('brand-artwork-copy',x,z,w,.014,h,y,{graphic:'orbit-'+key,rotationY,label:'กราฟิก Yuppie · '+key});
 global.YPPeninsularBlueOrbitTemplates=[{
  id:'penin-blue-orbit-6',name:'21 · Blue Orbit',version:1,previewVersion:'20260914-blue-orbit',
  width:6,depth:6,height:3,customBack:true,logoScale:0,logoU:3,logoY:2.5,
  primary:blue,secondary:red,background:white,floor:'tile',tile:'marble',graphic:'',purpose:'display',
  tagline:'6×6 ม. · ซุ้มสีน้ำเงิน + ชั้นวงกลม 3 จุด + ป้ายโค้ง',
  description:'บูธขาว–น้ำเงินแต้มแดง จากภาพอ้างอิง 5 มุม: ซุ้มเปิด 4 แนว ชั้นโชว์วงกลม 3 จุด ป้ายโค้งซ้อนระดับ ตู้โชว์ขอบแดง เคาน์เตอร์โค้ง และแท่นโชว์สินค้า · สูง 3 ม. · โลโก้และกราฟิก Yuppie เปลี่ยนได้ · สัดส่วนประมาณจากภาพ',
  objects:[
   box(3,.10,6,.20,2.45),
   // Short side returns frame the back only, leaving both aisles open.
   box(.19,.99,.28,1.80,2.45),part('sidewall',5.89,.99,1.80,.20,2.45,0,{rotationY:90}),
   box(.84,4.26,1.48,.24,2.43),
   box(.16,3.13,.12,2.50,.10,2.33),
   logo(.84,4.394,1.10,.35,1.94,0,'โลโก้ Yuppie · เสาจอ'),
   p('tv-65',.84,4.445,1.46,.10,.80,1.08,{geometryMode:'model',graphic:'orbit-screen',label:'ทีวี 65 นิ้ว · เสาหน้าบูธ'}),
   logo(.028,.99,1.21,.34,1.99,-90,'โลโก้ Yuppie · ด้านซ้าย'),
   art('portrait',.025,.99,1.48,1.46,.36,-90),
   logo(5.994,.99,1.20,.34,2.01,90,'โลโก้ Yuppie · ด้านขวา'),
   part('showcase',5.865,.99,1.46,.23,1.44,.38,{rotationY:90}),
   // Curved sign bands; branding uses a separate flat tangent panel, never stretched.
   part('ribbon',3.00,3.99,5.62,.42,.10,2.35),
   part('ribbon',3.06,3.82,5.32,.50,.43,2.52),
   logo(2.98,4.062,2.02,.32,2.57,0,'โลโก้ Yuppie · ป้ายโค้งบน'),
   part('ribbon',3.16,2.28,4.50,.48,.28,2.58),
   part('ribbon',3.02,2.38,5.66,.52,.095,2.33),
   ...[4.23,4.73,5.23,5.73].map(x=>part('portal',x,2.58,4.68,.10,3,0,{rotationY:90})),
   part('circle-shelf',4.28,5.008,.84,.18,.84,1.15),
   part('circle-shelf',5.15,5.008,.86,.18,.86,1.78),
   part('circle-shelf',5.15,5.008,.82,.18,.82,.68),
   part('planter',4.89,4.92,1.74,.29,.25),
   // Back graphics and red framed display cases are individual editable assets.
   art('portrait',1.15,.222,1.46,1.63,.50),
   art('wide',3.05,.222,1.58,.90,1.47),art('wide',4.83,.222,1.58,.90,1.47),
   part('showcase',3.05,.30,1.66,.38,1.12,.26),part('showcase',4.83,.30,1.66,.38,1.12,.26),
   // Front row leaves a clear entry between the counter and plinths.
   part('counter',.98,5.47,1.74,.70,.94),
   logo(.98,5.837,1.13,.34,.36,0,'โลโก้ Yuppie · เคาน์เตอร์'),
   p('bar-stool',1.05,4.82,.46,.46,.91,0,{rotationY:180,structure:{design:'nexus-stool'}}),
   ...[3.02,4.17,5.32].flatMap(x=>[
    part('plinth',x,5.53,.77,.67,.78),logo(x,5.878,.58,.24,.30,0,'โลโก้ Yuppie · แท่นโชว์')
   ]),
   part('plinth',5.33,3.82,.70,.60,.75),logo(5.692,3.82,.48,.23,.30,90,'โลโก้ Yuppie · แท่นด้านข้าง'),
   p('lounge-sofa',1.29,1.66,1.63,.67,.79),
   p('lounge-sofa',.79,2.80,1.36,.65,.79,0,{rotationY:90}),
   p('table-standard',2.18,2.32,.76,.76,.52),
   p('chair-standard',3.07,2.32,.56,.56,.82,0,{rotationY:-90}),
   p('plant-medium',2.12,4.01,.49,.49,.95,0,{structure:{design:'orbit-topiary'}}),
  ]
 }];
 function artwork(key,w,h){
  const c=document.createElement('canvas');c.width=1200;c.height=Math.round(1200*h/w);const ctx=c.getContext('2d'),W=c.width,H=c.height;
  const g=ctx.createLinearGradient(0,H,W,0);g.addColorStop(0,'#031c46');g.addColorStop(.6,'#066eae');g.addColorStop(1,'#29c5e9');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.lineWidth=1.3;ctx.strokeStyle='#69dcff30';
  for(let i=0;i<18;i++){const y=H*(.38+i*.038);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W*.33,y);ctx.lineTo(W*.62,y-H*.12);ctx.lineTo(W,y-H*.12);ctx.stroke();}
  for(let i=0;i<10;i++){const x=W*(.10+(i%5)*.19),y=H*(.53+Math.floor(i/5)*.23),r=W*.029;ctx.strokeStyle='#a9f4ff80';ctx.lineWidth=2;ctx.strokeRect(x-r,y-r,r*2,r*2);ctx.beginPath();ctx.arc(x,y,r*.48,0,Math.PI*2);ctx.stroke();}
  const light=ctx.createLinearGradient(0,0,W,0);light.addColorStop(0,'#ffffff00');light.addColorStop(.48,'#dcffff');light.addColorStop(1,'#ffffff00');ctx.fillStyle=light;ctx.fillRect(0,H*.44,W,Math.max(2,H*.003));
  return YPTemplateBranding.artwork(c.toDataURL(),w,h,{zone:key==='orbit-portrait'?[.12,.10,.76,.20]:[.19,.12,.62,.25]});
 }
 function build({T,obj,mesh,bx}){
  const design=obj.structure?.design;if(!design?.startsWith('orbit-'))return false;
  const {w,d,h}=obj.size,key=design.slice(6);
  const cube=(sz,pos,col=white,opt={})=>bx(sz,pos,col,{edges:false,roughness:.38,...opt});
  const rect=(x,y,W,H,r)=>{const s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+W-r,y);s.quadraticCurveTo(x+W,y,x+W,y+r);s.lineTo(x+W,y+H-r);s.quadraticCurveTo(x+W,y+H,x+W-r,y+H);s.lineTo(x+r,y+H);s.quadraticCurveTo(x,y+H,x,y+H-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);s.closePath();return s;};
  const extrude=(shape,depth,z,col=white)=>mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:20}),col,[0,0,z],{roughness:.37});
  if(key==='portal'){
   const t=.075;cube([t,h,d],[-w/2+t/2,h/2,0],blue);cube([t,h,d],[w/2-t/2,h/2,0],blue);cube([w,t,d],[0,h-t/2,0],blue);
   for(const z of [-d/2-.001,d/2+.001]){cube([.014,h-.06,.002],[-w/2+t*.65,(h-.06)/2,z]);cube([.014,h-.06,.002],[w/2-t*.65,(h-.06)/2,z]);cube([w-.09,.014,.002],[0,h-.043,z]);}
  }else if(key==='ribbon'){
   const s=new T.Shape(),steps=64,thick=Math.min(.065,d*.22),curve=x=>d*.41+thick/2-Math.sin((x/w+.5)*Math.PI)*d*.82;
   for(let i=0;i<=steps;i++){const x=-w/2+w*i/steps,y=curve(x);i?s.lineTo(x,y):s.moveTo(x,y);}
   for(let i=steps;i>=0;i--){const x=-w/2+w*i/steps;s.lineTo(x,curve(x)-thick);}s.closePath();
   const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:24});g.rotateX(-Math.PI/2);mesh(g,white,[0,0,0],{roughness:.37});
  }else if(key==='sidewall'){
   const s=rect(-w/2,0,w,h,.003);s.holes.push(rect(-.73,.38,1.46,1.44,.002));extrude(s,d,-d/2);
  }else if(key==='circle-shelf'){
   const r=Math.min(w,h)/2,t=.026;
   const s=new T.Shape();s.absarc(0,h/2,r,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,h/2,r-t,0,Math.PI*2,true);s.holes.push(hole);extrude(s,d,-d/2);
   mesh(new T.CircleGeometry(r-t,64),'#e1e4eb',[0,h/2,-d/2+.005],{roughness:.4});
   for(const y of [.32,.64]){const offset=(y-.5)*h,length=2*Math.sqrt((r-t)**2-offset**2);cube([length,.018,d*.9],[0,h*y,0]);}
   mesh(new T.TorusGeometry(r-.010,.009,8,72),'#c5cdd5',[0,h/2,d/2],{metalness:.5,roughness:.26});
  }else if(key==='showcase'){
   const t=Math.min(.07,w*.04);if(obj.structure.openBack!==true)cube([w,h,.025],[0,h/2,-d/2+.0125]);
   cube([t,h,d],[-w/2+t/2,h/2,0],red);cube([t,h,d],[w/2-t/2,h/2,0],red);cube([w,t,d],[0,t/2,0],red);cube([w,t,d],[0,h-t/2,0],red);
   for(const y of [.26,.50,.74])cube([w-2*t,.018,d*.94],[0,h*y,.005]);
  }else if(key==='plinth'){
   cube([w*.94,.075,d*.94],[0,.0375,0],blue);cube([w,h-.075,d],[0,.075+(h-.075)/2,0]);
  }else if(key==='counter'){
   extrude(rect(-w/2,0,w,h*.86,.13),d,-d/2,blue);
   extrude(rect(-w*.43,.09,w*.86,h-.09,.10),.07,d/2-.065,white);
   cube([w*.94,.06,d*.98],[0,h-.03,0]);
  }else if(key==='topiary'){
   mesh(new T.CylinderGeometry(w*.31,w*.23,h*.29,32),white,[0,h*.145,0],{roughness:.4});
   mesh(new T.CylinderGeometry(w*.28,w*.28,.012,24),'#353128',[0,h*.29,0]);
   mesh(new T.CylinderGeometry(.022,.03,h*.30,12),'#695b3f',[0,h*.40,0]);
   const rand=i=>{const f=Math.sin(i*127.1)*43758.54;return f-Math.floor(f);};
   for(let i=0;i<155;i++){const a=i*2.39996,v=rand(i+91)*2-1,r=Math.sqrt(1-v*v),radius=.55+.4*rand(i+73),leaf=mesh(new T.SphereGeometry(1,7,5),['#35772f','#529039','#6a9c47'][i%3],[Math.cos(a)*r*w*.44*radius,h*.69+v*h*.23,Math.sin(a)*r*d*.44*radius]);leaf.scale.set(.036,.052,.022);leaf.rotation.set(i*.7,a,i*.4);}
  }else if(key==='planter'){
   cube([w,h*.70,d],[0,h*.35,0]);cube([w-.055,.01,d-.055],[0,h*.70,0],'#414936');
   for(let i=0;i<46;i++){const leaf=mesh(new T.SphereGeometry(1,7,5),['#438133','#688d42','#366d2a'][i%3],[-w*.46+(i%23)/22*w*.92,h*.8+(i%5)*.006,(i%2?1:-1)*d*.19]);leaf.scale.set(.04,.075,.025);leaf.rotation.z=(i%7-3)*.25;}
  }
  return true;
 }
 // A saved template is isolated from live drafts; never migrate other instances by ID.
 const saved=global.YPBlueOrbitSavedSnapshot;
 if(saved){const t=global.YPPeninsularBlueOrbitTemplates[0];Object.assign(t,{version:2,previewVersion:'20260914-open-shelf',width:saved.spec.W,depth:saved.spec.D,height:saved.spec.H,floor:saved.spec.floor,tile:saved.spec.tile,savedSnapshot:saved,objects:saved.spec.objects,tagline:'แบบปรับล่าสุด · ธีมเขียวธรรมชาติ · ชั้นด้านข้างโปร่ง',description:'แบบจัดวางล่าสุด 36 ชิ้น · ธีมเขียวธรรมชาติ · ชั้นด้านข้างเปิดโล่ง คงกรอบและแผ่นชั้น · โลโก้และกราฟิก Yuppie'});}
 global.YPPeninsularBlueOrbit={build,artwork};
})(globalThis);
