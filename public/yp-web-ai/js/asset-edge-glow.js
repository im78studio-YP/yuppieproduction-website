(function(global){
 'use strict';
 function segments(value){
  if(!Array.isArray(value))return [];
  const out=[],seen=new Set();
  for(const pair of value.slice(0,512)){
   if(!Array.isArray(pair)||pair.length!==2||!pair.every(p=>Array.isArray(p)&&p.length===3&&p.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6)))continue;
   const clean=pair.map(p=>p.map(n=>+n.toFixed(6)));
   if(Math.hypot(...clean[0].map((n,i)=>n-clean[1][i]))<1e-7)continue;
   const key=segmentKey(clean);if(seen.has(key))continue;seen.add(key);out.push(clean);
  }return out;
 }
 const segmentKey=pair=>pair.map(p=>p.map(n=>+n.toFixed(6)).join(',')).sort().join('|');
 function sanitize(value){
  if(!value||value.enabled!==true)return null;
  const n=Number(value.intensity);
  const pathMode=['selected','custom'].includes(value.pathMode)?value.pathMode:'all';
  return{enabled:true,color:/^#[0-9a-f]{6}$/i.test(value.color||'')?value.color.toLowerCase():'#fff1c2',intensity:Number.isFinite(n)?Math.min(3,Math.max(.2,n)):1,pathMode,segments:pathMode==='all'?[]:segments(value.segments)};
 }
 function clear(entry){
  for(const child of [...entry.node.children])if(child.userData.partEdgeGlow&&child.userData.partSlot===entry.slot){child.removeFromParent();child.geometry.dispose();child.material.dispose();}
 }
 // Restrict edge extraction to the selected material slot, never the object's bounding box.
 function edgesFor(T,entry){
  const g=entry.node.geometry,p=g?.attributes.position;if(!p)return null;
  let subset=null,source=g;
  if(Array.isArray(entry.node.material)){
   const groups=g.groups.filter(group=>group.materialIndex===entry.slot),positions=[],index=g.index;
   for(const group of groups){const end=Math.min(group.start+group.count,index?index.count:p.count);
    for(let i=group.start;i<end;i++){const n=index?index.getX(i):i;positions.push(p.getX(n),p.getY(n),p.getZ(n));}
   }
   if(!positions.length)return null;
   subset=new T.BufferGeometry();subset.setAttribute('position',new T.Float32BufferAttribute(positions,3));source=subset;
  }
  const edges=new T.EdgesGeometry(source,30);subset?.dispose();return edges;
 }
 function update(T,entry,value){
  const settings=sanitize(value),existing=entry.node.children.find(n=>n.userData.partEdgeGlow&&n.userData.partSlot===entry.slot);
  if(!settings){clear(entry);return;}
  const signature=JSON.stringify([settings.pathMode,settings.segments]);
  if(existing&&existing.userData.routeSignature===signature){existing.material.uniforms.glowColor.value.set(settings.color);existing.material.uniforms.intensity.value=settings.intensity;return;}
  if(existing)clear(entry);
  let route=settings.segments;
  if(settings.pathMode==='all'){const edges=edgesFor(T,entry);if(!edges)return;const p=edges.attributes.position;route=[];
   for(let i=0;i+1<p.count;i+=2)route.push([[p.getX(i),p.getY(i),p.getZ(i)],[p.getX(i+1),p.getY(i+1),p.getZ(i+1)]]);edges.dispose();}
  // Screen-space ribbons keep their geometry bounds exactly on the source edges.
  // They do not enlarge snap/resize bounds and their raycast cannot intercept asset selection.
  const positions=[],starts=[],ends=[],sides=[],flags=[];
  for(const [a,b] of route){
   for(const [end,side] of [[0,-1],[1,-1],[1,1],[0,-1],[1,1],[0,1]]){positions.push(...(end?b:a));starts.push(...a);ends.push(...b);flags.push(end);sides.push(side);}
  }if(!positions.length)return;
  const geometry=new T.BufferGeometry();
  for(const [name,array,size] of [['position',positions,3],['edgeStart',starts,3],['edgeEnd',ends,3],['edgeFlag',flags,1],['edgeSide',sides,1]])geometry.setAttribute(name,new T.Float32BufferAttribute(array,size));
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false,
   uniforms:{glowColor:{value:new T.Color(settings.color)},intensity:{value:settings.intensity},resolution:{value:new T.Vector2(1,1)},pixelRatio:{value:1}},
   vertexShader:`attribute vec3 edgeStart;attribute vec3 edgeEnd;attribute float edgeFlag;attribute float edgeSide;
    uniform vec2 resolution;uniform float pixelRatio;uniform float intensity;varying float across;
    void main(){vec4 va=modelViewMatrix*vec4(edgeStart,1.0);vec4 vb=modelViewMatrix*vec4(edgeEnd,1.0);va.z+=0.0002;vb.z+=0.0002;
     vec4 a=projectionMatrix*va;vec4 b=projectionMatrix*vb;
     across=edgeSide;if(a.w<=0.0||b.w<=0.0){gl_Position=vec4(2.0,2.0,2.0,1.0);return;}
     vec2 delta=(b.xy/b.w-a.xy/a.w)*resolution;vec2 normal=vec2(-delta.y,delta.x)/max(length(delta),0.001);
     vec4 point=mix(a,b,edgeFlag);point.xy+=normal*edgeSide*(4.0+2.0*intensity)*pixelRatio*2.0/resolution*point.w;
     gl_Position=point;}`,
   fragmentShader:`uniform vec3 glowColor;uniform float intensity;varying float across;
    void main(){float d=abs(across);float core=1.0-smoothstep(0.08,0.23,d);float halo=exp(-d*d*5.5)*0.45*intensity;
     float alpha=min(0.97,(core+halo)*(1.0-smoothstep(0.85,1.0,d)));if(alpha<0.01)discard;
     gl_FragColor=vec4(mix(glowColor,vec3(1.0),core*0.72),alpha);
     #include <colorspace_fragment>
    }`});
  const mesh=new T.Mesh(geometry,material);mesh.name='asset-part-edge-glow';mesh.userData={partEdgeGlow:true,partSlot:entry.slot,systemHelper:true,routeSignature:signature};mesh.raycast=()=>{};mesh.renderOrder=5;
  mesh.onBeforeRender=renderer=>{renderer.getDrawingBufferSize(material.uniforms.resolution.value);material.uniforms.pixelRatio.value=renderer.getPixelRatio();};
  entry.node.add(mesh);
 }
 global.YPAssetEdgeGlow={sanitize,segments,segmentKey,update,clear,edgesFor};
})(globalThis);
