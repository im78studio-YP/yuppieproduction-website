(function(global){
 'use strict';
 const white='#e8e9e8',dark='#23434b',cyan='#28e5f3';
 const p=(catalogId,x,z,w,d,h,y=0,extra={})=>({catalogId,position:{x,y,z},size:{w,d,h},...extra});
 const custom=(key,x,z,w,d,h,y=0,extra={})=>p('panel-standard',x,z,w,d,h,y,{structure:{design:'nexus-'+key},...extra});
 const logo=(x,z,w,h,y,label)=>p('brand-artwork-copy',x,z,w,.012,h,y,{brandLogo:true,label});
 const art=(key,x,z,w,h,y)=>p('brand-artwork-copy',x,z,w,.012,h,y,{graphic:'nexus-'+key,label:'กราฟิก Yuppie · '+key,structure:{design:'nexus-art'}});
 global.YPPeninsularCyanNexusTemplates=[{id:'penin-cyan-nexus',name:'19 · Cyan Nexus',width:6,depth:3,height:3.5,customBack:true,logoU:3,logoY:3,logoScale:0,
  primary:cyan,secondary:dark,background:dark,floor:'tile',tile:'woodD',graphic:'',purpose:'display',
  tagline:'กรอบเทคโนโลยีขาว–เขียวเข้ม · ไฟเส้น Cyan',
  description:'อ้างอิงบูธเดียวกันสองมุม: ป้ายทรงเฉียงซ้อนชั้น ผนังกราฟิกขนาดใหญ่ กรอบเปิดด้านข้าง เคาน์เตอร์โค้งมีไฟ และโต๊ะสูง 4 ที่นั่ง · โลโก้และกราฟิก Yuppie · สูงประมาณ 3.5 ม. เปิดหน้าและสองข้าง',
  objects:[
   custom('back',3,.12,6,.24,3.5),
   custom('header',2.90,.91,5.74,.62,.84,2.66),
   logo(2.37,1.232,2.20,.44,2.98,'โลโก้ Yuppie · ป้ายบน'),
   custom('ceiling',2.96,.66,5.66,1.05,.12,2.63),
   custom('display-frame',2.10,.42,3.85,.30,2.45,.14),
   art('story',2.10,.640,3.38,1.65,.61),
   custom('side-portal',.12,1.46,2.62,.20,2.70,0,{rotationY:90}),
   custom('side-portal',5.88,1.46,2.62,.20,2.95,0,{rotationY:90}),
   ...[4.53,5.28].flatMap(x=>[custom('poster-frame',x,.32,.66,.14,1.30,1.27),art('poster',x,.432,.54,1.14,1.35)]),
   custom('counter',1.85,2.48,2.92,.84,.99),
   logo(2.29,2.917,1.25,.35,.51,'โลโก้ Yuppie · เคาน์เตอร์'),
   custom('bar',4.74,1.70,1.78,.58,1.04),
   ...[[4.26,1.10,0],[5.14,1.10,0],[4.26,2.30,180],[5.14,2.30,180]].map(([x,z,rotationY])=>p('bar-stool',x,z,.43,.43,.91,0,{rotationY,structure:{design:'nexus-stool'}})),
  ]
 }];
 const contour=[[0,0],[.89,0],[1,.17],[1,.84],[.90,1],[.13,1],[0,.83],[0,.34],[.10,.20]];
 function artwork(key,w,h){
  const c=document.createElement('canvas');c.width=1800;c.height=Math.round(1800*h/w);const ctx=c.getContext('2d'),W=c.width,H=c.height;
  const gradient=ctx.createLinearGradient(0,H,W,0);gradient.addColorStop(0,'#4427cd');gradient.addColorStop(.53,'#037fc9');gradient.addColorStop(1,'#05dccf');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#ffffff12';ctx.lineWidth=1;for(let x=0;x<W;x+=14){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=14){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  if(key==='nexus-story'){
   const points=[[.12,.53],[.30,.68],[.49,.44],[.68,.60],[.87,.35]];ctx.strokeStyle='#e8ffff';ctx.lineWidth=H*.009;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*W,y*H):ctx.moveTo(x*W,y*H));ctx.stroke();
   ['IDEA','DESIGN','CREATE','BUILD','CONNECT'].forEach((text,i)=>{const[x,y]=points[i];ctx.fillStyle='#154b6b';ctx.beginPath();ctx.ellipse(x*W,y*H,W*.032,H*.047,-.15,0,7);ctx.fill();ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.font='bold '+H*.043+'px sans-serif';ctx.fillText('0'+(i+1),x*W,y*H+H*.015);ctx.font='bold '+H*.025+'px sans-serif';ctx.fillText(text,x*W,y*H+H*.105);});
   return YPTemplateBranding.artwork(c.toDataURL(),w,h,{zone:[.32,.055,.36,.21]});
  }
  ctx.fillStyle='#203b43';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);ctx.lineTo(W,H*.28);ctx.lineTo(0,H*.66);ctx.fill();
  ctx.strokeStyle='#c8fcff88';for(let i=0;i<10;i++){ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(W*.5,H*.81,W*(.16+i*.035),H*(.036+i*.009),-.22,0,7);ctx.stroke();}
  ctx.save();ctx.translate(W*.42,H*.51);ctx.rotate(-.7);ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.font='bold '+W*.085+'px sans-serif';ctx.fillText('BRIGHTER IDEAS',0,0);ctx.restore();
  return YPTemplateBranding.artwork(c.toDataURL(),w,h,{zone:[.10,.055,.80,.14]});
 }
 function build({T,obj,mesh,bx}){
  const design=obj.structure?.design;if(!design?.startsWith('nexus-'))return false;
  const{w,d,h}=obj.size,key=design.slice(6),gcolor=obj.structure.color||dark;
  const cube=(sz,pos,col,opt={})=>bx(sz,pos,col,{edges:false,...opt});
  function shape(points,width=w,height=h){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo((x-.5)*width,y*height):s.moveTo((x-.5)*width,y*height));s.closePath();return s;}
  function solid(points,width,height,depth,col,x=0,y=0,z=0){return mesh(new T.ExtrudeGeometry(shape(points,width,height),{depth,bevelEnabled:false}),col,[x,y,z-depth/2],{roughness:.48});}
  function line(points,width,height,z,col=cyan,r=.010,x=0,y=0){const path=new T.CurvePath();for(let i=1;i<points.length;i++)path.add(new T.LineCurve3(new T.Vector3((points[i-1][0]-.5)*width+x,points[i-1][1]*height+y,z),new T.Vector3((points[i][0]-.5)*width+x,points[i][1]*height+y,z)));return mesh(new T.TubeGeometry(path,Math.max(20,points.length*8),r,8,false),col,[0,0,0],{emissive:col,emissiveIntensity:.8,roughness:.3});}
  if(key==='art'){
   const s=shape([[0,.07],[.035,0],[.94,0],[1,.10],[1,.91],[.96,1],[.03,1],[0,.93]]);const geo=new T.ShapeGeometry(s),p=geo.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push((p.getX(i)+w/2)/w,p.getY(i)/h);geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));mesh(geo,'#ffffff',[0,0,.001],{material:new T.MeshBasicMaterial({color:'#ffffff',side:T.DoubleSide,toneMapped:false})});
  }else if(key==='back'){
   solid([[0,0],[1,0],[1,.88],[.78,.88],[.72,.83],[.16,.83],[.03,.80],[0,.74]],w,h,d,gcolor);
  }else if(key==='header'){
    const outline=[[0,0],[.10,.28],[.61,.28],[.66,.48],[1,.48],[1,1],[.69,.98],[.63,.88],[.13,.98],[.05,.87],[0,.62]];
   solid(outline,w,h,d-.10,white,0,-.04,-.05);solid(outline,w,h,.12,white,0,0,d/2-.06);
   line([[.04,.10],[.12,.34],[.62,.34],[.68,.55],[.99,.55]],w,h,d/2+.006,'#babebe',.014);
  }else if(key==='ceiling'){
   cube([w,h,d],[0,h/2,0],gcolor);
   // Luminous discs only: no visible lamp housings, consistent with booth lighting controls.
   for(const x of [-w*.36,-w*.12,w*.12,w*.36]){const disc=mesh(new T.CircleGeometry(.065,32),'#ffffff',[x,-.001,d*.20],{emissive:'#ffffff',emissiveIntensity:2});disc.rotation.x=Math.PI/2;}
  }else if(key==='display-frame'){
   solid(contour,w,h,d,white);solid(contour,w-.16,h-.22,.025,'#94aeb4',0,.11,d/2+.014);
   solid(contour,w-.27,h-.33,.02,white,0,.165,d/2+.028);
   line([[.02,.22],[.02,.79],[.14,.96],[.87,.96],[.98,.81],[.98,.18],[.87,.04],[.15,.04]],w-.16,h-.20,d/2+.041,cyan,.009,0,.10);
  }else if(key==='side-portal'){
   const outline=[[0,0],[.08,0],[.08,.88],[.21,1],[.88,1],[1,.85],[1,0],[.92,0],[.92,.80],[.83,.90],[.25,.90],[.16,.82],[.16,0]];
   solid(outline,w,h,d,gcolor);solid(outline,w,h,.045,white,0,0,d/2+.014);
   line([[.12,.02],[.12,.85],[.23,.95],[.855,.95],[.96,.825],[.96,.02]],w,h,d/2+.041,cyan,.009);
  }else if(key==='poster-frame'){
   solid([[0,.08],[.08,0],[.91,0],[1,.08],[1,.92],[.91,1],[.08,1],[0,.92]],w,h,d,'#acb6b7');
   solid([[0,.07],[.07,0],[.93,0],[1,.07],[1,.93],[.93,1],[.07,1],[0,.93]],w-.055,h-.055,.02,white,0,.0275,d/2+.01);
  }else if(key==='counter'){
   // Rounded return on the left with a raised angular brand block on the right.
   const s=new T.Shape();s.moveTo(-w/2+.30,-d/2);s.lineTo(w/2,-d/2);s.lineTo(w/2,d/2);s.lineTo(-w/2+.32,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-.30);s.lineTo(-w/2,-d/2+.30);s.quadraticCurveTo(-w/2,-d/2,-w/2+.30,-d/2);
   const geo=new T.ExtrudeGeometry(s,{depth:h*.70,bevelEnabled:false});geo.rotateX(-Math.PI/2);mesh(geo,white,[0,.08,0],{roughness:.48});
   solid([[0,.12],[.08,0],[1,0],[1,1],[.16,1],[0,.69]],w*.56,h*.66,d*.78,white,w*.21,h*.34,.07);
   cube([w*.82,.085,d*.72],[0,.0425,0],gcolor);
   line([[0,.50],[.14,.24],[.56,.24],[.64,.06],[1,.06]],w*.91,h,d/2+.007,cyan,.009,0,.08);
   line([[0,0],[1,0]],w*.84,.02,d/2-.025,cyan,.008,0,.083);
  }else if(key==='bar'){
   cube([w,.065,d],[0,h-.0325,0],white);for(const x of [-w*.39,w*.39])solid([[0,0],[1,0],[1,.72],[.67,1],[.33,1],[0,.72]],w*.12,h-.065,d*.79,white,x);
   cube([w*.76,.06,.05],[0,.31,0],'#b9c2c5');
  }else if(key==='stool'){
   const steel='#aab9bd',cylinder=(r1,r2,height,y,color)=>mesh(new T.CylinderGeometry(r1,r2,height,40),color,[0,y,0],{metalness:color===steel?.68:.04,roughness:.35});
   cylinder(w*.45,w*.49,.028,.014,steel);cylinder(.028,.040,h*.72,h*.36,steel);
   const foot=mesh(new T.TorusGeometry(w*.33,.011,10,48),steel,[0,h*.32,0],{metalness:.7,roughness:.3});foot.rotation.x=Math.PI/2;
   const seat=mesh(new T.SphereGeometry(1,32,16),white,[0,h*.75,.02],{roughness:.45});seat.scale.set(w*.48,h*.044,d*.43);
   const back=mesh(new T.CylinderGeometry(w*.49,w*.45,h*.22,32,1,true,Math.PI/2,Math.PI),white,[0,h*.87,0],{side:T.DoubleSide,roughness:.45});
   back.scale.z=d/w;
  }
  return true;
 }
 function finish(spec){
  if(spec.boothTemplate?.id!=='penin-cyan-nexus')return;
  const header=spec.objects.find(o=>o.label==='โลโก้ Yuppie · ป้ายบน');
  if(header)header.logoFinish={logoType:'backlit',logoShape:'cutout',logoLight:{enabled:true,tone:'white',intensity:.85}};
 }
 global.YPPeninsularCyanNexus={build,artwork,finish};
})(globalThis);
