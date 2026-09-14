(function(global){
 'use strict';
 const ids=['tv-stand-console','tv-stand-pedestal','tv-stand-information'];
 const isStand=item=>ids.includes(item?.catalogId);
 // Reference-derived proportions, not verified manufacturer dimensions.
 function screenImage(){return 'assets/tv-stands/yuppie-screen.png';}
 function containRect(iw,ih,w,h){const scale=Math.min(w/iw,h/ih);return{x:(w-iw*scale)/2,y:(h-ih*scale)/2,w:iw*scale,h:ih*scale};}
 function build({T,obj,root}){
  if(!isStand(obj))return false;const kind=ids.indexOf(obj.catalogId),g=new T.Group();root.add(g);g.name=obj.catalogId;
  const mat=(color,metalness=.1,roughness=.43)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const silver=mat('#b7b8bd',.45),black=mat('#28282b'),white=mat('#e5e6e7',.08),rim=mat('#08090b');
  function mesh(geo,m,name,parent=g){const n=new T.Mesh(geo,m);n.name=name;n.castShadow=true;n.receiveShadow=true;n.userData.tvDisplay=true;parent.add(n);return n;}
  function box(w,h,d,x,y,z,m,name,parent=g){const n=mesh(new T.BoxGeometry(w,h,d),m,name,parent);n.position.set(x,y,z);return n;}
  function rounded(w,h,d,r,m,name){const s=new T.Shape(),x=-w/2,y=0;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const geo=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:8});geo.translate(0,0,-d/2);return mesh(geo,m,name);}
  function profile(w,points,m,name){const s=new T.Shape();points.forEach(([z,y],i)=>i?s.lineTo(-z,y):s.moveTo(-z,y));s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:w,bevelEnabled:false});geo.rotateY(Math.PI/2);geo.translate(-w/2,0,0);return mesh(geo,m,name);}
  function display(w,h,d,y,z,angle,screenW,screenH,material=black){const p=new T.Group();p.position.set(0,y,z);p.rotation.x=angle;g.add(p);box(w,h,d,0,0,0,material,'display-housing',p);box(screenW+.018,screenH+.018,.006,0,0,d/2+.001,rim,'screen-black-seal',p);const n=mesh(new T.PlaneGeometry(screenW,screenH),new T.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),'tv-stand-screen',p);n.position.z=d/2+.005;n.castShadow=false;return p;}
  if(kind===0){
   profile(.95,[[.235,.025],[.235,.79],[-.23,1.30],[-.23,.025]],silver,'silver-console');
   box(.96,.025,.55,0,.0125,-.02,silver,'console-foot');
   const len=Math.hypot(.465,.51),angle=-Math.atan2(.465,.51);
   display(.95,len,.016,1.045,.0025,angle,.74,.417,black);
   box(.80,.005,.005,0,.035,.237,mat('#88898c'),'console-bottom-seam');
  }else if(kind===1){
   const foot=rounded(.63,.045,.55,.02,black,'pedestal-foot');foot.position.z=.005;
   profile(.40,[[.12,.045],[.12,.48],[.05,.73],[-.10,.88],[-.16,.88],[-.04,.48],[-.04,.045]],black,'curved-pedestal');
   display(1.12,.60,.055,.965,.015,-.79,1.052,.532);
   box(.398,.004,.004,0,.50,.117,mat('#202024'),'pedestal-seam');
  }else{
   box(.82,.02,.40,0,.01,0,black,'information-foot');
   const body=rounded(.74,1.48,.19,.036,white,'white-information-cabinet');body.position.y=.02;
   const pos=body.geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,pos.getZ(i)-Math.max(0,pos.getY(i)-.87)*.25);pos.needsUpdate=true;body.geometry.computeVertexNormals();
   const angle=-Math.atan(.25),p=display(.610,.414,.005,1.225,.095-(1.225-.89)*.25+.004,angle,.588,.392,white);
   const holeGeo=new T.CircleGeometry(.0028,8),holes=new T.InstancedMesh(holeGeo,rim,176),matrix=new T.Matrix4();let k=0;
   for(let row=0;row<4;row++)for(let col=0;col<44;col++){matrix.makeTranslation(-.273+col*.0127+(row%2)*.003,.985-row*.010,.095-(.985-row*.010-.89)*.25+.003);matrix.multiply(new T.Matrix4().makeRotationX(angle));holes.setMatrixAt(k++,matrix);}holes.name='speaker-perforations';holes.userData.tvDisplay=true;g.add(holes);
   box(.616,.832,.002,0,.458,.096,mat('#a7a8aa'),'service-door-seam');box(.612,.828,.002,0,.458,.098,white,'service-door');
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');c.strokeStyle='#142c4d';c.lineWidth=12;c.beginPath();c.arc(128,128,109,0,7);c.stroke();c.fillStyle='#142c4d';c.textAlign='center';c.font='bold italic 205px Georgia';c.fillText('i',126,204);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
   const icon=mesh(new T.PlaneGeometry(.30,.30),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}),'information-symbol');icon.position.set(0,.45,.101);icon.castShadow=false;
  }
  g.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(g),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());g.children.forEach(n=>{n.position.x-=center.x;n.position.y-=bounds.min.y;n.position.z-=center.z;});g.scale.set(obj.size.w/size.x,obj.size.h/size.y,obj.size.d/size.z);return true;
 }
 function appearance(renderer,root,obj){
  const T=renderer.THREE,buildId=renderer.buildId;let screen;root.traverse(n=>{if(n.name==='tv-stand-screen')screen=n;});if(!screen)return;
  const source=obj.appearance?.textureData||screenImage(obj.catalogId);
  new T.TextureLoader().load(source,texture=>{
   if(buildId!==renderer.buildId||!root.parent){texture.dispose();return;}
   // Fit to the real transformed display, including its tilt and non-uniform size controls.
   screen.updateWorldMatrix(true,false);const e=screen.matrixWorld.elements,p=screen.geometry.parameters;
   const ratio=p.width*Math.hypot(e[0],e[1],e[2])/(p.height*Math.hypot(e[4],e[5],e[6]));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(1536*Math.min(1,ratio)));canvas.height=Math.max(1,Math.round(1536/Math.max(1,ratio)));
   const c=canvas.getContext('2d'),img=texture.image,r=containRect(img.width,img.height,canvas.width,canvas.height);
   c.fillStyle='#202020';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(img,r.x,r.y,r.w,r.h);
   const fitted=new T.CanvasTexture(canvas);fitted.colorSpace=T.SRGBColorSpace;screen.material.map?.dispose();screen.material.map=fitted;screen.material.needsUpdate=true;
   screen.userData.screenSource=source;screen.userData.screenFit={...r,canvasWidth:canvas.width,canvasHeight:canvas.height,sourceWidth:img.width,sourceHeight:img.height,displayRatio:ratio};texture.dispose();renderer.renderer.render(renderer.scene,renderer.camera);
  });
 }
 global.YPTVStands={ids,isStand,build,appearance,screenImage,containRect};
})(globalThis);
