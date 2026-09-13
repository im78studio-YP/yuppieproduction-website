(function(global){
 'use strict';
 const fixturePattern=/^(auto-light-visual-|spotlight-fixture|downlight-model)/;
 function fixture(node){node.userData.boothFixture=true;return node;}
 function anchor(T,group,position,direction=[0,-1,0],angle=.30){
  const node=new T.Object3D();node.position.fromArray(position);node.userData.boothBeamAnchor={direction,angle};group.add(node);return node;
 }
 function visible(node,root){for(let n=node;n&&n!==root;n=n.parent)if(n.visible===false)return false;return true;}
 function prepare(renderer,spec){
  const T=renderer.THREE,root=renderer.boothGroup;
  if(root.userData.beamsPrepared)return;
  root.userData.beamsPrepared=true;
  const objects=new Map((spec.objects||[]).map(o=>[o.id,o]));
  renderer.objectMeshes.forEach((node,id)=>{node.visible=objects.get(id)?.visible!==false;});
  root.traverse(n=>{if(spec.sceneItemState?.['structure.wall.'+(n.name||'').replace('booth-wall-','')]?.visible===false)n.visible=false;});
  root.updateMatrixWorld(true);
  const plans=[],spots=[],anchors=[];
  const add=(source,target,angle=.30,owner=null)=>{if(source.distanceTo(target)>.15)plans.push({source,target,angle,owner});};
  renderer.objectMeshes.forEach((node,id)=>{
   const o=objects.get(id),design=o?.structure?.design;if(!visible(node,root))return;
   if(/^(soft-wave-(downlight|flood)|beauty-downlight)$/.test(design||'')){
    node.traverse(part=>{if(part.isMesh||part.isLine)fixture(part);if(part.isLight)part.userData.beamSuperseded=true;});
    const source=node.localToWorld(new T.Vector3(0,design==='soft-wave-flood'?.08:-.015,design==='soft-wave-flood'?.14:0));
    const dir=design==='soft-wave-flood'?new T.Vector3(0,-1,-.12):new T.Vector3(0,-1,0);dir.transformDirection(node.matrixWorld);
    add(source,source.clone().addScaledVector(dir,design==='soft-wave-flood'?1.5:Math.max(.3,source.y-(Number(spec.raise)||0)/100)),.30,node);
   }
  });
  root.traverse(node=>{
   if(node.userData.boothFixture||fixturePattern.test(node.name||'')){node.visible=false;node.traverse(child=>{child.castShadow=false;child.raycast=()=>{};});}
   if(node.userData.boothBeamAnchor&&visible(node,root))anchors.push(node);
   if(node.isSpotLight&&!node.userData.beamSuperseded&&visible(node,root)&&!/diffuse|floor-fill/.test(node.name||''))spots.push(node);
  });
  for(const node of anchors){const a=node.userData.boothBeamAnchor,source=node.getWorldPosition(new T.Vector3()),dir=new T.Vector3(...a.direction).transformDirection(node.parent.matrixWorld);add(source,source.clone().addScaledVector(dir,Math.max(.4,source.y)),a.angle,node.parent);}
  for(const light of spots){light.target.updateWorldMatrix(true,false);const source=light.getWorldPosition(new T.Vector3()),target=light.target.getWorldPosition(new T.Vector3());plans.push({source,target,angle:light.angle,light});}
  const surfaces=[];
  root.traverse(n=>{
   if(!n.isMesh||!visible(n,root)||n.userData.systemHelper||n.userData.boothEmitter||n.userData.boothFixture)return;
   const material=Array.isArray(n.material)?n.material:[n.material];if(material.every(m=>m.transparent&&m.opacity<.8))return;surfaces.push(n);
  });
  const targets=[];
  renderer.objectMeshes.forEach((node,id)=>{
   const o=objects.get(id);if(!o||!visible(node,root))return;
   if(/counter|table|shelf/.test(o.catalogId||'')){const box=new T.Box3().setFromObject(node,true),p=box.getCenter(new T.Vector3());p.y=box.max.y+.015;targets.push(p);}
  });
  if(!plans.length){
   // Raycast actual undersides: a bounding box alone cannot prove a mounting surface exists.
   renderer.objectMeshes.forEach((node,id)=>{
    const o=objects.get(id);if(!o||!visible(node,root)||!/(panel|beam|canopy|frame|ribbon|fascia)/.test(o.catalogId||''))return;
    const box=new T.Box3().setFromObject(node,true),size=box.getSize(new T.Vector3());
    if(box.min.y<1.6||size.y>.9||Math.max(size.x,size.z)<.7)return;
    const longX=size.x>=size.z,count=Math.min(3,Math.max(1,Math.ceil(Math.max(size.x,size.z)/1.6)));
    for(let i=0;i<count;i++){
     const p=box.getCenter(new T.Vector3());p[longX?'x':'z']=box.min[longX?'x':'z']+Math.max(size.x,size.z)*(i+.5)/count;p.y=box.min.y-.10;
     const meshes=surfaces.filter(m=>{for(let n=m;n;n=n.parent)if(n===node)return true;return false;}),cross=longX?'z':'x';let hit;
     // Open rings/fascias can have a hole at their centre; try actual edge undersides too.
     for(const at of [p[cross],box.min[cross]+size[cross]*.08,box.max[cross]-size[cross]*.08]){
      const probe=p.clone();probe[cross]=at;hit=new T.Raycaster(probe,new T.Vector3(0,1,0),0,size.y+.2).intersectObjects(meshes,false)[0];if(hit)break;
     }
     if(!hit)continue;const source=hit.point.clone().add(new T.Vector3(0,-.035,0));
     const nearest=targets.filter(t=>t.y<source.y-.3&&Math.hypot(t.x-source.x,t.z-source.z)<1.3).sort((a,b)=>a.distanceTo(source)-b.distanceTo(source))[0];
     add(source,nearest?nearest.clone():new T.Vector3(source.x,(Number(spec.raise)||0)/100+.03,source.z),.30,node);
    }
   });
   const walls=[];
   root.traverse(n=>{if(/^booth-wall-(back|left|right)(-curved)?$/.test(n.name||'')&&visible(n,root))walls.push(n);});
   renderer.objectMeshes.forEach((n,id)=>{const o=objects.get(id);if(!o||!visible(n,root)||!/^panel-/.test(o.catalogId||'')||o.size.h<1.6||Math.min(o.size.w,o.size.d)>.35||Math.max(o.size.w,o.size.d)<1)return;walls.push(n);});
   walls.sort((a,b)=>{const size=n=>new T.Box3().setFromObject(n,true).getSize(new T.Vector3());const x=size(a),y=size(b);return Math.max(y.x,y.z)-Math.max(x.x,x.z);});
   for(const wall of walls){
    const box=new T.Box3().setFromObject(wall,true),size=box.getSize(new T.Vector3()),longX=size.x>=size.z,span=Math.max(size.x,size.z);
    const axis=longX?'z':'x',middle=longX?(Number(spec.D)||3)/2:(Number(spec.W)||6)/2,center=box.getCenter(new T.Vector3()),sign=center[axis]<middle?1:-1,face=sign>0?box.max[axis]:box.min[axis];
    for(let i=0,count=Math.min(3,Math.ceil(span/1.8));i<count;i++){
     const source=center.clone();source[longX?'x':'z']=box.min[longX?'x':'z']+span*(i+.5)/count;source.y=box.max.y-.07;source[axis]=face+sign*.16;
     if(plans.some(p=>p.source.distanceTo(source)<.9))continue;
     const inward=new T.Vector3();inward[axis]=-sign;
     const wallMeshes=surfaces.filter(m=>{for(let n=m;n;n=n.parent)if(n===wall)return true;return false;});
     const hit=new T.Raycaster(source,inward,0,size[axis]+.4).intersectObjects(wallMeshes,false)[0];
     if(!hit)continue;
     const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);if(normal.dot(inward)>0)normal.negate();
     const origin=hit.point.clone().addScaledVector(normal,.16),target=hit.point.clone().addScaledVector(normal,.006);target.y=box.min.y+size.y*.53;add(origin,target,.34,wall);
    }
   }
  }
  const authored=plans.filter(p=>p.light),generated=plans.filter(p=>!p.light),budget=8;
  const chosen=generated.length<=budget?generated:Array.from({length:budget},(_,i)=>generated[Math.round(i*(generated.length-1)/(budget-1))]);
  const effects=new T.Group();effects.name='booth-light-effects';effects.userData.systemHelper=true;root.add(effects);root.updateMatrixWorld(true);
  const details=[];
  for(const plan of [...authored,...chosen]){
   const dir=plan.target.clone().sub(plan.source).normalize();let length=Math.min(plan.source.distanceTo(plan.target),5);
   const obstacles=surfaces.filter(n=>{for(let p=n;p;p=p.parent)if(p===plan.owner)return false;return true;});
   const ray=new T.Raycaster(plan.source.clone().addScaledVector(dir,.015),dir,.015,length),hit=ray.intersectObjects(obstacles,false)[0];
   if(hit)length=Math.min(length,hit.distance+.015);if(length<.12)continue;
   const source=root.worldToLocal(plan.source.clone()),end=root.worldToLocal(plan.source.clone().addScaledVector(dir,length)),localDir=end.clone().sub(source).normalize();
   if(!plan.light){const light=new T.SpotLight('#fff0db',8,Math.max(4,length*2),plan.angle,.85,1.5),target=new T.Object3D();light.position.copy(source);target.position.copy(end);light.target=target;light.name='template-beam-source';light.userData.previewOnly=true;effects.add(light,target);}
   const geometry=new T.ConeGeometry(Math.tan(Math.min(plan.angle,.7))*length,length,32,1,true);
   const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,
    uniforms:{beamColor:{value:new T.Color('#fff0db')},beamLength:{value:length}},
    vertexShader:'varying float travel; uniform float beamLength; void main(){travel=clamp(0.5-position.y/beamLength,0.0,1.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 beamColor; varying float travel; void main(){float a=0.085*pow(1.0-travel,0.65)*smoothstep(0.0,0.035,travel);gl_FragColor=vec4(beamColor,a);}' });
   const cone=new T.Mesh(geometry,material);cone.name='booth-light-beam';cone.userData.systemHelper=true;cone.userData.boothBeamVisual=true;cone.raycast=()=>{};
   cone.position.copy(source).addScaledVector(localDir,length/2);cone.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),localDir);effects.add(cone);
   details.push({source:source.toArray(),target:end.toArray(),kind:plan.light?'existing':'template',angle:plan.angle});
  }
  root.userData.beamLayout=details;
 }
 global.YPBoothBeams={prepare,fixture,anchor};
})(globalThis);
