(function(global){
 'use strict';
 let stoneMap;
 function build({T,obj,mesh,bx}){
  const design=obj.structure?.design;if(!design?.startsWith('yellow-'))return false;
  const s=obj.size,gold='#f2c52e',black='#242527',chrome='#c3c8cb';
  const rod=(a,b,r=.014,color=chrome)=>{const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p);const m=mesh(new T.CylinderGeometry(r,r,v.length(),12),color,p.clone().add(q).multiplyScalar(.5).toArray(),{metalness:.83,roughness:.2});m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());};
  function stone(){
   if(!stoneMap){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#727373';g.fillRect(0,0,256,256);let seed=32;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<18000;i++){const x=random()*256,y=random()*256,l=65+Math.floor(random()*130);g.fillStyle='rgba('+l+','+l+','+l+',.4)';g.fillRect(x,y,1+random()*2,1+random()*2);}
    for(let i=0;i<14;i++){g.strokeStyle='#a8a9a51f';g.lineWidth=.5;g.beginPath();for(let x=0;x<256;x+=3){const y=(i*23+Math.sin(x*.035+i)*11+x*.3)%256;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
    stoneMap=new T.CanvasTexture(c);stoneMap.colorSpace=T.SRGBColorSpace;stoneMap.wrapS=stoneMap.wrapT=T.RepeatWrapping;
   }return new T.MeshStandardMaterial({map:stoneMap,roughness:.62,metalness:.04});
  }
  if(design==='yellow-oculus-roof'){
   const shape=new T.Shape();shape.moveTo(-s.w/2,-s.d/2);shape.lineTo(s.w/2,-s.d/2);shape.lineTo(s.w/2,s.d/2);shape.lineTo(-s.w/2,s.d/2);shape.closePath();
   const hole=new T.Path();hole.absarc(0,0,Math.min(s.w,s.d)*.255,0,Math.PI*2,true);shape.holes.push(hole);
   const g=new T.ExtrudeGeometry(shape,{depth:s.h,bevelEnabled:false,curveSegments:64});g.rotateX(Math.PI/2);const m=mesh(g,gold,[0,s.h,0]);
   // Stone horizontal faces; yellow inner bore and edge reveal.
   m.material=[stone(),new T.MeshStandardMaterial({color:gold,roughness:.48})];
  }else if(design==='yellow-bar'){
   const leg=.15,top=.075;
   bx([s.w,top,s.d],[0,s.h-top/2,0],black,{material:stone(),edges:false});
   bx([s.w-.06,.07,s.d-.025],[.015,s.h-top-.035,0],gold,{edges:false});
   bx([leg,s.h-top,s.d],[-s.w/2+leg/2,(s.h-top)/2,0],black,{material:stone(),edges:false});
   bx([.02,s.h-top-.07,s.d-.02],[-s.w/2+leg+.011,(s.h-top-.07)/2,0],gold,{edges:false});
   bx([leg,s.h-top,s.d],[s.w/2-leg/2,(s.h-top)/2,0],gold,{edges:false});
  }else if(design==='yellow-stool'){
   const r=s.w*.48,y=s.h-.045;
   mesh(new T.CylinderGeometry(r,r,.055,48),'#f4f3ee',[0,s.h-.0275,0],{roughness:.55});
   const x=s.w*.35,z=s.d*.4;
   for(const side of [-1,1]){const points=[[side*x,.025,z],[side*x,.025,-z],[side*x,y*.44,-z*.55],[side*x,y*.48,z*.55],[side*x,y*.93,z*.55],[side*x,y,-z*.7]];for(let i=0;i<points.length-1;i++)rod(points[i],points[i+1]);}
   rod([-x,.025,z],[x,.025,z]);rod([-x,y*.44,-z*.55],[x,y*.44,-z*.55]);rod([-x,y*.48,z*.55],[x,y*.48,z*.55]);
  }else if(design==='yellow-planter'){
   const h=s.h*.68;bx([s.w*.67,h,s.d*.68],[0,h/2,0],black,{roughness:.8,edges:false});bx([s.w*.58,.013,s.d*.58],[0,h-.01,0],'#252019',{edges:false});
   for(let i=0;i<9;i++){const a=i*Math.PI*2/9,length=Math.min(s.w,s.d)*(.46+(i%3)*.04),vertices=[],indices=[];
    for(let j=0;j<=12;j++){const u=j/12,r=length*u,y=h+s.h*.31*Math.sin(u*Math.PI*.8),width=Math.sin(Math.PI*u)*s.w*.10;for(const side of [-1,1])vertices.push(Math.cos(a)*r-Math.sin(a)*width*side,y+Math.abs(side)*width*.12,Math.sin(a)*r+Math.cos(a)*width*side);if(j<12){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,black,[0,0,0],{material:new T.MeshStandardMaterial({color:['#538f36','#7cb94a','#3e792a'][i%3],side:T.DoubleSide,roughness:.6})});
   }
  }else if(design==='yellow-track'){
   for(const z of [-s.d/2+.025,s.d/2-.025])bx([s.w,.05,.05],[0,s.h-.025,z],black,{edges:false});
   for(const x of [-s.w/2+.025,s.w/2-.025])bx([.05,.05,s.d],[x,s.h-.025,0],black,{edges:false});
   for(const [x,z,angle] of [[-s.w*.28,-s.d/2+.04,.6],[s.w*.28,-s.d/2+.04,-.6],[-s.w*.28,s.d/2-.04,-.6],[s.w*.28,s.d/2-.04,.6]]){
    rod([x,s.h-.035,z],[x,s.h-.13,z],.012,black);const cylinder=mesh(new T.CylinderGeometry(.045,.045,.19,20),black,[x,s.h-.20,z],{roughness:.48});cylinder.rotation.z=angle;
    const lens=mesh(new T.CircleGeometry(.039,20),'#fff1d2',[x+Math.sin(angle)*.096,s.h-.20-Math.cos(angle)*.096,z],{material:new T.MeshStandardMaterial({color:'#fff2dd',emissive:'#fff2dd',emissiveIntensity:.8,side:T.DoubleSide})});lens.rotation.x=Math.PI/2;lens.rotation.y=angle;
   }
  }else return false;
  return true;
 }
 global.YPIslandYellowGeometry={build};
})(globalThis);
