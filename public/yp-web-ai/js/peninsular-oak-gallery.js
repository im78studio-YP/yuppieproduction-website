(function(global){
 'use strict';
 const wood='#c4a077',black='#303132',white='#f2f0e9';
 const p=(catalogId,x,z,w,d,h,y=0,extra={})=>({catalogId,position:{x,y,z},size:{w,d,h},...extra});
 const custom=(key,x,z,w,d,h,y=0,extra={})=>p('panel-standard',x,z,w,d,h,y,{structure:{design:'oak-'+key},...extra});
 const box=(x,z,w,d,h,color,y=0)=>p('panel-standard',x,z,w,d,h,y,{color});
 const logo=(x,z,w,h,y,rotationY=0)=>p('brand-artwork-copy',x,z,w,.012,h,y,{brandLogo:true,label:'โลโก้ Yuppie',rotationY});
 const tv=(id,x,z,w,h,y)=>p(id,x,z,w,.10,h,y,{geometryMode:'model',graphic:'oak-screen',label:id==='tv-65'?'ทีวี 65 นิ้ว':'ทีวี 40 นิ้ว'});
 global.YPPeninsularOakGalleryTemplates=[{id:'penin-oak-gallery-6',name:'20 · Oak Gallery',width:6,depth:6,height:3,customBack:true,logoScale:0,logoU:3,logoY:2.2,
  primary:wood,secondary:black,background:white,floor:'tile',tile:'woodL',graphic:'',purpose:'meeting',
  tagline:'6×6 ม. · ซุ้มระแนงไม้ + แผงจอสีดำ + เคาน์เตอร์สวน',
  description:'อ้างอิงบูธเดียวกัน 4 มุม: ระแนงไม้ต่อเนื่องจากเสาถึงหลังคา คานไม้สามด้าน แผงจอสีดำ มุมเจรจา 4 ที่นั่ง และเคาน์เตอร์มุมมนช่องต้นไม้ · สูง 3 ม. · ใช้โลโก้ Yuppie และทีวีเปลี่ยนภาพได้',
  objects:[
   box(3,.12,6,.24,3,white),
   custom('wood',3.81,5.73,4.18,.34,.40,2.6),
   custom('wood',5.78,3.02,.32,5.72,.40,2.6),
   custom('wood',.20,2.48,.32,4.64,.40,2.6),
   ...Array.from({length:8},(_,i)=>[
    custom('wood',.13+i*.215,5.72,.12,.32,3),
    custom('wood',.13+i*.215,4.88,.12,1.68,.24,2.76)
   ]).flat(),
   custom('wood',.90,4.08,1.70,.22,.34,2.66),
   logo(3.74,5.914,2.15,.31,2.645),
   logo(5.954,3.52,2.04,.31,2.645,90),
   logo(.026,2.37,1.96,.31,2.645,-90),
   custom('cube-frame',.49,5.921,.57,.14,.62,1.02),
   custom('cube-frame',1.20,5.921,.57,.14,.62,1.36),
   // Short rear-side screen leaves the rest of the left aisle open.
   box(.20,1.08,.32,1.72,2.60,black),
   custom('lattice',.026,1.07,1.46,.05,2.20,.14,{rotationY:-90}),
   ...Array.from({length:10},(_,i)=>custom('wood',.39,.41+i*.15,.11,.055,2.60)),
   custom('foliage',.445,1.13,.08,.38,1.65,.73),
   // One display block, not an automatically added standard storage room.
   box(4.70,1.73,2.20,2.84,2.55,black),
   ...[.57,1.16,1.75,2.34,2.93].map(z=>box(5.89,z,.18,.14,2.60,black)),
   tv('tv-65',4.70,3.208,1.46,.80,1.05),
   box(1.95,.269,3.34,.055,.68,black,.99),
   logo(.73,.309,.70,.27,1.18),
   tv('tv-samsung-40',1.73,.355,.91,.55,1.05),
   tv('tv-samsung-40',2.85,.355,.91,.55,1.05),
   ...[3.05,3.32,3.59].flatMap(x=>[custom('rod',x,4.72,.035,.035,2.60),box(x,4.72,.18,.20,2.18,black,.22)]),
   p('table-standard',1.89,1.94,.82,.82,.73),
   ...[[1.15,1.94,90],[2.63,1.94,-90],[1.89,1.20,0],[1.89,2.68,180]].map(([x,z,rotationY])=>p('chair-standard',x,z,.56,.56,.82,0,{rotationY})),
   custom('counter',4.60,5.49,2.42,.72,1.03),
   p('planter-grass',4.18,5.72,1.28,.22,.68,.13),
   logo(5.35,5.864,.59,.22,.40),
   p('chair-standard',4.58,4.79,.56,.56,.82,0,{rotationY:180}),
  ]
 }];
 // Revision 2: saved from the user's 67-piece layout on 2026-09-14.
 // Keep the original IDs so logo slots and future edits remain identifiable.
 const saved=global.YPPeninsularOakGalleryTemplates[0];
 saved.version=2;saved.previewVersion='20260914-user-layout';
 saved.description='บูธไม้–ดำ 6×6×3 ม. · แบบปรับล่าสุด 67 ชิ้น: คานไม้ร่นเข้า แผงระแนงดำรองรับจอ ทีวี 3 จุด มุมเจรจา และเคาน์เตอร์สวน · โลโก้ Yuppie เปลี่ยนได้';
 saved.objects.forEach((o,i)=>o.id=saved.id+'-'+i);
 const updates={
  1:{position:{x:3.138,y:2.6,z:4.058},size:{w:5.472,d:.4,h:.4}},
  2:{position:{x:5.714,y:2.6,z:2.287},size:{w:.32,d:4,h:.4}},
  3:{position:{x:.139,y:2.648,z:2.311},size:{w:.277,d:4.023,h:.347}},
  21:{position:{x:3.714,y:2.645,z:4.324}},
  22:{position:{x:5.954,y:2.645,z:2}},
  39:{position:{x:4.751,y:0,z:1.24},size:{w:2,d:2,h:2.55}},
  43:{position:{x:5.841,y:0,z:2.17}},
  45:{position:{x:4.724,y:1.5,z:4.318}},
  51:{position:{x:5.824000000000001,y:.006,z:4.168},size:{w:.1,d:.2,h:2.6}},
  64:{catalogId:'bar-stool',size:{w:.37,d:.37,h:.9},transform:{flipZ:true}}
 };
 for(const [index,patch]of Object.entries(updates))Object.assign(saved.objects[index],patch);
 const removed=new Set([20,40,42,44,50,52,53,54,55]);
 saved.objects=saved.objects.filter((o,i)=>!removed.has(i));
 const slatIds=['311854bf-54d3-4798-9ba9-549f9c452848','77e0823d-60e8-45c4-b1ea-7b2ebfd1559d','1efb505d-9380-4bbf-87d2-65a33048aa0c','9f4194ea-bb61-44c2-b421-ef0dd2089bab','31e03cb9-f355-4189-bb5c-356f8d7025cf','ff96c8fa-a379-4acd-b81d-4fae60599537','3186c167-872c-4baf-996b-418cc904906c','44a2ddd1-cc9c-4e38-b41d-b9d8bb17ac93','a1d5a4ed-b7d8-4cda-8823-adb13da96e8f','3d0cc845-ccac-4f83-aa0c-19ad1ae0d9e7','9c9a9676-0a4d-4966-987a-65c9b4c7c0f2'];
 slatIds.forEach((id,i)=>saved.objects.push({...box(Number((5.624-i*.2).toFixed(3)),4.168,.1,.2,2.6,black,.006),id:'obj-array-'+id}));
 function artwork(key,w,h){
  const c=document.createElement('canvas');c.width=1400;c.height=Math.round(1400*h/w);const ctx=c.getContext('2d'),W=c.width,H=c.height;
  const g=ctx.createRadialGradient(W*.55,H*.6,5,W*.5,H*.5,W*.70);g.addColorStop(0,'#0a4f87');g.addColorStop(.45,'#071e43');g.addColorStop(1,'#030812');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<26;i++){ctx.beginPath();ctx.lineWidth=i%5===0?4:1.5;ctx.strokeStyle=i%4===0?'#ee438c88':'#39bfff77';for(let x=0;x<=W;x+=8){const y=H*.64+Math.sin(x/W*7+i*.12)*H*(.08+i*.009)+(i-13)*H*.009;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  return YPTemplateBranding.artwork(c.toDataURL(),w,h,{zone:[.20,.16,.60,.38]});
 }
 let grain;
 function woodTexture(T){
  if(grain)return grain;const canvas=document.createElement('canvas');canvas.width=256;canvas.height=1024;const c=canvas.getContext('2d');c.fillStyle='#caa77e';c.fillRect(0,0,256,1024);
  for(let i=0;i<420;i++){const x=(i*73.17)%256;c.strokeStyle=i%3?'#a17a5020':'#f3d3a450';c.lineWidth=.3+i%3*.3;c.beginPath();for(let y=0;y<=1024;y+=8){const xx=x+Math.sin(y*.006+i*.19)*2.6+Math.sin(y*.022+i)*.65;y?c.lineTo(xx,y):c.moveTo(xx,y);}c.stroke();}
  grain=new T.CanvasTexture(canvas);grain.colorSpace=T.SRGBColorSpace;grain.wrapS=grain.wrapT=T.RepeatWrapping;return grain;
 }
 function build({T,obj,mesh,bx}){
  const design=obj.structure?.design;if(!design?.startsWith('oak-'))return false;const {w,d,h}=obj.size,key=design.slice(4);
  const woodMat=()=>new T.MeshStandardMaterial({color:'#ffffff',map:woodTexture(T),roughness:.62});
  const cube=(size,pos,color,opt={})=>bx(size,pos,color,{edges:false,...opt});
  const rect=(x,y,W,H,r)=>{const s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+W-r,y);s.quadraticCurveTo(x+W,y,x+W,y+r);s.lineTo(x+W,y+H-r);s.quadraticCurveTo(x+W,y+H,x+W-r,y+H);s.lineTo(x+r,y+H);s.quadraticCurveTo(x,y+H,x,y+H-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;};
  const extrude=(s,depth,z,color,material)=>mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:18}),color,[0,0,z],material?{material}:{});
  if(key==='wood'){
   const geo=new T.BoxGeometry(w,h,d),pos=geo.attributes.position,n=geo.attributes.normal,uv=[];
   // Long grain follows the longest physical axis, never stretches the logo artwork.
   const axis=h>=w&&h>=d?'y':w>=d?'x':'z';
   for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),long=axis==='y'?y:axis==='x'?x:z,across=axis==='y'?(Math.abs(n.getX(i))>.5?z:x):axis==='x'?(Math.abs(n.getY(i))>.5?z:y):(Math.abs(n.getY(i))>.5?x:y);uv.push(across*3,long/2.2);}
   geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));mesh(geo,wood,[0,h/2,0],{material:woodMat()});
  }else if(key==='cube-frame'){
   const s=rect(-w/2,0,w,h,.006);s.holes.push(rect(-w/2+.035,.035,w-.07,h-.07,.002));extrude(s,d,-d/2,white);
  }else if(key==='rod'){
   mesh(new T.CylinderGeometry(w/2,w/2,h,16),'#9b9d98',[0,h/2,0],{metalness:.70,roughness:.3});
  }else if(key==='lattice'){
   // Parallel diagonal slats clipped mathematically to the display rectangle.
   for(let k=-h;k<=w;k+=.13){const pts=[];for(const x of [-w/2,w/2]){const y=x+w/2-k;if(y>=0&&y<=h)pts.push([x,y]);}for(const y of [0,h]){const x=y+k-w/2;if(x>-w/2&&x<w/2)pts.push([x,y]);}if(pts.length<2)continue;const a=new T.Vector3(pts[0][0],pts[0][1],0),b=new T.Vector3(pts[1][0],pts[1][1],0),v=b.clone().sub(a);const m=mesh(new T.BoxGeometry(.025,v.length(),d),wood,a.clone().add(b).multiplyScalar(.5).toArray(),{material:woodMat()});m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());}
  }else if(key==='foliage'){
   const rand=i=>{const f=Math.sin(i*127.1)*43758.54;return f-Math.floor(f);};for(let i=0;i<210;i++){const m=mesh(new T.SphereGeometry(1,7,5),['#36582d','#62793b','#7b9451'][i%3],[(rand(i)-.5)*w,rand(i+130)*h,(rand(i+600)-.5)*d]);m.scale.set(.018,.036,.026);m.rotation.z=i*2.4;}
  }else if(key==='counter'){
   const r=.14,t=.045,s=rect(-w/2,0,w,h,r);s.holes.push(rect(-w/2+t,t,w-2*t,h-2*t,r-t));extrude(s,d,-d/2,black);
   const face=rect(-w/2+t,t,w-2*t,h-2*t,r-t),hx=-w*.43,hy=.13,hw=w*.58,hh=h*.71;face.holes.push(rect(hx,hy,hw,hh,.08));extrude(face,.035,d/2-.055,wood,woodMat());
   const trim=rect(hx-.022,hy-.022,hw+.044,hh+.044,.102);trim.holes.push(rect(hx,hy,hw,hh,.08));extrude(trim,.024,d/2-.023,black);
   // The window stays physically open: no solid back panel behind the plants.
   cube([w*.73,.016,d*.63],[0,h+.042,0],'#acbdc3',{transparent:true,opacity:.36,metalness:.1,roughness:.16});
   for(const x of [-w*.30,w*.30])for(const z of [-d*.23,d*.23])cube([.018,.04,.018],[x,h+.02,z],'#8a9295');
  }
  return true;
 }
 global.YPPeninsularOakGallery={build,artwork};
})(globalThis);
