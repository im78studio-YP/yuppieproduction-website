(function(global){
  'use strict';

  const INTENTS=['balanced','brand','product','counter'];
  const TEMPERATURES=[3000,4000,5000];
  const BRIGHTNESS=['soft','standard','bright'];
  const PREFERENCES=['auto','clear','arm','side-wall','downlight','mixed','invisible'];
  const FIXTURE_STATUSES=['preview','suggested','approved'];
  const FIXTURE_TYPES=['clear','arm','downlight','invisible'];
  const TARGET_TYPES=['logo','graphic','product','counter','screen','meeting','entrance','general'];
  const INTENSITY={soft:.72,standard:1,bright:1.32};
  const AUTO_RENDER_BASE_INTENSITY=16;
  const AUTO_BEAM_ANGLE=.68;
  const BOOTH_WALL_THICKNESS=.1;
  const PENINSULAR_WALL_THICKNESS=.3;
  const STORAGE_PRESETS={a:{w:1.2,d:1.2},b:{w:1.2,d:1.5},c:{w:1.2,d:2},'1.2x1.2':{w:1.2,d:1.2},'1.2x1.5':{w:1.2,d:1.5},'1.2x2.0':{w:1.2,d:2}};
  const INTENT_PRIORITY={
    balanced:['logo','entrance','graphic','product','counter','screen','meeting','general'],
    brand:['logo','graphic','screen','product','counter','meeting','entrance','general'],
    product:['product','screen','counter','logo','graphic','meeting','entrance','general'],
    counter:['counter','logo','graphic','product','screen','meeting','entrance','general']
  };

  const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const round=(value,digits=3)=>Number(num(value).toFixed(digits));
  const clone=value=>JSON.parse(JSON.stringify(value));
  const slug=value=>String(value||'item').toLowerCase().replace(/[^a-z0-9\u0E00-\u0E7F]+/g,'-').replace(/^-|-$/g,'')||'item';
  const vec=(x=0,y=0,z=0)=>({x:round(x),y:round(y),z:round(z)});
  const fixtureId=(revision,index,target)=>'auto-light-r'+revision+'-'+String(index+1).padStart(2,'0')+'-'+slug(target?.id||target?.type);
  const fixtureName=type=>({clear:'Clear Light',arm:'Arm Light',downlight:'Downlight',invisible:'Invisible Preview Light'})[type]||'Invisible Preview Light';

  function normalizeMountAttachment(value){
    if(!value||typeof value!=='object')return null;
    const parentAssetId=String(value.parentAssetId||'');if(!parentAssetId)return null;
    const uv=value.surfaceUV||{};
    return{parentAssetId,mountRole:String(value.mountRole||''),surfaceUV:{u:round(clamp(num(uv.u,.5),0,1)),v:round(clamp(num(uv.v,.5),0,1))},
      normalOffset:round(num(value.normalOffset,0)),aimMode:value.aimMode==='world-down'?'world-down':'surface-normal'};
  }

  function defaultLightingState(){
    return{
      enabled:true,mode:'auto',intent:'balanced',temperatureK:4000,brightness:'standard',fixturePreference:'auto',
      suggestions:[],approvedFixtures:[],lightingRevision:0,lastCalculatedSceneRevision:null,stale:false,autoUpdate:false,
      validationWarnings:[]
    };
  }

  function normalizeFixture(input={},index=0){
    const position=input.position||{},rotation=input.rotation||{},mountId=String(input.mountSurfaceId||''),mountRotation=input.mountRotation||mountRotationForSurface({face:mountId==='wall-left'?'left':mountId==='wall-right'?'right':mountId==='wall-back'?'back':null}),aim=input.aimTarget||{};
    const type=FIXTURE_TYPES.includes(input.fixtureType)?input.fixtureType:'invisible';
    const status=FIXTURE_STATUSES.includes(input.status)?input.status:'suggested';
    return{
      id:String(input.id||'lighting-fixture-'+(index+1)),name:String(input.name||fixtureName(type)),
      status,source:input.source==='manual'?'manual':'auto',fixtureType:type,
      targetType:TARGET_TYPES.includes(input.targetType)?input.targetType:'general',targetAssetId:input.targetAssetId||null,targetZoneId:input.targetZoneId||null,
      mountSurfaceId:type==='invisible'?null:(input.mountSurfaceId||null),position:vec(position.x,position.y,position.z),
      rotation:vec(rotation.x,rotation.y,rotation.z),mountRotation:vec(mountRotation.x,mountRotation.y,mountRotation.z),aimTarget:vec(aim.x,aim.y,aim.z),
      mountAttachment:normalizeMountAttachment(input.mountAttachment),
      temperatureK:TEMPERATURES.includes(Number(input.temperatureK))?Number(input.temperatureK):4000,
      intensity:round(clamp(num(input.intensity,1),.05,5)),beamAngle:round(clamp(num(input.beamAngle,.65),.15,1.35)),
      valid:input.valid!==false,validationWarnings:Array.isArray(input.validationWarnings)?input.validationWarnings.map(String):[]
    };
  }

  function normalizeLightingState(value,options={}){
    const missing=!value||typeof value!=='object'||Array.isArray(value);
    const base=defaultLightingState(),input=missing?{}:value;
    const mode=missing&&options.legacyProject===true?'manual':(input.mode==='manual'?'manual':'auto');
    const state={...base,...input,mode};
    state.enabled=input.enabled!==false;
    state.intent=INTENTS.includes(input.intent)?input.intent:'balanced';
    state.temperatureK=TEMPERATURES.includes(Number(input.temperatureK))?Number(input.temperatureK):4000;
    state.brightness=BRIGHTNESS.includes(input.brightness)?input.brightness:'standard';
    state.fixturePreference=PREFERENCES.includes(input.fixturePreference)?input.fixturePreference:'auto';
    state.suggestions=Array.isArray(input.suggestions)?input.suggestions.map(normalizeFixture):[];
    state.approvedFixtures=Array.isArray(input.approvedFixtures)?input.approvedFixtures.map((item,index)=>normalizeFixture({...item,status:'approved'},index)):[];
    state.lightingRevision=Math.max(0,Math.floor(num(input.lightingRevision,0)));
    state.lastCalculatedSceneRevision=input.lastCalculatedSceneRevision==null?null:Math.max(0,Math.floor(num(input.lastCalculatedSceneRevision,0)));
    state.stale=input.stale===true;state.autoUpdate=input.autoUpdate===true;
    state.validationWarnings=Array.isArray(input.validationWarnings)?input.validationWarnings.map(String):[];
    return state;
  }

  function inferWalls(spec={}){
    if(Array.isArray(spec.activeWalls))return [...new Set(spec.activeWalls)];
    if(Array.isArray(spec.walls))return [...new Set(spec.walls)];
    if(spec.type==='island')return[];
    if(spec.type==='inline')return['back','left','right'];
    if(spec.type==='corner')return spec.cornerSide==='left'?['back','right']:['back','left'];
    if(spec.type==='penin'||spec.type==='peninsular')return['back'];
    return['back'];
  }

  function boothWallThickness(spec={}){
    return['penin','peninsular','backdrop','photo360'].includes(spec.type)?PENINSULAR_WALL_THICKNESS:BOOTH_WALL_THICKNESS;
  }

  /* Storage is a system asset, so it is not present in spec.objects.  Mirror
     the room footprint used by the scene renderer so lighting and geometry
     reason about exactly the same occupied wall spans. */
  function storageRoomGeometry(spec={}){
    const key=String(spec.stSize||'none');
    if(key==='none')return null;
    const W=Math.max(1,num(spec.W||spec.width,6)),D=Math.max(1,num(spec.D||spec.depth,3)),H=Math.max(.5,num(spec.H||spec.height,2.4)),walls=inferWalls(spec),t=boothWallThickness(spec),preset=STORAGE_PRESETS[key];
    const dimensions=key==='custom'?{w:num(spec.stW,1.2),d:num(spec.stD,1.2)}:key==='full'?{w:W,d:num(spec.stD,1.2)}:(preset||{w:1.2,d:1.2});
    const x0=walls.includes('left')?t:0,x1=walls.includes('right')?W-t:W,available=Math.max(.2,x1-x0),y=walls.includes('back')?t:0;
    const w=Math.min(Math.max(.2,num(dimensions.w,1.2)),available),d=Math.min(Math.max(.2,num(dimensions.d,1.2)),Math.max(.2,D-y)),floorY=Math.max(0,num(spec.raise)/100),requestedHeight=num(spec.stHmode)===0?num(spec.stHv,H):num(spec.stHmode,H),h=Math.min(Math.max(.2,requestedHeight),Math.max(.2,H-floorY));
    const x=spec.stPos==='left'?x0:spec.stPos==='center'?x0+(available-w)/2:x1-w;
    return{x:round(x),y:round(y),w:round(w),d:round(d),h:round(h)};
  }

  function mergeIntervals(intervals=[]){
    return intervals.slice().sort((a,b)=>a.min-b.min).reduce((merged,item)=>{
      const last=merged[merged.length-1];
      if(last&&item.min<=last.max){last.max=Math.max(last.max,item.max);last.assetIds=[...new Set(last.assetIds.concat(item.assetIds||[]))];}
      else merged.push({min:item.min,max:item.max,assetIds:[...(item.assetIds||[])]});
      return merged;
    },[]);
  }

  function freeWallSpans(spec={},face='back'){
    const span=face==='back'?Math.max(1,num(spec.W||spec.width,6)):Math.max(1,num(spec.D||spec.depth,3)),blocked=collectWallObstructions(spec,face),free=[];
    let cursor=0;
    blocked.forEach(interval=>{if(interval.min-cursor>.02)free.push({min:round(cursor),max:round(interval.min),width:round(interval.min-cursor)});cursor=Math.max(cursor,interval.max);});
    if(span-cursor>.02)free.push({min:round(cursor),max:round(span),width:round(span-cursor)});
    return free;
  }

  function automaticBrandWallLayout(spec={}){
    if((spec.logoMount&&spec.logoMount!=='wall')||(spec.logoWall&&spec.logoWall!=='back'))return null;
    const free=freeWallSpans(spec,'back');
    if(!free.length||!collectBackWallObstructions(spec).length)return null;
    const best=free.slice().sort((a,b)=>b.width-a.width||a.min-b.min)[0],padding=Math.min(.18,best.width*.08),available=Math.max(.05,best.width-padding*2),requested=Math.max(.4,num(spec.logoWidth,Math.min(2,available)));
    return{face:'back',min:best.min,max:best.max,center:round((best.min+best.max)/2),availableWidth:round(available),targetWidth:round(Math.min(requested,available))};
  }

  function applyAutomaticBrandWallLayout(spec={}){
    const layout=automaticBrandWallLayout(spec);if(!layout)return null;
    spec.logoWallU=layout.center;
    const W=Math.max(1,num(spec.W||spec.width,6)),ratio=layout.center/W;spec.logoPos=ratio<.34?'left':ratio>.66?'right':'center';
    return layout;
  }

  function objectInfo(object,index=0){
    const size=object.size||{},position=object.position||{},catalog=String(object.catalogId||''),name=String(object.label||object.name||object.type||catalog||'Asset '+(index+1));
    return{id:String(object.id||catalog||'asset-'+(index+1)),name,catalogId:catalog,type:String(object.type||''),
      position:vec(position.x,position.y,position.z),size:{w:Math.max(.01,num(size.w,1)),d:Math.max(.01,num(size.d,1)),h:Math.max(.01,num(size.h,1))},
      structure:object.structure&&typeof object.structure==='object'?object.structure:{},rotationY:num(object.rotationY),visible:object.visible!==false};
  }

  function isEntranceFrame(item={}){
    return /entranceframe|entrance-frame|entrance frame|กรอบทางเข้า/.test((item.name+' '+item.type+' '+item.catalogId).toLowerCase());
  }

  function classifyTarget(object){
    const text=(object.name+' '+object.type+' '+object.catalogId).toLowerCase();
    if(/logo|brand|โลโก้|ป้าย/.test(text))return'logo';
    if(/graphic|sticker|กราฟิก|สติ๊กเกอร์/.test(text))return'graphic';
    if(/screen|display|tv|จอ/.test(text))return'screen';
    if(/counter|reception|เคาน์เตอร์/.test(text))return'counter';
    if(/shelf|product|display|โชว์|ชั้น|สินค้า/.test(text))return'product';
    if(/chair|table|meeting|เก้าอี้|โต๊ะ|ประชุม/.test(text))return'meeting';
    return null;
  }

  function collectTargets(spec={}){
    const W=Math.max(1,num(spec.W||spec.width,6)),D=Math.max(1,num(spec.D||spec.depth,3)),H=Math.max(.5,num(spec.H||spec.height,2.4));
    const targets=[];
    if(spec.type!=='island'&&(num(spec.logoScale,25)>0||String(spec.brand||'').trim())){
      const automaticLayout=automaticBrandWallLayout(spec),logoOnBack=(!spec.logoMount||spec.logoMount==='wall')&&(!spec.logoWall||spec.logoWall==='back'),logoX=automaticLayout?.center??(logoOnBack?num(spec.logoWallU,W/2):W/2),logoWidth=automaticLayout?.targetWidth??Math.max(.4,Math.min(W*.9,num(spec.logoWidth,Math.min(2,W*.45))));
      targets.push({id:'system-brand',type:'logo',name:'โลโก้และชื่อแบรนด์',assetId:'system-brand',zoneId:null,
        position:vec(logoX,clamp(num(spec.logoWallY,H*.67),.25,H-.12),.04),width:logoWidth});
    }
    (spec.wallStickerFaces||[]).forEach(face=>{
      const sticker=spec.wallStickers?.[face];if(!sticker?.data)return;
      const p=face==='left'?vec(.03,H/2,D/2):face==='right'?vec(W-.03,H/2,D/2):vec(W/2,H/2,.03);
      targets.push({id:'wall-graphic-'+face,type:'graphic',name:'กราฟิกผนัง '+face,assetId:'system-wall-sticker-'+face,zoneId:null,position:p,width:num(sticker.w,W*.5)});
    });
    (spec.objects||[]).map(objectInfo).filter(item=>item.visible).forEach(item=>{
      if(isEntranceFrame(item)){
        const projection=Math.max(.2,num(item.structure.projection,item.size.d)),pierWidth=Math.max(.2,num(item.structure.pierWidth,item.size.w));
        targets.push({id:'entrance-zone-'+item.id,type:'entrance',name:'พื้นที่ทางเข้ากรอบ',assetId:item.id,zoneId:'entrance-'+item.id,
          position:vec(item.position.x,.05,item.position.z),width:pierWidth,size:{w:pierWidth,d:projection,h:.05}});return;
      }
      const type=classifyTarget(item);if(!type)return;
      targets.push({id:item.id,type,name:item.name,assetId:item.id,zoneId:null,
        position:vec(item.position.x,item.position.y+item.size.h*.55,item.position.z),width:item.size.w,size:item.size});
    });
    targets.push({id:'zone-general',type:'general',name:'พื้นที่ส่องสว่างทั่วไป',assetId:null,zoneId:'general',position:vec(W/2,Math.min(H*.55,1.6),D/2),width:W});
    return targets;
  }

  function isMountStructure(item){
    const text=(item.name+' '+item.type+' '+item.catalogId).toLowerCase();
    return /beam|fascia|entrance|frame|overhead|column|structure|คาน|กรอบ|เสา|โครง/.test(text);
  }

  function collectMountSurfaces(spec={}){
    const W=Math.max(1,num(spec.W||spec.width,6)),D=Math.max(1,num(spec.D||spec.depth,3)),H=Math.max(.5,num(spec.H||spec.height,2.4));
    const surfaces=[];
    inferWalls(spec).forEach(face=>surfaces.push({id:'wall-'+face,type:'wall',face,compatible:['arm','clear'],
      position:face==='left'?vec(0,H/2,D/2):face==='right'?vec(W,H/2,D/2):vec(W/2,H/2,0),size:face==='back'?{w:W,h:H}:{w:D,h:H}}));
    (spec.objects||[]).map(objectInfo).filter(item=>item.visible&&isMountStructure(item)).forEach(item=>{
      if(isEntranceFrame(item)){
        const height=Math.max(.2,num(item.structure.height,item.size.h)),thickness=Math.max(.02,num(item.structure.thickness,.15)),
          projection=Math.max(.2,num(item.structure.projection,item.size.d)),pierWidth=Math.max(.2,num(item.structure.pierWidth,item.size.w)),undersideY=item.position.y+height-thickness;
        surfaces.push({id:'asset-'+item.id,type:'overhead',face:null,assetId:item.id,mountRole:'entrance-canopy',compatible:['downlight','clear'],flushMount:true,undersideY,
          position:vec(item.position.x,undersideY+thickness/2,item.position.z),size:{w:pierWidth,d:projection,h:thickness}});return;
      }
      const overhead=item.position.y+item.size.h>=H*.72||/beam|fascia|overhead|คาน/.test((item.name+' '+item.type).toLowerCase());
      surfaces.push({id:'asset-'+item.id,type:overhead?'overhead':'structure',face:null,assetId:item.id,compatible:overhead?['clear']:['arm','clear'],
        position:vec(item.position.x,item.position.y+item.size.h/2,item.position.z),size:item.size});
    });
    return surfaces;
  }

  function targetScore(target,intent){
    const order=INTENT_PRIORITY[intent]||INTENT_PRIORITY.balanced,index=order.indexOf(target.type);
    return index<0?99:index;
  }

  function preferredFixtureType(preference,mount){
    if(preference==='invisible')return'invisible';
    if(!mount)return'invisible';
    if(preference==='clear'&&mount.compatible.includes('clear'))return'clear';
    if(preference==='arm'&&mount.compatible.includes('arm'))return'arm';
    if(preference==='downlight'&&mount.compatible.includes('downlight'))return'downlight';
    if(preference==='mixed')return mount.mountRole==='entrance-canopy'&&mount.compatible.includes('downlight')?'downlight':mount.type==='wall'&&mount.compatible.includes('arm')?'arm':mount.compatible.includes('clear')?'clear':'invisible';
    if(mount?.mountRole==='entrance-canopy'&&mount.compatible.includes('downlight'))return'downlight';
    if(mount?.type==='overhead')return'clear';
    if(mount?.type==='wall')return'arm';
    return mount.compatible.includes('clear')?'clear':mount.compatible.includes('downlight')?'downlight':mount.compatible.includes('arm')?'arm':'invisible';
  }

  function mountForTarget(target,mounts,preference){
    if(preference==='invisible')return null;
    const scoped=target.type==='entrance'
      ?mounts.filter(mount=>mount.mountRole==='entrance-canopy'&&mount.assetId===target.assetId)
      :mounts.filter(mount=>mount.mountRole!=='entrance-canopy');
    const compatible=scoped.filter(mount=>mount.compatible.length>0);
    if(!compatible.length)return null;
    const tx=target.position.x,tz=target.position.z;
    return compatible.slice().sort((a,b)=>{
      const af=preference!=='auto'&&preference!=='mixed'&&a.compatible.includes(preference)?0:1,bf=preference!=='auto'&&preference!=='mixed'&&b.compatible.includes(preference)?0:1;
      if(af!==bf)return af-bf;
      const ap=a.type==='overhead'?0:a.type==='structure'?1:2,bp=b.type==='overhead'?0:b.type==='structure'?1:2;
      if(ap!==bp)return ap-bp;
      const ad=Math.hypot(a.position.x-tx,a.position.z-tz),bd=Math.hypot(b.position.x-tx,b.position.z-tz);return ad-bd;
    })[0];
  }

  function fixturePosition(target,mount,spec,offset=0){
    const W=num(spec.W||spec.width,6),D=num(spec.D||spec.depth,3),H=num(spec.H||spec.height,2.4),x=clamp(target.position.x+offset,.08,W-.08),z=clamp(target.position.z,.08,D-.08);
    if(!mount)return vec(x,Math.max(.2,H-.12),z);
    if(mount.type==='overhead'||mount.type==='structure')return vec(clamp(x,mount.position.x-mount.size.w/2+.08,mount.position.x+mount.size.w/2-.08),Math.max(.1,Number.isFinite(Number(mount.undersideY))?Number(mount.undersideY)-(mount.flushMount?0:.02):mount.position.y-mount.size.h/2+.02),clamp(z,mount.position.z-mount.size.d/2+.05,mount.position.z+mount.size.d/2-.05));
    /* Wall-mounted fixtures use the wall's top edge as their physical mount
       datum.  The previous 0.12 m inset made every lamp sit visibly below the
       top line even though the fixture template is already anchored at its
       mounting base. */
    const wallTopY=Math.max(.2,H);
    if(mount.face==='left')return vec(.03,wallTopY,clamp(z,.08,D-.08));
    if(mount.face==='right')return vec(W-.03,wallTopY,clamp(z,.08,D-.08));
    return vec(x,wallTopY,.03);
  }

  function rotationToward(position,target){
    const dx=target.x-position.x,dy=target.y-position.y,dz=target.z-position.z,h=Math.hypot(dx,dz)||.0001;
    return vec(Math.atan2(-dy,h),Math.atan2(dx,dz),0);
  }

  function mountRotationForSurface(mount){
    if(mount?.type==='overhead')return vec(Math.PI/2,0,0);
    if(mount?.face==='left')return vec(0,Math.PI/2,0);
    if(mount?.face==='right')return vec(0,-Math.PI/2,0);
    return vec(0,0,0);
  }

  function aimOnMountSurface(mount,spec,point={}){
    const W=num(spec.W||spec.width,6),D=num(spec.D||spec.depth,3),x=clamp(num(point.x,W/2),.04,W-.04),z=clamp(num(point.z,D/2),.04,D-.04),y=Math.max(.04,num(point.y,1));
    if(mount?.face==='left')return vec(.04,y,z);
    if(mount?.face==='right')return vec(W-.04,y,z);
    if(mount?.face==='back')return vec(x,y,.04);
    return vec(x,y,z);
  }

  /* Three.js applies Object3D Euler rotation in XYZ order.  The fixture model
     uses that rotation, while SpotLight.target is expressed in the fixture
     root's local space.  Convert the intended world-space aim delta with the
     inverse (transpose) of the same rotation matrix so the target is not
     rotated a second time by its parent. */
  function fixtureWorldPointLocalOffset(fixture={},worldPoint={}){
    const position=fixture.position||{},rotation=fixture.rotation||{};
    const dx=num(worldPoint.x)-num(position.x),dy=num(worldPoint.y)-num(position.y),dz=num(worldPoint.z)-num(position.z);
    const x=num(rotation.x),y=num(rotation.y),z=num(rotation.z),
      a=Math.cos(x),b=Math.sin(x),c=Math.cos(y),d=Math.sin(y),e=Math.cos(z),f=Math.sin(z);
    const r11=c*e,r12=-c*f,r13=d,
      r21=a*f+b*e*d,r22=a*e-b*f*d,r23=-b*c,
      r31=b*f-a*e*d,r32=b*e+a*f*d,r33=a*c;
    return{x:r11*dx+r21*dy+r31*dz,y:r12*dx+r22*dy+r32*dz,z:r13*dx+r23*dy+r33*dz};
  }

  function fixtureAimLocalOffset(fixture={}){
    return fixtureWorldPointLocalOffset(fixture,fixture.aimTarget||{});
  }

  /* Fixture position is the physical mount point.  Emit light from the lamp
     head in front of that mount so a wall fixture illuminates the wall instead
     of starting inside it and travelling almost parallel to its surface. */
  function fixtureLightWorldPosition(fixture={}){
    const position=fixture.position||{},source={x:num(position.x),y:num(position.y),z:num(position.z)};
    if(fixture.fixtureType==='invisible')return source;
    if(fixture.fixtureType==='downlight'){source.y-=.015;return source;}
    const mount=String(fixture.mountSurfaceId||''),headOffset=fixture.fixtureType==='arm'?.33:.16;
    source.y-=fixture.fixtureType==='arm'?.07:.12;
    if(mount==='wall-back')source.z+=headOffset;
    else if(mount==='wall-left')source.x+=headOffset;
    else if(mount==='wall-right')source.x-=headOffset;
    else source.y-=headOffset*.35;
    return source;
  }

  function fixtureLightLocalOffset(fixture={}){
    return fixtureWorldPointLocalOffset(fixture,fixtureLightWorldPosition(fixture));
  }

  function fixtureRenderIntensity(fixture={}){
    return clamp(num(fixture.intensity,1)*AUTO_RENDER_BASE_INTENSITY,2.6,80);
  }

  function applyPhotometricSettings(lighting={}){
    const intensity=INTENSITY[lighting.brightness]||1,temperatureK=TEMPERATURES.includes(Number(lighting.temperatureK))?Number(lighting.temperatureK):4000;
    [lighting.suggestions,lighting.approvedFixtures].forEach(list=>(list||[]).forEach(fixture=>{
      fixture.temperatureK=temperatureK;fixture.intensity=round(intensity*(fixture.targetType==='general'?.8:1));
    }));
    return lighting;
  }

  function validateFixture(fixture,spec,existing=[]){
    const warnings=[],W=num(spec.W||spec.width,6),D=num(spec.D||spec.depth,3),H=num(spec.H||spec.height,2.4),p=fixture.position;
    if(p.x<-.05||p.x>W+.05||p.z<-.05||p.z>D+.05||p.y<0||p.y>H+num(spec.maxOverheadAllowance,5))warnings.push('ตำแหน่งอยู่นอกขอบเขตที่รองรับ');
    if(fixture.fixtureType!=='invisible'&&!fixture.mountSurfaceId)warnings.push('ไม่พบพื้นผิวติดตั้งจริง');
    if(fixture.fixtureType!=='invisible'&&existing.some(item=>item.fixtureType!=='invisible'&&Math.hypot(item.position.x-p.x,item.position.y-p.y,item.position.z-p.z)<.18))warnings.push('ระยะห่างจากโคมอื่นน้อยเกินไป');
    fixture.validationWarnings=warnings;fixture.valid=warnings.length===0;return fixture;
  }

  function fallbackToPreview(fixture,spec,existing=[]){
    if(fixture.valid!==false||fixture.fixtureType==='invisible')return fixture;
    const preview=normalizeFixture({...fixture,name:'Invisible Preview Light',status:'preview',fixtureType:'invisible',mountSurfaceId:null,validationWarnings:[]});
    return validateFixture(preview,spec,existing);
  }

  function collectWallObstructions(spec={},face='back'){
    const W=Math.max(1,num(spec.W||spec.width,6)),D=Math.max(1,num(spec.D||spec.depth,3)),H=Math.max(.5,num(spec.H||spec.height,2.4)),clearance=.12,span=face==='back'?W:D;
    const objectIntervals=(spec.objects||[]).map(objectInfo).filter(item=>item.visible).flatMap(item=>{
      const radians=num(item.rotationY)*Math.PI/180,cos=Math.abs(Math.cos(radians)),sin=Math.abs(Math.sin(radians)),
        halfX=(cos*item.size.w+sin*item.size.d)/2,halfZ=(sin*item.size.w+cos*item.size.d)/2,
        /* Arm Light projects about .33 m in front of the wall.  A tall object
           entering that envelope blocks the fixture even when its mesh does
           not literally touch z=0. */
        entranceSide=isEntranceFrame(item)?(item.position.x<W/2?'left':'right'):null,
        touchesWall=face!=='back'&&face===entranceSide?true:face==='left'?item.position.x-halfX<=.36:face==='right'?W-(item.position.x+halfX)<=.36:item.position.z-halfZ<=.36,
        reachesMountBand=item.position.y+item.size.h>=H-.22;
      if(!touchesWall||!reachesMountBand)return[];
      const center=face==='back'?item.position.x:item.position.z,half=face==='back'?halfX:halfZ,
        min=clamp(center-half-clearance,0,span),max=clamp(center+half+clearance,0,span);
      return max-min>.02?[{assetId:item.id,min:round(min),max:round(max)}]:[];
    }).map(item=>({min:item.min,max:item.max,assetIds:[item.assetId]}));
    const room=storageRoomGeometry(spec),walls=inferWalls(spec),t=boothWallThickness(spec),epsilon=.012,roomIntervals=[];
    if(room){
      const touches=face==='back'?walls.includes('back')&&room.y<=t+epsilon:face==='left'?walls.includes('left')&&room.x<=t+epsilon:walls.includes('right')&&room.x+room.w>=W-t-epsilon;
      if(touches){const start=face==='back'?room.x:room.y,length=face==='back'?room.w:room.d,min=clamp(start-clearance,0,span),max=clamp(start+length+clearance,0,span);if(max-min>.02)roomIntervals.push({min:round(min),max:round(max),assetIds:['storage-room']});}
    }
    return mergeIntervals(objectIntervals.concat(roomIntervals));
  }

  function collectBackWallObstructions(spec={}){return collectWallObstructions(spec,'back');}

  function applyBackWallObstructions(fixtures,spec={}){
    const W=Math.max(1,num(spec.W||spec.width,6)),blocked=collectBackWallObstructions(spec),wall=fixtures.filter(item=>item.mountSurfaceId==='wall-back');
    let output=fixtures;
    const removedFixtureIds=[];
    if(blocked.length&&wall.length){
    const usableWidth=Math.max(0,W-blocked.reduce((sum,item)=>sum+(item.max-item.min),0)),desiredWallCount=usableWidth>.35?Math.max(1,Math.round(usableWidth/1.55)):0,
      obstructed=new Set(wall.filter(item=>blocked.some(interval=>item.position.x>=interval.min&&item.position.x<=interval.max)).map(item=>item.id)),
      available=wall.filter(item=>!obstructed.has(item.id)),priority={logo:0,graphic:0,product:1,counter:1,screen:1,meeting:2,general:3},
      keep=new Set(available.slice().sort((a,b)=>(priority[a.targetType]??2)-(priority[b.targetType]??2)).slice(0,desiredWallCount).map(item=>item.id)),
      removedBack=wall.filter(item=>!keep.has(item.id)).map(item=>item.id);
    removedFixtureIds.push(...removedBack);output=output.filter(item=>!removedBack.includes(item.id));
    }
    const sideLayouts={};
    ['left','right'].forEach(face=>{
      const sideBlocked=collectWallObstructions(spec,face),sideFixtures=output.filter(item=>item.mountSurfaceId==='wall-'+face),
        removed=sideFixtures.filter(item=>sideBlocked.some(interval=>item.position.z>=interval.min&&item.position.z<=interval.max)).map(item=>item.id);
      if(removed.length){removedFixtureIds.push(...removed);output=output.filter(item=>!removed.includes(item.id));}
      sideLayouts[face]={blocked:sideBlocked,removedFixtureIds:removed};
    });
    return{fixtures:output,blocked,desiredWallCount:output.filter(item=>item.mountSurfaceId==='wall-back').length,removedFixtureIds,sideLayouts};
  }

  function generateLightingPlan({spec={},sceneRevision=0,lighting=null}={}){
    const state=normalizeLightingState(lighting||spec.lighting||defaultLightingState()),targets=collectTargets(spec).sort((a,b)=>targetScore(a,state.intent)-targetScore(b,state.intent));
    const mounts=collectMountSurfaces(spec),sideWallMounts=mounts.filter(mount=>mount.type==='wall'&&(mount.face==='left'||mount.face==='right')),nextRevision=state.lightingRevision+1,fixtures=[];
    const important=targets.filter(target=>target.type!=='general').slice(0,state.intent==='balanced'?5:6);
    const selected=important.length?important:targets.slice(-1);
    selected.forEach(target=>{
      const pairedBrand=target.type==='logo'&&num(spec.W||spec.width,6)>=4.5&&target.width>=Math.max(1.2,num(spec.W||spec.width,6)*.2),
        entrancePair=target.type==='entrance'&&num(target.size?.d,0)>=1.8,count=entrancePair||pairedBrand?2:1;
      for(let copyIndex=0;copyIndex<count;copyIndex++){
        const mount=mountForTarget(target,mounts,state.fixturePreference),type=preferredFixtureType(state.fixturePreference,mount),
          offset=pairedBrand?(copyIndex===0?-target.width*.32:target.width*.32):0,zOffset=entrancePair?(copyIndex===0?-target.size.d*.22:target.size.d*.22):0,
          entranceV=entrancePair?(copyIndex===0?.28:.72):.5,
          placementTarget=zOffset?{...target,position:vec(target.position.x,target.position.y,target.position.z+zOffset)}:target,
          position=fixturePosition(placementTarget,mount,spec,offset),aim=target.type==='entrance'?vec(position.x,.05,position.z):aimOnMountSurface(mount,spec,vec(position.x,target.position.y,position.z)),fixture=normalizeFixture({
          id:fixtureId(nextRevision,fixtures.length,target),name:fixtureName(type),
          status:type==='invisible'?'preview':'suggested',source:'auto',fixtureType:type,targetType:target.type,targetAssetId:target.assetId,targetZoneId:target.zoneId,
          mountSurfaceId:mount?.id||null,position,rotation:rotationToward(position,aim),mountRotation:mountRotationForSurface(mount),aimTarget:aim,temperatureK:state.temperatureK,
          mountAttachment:target.type==='entrance'&&mount?.mountRole==='entrance-canopy'?{parentAssetId:target.assetId,mountRole:'entrance-canopy',surfaceUV:{u:.5,v:entranceV},normalOffset:0,aimMode:'world-down'}:null,
          intensity:INTENSITY[state.brightness]||1,beamAngle:AUTO_BEAM_ANGLE
        },fixtures.length);
        validateFixture(fixture,spec,fixtures);fixtures.push(fallbackToPreview(fixture,spec,fixtures));
      }
    });
    /* Balanced means balanced across the booth, not merely symmetric around
       the logo.  When the first pair is dedicated to branding on a wide wall,
       add an outer pair that aims into the left/right usable zones. */
    const generalTarget=targets.find(target=>target.type==='general'),W=num(spec.W||spec.width,6),D=num(spec.D||spec.depth,3),H=num(spec.H||spec.height,2.4);
    const brandFixtures=fixtures.filter(item=>item.targetType==='logo'||item.targetType==='graphic');
    if(state.intent==='balanced'&&W>=4.5&&generalTarget&&brandFixtures.length===2&&!fixtures.some(item=>item.targetType==='general')){
      const mount=mountForTarget(generalTarget,mounts,state.fixturePreference),type=preferredFixtureType(state.fixturePreference,mount);
      [-1,1].forEach((side,index)=>{
        const position=fixturePosition(generalTarget,mount,spec,side*W*.35),aim=aimOnMountSurface(mount,spec,vec(position.x,Math.min(1.25,H*.52),position.z)),fixture=normalizeFixture({
          id:fixtureId(nextRevision,fixtures.length,generalTarget),name:fixtureName(type),
          status:type==='invisible'?'preview':'suggested',source:'auto',fixtureType:type,targetType:'general',targetZoneId:'general-'+(index?'right':'left'),
          mountSurfaceId:mount?.id||null,position,rotation:rotationToward(position,aim),mountRotation:mountRotationForSurface(mount),aimTarget:aim,
          temperatureK:state.temperatureK,intensity:(INTENSITY[state.brightness]||1)*.8,beamAngle:AUTO_BEAM_ANGLE
        },fixtures.length);
        validateFixture(fixture,spec,fixtures);fixtures.push(fallbackToPreview(fixture,spec,fixtures));
      });
    }
    if(state.fixturePreference==='side-wall'){
      sideWallMounts.forEach(mount=>{
        if(fixtures.some(item=>item.mountSurfaceId===mount.id))return;
        const sideTarget={id:'zone-side-'+mount.face,type:'general',position:vec(W/2,Math.min(1.25,H*.52),D*.55)},position=fixturePosition(sideTarget,mount,spec),aim=aimOnMountSurface(mount,spec,vec(position.x,Math.min(1.25,H*.52),position.z)),fixture=normalizeFixture({
          id:fixtureId(nextRevision,fixtures.length,sideTarget),name:'Arm Light',status:'suggested',source:'auto',fixtureType:'arm',targetType:'general',targetZoneId:'side-wall-'+mount.face,
          mountSurfaceId:mount.id,position,rotation:rotationToward(position,aim),mountRotation:mountRotationForSurface(mount),aimTarget:aim,
          temperatureK:state.temperatureK,intensity:(INTENSITY[state.brightness]||1)*.8,beamAngle:AUTO_BEAM_ANGLE
        },fixtures.length);
        validateFixture(fixture,spec,fixtures);fixtures.push(fallbackToPreview(fixture,spec,fixtures));
      });
    }
    if(fixtures.length<2&&targets.some(target=>target.type==='general')){
      const target=targets.find(item=>item.type==='general'),mount=mountForTarget(target,mounts,state.fixturePreference),type=preferredFixtureType(state.fixturePreference,mount);
      let fixture=null;for(const offset of [0,num(spec.W||spec.width,6)*.2,-num(spec.W||spec.width,6)*.2]){
        const position=fixturePosition(target,mount,spec,offset);fixture=normalizeFixture({id:fixtureId(nextRevision,fixtures.length,target),name:fixtureName(type),status:type==='invisible'?'preview':'suggested',source:'auto',fixtureType:type,targetType:'general',targetZoneId:'general',mountSurfaceId:mount?.id||null,position,rotation:rotationToward(position,target.position),mountRotation:mountRotationForSurface(mount),aimTarget:target.position,temperatureK:state.temperatureK,intensity:(INTENSITY[state.brightness]||1)*.8,beamAngle:AUTO_BEAM_ANGLE},fixtures.length);
        validateFixture(fixture,spec,fixtures);if(fixture.valid||type==='invisible')break;
      }
      fixtures.push(fallbackToPreview(fixture,spec,fixtures));
    }
    const wallLayout=applyBackWallObstructions(fixtures,spec),finalFixtures=wallLayout.fixtures;
    return{...state,suggestions:finalFixtures,lightingRevision:nextRevision,lastCalculatedSceneRevision:sceneRevision,stale:false,
      validationWarnings:finalFixtures.flatMap(item=>item.validationWarnings.map(warning=>item.name+': '+warning)),diagnostics:{targetCount:targets.length,mountSurfaceCount:mounts.length,targets,mounts,wallLayout}};
  }

  function recalculateLightingPlan(args={}){
    const current=normalizeLightingState(args.lighting||args.spec?.lighting),approved=current.approvedFixtures;
    const next=generateLightingPlan({...args,lighting:{...current,suggestions:[]}}),approvedLayout=applyBackWallObstructions(approved,args.spec||{}),keptApproved=approvedLayout.fixtures;
    next.approvedFixtures=keptApproved;
    next.suggestions=next.suggestions.filter(candidate=>!keptApproved.some(existing=>existing.mountSurfaceId===candidate.mountSurfaceId&&Math.hypot(existing.position.x-candidate.position.x,existing.position.y-candidate.position.y,existing.position.z-candidate.position.z)<.18));
    next.validationWarnings=next.suggestions.flatMap(item=>item.validationWarnings.map(warning=>item.name+': '+warning));
    next.diagnostics={...next.diagnostics,approvedWallLayout:approvedLayout};return next;
  }

  function approveSuggestions(lighting){
    const state=normalizeLightingState(lighting),approvedIds=new Set(state.approvedFixtures.map(item=>item.id));
    const additions=state.suggestions.filter(item=>item.valid!==false&&item.fixtureType!=='invisible').map((item,index)=>normalizeFixture({...item,status:'approved'},index)).filter(item=>!approvedIds.has(item.id));
    return{...state,suggestions:state.suggestions.filter(item=>item.valid===false||item.fixtureType==='invisible'),approvedFixtures:state.approvedFixtures.concat(additions),stale:false,approvedNow:additions};
  }

  function markStale(lighting,sceneRevision){
    const state=normalizeLightingState(lighting);if(state.mode!=='auto'||state.lastCalculatedSceneRevision==null||state.lastCalculatedSceneRevision===sceneRevision)return state;
    return{...state,stale:true,suggestions:state.suggestions.map(item=>({...item,status:item.fixtureType==='invisible'?'preview':'suggested'})),approvedFixtures:state.approvedFixtures.map(item=>({...item,validationWarnings:[...new Set([...(item.validationWarnings||[]),'โครงสร้างหรือองค์ประกอบบูธมีการเปลี่ยนแปลง กรุณาตรวจสอบตำแหน่งโคมที่ยืนยันแล้ว'])]}))};
  }

  function promptLines(lighting,{includePreview=true}={}){
    const state=normalizeLightingState(lighting),approved=state.approvedFixtures,suggested=state.suggestions.filter(item=>item.fixtureType!=='invisible'),preview=state.suggestions.filter(item=>item.fixtureType==='invisible');
    const summary=list=>list.map(item=>item.name+' → '+item.targetType+' @ '+item.position.x.toFixed(2)+','+item.position.y.toFixed(2)+','+item.position.z.toFixed(2)+' ม. · Mount '+(item.mountSurfaceId||'none')+' · Aim '+item.aimTarget.x.toFixed(2)+','+item.aimTarget.y.toFixed(2)+','+item.aimTarget.z.toFixed(2)+' · '+item.temperatureK+'K · Intensity '+item.intensity).join(' | ')||'ไม่มี';
    const lines=['LIGHTING INTENT','โหมดไฟ: '+(state.mode==='auto'?'Auto Lighting':'Manual Lighting')+' · Intent '+state.intent+' · '+state.temperatureK+'K · ความสว่าง '+state.brightness+' · โคม '+state.fixturePreference,
      'ไฟที่อนุมัติแล้ว (LOCKED): '+summary(approved)];
    if(suggested.length)lines.push('ไฟแนะนำ (AI Suggested / Render Staging): '+summary(suggested));
    if(includePreview&&preview.length)lines.push('Preview Light Intent (ไม่มี Mesh/Asset/BOQ): '+[...new Set(preview.map(item=>item.targetType))].join(', ')+' · ใช้แสงเสมือนเพื่อ Preview เท่านั้น');
    else if(includePreview&&!approved.length&&!suggested.length&&state.mode==='auto')lines.push('Preview intent: ให้จัดแสงตาม Intent โดยไม่สร้างโครงสร้างติดตั้งใหม่');
    lines.push('ห้ามย้ายไฟที่อนุมัติแล้ว ห้ามสร้างจุดยึด เสา คาน หรือผนังใหม่เพื่อรองรับไฟ');return lines;
  }

  global.YPAutoLighting={
    INTENTS,TEMPERATURES,BRIGHTNESS,PREFERENCES,FIXTURE_TYPES,TARGET_TYPES,defaultLightingState,normalizeLightingState,normalizeFixture,
    inferWalls,storageRoomGeometry,freeWallSpans,automaticBrandWallLayout,applyAutomaticBrandWallLayout,collectTargets,collectMountSurfaces,isEntranceFrame,collectWallObstructions,collectBackWallObstructions,applyBackWallObstructions,mountRotationForSurface,aimOnMountSurface,fixtureWorldPointLocalOffset,fixtureAimLocalOffset,fixtureLightWorldPosition,fixtureLightLocalOffset,fixtureRenderIntensity,applyPhotometricSettings,
    generateLightingPlan,recalculateLightingPlan,approveSuggestions,markStale,promptLines
  };
})(typeof globalThis!=='undefined'?globalThis:window);
