(function(root){
 'use strict';
 const p=(id,x,z,w,d,h,color,y=0,extra={})=>({catalogId:id,position:{x,y,z},size:{w,d,h},color,...extra});
 const box=(x,z,w,d,h,c,y=0)=>p('panel-standard',x,z,w,d,h,c,y);
 const custom=(design,x,z,w,d,h,color,y=0,rotationY=0)=>p('panel-standard',x,z,w,d,h,null,y,{structure:{design:'botanical-'+design,color},rotationY});
 const art=(key,x,z,w,h,y,rotationY=0)=>p('brand-artwork-copy',x,z,w,.012,h,null,y,{graphic:key,rotationY,structure:{design:'botanical-art'}});
 const logo=(x,z,w,h,y,rotationY=0)=>p('brand-artwork-copy',x,z,w,.012,h,null,y,{brandLogo:true,rotationY,structure:{design:'botanical-art'}});
 const cream='#f4f0df',wood='#d6af86',green='#87b51a';
 root.YPPeninsularBotanicalTemplates=[{id:'penin-botanical-atelier',name:'18 · Botanical Atelier',width:6,depth:3,height:3.5,logoScale:0,logoU:3,logoY:3,customBack:true,
  primary:green,secondary:wood,background:cream,floor:'tile',tile:'woodL',graphic:'',purpose:'meeting',tagline:'สวนสกินแคร์ · ซุ้มไม้และเลานจ์สีครีม–เขียว',
  description:'บูธเดียวจากสองมุม: ซุ้มไม้สีพีช โซฟาครีม แผงใบไม้ช่องกลม 3 ช่อง เสาสูงพร้อมจอแนวตั้ง ป้ายสวนแนวตั้ง และแท่นโชว์ทรงกระบอกพันแถบโค้ง · ใช้โลโก้ Yuppie · สูงประมาณ 3.5 ม.',
  objects:[
   box(3,.15,6,.30,3.5,cream),
   custom('floor',3,1.5,5.96,2.96,.009,wood),
   ...[.018,2.982].map(z=>custom('wood',3,z,6,.035,.015,wood)),
   ...[.018,5.982].map(x=>custom('wood',x,1.5,.035,3,.015,wood)),
   logo(2.10,.311,2.96,.70,2.68),
   // The side post is an open rectangular frame, not a solid side wall.
   custom('side-frame',.40,1.51,.25,2.26,2.6,wood),
   custom('wood',2.23,2.52,3.91,.26,.24,wood,2.39),
   ...[.74,1.34,1.94].map((z,i)=>box(2.25,z,3.60,.57,.05,i%2?green:cream,2.4)),
   custom('leaf-panel',4.13,.43,.88,.11,3.5,green),
   custom('mirror-panel',4.10,1.03,.80,.12,2.37,green),
   box(5.25,1.18,1.30,1.96,3.5,cream),
   ...[4.81,5.24,5.67].map(x=>custom('wood',x,2.20,.23,.14,3.5,wood)),
   custom('foliage',5.24,2.31,1.25,.16,.95,green,1.76),logo(5.24,2.414,1.04,.34,2.06),
   ...[4.91,5.54].flatMap(x=>[.98,1.32].flatMap(y=>[custom('shelf',x,2.30,.25,.20,.018,cream,y),custom('bottle',x,2.29,.065,.065,.25,cream,y+.02)])),
   art('botanical-portrait',5.910,1.18,1.45,1.94,.67,90),logo(5.914,1.18,1.48,.42,2.83,90),
   ...[1.15,1.64,2.12].map(y=>box(5.918,1.18,.008,1.46,.008,'#57594a',y)),box(5.918,1.18,.008,.008,1.94,'#57594a',.67),
   custom('wood',2.14,.37,3.37,.045,1.35,wood,1.02),art('botanical-wide',2.14,.403,3.23,1.22,1.085),
   p('lounge-sofa',2.22,.88,2.75,.87,.86,'#f1e6c8'),
   ...[1.42,3.02].map(x=>custom('pillow',x,1.07,.48,.18,.30,green,.48)),
   custom('coffee',2.43,1.67,1.12,.66,.46,wood),
   custom('flowers',2.43,1.67,.24,.24,.34,green,.46),
   ...[[1.64,1.92],[3.42,1.92]].map(([x,z])=>custom('ottoman',x,z,.48,.48,.44,green)),
   custom('rod-screen',.42,1.30,.16,1.20,2.12,wood),
   custom('green-frame',.42,1.30,.24,.67,.57,green,1.25),
   custom('plant',.96,2.24,.75,.75,1.62,green),
   custom('helix-display',1.64,2.57,.77,.68,1.13,wood),
   custom('reception',5.05,2.55,1.72,.70,1.0,cream),logo(5.05,2.906,.90,.30,.45),
   custom('monitor',5.02,2.45,.40,.19,.40,'#d4d4ca',1.0),
   custom('plant',5.65,2.46,.20,.20,.48,green,1.0)
  ]
 }];
 function build({T,obj,mesh,bx}){
  const design=obj.structure?.design;if(!design?.startsWith('botanical-'))return false;
  const {w,d,h}=obj.size,c=obj.structure.color||cream,white='#f7f4e9';
  const cube=(s,pos,color=c,opt={})=>bx(s,pos,color,{edges:false,...opt});
  const cyl=(r1,r2,height,pos,color=c,segments=28)=>mesh(new T.CylinderGeometry(r1,r2,height,segments),color,pos,{roughness:.63});
  const ell=(pos,scale,color=c)=>{const m=mesh(new T.SphereGeometry(1,12,8),color,pos,{roughness:.76});m.scale.set(...scale);return m;};
  const rod=(a,b,r,color)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),m=cyl(r,r,av.distanceTo(bv),av.clone().add(bv).multiplyScalar(.5).toArray(),color,8);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());};
  const bottle=(x,y,z,r=.032,ht=.22)=>{cyl(r,r,ht*.76,[x,y+ht*.38,z],white);cyl(r*.74,r*.74,ht*.24,[x,y+ht*.88,z],wood);};
  if(design==='botanical-art'){mesh(new T.PlaneGeometry(w,h),white,[0,h/2,.002],{material:new T.MeshBasicMaterial({color:0xffffff,transparent:true,side:T.DoubleSide,toneMapped:false})});}
  else if(design==='botanical-wood'){
   cube([w,h,d],[0,h/2,0],wood);
   // Fine deterministic grain remains geometry-light and scale-independent.
   for(let i=0;i<9;i++)cube([w,.001,.001],[0,h*(i+1)/10,d/2+.0006],i%2?'#c6a17d':'#e3c5a4');
  }else if(design==='botanical-side-frame'){
   for(const z of [-d/2+.09,d/2-.09])cube([w,h,.18],[0,h/2,z],wood);
   cube([w,.20,d],[0,h-.10,0],wood);
  }else if(design==='botanical-rod-screen'){
   for(let i=0;i<4;i++)cyl(.016,.016,h,[0,h/2,-d*.45+i*d*.3],wood,12);
   for(const y of [.52,1.1])cube([w,.025,d],[0,y,0],wood);
  }else if(design==='botanical-green-frame'){
   for(const z of [-d/2+.04,d/2-.04])cube([w,h,.08],[0,h/2,z],green);
   for(const y of [.04,h-.04])cube([w,.08,d],[0,y,0],green);bottle(0,.08,0,.035,.2);
  }else if(design==='botanical-leaf-panel'||design==='botanical-mirror-panel'){
   cube([w,h,d],[0,h/2,0],green);
   rod([-.35*w,0,d/2+.005],[w*.25,h,d/2+.005],.008,'#c2d857');
   for(let i=0;i<20;i++){const y=h*i/20;for(const side of [-1,1])rod([-.35*w+.6*w*i/20,y,d/2+.007],[side*w*.48,Math.min(h,y+h*.12),d/2+.007],.003,'#a8cc32');}
   if(design==='botanical-mirror-panel')for(const y of [.55,1.12,1.69]){
    mesh(new T.CircleGeometry(w*.30,48),'#dee3d2',[0,y,d/2+.015],{metalness:.18,roughness:.27});
    mesh(new T.TorusGeometry(w*.305,.009,8,48),wood,[0,y,d/2+.015]);
   }
  }else if(design==='botanical-foliage'){
   cube([w,h,d*.4],[0,h/2,0],'#45681b');
   const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
   for(let i=0;i<550;i++){const x=(rand(i)-.5)*w,y=rand(i+991)*h,z=d*.25+rand(i+333)*.035;const m=ell([x,y,z],[.046,.026,.008],['#4e791d','#759832','#92b53d','#adc85a'][i%4]);m.rotation.z=i*2.4;}
  }else if(design==='botanical-shelf'){cube([w,h,d],[0,h/2,0],'#dde7da',{transparent:true,opacity:.5});}
  else if(design==='botanical-bottle'){bottle(0,0,0,w/2,h);}
  else if(design==='botanical-pillow'||design==='botanical-ottoman'){
   if(design==='botanical-pillow')ell([0,h/2,0],[w*.55,h*.54,d*.55],green);
   else{const r=.035,s=new T.Shape();s.moveTo(-w/2+r,0);s.lineTo(w/2-r,0);s.quadraticCurveTo(w/2,0,w/2,r);s.lineTo(w/2,h-r);s.quadraticCurveTo(w/2,h,w/2-r,h);s.lineTo(-w/2+r,h);s.quadraticCurveTo(-w/2,h,-w/2,h-r);s.lineTo(-w/2,r);s.quadraticCurveTo(-w/2,0,-w/2+r,0);mesh(new T.ExtrudeGeometry(s,{depth:d-.02,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:3}),green,[0,0,-d/2+.01]);}
  }else if(design==='botanical-coffee'){
   const top=cyl(w/2,w/2,.065,[0,h-.032,0],wood,64);top.scale.z=d/w;
   for(const a of [0,2.1,4.2]){const x=Math.cos(a)*w*.28,z=Math.sin(a)*d*.28;rod([x,h-.06,z],[x*1.25,.015,z*1.25],.009,'#9a7447');rod([x+.05,h-.06,z],[x*1.25,.015,z*1.25],.007,'#9a7447');}
  }else if(design==='botanical-flowers'){
   cyl(.035,.028,h*.43,[0,h*.215,0],'#777560');for(let i=0;i<9;i++){const x=Math.sin(i*2.4)*w*.4,z=Math.cos(i*2.4)*d*.4;rod([0,h*.3,0],[x,h*(.6+i%3*.17),z],.003,'#48602a');ell([x,h*(.6+i%3*.17),z],[.025,.018,.025],'#c67fab');}
  }else if(design==='botanical-plant'){
   cyl(w*.22,w*.15,h*.27,[0,h*.135,0],white,40);
   for(let i=0;i<28;i++){const a=i*Math.PI/14;rod([Math.cos(a)*w*.15,0,Math.sin(a)*d*.15],[Math.cos(a)*w*.22,h*.27,Math.sin(a)*d*.22],w*.005,'#d3cbb9');}
   for(let k=0;k<7;k++){const a=k*2.4,x=Math.cos(a)*w*.15,z=Math.sin(a)*d*.15;rod([x*.3,h*.2,z*.3],[x,h*.96,z],.004,'#638333');for(let j=0;j<9;j++){const y=h*(.31+j*.067+(k%3)*.013),angle=a+j*2.39,dx=Math.cos(angle)*w*.25,dz=Math.sin(angle)*d*.25;rod([x,y,z],[x+dx,y+h*.04,z+dz],.002,'#6a8a2e');const l=ell([x+dx*.7,y+h*.025,z+dz*.7],[w*.18,h*.009,w*.027],j%2?'#5f912c':'#407324');l.rotation.y=-angle;l.rotation.z=.20*Math.sin(j+k);}}
  }else if(design==='botanical-floor'){
   const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);const surface=mesh(g,wood,[0,h,0]);
   // A template floor skin follows the booth flooring controls, not a fixed wood finish.
   surface.userData.boothFloorFinish={width:w,depth:d};
  }else if(design==='botanical-helix-display'){
   cyl(w*.56,w*.56,.012,[0,.006,0],'#eee9d8',64);for(let r=1;r<=3;r++){const ring=mesh(new T.TorusGeometry(w*(.27+r*.065),.003,6,64),'#51534c',[0,.015,0]);ring.rotation.x=Math.PI/2;}
   [[-.17,0,.80],[.14,-.06,.96],[.10,.18,.66]].forEach(([x,z,ht])=>{cyl(.12,.12,h*ht,[x,h*ht/2,z],white);cyl(.125,.125,.025,[x,h*ht,z],wood);bottle(x,h*ht+.015,z,.032,.18);});
   const vertices=[],idx=[],n=100;for(let i=0;i<=n;i++){const a=i/n*Math.PI*3.8,y=.12+i/n*h*.70;for(const dy of [0,.08])vertices.push(Math.cos(a)*w*.38,y+dy,Math.sin(a)*d*.40);}for(let i=0;i<n;i++){let v=i*2;idx.push(v,v+1,v+2,v+1,v+3,v+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(idx);g.computeVertexNormals();mesh(g,wood,[0,0,0],{side:T.DoubleSide});
   const tab=cube([.16,.23,.018],[.10,h+.09,-.06],'#353a34');tab.rotation.x=-.24;
  }else if(design==='botanical-reception'){
   cube([w*.80,.13,d*.76],[0,.065,0],wood);cube([w*.79,.025,d*.74],[0,.033,0],'#ffc257',{emissive:'#ffc257',emissiveIntensity:.8});
   const shape=new T.Shape();shape.moveTo(-w/2,.14);shape.lineTo(w/2,.14);shape.lineTo(w/2,h);shape.lineTo(-w/2,h*.9);shape.closePath();mesh(new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false}),cream,[0,0,-d/2]);
  }else if(design==='botanical-monitor'){
   cube([w*.42,.018,d],[0,.009,0],c);cube([.04,h*.34,.04],[0,h*.18,0],c);cube([w,h*.68,.04],[0,h*.66,0],c);cube([w*.91,h*.59,.009],[0,h*.66,-.027],'#263333');
  }else return false;return true;
 }
 root.YPPeninsularBotanical={build,artwork:key=>root.YPBotanicalImages[key==='botanical-wide'?'wide':'portrait']};
})(globalThis);
