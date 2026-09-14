(function(global){
 'use strict';
 const id='brochure-zigzag';
 // Estimated from one reference photograph; dimensions remain editable, not a fabrication specification.
 const definition={catalogId:id,category:'display',type:'brochureRack',name:'ชั้นวางโบรชัวร์ซิกแซก',icon:'▤',size:{w:.28,d:.38,h:1.55},unitPrice:0,color:'#bdc8d0',thumbUrl:'assets/catalog-thumbnails/brochure-zigzag.png',capabilities:['floorPlaceable','free3DPlaceable','surfaceSnappable','resizable','rotatable','styleable'],transformPolicy:{canResize:true,canScale:true,defaultMode:'resize',productionSensitive:false}};
 function cover(T,index){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=724;const c=canvas.getContext('2d'),cream=index===4;
  c.fillStyle=cream?'#e8e3d8':'#1a2027';c.fillRect(0,0,512,724);
  c.fillStyle=cream?'#5f625d':'#ffffff';c.font='bold 25px sans-serif';c.fillText('EXHIBITION DESIGN',34,182);
  c.font='16px sans-serif';c.fillStyle=cream?'#8b8d85':'#bac1c5';c.fillText('SPACE / IDEAS / PEOPLE',34,216);
  // Architectural cover illustration, replacing the reference's third-party magazine artwork.
  c.strokeStyle=cream?'#a29980':'#d8d3c8';c.lineWidth=4;
  for(let i=0;i<11;i++){const x=48+i*29,y=330-i*7;c.beginPath();c.moveTo(x,588);c.lineTo(x,y);c.lineTo(x+104,y+48);c.lineTo(x+104,636);c.stroke();}
  c.fillStyle=cream?'#c1ae84':'#f72585';c.fillRect(285,445,191,133);c.fillStyle=cream?'#41483d':'#ffffff';c.font='bold 24px sans-serif';c.fillText('GOOD',305,489);c.fillText('IDEAS',305,524);c.fillText('TOGETHER',305,559);
  c.fillStyle=cream?'#65695f':'#d4d6d8';for(let i=0;i<4;i++)c.fillRect(36,646+i*10,180-i*21,3);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const logo=new Image();logo.onload=()=>{const scale=Math.min(448/logo.naturalWidth,112/logo.naturalHeight),w=logo.naturalWidth*scale,h=logo.naturalHeight*scale;c.drawImage(logo,(512-w)/2,36+(112-h)/2,w,h);texture.needsUpdate=true;};if(global.YPDefaultLogo?.data)logo.src=global.YPDefaultLogo.data;
  return texture;
 }
 function build({T,obj,root}){
  if(obj.catalogId!==id)return false;
  const group=new T.Group();group.name='brochure-zigzag-rack';root.add(group);
  const metal=new T.MeshStandardMaterial({color:'#bfcbd2',metalness:.78,roughness:.3}),trayMat=new T.MeshStandardMaterial({color:'#bbc6cf',metalness:.55,roughness:.4,side:T.DoubleSide});
  const box=(w,h,d,x,y,z,mat,name,parent=group)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const rod=(a,b,r,name)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start),m=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),8),metal);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());m.name=name;m.castShadow=true;group.add(m);};
  box(.28,.010,.38,0,.007,0,new T.MeshStandardMaterial({color:'#dee2e3',roughness:.4,metalness:.35}),'rack-base');
  for(const x of [-.136,.136])box(.008,.014,.38,x,.009,0,metal,'base-side-rim');
  for(const z of [-.186,.186])box(.28,.014,.008,0,.009,z,metal,'base-end-rim');
  const rise=.30,depth=.30,y0=.018,len=Math.hypot(rise,depth),width=.264;
  for(let i=0;i<5;i++){
   const za=i%2?-.15:.15,zb=-za,ya=y0+i*rise,yb=ya+rise,frame=new T.Group();frame.name='brochure-tray-'+i;frame.position.set(0,(ya+yb)/2,0);frame.rotation.x=Math.atan2(zb-za,rise);group.add(frame);
   box(width,len,.0025,0,0,0,trayMat,'silver-tray',frame);
   for(const x of [-width/2,width/2])box(.007,len+.008,.009,x,0,.002,metal,'tray-side-rail',frame);
   for(const y of [-len/2,len/2])box(width+.007,.007,.009,0,y,.002,metal,'tray-end-rail',frame);
   // Opposed diagonal links form the open scissor diamonds visible along both sides.
   for(const x of [-.137,.137]){rod([x,ya,-za],i===4?[x,(ya+yb)/2,0]:[x,yb,-zb],.0024,'scissor-link');const pin=new T.Mesh(new T.SphereGeometry(.004,8,6),metal);pin.position.set(x,(ya+yb)/2,0);group.add(pin);}
   if(i%2===0){
    box(width,.013,.023,0,-len/2+.006,.011,metal,'brochure-retaining-lip',frame);
    box(.221,.307,.007,0,-.039,.007,new T.MeshStandardMaterial({color:'#e1ddd3',roughness:.8}),'brochure-pages',frame);
    box(.225,.313,.0015,0,-.039,.0115,new T.MeshStandardMaterial({map:cover(T,i),color:'#ffffff',roughness:.85,metalness:0}),'brochure-artwork',frame);
   }
  }
  // Normalize exact outer envelope so numeric resize, selection bounds and physical model agree.
  group.updateMatrixWorld(true);const b=new T.Box3().setFromObject(group),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());
  group.children.forEach(child=>{child.position.x-=center.x;child.position.y-=b.min.y;child.position.z-=center.z;});
  group.scale.set(obj.size.w/size.x,obj.size.h/size.y,obj.size.d/size.z);return true;
 }
 global.YPBrochureRack={id,definition,build};
})(globalThis);
