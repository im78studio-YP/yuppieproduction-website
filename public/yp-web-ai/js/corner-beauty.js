(function(root){
 'use strict';
 const white='#f6f5f2';
 function build({T,obj,mesh,bx}){
  const kind=obj.structure?.design;if(!kind?.startsWith('beauty-'))return false;const s=obj.size;
  const rod=(a,b,r=.011)=>{const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),m=mesh(new T.CylinderGeometry(r,r,v.length(),12),'#bdc3c6',p.add(q).multiplyScalar(.5).toArray(),{metalness:.85,roughness:.18});m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());};
  if(kind==='beauty-vitrine'){
   const base=s.h*.71,glassH=s.h-base,t=.012;
   bx([s.w-.03,base-.035,s.d-.04],[0,(base-.035)/2+.015,0],white,{edges:false,roughness:.34});
   bx([s.w,.025,s.d],[0,base-.0125,0],white,{edges:false,roughness:.3});
   bx([s.w-.08,.035,s.d-.08],[0,.0175,0],'#c5c7c6',{edges:false});
   const glass=new T.MeshStandardMaterial({color:'#bed8d3',transparent:true,opacity:.22,roughness:.08,metalness:.05,depthWrite:false,side:T.DoubleSide});
   for(const z of [-s.d/2+t/2,s.d/2-t/2]){const m=bx([s.w,glassH,t],[0,base+glassH/2,z],white,{material:glass,edges:false});m.castShadow=false;}
   for(const x of [-s.w/2+t/2,s.w/2-t/2]){const m=bx([t,glassH,s.d],[x,base+glassH/2,0],white,{material:glass,edges:false});m.castShadow=false;}
   const lid=bx([s.w,t,s.d],[0,s.h-t/2,0],white,{material:glass,edges:false});lid.castShadow=false;
   for(const z of [-s.d/2,s.d/2])bx([s.w,.006,.006],[0,s.h-.003,z],'#98aaa8',{metalness:.6,roughness:.2,edges:false});
   for(const x of [-s.w/2,s.w/2])for(const z of [-s.d/2,s.d/2])bx([.004,glassH,.004],[x,base+glassH/2,z],'#8da6a2',{roughness:.2,edges:false});
  }else if(kind==='beauty-bottle'){
   const r=s.w*.4,body=s.h*.72,color=obj.structure.color||'#242a2b';
   mesh(new T.CylinderGeometry(r*.8,r,body,24),color,[0,body/2,0],{roughness:.27,metalness:.08});
   mesh(new T.CylinderGeometry(r*.46,r*.78,s.h*.1,24),color,[0,body+s.h*.05,0],{roughness:.25});
   mesh(new T.CylinderGeometry(r*.46,r*.46,s.h*.18,20),'#222527',[0,s.h*.91,0],{roughness:.35});
  }else if(kind==='beauty-chair'){
   bx([s.w,.04,s.d*.77],[0,s.h*.53,s.d*.05],white,{roughness:.45,edges:false});
   const back=bx([s.w*.88,s.h*.40,.035],[0,s.h*.79,-s.d*.36],white,{roughness:.45,edges:false});back.rotation.x=-.10;
   for(const x of [-s.w*.41,s.w*.41])for(const z of [-s.d*.34,s.d*.34])rod([x,s.h*.51,z],[x*1.07,.015,z*1.1]);
   for(const x of [-s.w*.37,s.w*.37])rod([x,s.h*.49,-s.d*.34],[x,s.h*.84,-s.d*.40],.009);
  }else if(kind==='beauty-downlight'){
   mesh(new T.CylinderGeometry(s.w/2,s.w/2,s.h,32),white,[0,s.h/2,0],{roughness:.3});
   const light=mesh(new T.CircleGeometry(s.w*.37,32),white,[0,.002,0],{material:new T.MeshStandardMaterial({color:'#fff8ec',emissive:'#fff8ec',emissiveIntensity:1.5,side:T.DoubleSide})});light.rotation.x=Math.PI/2;
  }else if(kind==='beauty-lit-artwork'){
   mesh(new T.PlaneGeometry(s.w,s.h),white,[0,s.h/2,s.d/2],{material:new T.MeshBasicMaterial({color:'#ffffff',transparent:true,side:T.DoubleSide,toneMapped:false})});
  }else return false;
  return true;
 }
 // New illustration artwork, not a crop of the reference: no third-party copy,
 // packaging marks or watermarks. The shared branding layer adds the actual YP vector.
 function artwork(kind){
  const tone=kind.replace('beauty-',''),colors={blue:['#e4f6ff','#1474df','#071e67'],white:['#ffffff','#f0f1f0','#d5dadd'],pink:['#fff4f7','#f8cbdd','#e9a3c2'],yellow:['#fffdeb','#f4ed95','#ddd96d'],cyan:['#e2faff','#66dbe9','#219eba'],magenta:['#ffcbed','#fc59c2','#dc248f'],coral:['#ffddd6','#ff998f','#f06279'],wide:['#f6fcff','#d5f5fa','#76cbdc']};
  const [a,b,c]=colors[tone]||colors.white,W=tone==='wide'?1200:600,H=tone==='wide'?550:1000;
  let shapes='';
  for(let i=0;i<8;i++)shapes+='<circle cx="'+(i*179%W)+'" cy="'+(i*231%H)+'" r="'+(50+i*11)+'" fill="white" opacity=".08"/>';
  const bottle=(x,y,w,h)=>'<ellipse cx="'+(x+w*.5)+'" cy="'+(y+h+8)+'" rx="'+w*.7+'" ry="13" fill="'+c+'" opacity=".24"/><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="12" fill="url(#bottle)" stroke="white" stroke-opacity=".6"/><rect x="'+(x+w*.19)+'" y="'+(y-38)+'" width="'+w*.62+'" height="38" rx="4" fill="#e8e9ec"/><rect x="'+(x+w*.15)+'" y="'+(y+h*.38)+'" width="'+w*.7+'" height="'+h*.32+'" fill="white" opacity=".75"/>';
  if(tone==='wide'){shapes+='<path d="M0 490 Q400 320 1200 435 V550 H0Z" fill="white" opacity=".8"/>';shapes+=bottle(190,235,125,260)+bottle(390,300,88,193)+bottle(850,265,95,230);}
  else{shapes+='<path d="M0 780 Q230 660 600 760 V1000 H0Z" fill="'+c+'" opacity=".16"/>';shapes+=bottle(245,510,128,335);if(tone==='blue'||tone==='white')shapes+=bottle(105,670,77,190)+bottle(420,640,75,210);}
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><defs><linearGradient id="bg" x2=".7" y2="1"><stop stop-color="'+a+'"/><stop offset=".4" stop-color="'+b+'"/><stop offset="1" stop-color="'+c+'"/></linearGradient><linearGradient id="bottle"><stop stop-color="#cfdde4"/><stop offset=".25" stop-color="#fff"/><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#b1c6d2"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/>'+shapes+'</svg>';
  return 'data:image/svg+xml;base64,'+btoa(svg);
 }
 const floor='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#373839"/><path d="M0 160 Q170 120 290 330 T512 420 M150 0 Q110 180 340 210 T490 512" fill="none" stroke="#626360" stroke-width="1" opacity=".35"/></svg>');
 root.YPCornerBeauty={build,artwork,floor};
})(globalThis);
