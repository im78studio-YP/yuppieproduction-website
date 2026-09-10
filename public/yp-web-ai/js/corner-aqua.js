(function(root){
 'use strict';let woodMap;
 function build({T,obj,mesh,bx}){
  const design=obj.structure?.design;if(!design?.startsWith('aqua-'))return false;
  const {w,h,d}=obj.size,blue='#008da7',white='#f4f3ef';
  const extrude=(p,depth,z,color,options={})=>mesh(new T.ExtrudeGeometry(p,{depth,bevelEnabled:false,curveSegments:48}),color,[0,0,z],options);
  const plan=(p,height,y,color,options={})=>{const g=new T.ExtrudeGeometry(p,{depth:height,bevelEnabled:false,curveSegments:64});g.rotateX(Math.PI/2);return mesh(g,color,[0,y+height,0],options);};
  function timber(){
   if(!woodMap){const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');g.fillStyle='#cbb18a';g.fillRect(0,0,512,256);
    for(let i=0;i<140;i++){g.strokeStyle=i%3?'#78582a18':'#fff4d525';g.lineWidth=.5+i%3*.25;g.beginPath();for(let x=0;x<=512;x+=8){const y=i*1.85+Math.sin(x*.017+i*.6)*1.3;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}woodMap=new T.CanvasTexture(c);woodMap.colorSpace=T.SRGBColorSpace;
   }return new T.MeshStandardMaterial({map:woodMap,roughness:.67,metalness:0});
  }
  if(design==='aqua-wave-fascia'){
   const p=new T.Shape(),z=d*.43,t=.12;p.moveTo(-w/2,z);p.lineTo(-w*.20,z);p.bezierCurveTo(w*.08,z,w*.16,-z,w*.5,-z);p.lineTo(w*.5,-z-t);p.bezierCurveTo(w*.16,-z-t,w*.08,z-t,-w*.2,z-t);p.lineTo(-w/2,z-t);p.closePath();
   plan(p,h-.025,.025,'#49484b');plan(p,.025,0,'#cbb18a',{material:timber()});
  }else if(design==='aqua-slanted-sign'){
   const p=new T.Shape();p.moveTo(-w/2,0);p.lineTo(w*.32,0);p.lineTo(w*.48,h*.78);p.quadraticCurveTo(w*.54,h,w*.43,h);p.lineTo(-w/2,h);p.closePath();extrude(p,d,-d/2,blue);
  }else if(design==='aqua-timber-backdrop'){
   const p=new T.Shape();p.moveTo(-w/2,0);p.lineTo(-w*.34,h*.83);p.quadraticCurveTo(-w*.29,h,-w*.17,h);p.lineTo(w*.19,h);p.quadraticCurveTo(w*.33,h,w*.38,h*.77);p.lineTo(w/2,0);p.closePath();extrude(p,d,-d/2,'#cbb18a',{material:timber()});
  }else if(design==='aqua-wood-shelf'){
   bx([w,h,d],[0,h/2,0],'#cbb18a',{material:timber(),edges:false});
  }else if(design==='aqua-curved-counter'){
   const outline=(inset=0)=>{const W=w/2-inset,D=d/2-inset,r=.07,p=new T.Shape();p.moveTo(-W+r,-D);p.lineTo(W-r,-D);p.quadraticCurveTo(W,-D,W,-D+r);p.lineTo(W,D*.40);p.quadraticCurveTo(W,D*.58,W-r,D*.64);p.bezierCurveTo(W*.5,D*1.12,-W*.5,D*1.12,-W+r,D*.64);p.quadraticCurveTo(-W,D*.58,-W,D*.40);p.lineTo(-W,-D+r);p.quadraticCurveTo(-W,-D,-W+r,-D);p.closePath();return p;};
   plan(outline(.05),h*.94,.01,blue);plan(outline(),h*.27,0,white);const crown=plan(outline(),h*.27,h*.73,white),v=crown.geometry.attributes.position;
   for(let i=0;i<v.count;i++){const x=v.getX(i);v.setY(i,v.getY(i)-.04*Math.max(0,1-(x/(w/2))**2));}v.needsUpdate=true;crown.geometry.computeVertexNormals();
   // Work surface and staff-side recess remain accessible from behind.
   bx([w*.78,.02,d*.55],[0,h-.012,-d*.12],white,{roughness:.35,edges:false});
  }else if(design==='aqua-display-plinth'){
   const base=h*.71;bx([w,base,d],[0,base/2,0],'#cbb18a',{material:timber(),edges:false});bx([w,.025,d],[0,.0125,0],white,{edges:false});
   const glass=new T.MeshStandardMaterial({color:'#c0dfd9',transparent:true,opacity:.17,roughness:.1,depthWrite:false,side:T.DoubleSide});
   for(const z of [-d/2,d/2]){const m=bx([w,h-base,.009],[0,base+(h-base)/2,z],white,{material:glass,edges:false});m.castShadow=false;}
   for(const x of [-w/2,w/2]){const m=bx([.009,h-base,d],[x,base+(h-base)/2,0],white,{material:glass,edges:false});m.castShadow=false;}
   const lid=bx([w,.009,d],[0,h-.005,0],white,{material:glass,edges:false});lid.castShadow=false;
   for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])bx([.005,h-base,.005],[x,base+(h-base)/2,z],'#9baf9f',{edges:false});
  }else return false;
  return true;
 }
 function artwork(kind){
  let body='';
  if(kind==='aqua-map'){
   // Decorative continent outlines only; no labels or geographic claims.
   const paths=['M60 90L130 50 210 70 265 135 228 180 178 190 160 245 116 218 90 163Z','M196 240L240 264 267 330 235 422 203 468 188 391 164 307Z','M390 96L438 70 495 100 532 79 617 107 682 160 632 204 572 186 530 235 475 185 437 189 410 149Z','M396 189L460 177 491 243 467 340 421 360 384 289 364 229Z','M597 340L655 320 704 358 680 404 619 399Z'];
   body=paths.map(p=>'<path d="'+p+'"/>').join('');return encode('<svg xmlns="http://www.w3.org/2000/svg" width="760" height="500" viewBox="0 0 760 500"><g fill="none" stroke="#eeeae5" stroke-width="2.7" stroke-linejoin="round">'+body+'</g></svg>');
  }
  for(let i=0;i<8;i++)body+='<circle cx="400" cy="240" r="'+(30+i*22)+'" fill="none" stroke="'+(i%2?'#21c3dc':'#126280')+'" stroke-width="'+(i%3+2)+'" opacity=".55"/>';
  return encode('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480"><rect width="800" height="480" fill="#092532"/>'+body+'</svg>');
 }
 const encode=svg=>'data:image/svg+xml;base64,'+btoa(svg);
 root.YPCornerAqua={build,artwork};
})(globalThis);
