(function(root){
 'use strict';
 const id='touch-screen-portrait',image='assets/touch-screen/yuppie-portrait.png';
 // Overall footprint is estimated from the references, not manufacturer data.
 const definition={catalogId:id,category:'media',type:'touchScreen',name:'จอ Touch Screen แนวตั้ง',icon:'▯',size:{w:.82,d:.40,h:2},unitPrice:0,color:'#101114',tvDisplay:true,thumbUrl:'assets/catalog-thumbnails/touch-screen-portrait.png',capabilities:['floorPlaceable','free3DPlaceable','surfaceSnappable','resizable','rotatable','styleable'],transformPolicy:{canResize:true,canScale:true,defaultMode:'resize',productionSensitive:false}};
 const isTouch=item=>item?.catalogId===id;
 function build({T,obj,root:g}){
  if(!isTouch(obj))return false;
  const frame=new T.Group();g.add(frame);frame.name='touch-screen-cabinet';
  const metal=new T.MeshStandardMaterial({color:'#b9c2c8',metalness:.72,roughness:.3}),black=new T.MeshStandardMaterial({color:'#111316',roughness:.26,metalness:.2}),rear=new T.MeshStandardMaterial({color:'#272b30',roughness:.55,metalness:.3});
  function box(w,h,d,x,y,z,mat,name){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.userData.tvDisplay=true;frame.add(m);return m;}
  box(.82,.025,.40,0,.0125,0,metal,'silver-stability-foot');
  box(.78,1.975,.095,0,1.0125,0,metal,'slim-silver-housing');
  box(.744,1.949,.003,0,1.0125,.049,black,'black-glass-front');
  box(.736,1.89,.003,0,1.0125,-.049,rear,'rear-service-cover');
  box(.70,.002,.003,0,.29,-.052,black,'rear-service-seam');
  // Display is inset in the black bezel; the lower black plinth stays unbranded.
  const screen=new T.Mesh(new T.PlaneGeometry(.704,1.42),new T.MeshBasicMaterial({color:'#ffffff',toneMapped:false}));screen.name='touch-screen-display';screen.position.set(0,1.235,.052);screen.userData.tvDisplay=true;frame.add(screen);
  const ventGeo=new T.BoxGeometry(.027,.003,.001),vents=new T.InstancedMesh(ventGeo,black,48),matrix=new T.Matrix4();
  for(let row=0;row<3;row++)for(let col=0;col<16;col++){matrix.makeTranslation(-.29+col*.038,1.80-row*.012,-.0515);vents.setMatrixAt(row*16+col,matrix);}vents.name='rear-vent-slots';vents.userData.tvDisplay=true;frame.add(vents);
  box(.047,.025,.002,.26,.19,-.052,black,'rear-cable-port');
  frame.scale.set(obj.size.w/.82,obj.size.h/2,obj.size.d/.40);return true;
 }
 function contain(iw,ih,w,h){const f=Math.min(w/iw,h/ih);return{x:(w-iw*f)/2,y:(h-ih*f)/2,w:iw*f,h:ih*f};}
 function appearance(renderer,g,obj){
  const T=renderer.THREE,screen=g.getObjectByName('touch-screen-display');if(!screen)return;
  const source=obj.appearance?.textureData||image,generation=renderer.buildId;
  function apply(decoded){
   if(!decoded||generation!==renderer.buildId)return;
   // Derive from authored local dimensions: correct even before the root is
   // attached, and unaffected by rotation or the direction of the camera.
   const ratio=(.704*obj.size.w/.82)/(1.42*obj.size.h/2),canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(1536*Math.min(1,ratio)));canvas.height=Math.max(1,Math.round(1536/Math.max(1,ratio)));
   const img=decoded._ypRasterSource||decoded,c=canvas.getContext('2d'),r=contain(img.width,img.height,canvas.width,canvas.height);
   c.fillStyle='#071827';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(img,r.x,r.y,r.w,r.h);
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;screen.material.map?.dispose();screen.material.map=texture;screen.material.needsUpdate=true;
   screen.userData.screenSource=source;screen.userData.screenFit={...r,sourceWidth:img.width,sourceHeight:img.height,canvasWidth:canvas.width,canvasHeight:canvas.height,displayRatio:ratio};
   if(g.parent)renderer.renderer.render(renderer.scene,renderer.camera);
  }
  const cached=renderer.brandImages.get(source);if(cached)apply(cached);else renderer.loadBrandImage(source).then(apply);
 }
 function artwork(){
  // Portrait artwork created at the physical display ratio; the official logo
  // is composited with preserveAspectRatio, never substituted with typed text.
  const c=document.createElement('canvas');c.width=704;c.height=1420;const x=c.getContext('2d'),gradient=x.createLinearGradient(0,0,704,1420);gradient.addColorStop(0,'#08d2d9');gradient.addColorStop(.43,'#087fa8');gradient.addColorStop(1,'#06142c');x.fillStyle=gradient;x.fillRect(0,0,704,1420);
  for(let i=0;i<16;i++){x.beginPath();x.moveTo(-80,520+i*31);x.bezierCurveTo(300,800+i*12,350,1150-i*20,820,860+i*24);x.strokeStyle=i%3?'#23eced66':'#b2ffff99';x.lineWidth=i%3?6:14;x.stroke();}
  x.fillStyle='#06243cdc';x.fillRect(44,180,616,276);x.fillStyle='#50eced';x.fillRect(44,180,4,276);
  x.font='18px sans-serif';x.textAlign='center';x.fillStyle='#dbfbff';x.fillText('EXPLORE  /  CONNECT  /  DISCOVER',352,404);
  x.strokeStyle='#cbffffaa';x.lineWidth=2;x.beginPath();x.arc(352,1210,32,0,Math.PI*2);x.stroke();x.beginPath();x.moveTo(344,1199);x.lineTo(356,1210);x.lineTo(344,1221);x.stroke();
  return YPTemplateBranding.artwork(c.toDataURL(),.704,1.42,{zone:[.12,.158,.76,.096]});
 }
 root.YPTouchScreen={id,image,definition,isTouch,build,appearance,contain,artwork};
})(globalThis);
