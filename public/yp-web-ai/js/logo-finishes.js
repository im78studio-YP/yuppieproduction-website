(function(global){
 'use strict';
 // Double front-lit lightboxes only; rear halos retain their existing intensity.
 const LIGHTBOX_GAIN=2;
 function settings(spec={}){
  const s=spec.logoLight||{},v=Number(s.intensity);
  return {enabled:s.enabled!==false,tone:s.tone==='white'?'white':'warm',intensity:Number.isFinite(v)?Math.max(0,Math.min(1,v)):.65};
 }
 const lit=spec=>['backlit','light'].includes(spec.logoType)&&settings(spec).enabled;
 const tone=spec=>settings(spec).tone==='warm'?'#ffe2b5':'#f3f7ff';
 const colorMode=spec=>spec.logoColorMode||(spec.logoColorTouched?'tint':'original');
 function front(T,texture,spec){
  const on=spec.logoType==='light'&&lit(spec);
  const material=new T.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.025,side:T.DoubleSide,
   roughness:spec.logoType==='light'?.32:.58,metalness:.02,emissive:on?tone(spec):'#000000',
   emissiveMap:texture,emissiveIntensity:on?settings(spec).intensity*.9*LIGHTBOX_GAIN:0});
  material.userData.logoFinish=true;return material;
 }
 function edge(T,texture,spec){
  // Use the image alpha, not alphaMap's green channel: retain holes in coloured logos.
  const m=new T.MeshStandardMaterial({map:texture,color:spec.logoType==='light'?'#bfc1c5':'#66666b',transparent:true,alphaTest:.04,side:T.DoubleSide,roughness:.48,metalness:.1});m.userData.logoFinish=true;return m;
 }
 function haloMaterial(T,texture,spec,frontGlow=false){
  const pad=frontGlow?32:0,W=1024+pad*2,H=512+pad*2;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const mask=document.createElement('canvas');mask.width=W;mask.height=H;
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const update=()=>{
   if(!texture.image)return;const m=mask.getContext('2d'),c=canvas.getContext('2d');m.clearRect(0,0,W,H);m.drawImage(texture.image,pad,pad,1024,512);
   if(!frontGlow){m.globalCompositeOperation='source-in';m.fillStyle=tone(spec);m.fillRect(0,0,W,H);m.globalCompositeOperation='source-over';}
   c.clearRect(0,0,W,H);c.filter='blur(16px)';c.globalAlpha=.8;c.drawImage(mask,0,0);c.filter='blur(5px)';c.globalAlpha=.95;c.drawImage(mask,0,0);c.filter='none';c.globalAlpha=1;
   // Bloom surrounds the artwork; it must not wash out the coloured face itself.
   if(frontGlow){c.globalCompositeOperation='destination-out';c.drawImage(mask,0,0);c.globalCompositeOperation='source-over';}map.needsUpdate=true;
  };
  update();texture.userData=texture.userData||{};(texture.userData.brandBoundsListeners||(texture.userData.brandBoundsListeners=[])).push(update);
  const m=new T.MeshBasicMaterial({map,transparent:true,opacity:lit(spec)?settings(spec).intensity:0,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false});
  if(frontGlow)m.color.multiplyScalar(LIGHTBOX_GAIN);
  m.userData[frontGlow?'logoBloom':'logoHalo']=true;return m;
 }
 function markHalo(mesh){mesh.name='logo-back-halo';mesh.castShadow=false;mesh.receiveShadow=false;mesh.raycast=()=>{};mesh.userData.systemHelper=true;mesh.userData.logoHalo=true;delete mesh.userData.applyBrandVisibleBounds;return mesh;}
 function addBloom(T,root,face,spec){
  if(spec.logoType!=='light'||!face.material?.emissiveMap)return;
  const bloom=new T.Mesh(face.geometry.clone(),haloMaterial(T,face.material.map,spec,true));bloom.position.copy(face.position);bloom.quaternion.copy(face.quaternion);
  if(!face.userData.curvedBranding){bloom.scale.set(1088/1024,576/512,1);bloom.translateZ(.004);}
  bloom.name='logo-front-bloom';bloom.userData.systemHelper=true;bloom.userData.logoBloom=true;bloom.raycast=()=>{};bloom.renderOrder=2;root.add(bloom);return bloom;
 }
 function finish(renderer){
  const T=renderer.THREE,scene=renderer.boothGroup;if(!scene)return;scene.updateMatrixWorld(true);
  const halos=[],surfaces=[];scene.traverse(n=>{
   if(n.userData.logoSupport&&!n.userData.logoSupportResolved)halos.push(n);
   if(!n.isMesh||n.userData.systemHelper||n.userData.brandPlacement)return;
   for(let a=n;a&&a!==scene;a=a.parent)if(a.visible===false)return;
   const ms=Array.isArray(n.material)?n.material:[n.material];if(ms.every(m=>m.transparent&&m.opacity<.8))return;surfaces.push(n);
  });
  for(const halo of halos){
   const origin=halo.getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,0,1).transformDirection(halo.matrixWorld),owner=halo.parent;
   const targets=surfaces.filter(n=>{for(let a=n;a;a=a.parent)if(a===owner)return false;return true;});
   const hit=new T.Raycaster(origin.clone().addScaledVector(normal,.15),normal.clone().negate(),0,.35).intersectObjects(targets,false)[0];
   if(hit){
    const destination=hit.point.clone().addScaledVector(normal,.003);halo.position.copy(owner.worldToLocal(destination));halo.userData.logoSupportResolved=true;halo.userData.supportClearance=.003;
   }else{halo.visible=false;halo.userData.logoSupportResolved=true;}
  }
 }
 function copySpec(obj){return {...(obj.logoFinish||{}),logoType:obj.logoFinish?.logoType||'diecut',logoShape:obj.logoFinish?.logoShape||'cutout'};}
 function applyCopy(renderer,root,obj,texture){
  if(obj.type!=='brandCopy'||!obj.logoFinish)return;const T=renderer.THREE,s=copySpec(obj),w=obj.size.w,h=obj.size.h,d=Math.max(.008,Math.min(.12,obj.size.d||.03));
  const artwork=root.children.find(n=>n.name==='brand-artwork-copy')||root.children.find(n=>n.isMesh&&n.geometry?.type==='PlaneGeometry');if(!artwork)return;artwork.name='brand-artwork-copy';
  let faceTexture=texture;
  if(s.logoShape==='panel'){
   const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,1024,512);x.drawImage(texture.image,0,0,1024,512);faceTexture=new T.CanvasTexture(c);faceTexture.colorSpace=T.SRGBColorSpace;
  }
  if(artwork.material)artwork.material.dispose();artwork.material=front(T,faceTexture,s);artwork.position.z=d/2;
  const side=edge(T,faceTexture,s),layers=Math.min(24,Math.max(3,Math.ceil(d/.004)));
  for(let i=0;i<layers;i++){const part=new T.Mesh(new T.PlaneGeometry(w,h),side);part.position.set(0,h/2,-d/2+d*i/layers);part.name='logo-copy-edge';part.castShadow=true;part.userData.objectId=obj.id;root.add(part);}
  if(s.logoType==='backlit'){const halo=new T.Mesh(new T.PlaneGeometry(w,h),haloMaterial(T,texture,s));halo.position.set(0,h/2,-d/2-.006);markHalo(halo);halo.userData.logoSupport=true;root.add(halo);}
  addBloom(T,root,artwork,s);
  // Async artwork loads can finish after the main scene's support pass.
  if(root.parent)finish(renderer);
 }
 function selected(){const o=objectById(objectEditor.selectedId);return o?.type==='brandCopy'?o:null;}
 function current(){const o=selected();return o?copySpec(o):S;}
 function change(patch){
  const before=objectSnapshot(),o=selected();
  if(o){o.logoFinish={...copySpec(o),...patch};if(o.logoFinish.logoType==='backlit')o.logoFinish.logoShape='cutout';}
  else{Object.assign(S,patch);if(S.logoType==='backlit')S.logoShape='cutout';}
  recordObjectHistory(before);sync();
 }
 function updateUI(){
  const box=document.getElementById('logoLightControls');if(!box)return;
  const spec=current(),s=settings(spec),o=selected(),select=document.getElementById('logoType');
  document.getElementById('settingsBrand').classList.toggle('island-brand-disabled',S.type==='island'&&!o);
  for(const option of select.options)option.hidden=option.value==='sticker'&&spec.logoType!=='sticker';select.value=spec.logoType;
  document.getElementById('logoTypeNote').textContent=(LOGOTYPES.find(t=>t.k===spec.logoType)?.s||'')+(o?' · ใช้กับโลโก้ที่เลือก':'');
  box.hidden=!['backlit','light'].includes(spec.logoType);
  for(const [id,on] of [['logoLightOn',s.enabled],['logoLightOff',!s.enabled],['logoLightWhite',s.tone==='white'],['logoLightWarm',s.tone==='warm']])document.getElementById(id).setAttribute('aria-pressed',String(on));
  document.getElementById('logoLightLevel').value=Math.round(s.intensity*100);document.getElementById('logoLightValue').textContent=Math.round(s.intensity*100)+'%';
  document.getElementById('logoOriginalColor').hidden=!!o;document.getElementById('logoOriginalColor').setAttribute('aria-pressed',String(colorMode(spec)==='original'));
  document.querySelectorAll('#oLogoShape button').forEach(b=>{b.disabled=spec.logoType==='backlit';b.classList.toggle('on',b.dataset.k===spec.logoShape);});
  global.YPLogoReplacement?.refresh();
 }
 function installUI(){
  const $=id=>document.getElementById(id);
  if(!$('logoFinishStyles')){const style=document.createElement('style');style.id='logoFinishStyles';style.textContent='#logoLightControls button[aria-pressed="true"],#logoOriginalColor[aria-pressed="true"]{border-color:var(--ac,#f72585);background:#351329;color:#ff79b1}#logoLightLevel{accent-color:#f72585}';document.head.append(style);}
  $('logoType').onchange=()=>change({logoType:$('logoType').value});
  $('logoOriginalColor').onclick=()=>change({logoColorMode:'original'});
  const light=patch=>change({logoLight:{...settings(current()),...patch}});
  $('logoLightOn').onclick=()=>light({enabled:true});$('logoLightOff').onclick=()=>light({enabled:false});
  $('logoLightWhite').onclick=()=>light({tone:'white'});$('logoLightWarm').onclick=()=>light({tone:'warm'});
  $('logoLightLevel').oninput=e=>{$('logoLightValue').textContent=e.target.value+'%';};
  $('logoLightLevel').onchange=e=>light({intensity:Number(e.target.value)/100});updateUI();
 }
 function prompt(spec){
  const s=settings(spec),describe=x=>x.logoType==='backlit'?'die-cut coloured faces with a soft rear halo on the supporting surface':x.logoType==='light'?'lightbox with evenly illuminated coloured faces and visible solid returns':'non-luminous painted/printed coloured faces';
  return 'LOGO FINISH: '+describe(spec)+'. Logo illumination is independently '+(lit(spec)?'on, '+s.tone+', level '+Math.round(s.intensity*100)+'%':'off')+'. Preserve the artwork colours and legibility. No light cones from logos. Do not change logo position or scale. '+(spec.objects||[]).filter(o=>o.logoFinish).map(o=>o.id+': '+describe(o.logoFinish)+', '+(lit(o.logoFinish)?'on':'off')).join('; ');
 }
 global.YPLogoFinishes={settings,lit,tone,colorMode,front,edge,haloMaterial,markHalo,addBloom,finish,applyCopy,current,change,updateUI,installUI,prompt};
})(globalThis);
