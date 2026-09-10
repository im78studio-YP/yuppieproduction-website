(function(global){
 'use strict';
 // Opt-in geometry, so existing saved tables, chairs and portals are unchanged.
 function build({T,obj,mesh,bx,root}){
  const design=obj.structure?.design;if(!design?.startsWith('timber-'))return false;
  const s=obj.size,white='#f5f3ed',wood='#b99b76',metal='#9caaad';
  const line=(a,b,r,color)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);const m=mesh(new T.CylinderGeometry(r,r*.85,v.length(),10),color,start.clone().add(end).multiplyScalar(.5).toArray(),{roughness:.5});m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;};
  const rect=(x,y,w,h,r)=>{const p=new T.Shape();p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);return p;};
  const extrude=(shape,d,color,z)=>mesh(new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,curveSegments:24}),color,[0,0,z]);
  if(design==='timber-shell-chair'){
   // Continuous shallow bowl rises into the back and arm wings; front faces +Z.
   const vertices=[],indices=[],rings=18,segments=64;
   for(let i=0;i<=rings;i++)for(let j=0;j<=segments;j++){
    const r=i/rings,a=j/segments*Math.PI*2,back=(1-Math.sin(a))/2;
    const edge=.09+.45*Math.pow(back,2.15)+.12*Math.pow(Math.cos(a),4);
    vertices.push(s.w*.5*r*Math.cos(a),s.h*(.46+edge*Math.pow(r,3.1)),s.d*.48*r*Math.sin(a));
    if(i<rings&&j<segments){const k=i*(segments+1)+j;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
   mesh(g,white,[0,0,0],{material:new T.MeshStandardMaterial({color:white,side:T.DoubleSide,roughness:.4})});
   const rim=[];for(let j=0;j<=segments;j++){const k=(rings*(segments+1)+j)*3;rim.push(new T.Vector3(...vertices.slice(k,k+3)));}
   mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rim),96,.008,6,false),white,[0,0,0]);
   for(const x of [-1,1])for(const z of [-1,1]){
    line([x*s.w*.22,s.h*.45,z*s.d*.22],[x*s.w*.43,.018,z*s.d*.43],.014,wood);
    line([x*s.w*.22,s.h*.42,z*s.d*.22],[-x*s.w*.3,s.h*.16,z*s.d*.33],.004,'#42433e');
   }
  }else if(design==='timber-glass-table'){
   const radius=Math.min(s.w,s.d)*.5;
   mesh(new T.CylinderGeometry(radius,radius,.018,64),white,[0,s.h-.009,0],{material:new T.MeshStandardMaterial({color:'#dce9e7',transparent:true,opacity:.25,roughness:.12,metalness:.1,depthWrite:false})});
   if(obj.structure.glassRim){
    const rim=mesh(new T.TorusGeometry(radius,.005,6,64),'#9aadaa',[0,s.h-.009,0],{roughness:.18,metalness:.25});rim.rotation.x=Math.PI/2;
   }
   mesh(new T.CylinderGeometry(.021,.029,s.h-.04,20),metal,[0,(s.h-.04)/2,0],{metalness:.75,roughness:.2});
   mesh(new T.CylinderGeometry(radius*.48,radius*.5,.024,48),metal,[0,.012,0],{metalness:.65,roughness:.3});
  }else if(design==='timber-counter'){
   const r=Math.min(s.w,s.h)*.15,t=.045,w=s.w,h=s.h;
   const shell=rect(-w/2,0,w,h,r);shell.holes.push(rect(-w/2+t,t,w-2*t,h-2*t,r-t));extrude(shell,s.d,white,-s.d/2);
   const front=rect(-w/2+t,t,w-2*t,h-2*t,r-t);
   const holeX=-w*.41,holeY=h*.12,holeW=w*.49,holeH=h*.68,holeR=.08;
   front.holes.push(rect(holeX,holeY,holeW,holeH,holeR));extrude(front,.035,wood,s.d/2-.055);
   const trim=rect(holeX-.025,holeY-.025,holeW+.05,holeH+.05,holeR+.025);trim.holes.push(rect(holeX,holeY,holeW,holeH,holeR));extrude(trim,.026,white,s.d/2-.025);
   bx([w-2*t,h-2*t,.035],[0,h/2,-s.d/2+.025],wood,{edges:false});
   for(const x of [-w*.32,w*.32])for(const z of [-s.d*.27,s.d*.27])line([x,h,z],[x,h+.047,z],.012,metal);
  }else if(design==='timber-folded-canopy'){
   const w=s.w,h=s.h,r=.16,shape=new T.Shape();
   shape.moveTo(-w/2+r,0);shape.lineTo(w/2-r,0);shape.quadraticCurveTo(w/2,0,w/2,r);shape.lineTo(w/2,h);shape.lineTo(-w/2,h);shape.lineTo(-w/2,r);shape.quadraticCurveTo(-w/2,0,-w/2+r,0);
   extrude(shape,.09,white,s.d/2-.09);bx([w,.09,s.d],[0,h-.045,0],white,{edges:false});
  }else if(design==='timber-sofa'){
   const fabric=obj.structure.color||white;
   const cushion=(w,h,d,x,y,z)=>{const inset=.008,shape=rect(-w/2+inset,inset,w-inset*2,h-inset*2,Math.min(.045,h*.2,w*.2));mesh(new T.ExtrudeGeometry(shape,{depth:d-inset*2,bevelEnabled:true,bevelThickness:inset,bevelSize:inset,bevelSegments:3,curveSegments:12}),fabric,[x,y,z-d/2+inset],{roughness:.92});};
   cushion(s.w,s.h*.26,s.d,0,s.h*.12,0);
   for(const x of [-s.w*.4,s.w*.4])for(const z of [-s.d*.34,s.d*.34])mesh(new T.CylinderGeometry(.023,.02,s.h*.12,12),metal,[x,s.h*.06,z],{metalness:.6,roughness:.3});
   const count=s.w>1.2?3:2,cw=s.w*.78/count;
   for(let i=0;i<count;i++){const x=(i-(count-1)/2)*cw;cushion(cw-.012,s.h*.12,s.d*.72,x,s.h*.39,s.d*.07);cushion(cw-.012,s.h*.48,s.d*.19,x,s.h*.5,-s.d*.385);}
   for(const side of [-1,1])cushion(s.w*.105,s.h*.47,s.d,side*s.w*.447,s.h*.23,0);
  }else if(design==='timber-grass-planter'){
   const potH=s.h*.31,t=Math.min(.025,s.d*.1),r=Math.min(.04,s.d*.15);
   const shape=rect(-s.w/2,-s.d/2,s.w,s.d,r);shape.holes.push(rect(-s.w/2+t,-s.d/2+t,s.w-t*2,s.d-t*2,Math.max(.005,r-t)));
   const pot=mesh(new T.ExtrudeGeometry(shape,{depth:potH,bevelEnabled:false,curveSegments:8}),white,[0,potH,0]);pot.rotation.x=Math.PI/2;
   bx([s.w-2*t,.015,s.d-2*t],[0,potH-.035,0],'#39372b',{edges:false});
   const count=Math.max(14,Math.ceil(s.w*34));
   for(let i=0;i<count;i++){
    const x=(i/count-.5)*(s.w-.08),z=Math.sin(i*2.39)*(s.d-.07)*.42,h=(s.h-potH)*(.65+.35*(i*17%23)/23),lean=Math.sin(i*3.31)*.06;
    const points=[],idx=[];for(let j=0;j<=8;j++){const u=j/8,width=.012*(1-u*.92);points.push(x+lean*u*u-width,potH+h*u,z+.025*Math.sin(i)*u,x+lean*u*u+width,potH+h*u,z+.025*Math.sin(i)*u);if(j<8){const k=j*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
    const leaf=new T.BufferGeometry();leaf.setAttribute('position',new T.Float32BufferAttribute(points,3));leaf.setIndex(idx);leaf.computeVertexNormals();mesh(leaf,white,[0,0,0],{material:new T.MeshStandardMaterial({color:['#66833b','#829b4d','#3f682f'][i%3],side:T.DoubleSide,roughness:.72})});
   }
  }else if(design==='timber-grass'){
   bx([s.w,s.h*.19,s.d],[0,s.h*.095,0],white,{edges:false});bx([s.w*.93,.016,s.d*.84],[0,s.h*.19,0],'#514837',{edges:false});
   for(let i=0;i<32;i++){
    const x=((i*13%32)/31-.5)*s.w*.91,z=((i*7%9)/8-.5)*s.d*.72,h=s.h*(.53+(i%5)*.045),lean=(i%3-1)*.04;
    const points=[new T.Vector3(x,s.h*.19,z),new T.Vector3(x+lean*.3,s.h*.19+h*.4,z+.006),new T.Vector3(x+lean,s.h*.19+h,z)];
    const curve=new T.CatmullRomCurve3(points),g=new T.TubeGeometry(curve,8,.008,3,false);
    const leaf=mesh(g,['#657935','#7c8a44','#9b9b57'][i%3],[0,0,0]);leaf.scale.z=.65;
   }
  }else if(design==='timber-rib'){
   const w=s.w,h=s.h,t=.10,r=.40,shape=new T.Shape();
   shape.moveTo(-w/2,0);shape.lineTo(-w/2,h-r);shape.quadraticCurveTo(-w/2,h,-w/2+r,h);shape.lineTo(w/2,h);shape.lineTo(w/2,h-t);shape.lineTo(-w/2+r,h-t);shape.quadraticCurveTo(-w/2+t,h-t,-w/2+t,h-r);shape.lineTo(-w/2+t,0);shape.closePath();extrude(shape,s.d,wood,-s.d/2);
  }else return false;
  // Subtle deterministic grain, generated as a material, not baked into the preview.
  const timber=[];root?.traverse(part=>{if(part.isMesh&&part.material?.color?.getHexString()==='b99b76')timber.push(part);});
  if(timber.length){
   const canvas=document.createElement('canvas');canvas.width=128;canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#c2a17c';c.fillRect(0,0,128,512);
   for(let i=0;i<110;i++){c.strokeStyle=i%3?'#9b79531b':'#edd2aa33';c.lineWidth=.3+i%3*.3;c.beginPath();for(let y=0;y<=512;y+=8){const x=i*17%128+Math.sin(y*.018+i)*1.4;y?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
   const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
   timber.forEach(part=>{part.material.color.set('#ffffff');part.material.map=map;part.material.needsUpdate=true;});
  }
  return true;
 }
 global.YPTimberRibbonGeometry={build};
})(globalThis);
