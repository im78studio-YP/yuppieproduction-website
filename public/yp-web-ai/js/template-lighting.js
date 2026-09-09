(function(root){
  'use strict';
  // Versioned, reviewed anchor regions: never infer that decorative panels can carry lamps.
  // Indexes refer to stable template object IDs, including projects saved before this feature.
  const profiles={
    'corner-timber-lounge':{mounts:[[1,'panel-standard',[[.25,.5],[.75,.5]]]],screens:[24,25],products:[]},
    'penin-blue-pavilion':{mounts:[[0,'panel-standard',[[.1,.5],[.37,.5],[.57,.5],[.88,.5]]],[1,'panel-standard',[[.5,.35],[.5,.65]]],[2,'panel-standard',[[.5,.35],[.5,.65]]]],screens:[15,16],products:[]},
    'penin-orchard':{mounts:[[1,'canopy-organic',[[.18,.45],[.32,.65],[.5,.5],[.68,.65],[.82,.45]]]],screens:[],products:[4]}
  };
  const api=()=>root.YPAutoLighting,clone=x=>JSON.parse(JSON.stringify(x)),n=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
  const profile=s=>profiles[s.boothTemplate?.id]||null;
  const scale=o=>n(typeof o.transform?.scale==='number'?o.transform.scale:o.transform?.scale?.x??o.transform?.uniformScale,1);
  const supported=o=>o&&o.visible!==false&&Math.abs(n(o.rotationX)%360)<.001&&Math.abs(n(o.rotationZ)%360)<.001&&(!o.orientation||o.orientation==='horizontal')&&!o.transform?.flipY;
  function object(s,index){return s.objects?.find(o=>o.id===s.boothTemplate.id+'-'+index);}
  function world(o,u,v,y){const a=n(o.rotationY)*Math.PI/180,k=scale(o),x=(u-.5)*o.size.w*k*(o.transform?.flipX?-1:1),z=(v-.5)*o.size.d*k;return{x:o.position.x+x*Math.cos(a)+z*Math.sin(a),y:o.position.y+y*k,z:o.position.z-x*Math.sin(a)+z*Math.cos(a)};}
  function inverse(o,p){const a=n(o.rotationY)*Math.PI/180,k=scale(o),x=p.x-o.position.x,z=p.z-o.position.z;return{x:(x*Math.cos(a)-z*Math.sin(a))/k,y:(p.y-o.position.y)/k,z:(x*Math.sin(a)+z*Math.cos(a))/k};}
  const thickness=s=>['penin','peninsular','backdrop','photo360'].includes(s.type)?.3:.1;
  function targets(s){
    const p=profile(s),out=[],t=thickness(s),face=s.logoWall||'back';
    if(s.logoScale>0&&s.sceneItemState?.['branding.logo.main']?.visible!==false){const u=n(s.logoWallU,s.W/2),y=n(s.logoWallY,s.H*.75);out.push({id:'system-brand',type:'logo',position:face==='left'?{x:t+.02,y,z:u}:face==='right'?{x:s.W-t-.02,y,z:u}:{x:u,y,z:t+.02}});}
    for(const o of s.objects||[]){if(!supported(o))continue;
      if(p.screens.some(i=>o===object(s,i)))continue;
      const type=p.products.some(i=>o===object(s,i))||o.catalogId==='shelf-standard'?'product':/counter/.test(o.catalogId)?'counter':o.catalogId==='table-standard'?'meeting':o.type==='brandCopy'?'logo':null;
      if(type)out.push({id:o.id,type,position:world(o,.5,type==='product'||type==='logo'?1.06:.5,type==='meeting'||type==='counter'?o.size.h+.025:o.size.h*.55)});
    }
    return out;
  }
  function mounts(s){
    const p=profile(s),out=[],t=thickness(s);if(!p)return out;
    for(const face of api().inferWalls(s)){const span=face==='back'?s.W:s.D,blocked=api().collectWallObstructions(s,face);
      const count=Math.max(2,Math.ceil(span/1.15));for(let i=0;i<count;i++){const u=(i+.5)/count,at=u*span;if(blocked.some(b=>at>=b.min&&at<=b.max))continue;
        out.push({id:'wall-'+face,parent:'wall-'+face,role:'template-wall',u,v:1,type:'arm',position:face==='left'?{x:t/2,y:s.H,z:at}:face==='right'?{x:s.W-t/2,y:s.H,z:at}:{x:at,y:s.H,z:t/2},face});
      }
    }
    for(const [index,catalog,anchors] of p.mounts){const o=object(s,index);if(!supported(o)||o.catalogId!==catalog)continue;
      for(const [u,v] of anchors){if(o.size.w*scale(o)<.18||o.size.d*scale(o)<.12)continue;const pos=world(o,u,v,0);pos.y-=.025;out.push({id:'asset-'+o.id,parent:o.id,role:'template-under',u,v,type:'downlight',position:pos});}
    }
    return out;
  }
  // Conservative oriented-box visibility test. Curved objects may reject a usable path,
  // but cannot be assumed transparent. This is a preview check, not engineering approval.
  function blockedSegment(s,start,end,excluded=[]){
    const room=api().storageRoomGeometry(s),obstacles=(s.objects||[]).slice();if(room)obstacles.push({id:'storage-room',position:{x:room.x+room.w/2,y:0,z:room.y+room.d/2},size:{w:room.w,d:room.d,h:room.h}});
    for(const o of obstacles){if(o.visible===false||excluded.includes(o.id))continue;
      if(!supported(o)){const center={x:o.position.x,y:o.position.y+o.size.h*scale(o)/2,z:o.position.z},d={x:end.x-start.x,y:end.y-start.y,z:end.z-start.z},length=d.x*d.x+d.y*d.y+d.z*d.z,u=Math.max(0,Math.min(1,((center.x-start.x)*d.x+(center.y-start.y)*d.y+(center.z-start.z)*d.z)/(length||1))),radius=Math.hypot(o.size.w,o.size.h,o.size.d)*scale(o);if(Math.hypot(start.x+u*d.x-center.x,start.y+u*d.y-center.y,start.z+u*d.z-center.z)<=radius)return true;continue;}
      const a=inverse(o,start),b=inverse(o,end),min={x:-o.size.w/2,y:0,z:-o.size.d/2},max={x:o.size.w/2,y:o.size.h,z:o.size.d/2};let lo=.025,hi=.975;
      for(const axis of ['x','y','z']){const d=b[axis]-a[axis];if(Math.abs(d)<1e-8){if(a[axis]<min[axis]||a[axis]>max[axis]){lo=1;hi=0;break;}}else{let l=(min[axis]-a[axis])/d,h=(max[axis]-a[axis])/d;if(l>h)[l,h]=[h,l];lo=Math.max(lo,l);hi=Math.min(hi,h);}}
      if(lo<=hi)return true;
    }return false;
  }
  function warnings(s,f,existing=[]){
    const list=[],a=f.mountAttachment,p=f.position,t=thickness(s);
    if(p.x<0||p.x>s.W||p.z<0||p.z>s.D||p.y<.1||p.y>s.H+.02)list.push('ตำแหน่งโคมนอกขอบเขตบูธ');
    if(a?.mountRole==='template-under'){
      const parent=s.objects?.find(o=>o.id===a.parentAssetId);if(!supported(parent))list.push('จุดยึดถูกลบ ซ่อน หรือเอียงเกินขอบเขตที่รองรับ');
    }else if(f.mountSurfaceId?.startsWith('wall-')){const face=f.mountSurfaceId.slice(5),at=face==='back'?p.x:p.z;
      if(!api().inferWalls(s).includes(face))list.push('ผนังรองรับโคมไม่มีอยู่แล้ว');
      if(api().collectWallObstructions(s,face).some(b=>at>=b.min&&at<=b.max))list.push('มีชิ้นงานบังจุดติดโคม');
    }else if(!a&&f.fixtureType!=='invisible'&&!s.objects?.some(o=>'asset-'+o.id===f.mountSurfaceId))list.push('ไม่พบชิ้นงานรองรับโคม');
    if(existing.some(o=>o.id!==f.id&&o.fixtureType!=='invisible'&&Math.hypot(o.position.x-p.x,o.position.y-p.y,o.position.z-p.z)<.22))list.push('โคมอยู่ชิดกันเกินไป');
    const light=api().fixtureLightWorldPosition(f),aim=f.aimTarget;
    if(a?.mountRole==='template-under'&&aim.y>=light.y-.08)list.push('เป้าหมายสูงเกินมุมส่องใต้คาน');
    if(light.x<t&&api().inferWalls(s).includes('left')||light.x>s.W-t&&api().inferWalls(s).includes('right')||light.z<t&&api().inferWalls(s).includes('back'))list.push('หัวโคมอยู่ในเนื้อผนัง');
    if(blockedSegment(s,light,aim,[a?.parentAssetId,f.targetAssetId]))list.push('ทางแสงอาจถูกชิ้นงานบัง ต้องตรวจมุมส่อง');
    return [...new Set(list)];
  }
  function resolve(s,fixture){
    if(!profile(s)||fixture.fixtureType==='invisible')return fixture;const f=clone(fixture),a=f.mountAttachment;
    if(a?.mountRole==='template-under'){
      const o=s.objects?.find(o=>o.id===a.parentAssetId);if(supported(o)){f.position=world(o,a.surfaceUV.u,a.surfaceUV.v,0);f.position.y-=.025;f.mountRotation={x:Math.PI/2,y:n(o.rotationY)*Math.PI/180,z:0};}
    }else if(a?.mountRole==='template-wall'){
      const face=a.parentAssetId.slice(5),t=thickness(s),u=a.surfaceUV.u;f.position=face==='left'?{x:t/2,y:s.H,z:u*s.D}:face==='right'?{x:s.W-t/2,y:s.H,z:u*s.D}:{x:u*s.W,y:s.H,z:t/2};f.mountRotation=api().mountRotationForSurface({face});
    }
    if(a){const target=targets(s).find(t=>t.id===f.targetAssetId);if(target)f.aimTarget=target.position;}
    const issues=warnings(s,f);if(f.targetAssetId&&!targets(s).some(t=>t.id===f.targetAssetId))issues.push('เป้าหมายถูกลบหรือซ่อน กรุณาเลือกเป้าหมายใหม่');
    f.validationWarnings=issues;f.valid=!issues.length;return f;
  }
  function generate({spec:s,lighting,sceneRevision=0}){
    const A=api(),state=A.normalizeLightingState(lighting||s.lighting),approved=state.approvedFixtures.map(f=>resolve(s,f)),manual=state.suggestions.filter(f=>f.source==='manual').map(f=>resolve(s,f)),fixtures=[],pending=[],allTargets=targets(s),surfaces=mounts(s),revision=state.lightingRevision+1;
    const priorities={brand:['logo','product','counter','meeting'],product:['product','logo','counter','meeting'],counter:['counter','logo','product','meeting'],balanced:['logo','product','counter','meeting']}[state.intent];
    allTargets.sort((a,b)=>priorities.indexOf(a.type)-priorities.indexOf(b.type));
    for(const target of allTargets){if(approved.concat(manual).some(f=>f.targetAssetId===target.id))continue;
      const candidates=surfaces.filter(m=>state.fixturePreference==='invisible'?false:state.fixturePreference==='downlight'?m.type==='downlight':state.fixturePreference==='arm'?m.type==='arm':state.fixturePreference==='side-wall'?m.face==='left'||m.face==='right':true).map(m=>{
        const type=state.fixturePreference==='clear'?'clear':m.type;
        const f=A.normalizeFixture({id:'template-light-'+revision+'-'+target.id,fixtureType:type,name:type==='downlight'?'Downlight':type==='clear'?'Clear Light':'Arm Light',source:'auto',status:'suggested',targetType:target.type,targetAssetId:target.id,mountSurfaceId:m.id,position:m.position,aimTarget:target.position,mountRotation:m.type==='downlight'?{x:Math.PI/2,y:0,z:0}:A.mountRotationForSurface(m),mountAttachment:{parentAssetId:m.parent,mountRole:m.role,surfaceUV:{u:m.u,v:m.v},aimMode:'surface-normal'},temperatureK:state.temperatureK,intensity:{soft:.72,standard:1,bright:1.32}[state.brightness],beamAngle:.68});
        f.validationWarnings=warnings(s,f,approved.concat(manual,fixtures));f.valid=!f.validationWarnings.length;
        const distance=Math.hypot(f.position.x-target.position.x,f.position.z-target.position.z),preference=(target.type==='meeting'||target.type==='counter')&&m.type==='downlight'?-.7:0;
        return {f,score:distance+preference};
      }).filter(c=>c.f.valid).sort((a,b)=>a.score-b.score);
      if(candidates.length)fixtures.push(candidates[0].f);
      else {const label={logo:'โลโก้',counter:'เคาน์เตอร์',meeting:'มุมนั่งคุย',product:'ชั้นสินค้า'}[target.type]||target.type,message='ยังไม่มีจุดติดตั้งที่ผ่านการตรวจสำหรับ'+label+' — ใช้แสง Preview เท่านั้น';pending.push(message);fixtures.push(A.normalizeFixture({id:'template-preview-'+revision+'-'+target.id,name:'Preview เท่านั้น — '+label,fixtureType:'invisible',status:'preview',targetType:target.type,targetAssetId:target.id,position:{x:target.position.x,y:s.H-.12,z:target.position.z},aimTarget:target.position,temperatureK:state.temperatureK,validationWarnings:[message]}));}
    }
    const result={...state,suggestions:manual.concat(fixtures),approvedFixtures:approved,lightingRevision:revision,lastCalculatedSceneRevision:sceneRevision,stale:false,validationWarnings:pending.concat(approved.concat(manual).flatMap(f=>f.validationWarnings)),diagnostics:{profile:s.boothTemplate.id,profileVersion:1,targetCount:allTargets.length,mountSurfaceCount:surfaces.length,targets:allTargets,mounts:surfaces}};
    return result;
  }
  function mirror(s){
    if(!s.lighting)return;const swap=face=>face==='wall-left'?'wall-right':face==='wall-right'?'wall-left':face;
    for(const list of [s.lighting.suggestions,s.lighting.approvedFixtures])for(const f of list||[]){f.position.x=s.W-f.position.x;f.aimTarget.x=s.W-f.aimTarget.x;for(const key of ['rotation','mountRotation'])if(f[key]){f[key].y=-n(f[key].y);f[key].z=-n(f[key].z);}f.mountSurfaceId=swap(f.mountSurfaceId);
      const a=f.mountAttachment;if(a?.mountRole==='template-under')a.surfaceUV.u=1-a.surfaceUV.u;
      else if(a?.mountRole==='template-wall'){a.parentAssetId=swap(a.parentAssetId);if(a.parentAssetId==='wall-back')a.surfaceUV.u=1-a.surfaceUV.u;}
    }s.lighting.stale=true;s.lighting.lastCalculatedSceneSignature=null;
  }
  root.YPTemplateLighting={profile,targets,mounts,generate,resolve,mirror,blockedSegment};
})(globalThis);
