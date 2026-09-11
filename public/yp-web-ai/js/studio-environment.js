(function(global){
 'use strict';
 const background='#e6e7eb';
 function create(app,spec){
  const T=app.THREE,span=Math.max(spec.W,spec.D,spec.H,3),group=new T.Group();
  group.name='scene-ground';group.userData.systemHelper=true;
  const target=new T.WebGLRenderTarget(512,512,{type:T.HalfFloatType,depthBuffer:true});
  const textureMatrix=new T.Matrix4(),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
  const uniforms={reflection:{value:target.texture},textureMatrix:{value:textureMatrix},baseColor:{value:new T.Color(background)},
   center:{value:new T.Vector2(spec.W/2,spec.D/2)},span:{value:span},ready:{value:0}};
  const material=new T.ShaderMaterial({uniforms,toneMapped:false,
   vertexShader:`uniform mat4 textureMatrix;varying vec4 reflectedUv;varying vec3 world;
    void main(){vec4 p=modelMatrix*vec4(position,1.0);world=p.xyz;reflectedUv=textureMatrix*p;gl_Position=projectionMatrix*viewMatrix*p;}`,
   fragmentShader:`uniform sampler2D reflection;uniform vec3 baseColor;uniform vec2 center;uniform float span;uniform float ready;
    varying vec4 reflectedUv;varying vec3 world;
    void main(){
     float distanceFromBooth=length(world.xz-center)/span;
     float nearBooth=1.0-smoothstep(.45,1.65,distanceFromBooth);
     vec3 floorColor=mix(baseColor,vec3(1.0),.055*nearBooth);
     vec2 uv=reflectedUv.xy/reflectedUv.w;
     vec3 reflected=texture2D(reflection,uv).rgb*.20;
     // Broad, low-contrast reflection: a satin studio floor, not a mirror.
     for(int i=0;i<8;i++){float a=float(i)*.78539816;reflected+=texture2D(reflection,uv+vec2(cos(a),sin(a))*.006).rgb*.10;}
     float inView=step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0);
     // Compress HDR highlights while retaining a hint of the booth's actual colours.
     reflected=clamp(reflected,0.0,1.0);
     gl_FragColor=vec4(mix(floorColor,reflected,.16*nearBooth*inView*ready),1.0);
     #include <colorspace_fragment>
    }`});
  const floor=new T.Mesh(new T.PlaneGeometry(1000,1000),material);floor.rotation.x=-Math.PI/2;
  floor.position.set(spec.W/2,-.045,spec.D/2);floor.name='studio-satin-floor';group.add(floor);
  const shadow=new T.Mesh(new T.PlaneGeometry(1000,1000),new T.ShadowMaterial({color:0x48505e,opacity:.22,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.copy(floor.position);shadow.position.y+=.0005;shadow.receiveShadow=true;
  shadow.name='studio-contact-shadow';group.add(shadow);
  group.traverse(o=>{o.userData.systemHelper=true;o.raycast=()=>{};});
  let rendering=false,lastTime=-Infinity,lastKey='',mirror=null,lastType='';
  floor.onBeforeRender=(renderer,scene,camera)=>{
   if(rendering||!group.visible)return;
   const now=performance.now(),key=Array.from(camera.matrixWorld.elements).join(',')+'|'+Array.from(camera.projectionMatrix.elements).join(',')+'|'+app.buildId;
   // Throttle during orbit/drag; refresh settled frames for asynchronously loaded textures.
   if(now-lastTime<100||(key===lastKey&&!app.pointerDrag&&now-lastTime<1500))return;
   lastTime=now;lastKey=key;rendering=true;
   const hidden=[],oldTarget=renderer.getRenderTarget(),oldXr=renderer.xr.enabled,oldShadowUpdate=renderer.shadowMap.autoUpdate,
    oldViewport=renderer.getViewport(new T.Vector4()),oldScissor=renderer.getScissor(new T.Vector4()),oldScissorTest=renderer.getScissorTest();
   try{
    // Clone the actual camera type: orthographic editing views must reflect correctly too.
    if(lastType!==camera.type){mirror=camera.clone();lastType=camera.type;}
    mirror.copy(camera,false);mirror.position.setFromMatrixPosition(camera.matrixWorld);
    const direction=camera.getWorldDirection(new T.Vector3()),look=mirror.position.clone().add(direction),up=new T.Vector3(0,1,0).transformDirection(camera.matrixWorld);
    mirror.position.y=2*floor.position.y-mirror.position.y;look.y=2*floor.position.y-look.y;up.y*=-1;
    mirror.up.copy(up);mirror.lookAt(look);mirror.updateMatrixWorld(true);
    textureMatrix.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
    scene.traverse(o=>{if(o.visible&&(o===group||o.userData.systemHelper||/^(object-selection|brand-selection|object-anchor|magnetic-snap|attachment-|booth-dimension|booth-editing-grid|booth-wall-editing-grid)/.test(o.name))){hidden.push(o);o.visible=false;}});
    renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(target);renderer.setScissorTest(false);
    renderer.clear();renderer.render(scene,mirror);uniforms.ready.value=1;
   }finally{
    hidden.forEach(o=>o.visible=true);renderer.setRenderTarget(oldTarget);renderer.setViewport(oldViewport);renderer.setScissor(oldScissor);renderer.setScissorTest(oldScissorTest);
    renderer.xr.enabled=oldXr;renderer.shadowMap.autoUpdate=oldShadowUpdate;rendering=false;
   }
  };
  group.userData.disposeResources=()=>target.dispose();
  return group;
 }
 global.YPStudioEnvironment={background,create};
})(globalThis);
