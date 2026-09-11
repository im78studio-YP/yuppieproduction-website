(function(root){
 'use strict';
 // One booth reconstructed from two views; metres, front is +Z. Heights are estimated.
 const white='#f5f3ed',wood='#d8bd8c',navy='#243b60';
 const p=(id,x,z,w,d,h,color,y=0,rotationY=0,extra={})=>({catalogId:id,x,z,y,size:{w,d,h},color,rotationY,...extra});
 const box=(x,z,w,d,h,c,y=0)=>p('panel-standard',x,z,w,d,h,c,y);
 const detail=(kind,x,z,w,d,h,y=0,id='panel-standard',rotation=0)=>p(id,x,z,w,d,h,null,y,rotation,{structure:{design:'soft-wave-'+kind}});
 const art=(key,x,z,w,h,y,rotation=0)=>p('brand-artwork-copy',x,z,w,.012,h,null,y,rotation,{waveArtwork:key});
 const template={id:'soft-wave',name:'07 · Soft Wave Pavilion',width:6,depth:3,height:3.8,
  brand:'Yuppie Production',purpose:'meeting',primary:navy,secondary:wood,background:white,ink:navy,
  floor:'tile',tile:'woodL',graphic:'',reference:true,customShell:true,
  tagline:'กรอบโค้งไล่ระดับ · ไฟซ่อนโทนอุ่น · เจรจา 2 ชุด',
  description:'ถอดแบบจากบูธเดียวสองมุม: ป้ายสูงกับกรอบโค้งไล่ระดับ ไฟซ่อน ผนังข้อมูล จอภาพ ระแนงไม้และแนวต้นไม้ ห้องเก็บของหลังขวา เคาน์เตอร์หน้าขวา และเก้าอี้ 6 ตัว · โลโก้ Yuppie · กว้าง 6 × ลึก 3 ม. ป้ายสูงประมาณ 3.6 ม. รวมโคม 3.8 ม. ไม่ใช่แบบผลิต',
  objects:[
   box(3,.065,6,.13,2.68,white),box(.065,1.5,.13,3,2.68,white),box(5.935,1.5,.13,3,2.98,white),
   detail('fascia',3,2.875,6,.25,3.12),detail('crown',2.17,2.69,4.24,.18,1.04,2.56),
   // Shallow overhead returns, not a roof closing the whole booth.
   detail('soffit',3,2.40,5.75,.73,.61,2.49),box(3,.46,5.74,.70,.12,white,2.51),
   art('logo',2.03,2.789,3.12,.62,2.89),art('logo',4.91,3.007,1.40,.14,2.88),
   ...[.75,1.98,3.23].map(x=>detail('flood',x,2.69,.22,.30,.20,3.60)),
   ...[.72,1.83,4.25,5.35].map((x,i)=>({...detail('downlight',x,2.33,.085,.085,.022,x<3?2.468:2.898),structure:{design:'soft-wave-downlight',illuminate:i%2===0}})),
   ...[.8,2.2,3.6,5].map((x,i)=>({...detail('downlight',x,.47,.085,.085,.022,2.480),structure:{design:'soft-wave-downlight',illuminate:i%2===0}})),
   // Integrated room is behind the flush door; no stock full-height room overlaps the fascia.
   box(4.98,.55,.10,.95,2.51,white),box(5.43,1.04,.90,.10,2.51,white),
   detail('door',5.39,1.101,.71,.045,2.08,.02),
   detail('slats',3.14,.23,3.48,.11,.74,.19),
   detail('led',3.14,.30,3.48,.022,.018,.924),
   detail('panel',3.09,.23,3.52,.09,1.39,.96),
   art('logo',2.00,.283,1.12,.16,2.12),
   box(2.06,.31,1.24,.06,.78,'#171b23',1.24),art('screen',2.06,.347,1.18,.67,1.295),
   detail('panel',3.28,.32,.84,.04,1.12,1.10),art('info',3.28,.347,.79,1.07,1.125),
   detail('panel',4.22,.32,.84,.04,1.12,1.10),art('info',4.22,.347,.79,1.07,1.125),
   detail('panel',.163,1.23,1.65,.055,1.34,1.13,'panel-standard',90),art('process',.197,1.23,1.57,1.26,1.17,90),
   ...[1.44,2.36].flatMap(z=>[detail('panel',5.84,z,.72,.045,1.30,1.30,'panel-standard',-90),art('navy',5.81,z,.66,1.24,1.33,-90)]),
   detail('planter',3.10,.55,3.32,.41,.48,0,'planter-grass'),
   detail('counter',5.15,2.53,1.42,.67,1.04,0,'counter-standard'),art('logo',5.15,2.878,.86,.18,.84),
   ...[1.44,3.40].flatMap(x=>[
    detail('table',x,1.86,.64,.64,.72,0,'table-standard'),
    detail('chair',x,1.24,.52,.55,.84,0,'chair-standard'),
    detail('chair',x-.54,2.18,.52,.55,.84,0,'chair-standard',130),
    detail('chair',x+.54,2.18,.52,.55,.84,0,'chair-standard',-130)
   ])
  ]};
 root.YPInlineTemplates.templates.push(template);
 function build({T,obj,mesh,bx,root:group}){
  const kind=obj.structure?.design?.replace(/^soft-wave-/,'');if(!obj.structure?.design?.startsWith('soft-wave-'))return false;
  const s=obj.size;
  const round=(x,y,w,h,r)=>{const a=new T.Shape();a.moveTo(x+r,y);a.lineTo(x+w-r,y);a.quadraticCurveTo(x+w,y,x+w,y+r);a.lineTo(x+w,y+h-r);a.quadraticCurveTo(x+w,y+h,x+w-r,y+h);a.lineTo(x+r,y+h);a.quadraticCurveTo(x,y+h,x,y+h-r);a.lineTo(x,y+r);a.quadraticCurveTo(x,y,x+r,y);return a;};
  const extrude=(shape,d,c,z=-d/2)=>mesh(new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,curveSegments:24}),c,[0,0,z],{roughness:.48});
  const tube=(points,r,c,glow=false)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),100,r,6,false),c,[0,0,0],glow?{emissive:c,emissiveIntensity:2}:{});
  const rod=(a,b,r,c)=>{const v=new T.Vector3(...b).sub(new T.Vector3(...a));const m=mesh(new T.CylinderGeometry(r,r*.8,v.length(),12),c,a.map((n,i)=>(n+b[i])/2),{metalness:c==='#a9adae'?.75:.02,roughness:.4});m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());};
  if(kind==='fascia'){
   const a=new T.Shape();a.moveTo(-3,0);a.lineTo(-3,2.47);a.quadraticCurveTo(-3,2.69,-2.78,2.69);a.lineTo(.22,2.69);a.bezierCurveTo(.48,2.69,.70,3.12,.96,3.12);a.lineTo(2.79,3.12);a.quadraticCurveTo(3,3.12,3,2.91);a.lineTo(3,0);a.lineTo(2.85,0);a.lineTo(2.85,2.78);a.quadraticCurveTo(2.85,2.87,2.74,2.87);a.lineTo(1.02,2.87);a.bezierCurveTo(.77,2.87,.54,2.44,.25,2.44);a.lineTo(-2.72,2.44);a.quadraticCurveTo(-2.84,2.44,-2.84,2.32);a.lineTo(-2.84,0);a.closePath();
   const m=extrude(a,s.d,white);m.scale.set(s.w/6,s.h/3.12,1);
   const path=[[-2.91,.12],[-2.91,2.35],[-2.88,2.53],[-2.72,2.58],[.21,2.58],[.46,2.66],[.83,3.0],[1.07,3.015],[2.7,3.015],[2.90,2.96],[2.91,2.73],[2.91,.12]];
   // A sampled 2D contour keeps the LED parallel to the fascia with no overshoot at long runs.
   const curve=new T.CurvePath();for(let i=1;i<path.length;i++)curve.add(new T.LineCurve3(new T.Vector3(path[i-1][0]*s.w/6,path[i-1][1]*s.h/3.12,s.d/2+.003),new T.Vector3(path[i][0]*s.w/6,path[i][1]*s.h/3.12,s.d/2+.003)));
   mesh(new T.TubeGeometry(curve,160,.008,6,false),'#fff1c9',[0,0,0],{emissive:'#ffe5a9',emissiveIntensity:2});
  }else if(kind==='crown'){
   const a=new T.Shape();a.moveTo(-s.w/2,0);a.lineTo(-s.w/2,s.h-.22);a.quadraticCurveTo(-s.w/2,s.h,-s.w/2+.24,s.h);a.lineTo(s.w/2-.78,s.h);a.quadraticCurveTo(s.w/2-.64,s.h,s.w/2-.55,s.h-.13);a.lineTo(s.w/2,.31);a.lineTo(s.w/2-.13,0);a.closePath();extrude(a,s.d,white);
  }else if(kind==='soffit'){
   const a=new T.Shape();a.moveTo(-s.w/2,0);a.lineTo(.22,0);a.bezierCurveTo(.50,0,.73,.43,.99,.43);a.lineTo(s.w/2,.43);a.lineTo(s.w/2,.55);a.lineTo(.99,.55);a.bezierCurveTo(.73,.55,.50,.12,.22,.12);a.lineTo(-s.w/2,.12);a.closePath();extrude(a,s.d,white);
  }else if(kind==='panel')extrude(round(-s.w/2,0,s.w,s.h,.05),s.d,white);
  else if(kind==='led')bx([s.w,s.h,s.d],[0,s.h/2,0],'#fff0cd',{edges:false,material:new T.MeshStandardMaterial({color:'#fff0cd',emissive:'#ffe4a0',emissiveIntensity:2})});
  else if(kind==='door'){
   bx([s.w,s.h,s.d],[0,s.h/2,0],'#dad7cf',{edges:false});bx([s.w-.024,s.h-.025,.009],[0,s.h/2,s.d/2+.003],white,{edges:false});rod([s.w*.38,.94,s.d/2+.025],[s.w*.38,1.04,s.d/2+.025],.01,'#a9adae');
  }else if(kind==='slats'){
   bx([s.w,s.h,.035],[0,s.h/2,-.02],wood,{edges:false});const count=Math.ceil(s.w/.046);for(let i=0;i<count;i++)bx([s.w/count*.69,s.h,s.d],[(-.5+(i+.5)/count)*s.w,s.h/2,0],i%3?'#dac294':'#c6a675',{edges:false});
  }else if(kind==='downlight'){
   const m=mesh(new T.CylinderGeometry(s.w/2,s.w/2,s.h,24),'#fff6df',[0,s.h/2,0],{emissive:'#fff1ce',emissiveIntensity:2});m.castShadow=false;
   // A restrained pool of actual light, budgeted with the scene's other spotlights.
   if(obj.structure.illuminate){const light=new T.PointLight('#fff0dc',1.15,4,2);light.position.set(0,-.13,0);group.add(light);}
  }else if(kind==='flood'){
   rod([0,0,-.07],[0,.14,.02],.008,'#a9adae');const lamp=bx([s.w,.07,.15],[0,.16,.025],white,{edges:false});lamp.rotation.x=.25;
  }else if(kind==='counter'){
   extrude(round(-s.w/2,0,s.w,s.h*.81,.06),s.d,white);
   bx([s.w-.06,.04,s.d-.04],[0,.034,0],'#dedbd3',{edges:false});
   extrude(round(-s.w/2,s.h*.83,s.w,s.h*.17,.025),s.d,white);
   bx([s.w-.03,.015,.013],[0,s.h*.824,s.d/2],'#fff2cf',{edges:false,material:new T.MeshStandardMaterial({color:'#fff2cf',emissive:'#ffdf91',emissiveIntensity:2})});
  }else if(kind==='chair'){
   // Upholstered tub bowl, raised arms and curved back, tapered timber legs.
   const pos=[],idx=[],R=16,N=64;
   for(let i=0;i<=R;i++)for(let j=0;j<=N;j++){const r=i/R,a=j/N*Math.PI*2,back=(1-Math.sin(a))/2;pos.push(s.w*.5*r*Math.cos(a),s.h*(.48+(.09+.40*back*back+.13*Math.pow(Math.cos(a),4))*r*r*r),s.d*.47*r*Math.sin(a));if(i<R&&j<N){const k=i*(N+1)+j;idx.push(k,k+1,k+N+1,k+1,k+N+2,k+N+1);}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();mesh(g,'#aaa9a4',[0,0,0],{material:new T.MeshStandardMaterial({color:'#aaa9a4',side:T.DoubleSide,roughness:.92})});
   const rim=[];for(let j=0;j<=N;j++)rim.push(pos.slice((R*(N+1)+j)*3,(R*(N+1)+j)*3+3));tube(rim,.01,'#b9b8b3');
   for(const x of [-1,1])for(const z of [-1,1])rod([x*s.w*.23,s.h*.46,z*s.d*.23],[x*s.w*.40,.015,z*s.d*.40],.021,wood);
  }else if(kind==='table'){
   mesh(new T.CylinderGeometry(s.w/2,s.w/2,.023,48),'#eeeae0',[0,s.h-.012,0],{roughness:.38});rod([0,.03,0],[0,s.h-.025,0],.022,'#a9adae');mesh(new T.CylinderGeometry(.19,.20,.025,48),'#a9adae',[0,.013,0],{metalness:.8,roughness:.2});
  }else if(kind==='planter'){
   bx([s.w,.18,s.d],[0,.09,0],white,{edges:false});bx([s.w-.04,.015,s.d-.04],[0,.18,0],'#3e3b24',{edges:false});
   const mat=new T.MeshStandardMaterial({color:'#4f7831',side:T.DoubleSide,roughness:.8});
   for(let i=0;i<140;i++){const x=((i*37%139)/139-.5)*(s.w-.06),z=((i*17%31)/31-.5)*(s.d-.08),h=.17+(i%9)*.016;
    const leaf=new T.Shape();leaf.moveTo(0,0);leaf.quadraticCurveTo(.09,h*.35,.015,h);leaf.quadraticCurveTo(-.08,h*.55,0,0);
    const m=mesh(new T.ShapeGeometry(leaf,7),'#4f7831',[x,.17,z],{material:mat});m.rotation.y=i*2.4;m.rotation.z=Math.sin(i)*.75;
   }
  }else return false;
  return true;
 }
 function decorate(spec,t){
  if(t.id!==template.id)return;
  t.objects.forEach((part,i)=>{
   const key=part.waveArtwork;if(!key)return;const o=spec.objects[i];
   let background=null,zone=[.04,.04,.92,.92];
   if(key!=='logo'){
    const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=Math.round(1000*o.size.h/o.size.w);const c=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
    c.fillStyle=white;c.fillRect(0,0,W,H);
    if(key==='screen'){
     const grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#395484');grad.addColorStop(.5,'#ecb597');grad.addColorStop(1,'#344e71');c.fillStyle=grad;c.fillRect(0,0,W,H);
     for(let k=0;k<3;k++){c.fillStyle=['#566c83','#405169','#253b51'][k];c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=50)c.lineTo(x,H*(.42+k*.15)-Math.sin(x*.007+k)*H*.13-Math.cos(x*.021)*H*.035);c.lineTo(W,H);c.fill();}zone=[.05,.045,.28,.20];
    }else{
     if(key==='navy'){c.fillStyle=navy;c.beginPath();c.roundRect(0,0,W,H,35);c.fill();}
     const ink=key==='navy'?'#e5c56b':navy;
     for(let k=0;k<4;k++){const y=H*(.35+k*.15);c.strokeStyle=ink;c.lineWidth=3;c.beginPath();c.arc(W*.16,y,W*.046,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(W*.135,y);c.lineTo(W*.16,y-W*.023);c.lineTo(W*.188,y);c.stroke();c.fillStyle=key==='navy'?'#d2dbe4':'#bdc1c4';for(let j=0;j<3;j++)c.fillRect(W*.28,y-W*.02+j*H*.017,W*(.53-j*.055),H*.005);}
     c.fillStyle='#c8a85c';c.beginPath();c.moveTo(W*.75,H);c.lineTo(W,H*.92);c.lineTo(W,H);c.fill();zone=[.08,.06,.84,.18];
    }
    background=canvas.toDataURL('image/png');
   }
   o.appearance={mode:'original',textureData:root.YPTemplateBranding.artwork(background,o.size.w,o.size.h,{zone}),textureName:'Yuppie Production · '+key,textureId:'soft-wave-yp-'+i};
  });
 }
 root.YPInlineSoftWave={build,decorate,template};
})(globalThis);
