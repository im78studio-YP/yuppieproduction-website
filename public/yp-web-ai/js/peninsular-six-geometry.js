(function(global){
 'use strict';
 function build({T,obj,mesh,bx}){
  const design=obj.structure?.design;if(!design?.startsWith('six-'))return false;
  const s=obj.size,w=s.w,h=s.h,d=s.d,color=obj.structure.color||'#087eae';
  const extrude=(shape,depth,z,c=color)=>mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:48}),c,[0,0,z]);
  const rounded=(x,y,w,h,r)=>{const p=new T.Shape();p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);return p;};
  const glow=(points,r=.012,c='#fffbed')=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),96,r,6,false),c,[0,0,0],{emissive:c,emissiveIntensity:1.2,roughness:.3});
  if(design==='six-blue-sweep'){
   const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(-w/2,h);shape.lineTo(w/2,h);shape.lineTo(w/2,h*.80);shape.lineTo(-w*.06,h*.80);shape.bezierCurveTo(-w*.23,h*.80,-w*.21,h*.48,-w*.36,.16);shape.quadraticCurveTo(-w*.40,0,-w/2,0);
   extrude(shape,d,-d/2);glow([[-w*.355,.16,d/2+.01],[-w*.27,h*.42,d/2+.01],[-w*.19,h*.70,d/2+.01],[-w*.06,h*.80,d/2+.01],[w*.49,h*.80,d/2+.01]],.025,'#f8f6ef');
  }else if(design==='six-blue-crown'){
   // Rounded plan fascia with a continuous open top, including side returns.
   const shape=rounded(-w/2,-d/2,w,d,Math.min(.42,d*.48));shape.holes.push(rounded(-w/2+.075,-d/2+.075,w-.15,d-.15,Math.min(.34,d*.36)));
   const g=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:40});g.rotateX(Math.PI/2);mesh(g,color,[0,h,0]);
   extrude(rounded(-w*.44,.12,w*.78,h*.66,.16),.018,d/2+.008,'#ffffff');
  }else if(design==='six-side-bridge'){
   const t=.46,r=.63,shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(-w/2,h-r);shape.quadraticCurveTo(-w/2,h,-w/2+r,h);shape.lineTo(w/2,h);shape.lineTo(w/2,h-.17);shape.lineTo(-w/2+r,h-.17);shape.quadraticCurveTo(-w/2+t,h-.17,-w/2+t,h-r);shape.lineTo(-w/2+t,0);shape.closePath();extrude(shape,d,-d/2);
  }else if(design==='six-noir-portal'){
   const shape=new T.Shape(),r=.58,t=.34;
   shape.moveTo(-w/2,0);shape.lineTo(-w/2,h-r);shape.quadraticCurveTo(-w/2,h,-w/2+r,h);shape.lineTo(w/2-r,h);shape.quadraticCurveTo(w/2+.08,h,w/2,h-r);shape.lineTo(w*.36,0);shape.lineTo(w*.36-t,0);shape.lineTo(w/2-t,h-r);shape.quadraticCurveTo(w/2-t,h-t,w/2-r,h-t);shape.lineTo(-w/2+r,h-t);shape.quadraticCurveTo(-w/2+t,h-t,-w/2+t,h-r);shape.lineTo(-w/2+t,0);shape.closePath();
   extrude(shape,d,-d/2,'#c7c9c8');extrude(shape,.035,d/2,color);
   glow([[-w/2+t*.48,.08,d/2+.045],[-w/2+t*.48,h-r,d/2+.045],[-w/2+.30,h-.20,d/2+.045],[-w/2+r,h-.15,d/2+.045],[w/2-r,h-.15,d/2+.045],[w/2-.22,h-.29,d/2+.045],[w/2-.18,h-r,d/2+.045],[w*.36-.15,.14,d/2+.045]],.011);
  }else if(design==='six-display-pod'){
   const outer=rounded(-w/2,0,w,h,Math.min(w*.23,h*.2));outer.holes.push(rounded(-w/2+.095,.095,w-.19,h-.19,Math.min(w*.16,h*.12)));extrude(outer,d,-d/2,'#f8f7f2');
   extrude(rounded(-w/2+.09,.09,w-.18,h-.18,.08),.025,-d/2,color);
   for(const f of [.32,.65])bx([w-.17,.045,d*.88],[0,h*f,.015],'#eeefed',{edges:false});
  }else if(design==='six-lit-counter'){
   extrude(rounded(-w/2,0,w,h,.17),d,-d/2,color);
   const border=rounded(-w/2+.045,.045,w-.09,h-.09,.13);border.holes.push(rounded(-w/2+.062,.062,w-.124,h-.124,.113));
   const g=new T.ExtrudeGeometry(border,{depth:.009,bevelEnabled:false,curveSegments:32});mesh(g,'#dbfaff',[0,0,d/2+.003],{emissive:color==='#222327'?'#fffdf2':'#31baff',emissiveIntensity:1.1});
  }else if(design==='six-lit-beam'){
   bx([w,h,d],[0,h/2,0],color,{edges:false});for(let i=0;i<5;i++){
    const z=(i/4-.5)*d*.85;mesh(new T.CylinderGeometry(.055,.055,.012,24),'#fff4da',[0,-.003,z],{emissive:'#fff4da',emissiveIntensity:1});
   }
  }else if(design==='six-brochure'){
   bx([w,.035,d],[0,.0175,0],'#33363a',{edges:false});
   for(let i=0;i<5;i++){const y=.12+i*h*.17,dir=i%2?1:-1,slab=bx([w,.025,d*.90],[0,y+d*.3,0],'#31373c',{edges:false});slab.rotation.x=dir*.65;
    const face=bx([w*.84,.008,d*.70],[0,y+d*.3+.018,0],'#a2acb4',{edges:false});face.rotation.x=dir*.65;}
  }else return false;
  return true;
 }
 global.YPPeninsularSixGeometry={build};
})(globalThis);
