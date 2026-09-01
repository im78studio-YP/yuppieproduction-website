(function(global){
  'use strict';

  const SMART_SNAP_VERSION=1;
  const GRID_STEP=.05;
  const SURFACE_DETECTION_DISTANCE=.14;
  const SCREEN_THRESHOLD=14;
  const SNAP_RELEASE_DISTANCE=.22;
  const SNAP_RELEASE_SCREEN_THRESHOLD=22;
  const ANCHOR_TYPES=Object.freeze(['bottom','back','front','left','right','top','center','mount','corner']);
  const SURFACE_TYPES=Object.freeze(['floor-top','wall-inside','wall-outside','vertical-face','horizontal-top','horizontal-bottom','edge','center-line']);
  const ROTATION_POLICIES=Object.freeze(['preserve','align-normal','align-horizontal','align-vertical']);
  const SNAP_PRIORITIES=Object.freeze({'anchor-surface':1,'face-face':2,'edge-edge':3,'center-center':4,grid:5});

  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const vector=(value={},fallback=0)=>({x:finite(value.x,fallback),y:finite(value.y,fallback),z:finite(value.z,fallback)});
  const length=value=>Math.hypot(finite(value?.x),finite(value?.y),finite(value?.z));
  const normalize=value=>{const v=vector(value),l=length(v)||1;return{x:v.x/l,y:v.y/l,z:v.z/l};};
  const dot=(a,b)=>finite(a?.x)*finite(b?.x)+finite(a?.y)*finite(b?.y)+finite(a?.z)*finite(b?.z);
  const add=(a,b)=>({x:finite(a?.x)+finite(b?.x),y:finite(a?.y)+finite(b?.y),z:finite(a?.z)+finite(b?.z)});
  const subtract=(a,b)=>({x:finite(a?.x)-finite(b?.x),y:finite(a?.y)-finite(b?.y),z:finite(a?.z)-finite(b?.z)});
  const scale=(value,amount)=>({x:finite(value?.x)*amount,y:finite(value?.y)*amount,z:finite(value?.z)*amount});
  const quantize=(value,step=GRID_STEP)=>Math.round(finite(value)/step)*step;

  function rotateVector(value,rotation={}){
    let {x,y,z}=vector(value),rx=finite(rotation.x),ry=finite(rotation.y),rz=finite(rotation.z);
    let c=Math.cos(rx),s=Math.sin(rx),ny=y*c-z*s,nz=y*s+z*c;y=ny;z=nz;
    c=Math.cos(ry);s=Math.sin(ry);let nx=x*c+z*s;nz=-x*s+z*c;x=nx;z=nz;
    c=Math.cos(rz);s=Math.sin(rz);nx=x*c-y*s;ny=x*s+y*c;return{x:nx,y:ny,z};
  }

  function normalizeSnapAnchor(input={}){
    const anchorType=ANCHOR_TYPES.includes(input.anchorType)?input.anchorType:'center';
    const rotationPolicy=ROTATION_POLICIES.includes(input.rotationPolicy)?input.rotationPolicy:'preserve';
    return{id:String(input.id||''),ownerAssetId:String(input.ownerAssetId||''),anchorType,
      localPosition:vector(input.localPosition),localNormal:normalize(input.localNormal||{x:0,y:-1,z:0}),
      compatibleSurfaceTypes:[...new Set((Array.isArray(input.compatibleSurfaceTypes)?input.compatibleSurfaceTypes:[]).filter(type=>SURFACE_TYPES.includes(type)))],rotationPolicy};
  }

  function normalizeSnapSurface(input={}){
    const surfaceType=SURFACE_TYPES.includes(input.surfaceType)?input.surfaceType:'vertical-face';
    return{id:String(input.id||''),ownerAssetId:String(input.ownerAssetId||''),surfaceType,
      localOrigin:vector(input.localOrigin),localNormal:normalize(input.localNormal||{x:0,y:1,z:0}),
      width:Math.max(0,finite(input.width)),height:Math.max(0,finite(input.height)),
      allowedAssetTypes:[...new Set((Array.isArray(input.allowedAssetTypes)?input.allowedAssetTypes:[]).map(String))],
      padding:Math.max(0,finite(input.padding,.001)),enabled:input.enabled!==false};
  }

  function assetOriginMode(asset){
    const type=String(asset?.assetType||'').toLowerCase();
    return asset?.metadata?.system===true||/(floor|wall|room|door)/.test(type)?'center':'base';
  }

  function anchorDefinition(asset,anchorType,compatibleSurfaceTypes,rotationPolicy='preserve'){
    const b=asset.bounds||{},w=finite(b.width),h=finite(b.height),d=finite(b.depth),centerY=assetOriginMode(asset)==='base'?h/2:0;
    const positions={bottom:{x:0,y:assetOriginMode(asset)==='base'?0:-h/2,z:0},back:{x:0,y:centerY,z:-d/2},front:{x:0,y:centerY,z:d/2},
      left:{x:-w/2,y:centerY,z:0},right:{x:w/2,y:centerY,z:0},top:{x:0,y:assetOriginMode(asset)==='base'?h:h/2,z:0},center:{x:0,y:centerY,z:0},mount:{x:0,y:centerY,z:-d/2}};
    const normals={bottom:{x:0,y:-1,z:0},back:{x:0,y:0,z:-1},front:{x:0,y:0,z:1},left:{x:-1,y:0,z:0},right:{x:1,y:0,z:0},top:{x:0,y:1,z:0},center:{x:0,y:0,z:1},mount:{x:0,y:0,z:-1}};
    return normalizeSnapAnchor({id:asset.id+'.anchor.'+anchorType,ownerAssetId:asset.id,anchorType,localPosition:positions[anchorType],localNormal:normals[anchorType],compatibleSurfaceTypes,rotationPolicy});
  }

  function createCornerAnchorsForAsset(asset={}){
    if(asset.snapEnabled===false)return[];
    const b=asset.bounds||{},w=finite(b.width),h=finite(b.height),d=finite(b.depth),base=assetOriginMode(asset)==='base',
      xs=[['min-x',-w/2],['max-x',w/2]],ys=base?[['min-y',0],['max-y',h]]:[['min-y',-h/2],['max-y',h/2]],zs=[['min-z',-d/2],['max-z',d/2]];
    const anchors=[];
    xs.forEach(([xId,x])=>ys.forEach(([yId,y])=>zs.forEach(([zId,z])=>{
      anchors.push(normalizeSnapAnchor({id:asset.id+'.anchor.corner.'+[xId,yId,zId].join('.'),ownerAssetId:asset.id,anchorType:'corner',
        localPosition:{x,y,z},localNormal:normalize({x:x<0?-1:1,y:y===ys[0][1]?-1:1,z:z<0?-1:1}),compatibleSurfaceTypes:['edge','center-line'],rotationPolicy:'preserve'}));
    })));
    return anchors;
  }

  function worldAnchor(anchor,asset,transformOverride=null){
    const transform=transformOverride||asset?.transform||{},position=transform.position||{},rotation=transform.rotation||{},transformScale=transform.scale||{},
      scaledPosition={x:finite(anchor?.localPosition?.x)*finite(transformScale.x,1),y:finite(anchor?.localPosition?.y)*finite(transformScale.y,1),z:finite(anchor?.localPosition?.z)*finite(transformScale.z,1)},
      scaledNormal={x:finite(anchor?.localNormal?.x)*Math.sign(finite(transformScale.x,1)||1),y:finite(anchor?.localNormal?.y)*Math.sign(finite(transformScale.y,1)||1),z:finite(anchor?.localNormal?.z)*Math.sign(finite(transformScale.z,1)||1)};
    return{...clone(anchor),worldPosition:add(position,rotateVector(scaledPosition,rotation)),worldNormal:normalize(rotateVector(scaledNormal,rotation))};
  }

  function anchorKindsCompatible(sourceKind,targetKind){
    return sourceKind===targetKind||(sourceKind==='corner'&&targetKind==='edge')||(sourceKind==='edge'&&targetKind==='corner');
  }

  function createAnchorsForAsset(asset={}){
    if(asset.snapEnabled===false)return[];
    const type=(String(asset.assetType||'')+' '+String(asset.name||'')+' '+String(asset.metadata?.fixtureType||'')).toLowerCase(),anchors=[];
    const add=(kind,surfaces,policy='preserve')=>{if(!anchors.some(anchor=>anchor.anchorType===kind))anchors.push(anchorDefinition(asset,kind,surfaces,policy));};
    if(/logo|โลโก้|brandcopy|graphic|screen|tv|จอ|ป้าย/.test(type))add('mount',['wall-inside','wall-outside','vertical-face'],'align-normal');
    else if(/arm light|wall light|ไฟกิ่ง|โคมติดผนัง/.test(type))add('mount',['wall-inside','wall-outside','vertical-face'],'align-normal');
    else if(/clear light|downlight|ceiling light|ไฟดาวน์ไลท์|โคมใต้คาน/.test(type))add('top',['horizontal-bottom'],'align-horizontal');
    else if(/counter|shelf|เคาน์เตอร์|ชั้น/.test(type)){
      add('bottom',['floor-top','horizontal-top'],'align-horizontal');add('back',['wall-inside','wall-outside','vertical-face'],'align-normal');
    }else add('bottom',['floor-top','horizontal-top'],'align-horizontal');
    add('back',['wall-inside','wall-outside','vertical-face'],'align-normal');
    add('front',['vertical-face','wall-inside','wall-outside'],'align-normal');
    add('left',['vertical-face'],'align-normal');add('right',['vertical-face'],'align-normal');
    add('top',['horizontal-bottom'],'align-horizontal');add('center',['center-line'],'preserve');
    anchors.push(...createCornerAnchorsForAsset(asset));
    return anchors;
  }

  function surfaceDefinition(asset,suffix,surfaceType,localOrigin,localNormal,width,height,allowedAssetTypes=[],padding=.001){
    return normalizeSnapSurface({id:asset.id+'.surface.'+suffix,ownerAssetId:asset.id,surfaceType,localOrigin,localNormal,width,height,allowedAssetTypes,padding,enabled:asset.snapEnabled!==false});
  }

  function boxSurfaces(asset,{includeCenter=true}={}){
    const b=asset.bounds||{},w=finite(b.width),h=finite(b.height),d=finite(b.depth),base=assetOriginMode(asset)==='base',cy=base?h/2:0,bottomY=base?0:-h/2,topY=base?h:h/2;
    const surfaces=[
      surfaceDefinition(asset,'back','vertical-face',{x:0,y:cy,z:-d/2},{x:0,y:0,z:-1},w,h),
      surfaceDefinition(asset,'front','vertical-face',{x:0,y:cy,z:d/2},{x:0,y:0,z:1},w,h),
      surfaceDefinition(asset,'left','vertical-face',{x:-w/2,y:cy,z:0},{x:-1,y:0,z:0},d,h),
      surfaceDefinition(asset,'right','vertical-face',{x:w/2,y:cy,z:0},{x:1,y:0,z:0},d,h),
      surfaceDefinition(asset,'top','horizontal-top',{x:0,y:topY,z:0},{x:0,y:1,z:0},w,d),
      surfaceDefinition(asset,'bottom','horizontal-bottom',{x:0,y:bottomY,z:0},{x:0,y:-1,z:0},w,d)
    ];
    if(includeCenter)surfaces.push(surfaceDefinition(asset,'center','center-line',{x:0,y:cy,z:0},{x:0,y:0,z:1},w,h));
    return surfaces;
  }

  function createSurfacesForAsset(asset={}){
    if(asset.snapEnabled===false)return[];
    const id=String(asset.id||''),type=String(asset.assetType||'').toLowerCase(),b=asset.bounds||{},w=finite(b.width),h=finite(b.height),d=finite(b.depth);
    if(/floor/.test(type)||id==='structure.floor.main'){
      const top=surfaceDefinition(asset,'top','floor-top',{x:0,y:h/2,z:0},{x:0,y:1,z:0},w,d),y=h/2;
      return[top,
        surfaceDefinition(asset,'edge.back','edge',{x:0,y,z:-d/2},{x:0,y:0,z:-1},w,0),surfaceDefinition(asset,'edge.front','edge',{x:0,y,z:d/2},{x:0,y:0,z:1},w,0),
        surfaceDefinition(asset,'edge.left','edge',{x:-w/2,y,z:0},{x:-1,y:0,z:0},d,0),surfaceDefinition(asset,'edge.right','edge',{x:w/2,y,z:0},{x:1,y:0,z:0},d,0),
        surfaceDefinition(asset,'center.x','center-line',{x:0,y,z:0},{x:1,y:0,z:0},d,0),surfaceDefinition(asset,'center.z','center-line',{x:0,y,z:0},{x:0,y:0,z:1},w,0)];
    }
    if(/wall/.test(type)||id.startsWith('structure.wall.')){
      const face=id.split('.').pop(),back=face==='back',left=face==='left',insideNormal=back?{x:0,y:0,z:1}:left?{x:1,y:0,z:0}:{x:-1,y:0,z:0},
        insideOrigin=back?{x:0,y:0,z:d/2}:left?{x:w/2,y:0,z:0}:{x:-w/2,y:0,z:0},outsideOrigin=scale(insideOrigin,-1),surfaceWidth=back?w:d;
      return[
        surfaceDefinition(asset,'inside','wall-inside',insideOrigin,insideNormal,surfaceWidth,h),surfaceDefinition(asset,'outside','wall-outside',outsideOrigin,scale(insideNormal,-1),surfaceWidth,h),
        surfaceDefinition(asset,'edge.top','edge',{x:0,y:h/2,z:0},{x:0,y:1,z:0},surfaceWidth,0),surfaceDefinition(asset,'edge.left','edge',{x:-w/2,y:0,z:-d/2},insideNormal,h,0),
        surfaceDefinition(asset,'edge.right','edge',{x:w/2,y:0,z:d/2},insideNormal,h,0),surfaceDefinition(asset,'center','center-line',insideOrigin,insideNormal,surfaceWidth,h)
      ];
    }
    return boxSurfaces(asset);
  }

  function worldSurface(surface,ownerAsset){
    if(surface.worldOrigin&&surface.worldNormal)return{...surface,worldOrigin:vector(surface.worldOrigin),worldNormal:normalize(surface.worldNormal)};
    const transform=ownerAsset?.transform||{},rotation=transform.rotation||{},position=transform.position||{};
    return{...surface,worldOrigin:add(position,rotateVector(surface.localOrigin,rotation)),worldNormal:normalize(rotateVector(surface.localNormal,rotation))};
  }

  function surfaceBasis(normalValue){
    const normal=normalize(normalValue);
    if(Math.abs(normal.y)>.7)return{u:{x:1,y:0,z:0},v:{x:0,y:0,z:1}};
    const u=normalize({x:-normal.z,y:0,z:normal.x});return{u,v:{x:0,y:1,z:0}};
  }

  function quantizeSurfacePoint(point,surface,step=GRID_STEP){
    const origin=surface.worldOrigin||surface.localOrigin,normal=surface.worldNormal||surface.localNormal,{u,v}=surfaceBasis(normal),delta=subtract(point,origin);
    const du=quantize(dot(delta,u),step),dv=quantize(dot(delta,v),step);
    return add(origin,add(scale(u,du),scale(v,dv)));
  }

  function alignRotation(anchor,surface,currentRotation={}){
    const next=vector(currentRotation),normal=surface.worldNormal||surface.localNormal;
    if(anchor.rotationPolicy==='preserve')return next;
    if(anchor.rotationPolicy==='align-horizontal'){next.x=0;next.z=0;return next;}
    if(Math.abs(normal.y)>.7)return next;
    const local=normalize(anchor.localNormal),target=scale(normal,-1);
    const rawYaw=Math.atan2(target.x,target.z)-Math.atan2(local.x,local.z);
    next.y=Math.atan2(Math.sin(rawYaw),Math.cos(rawYaw));next.x=0;next.z=0;return next;
  }

  function projectedHalfExtents(asset,rotation,basis){
    const b=asset.bounds||{},axes=[rotateVector({x:1,y:0,z:0},rotation),rotateVector({x:0,y:1,z:0},rotation),rotateVector({x:0,y:0,z:1},rotation)],half=[finite(b.width)/2,finite(b.height)/2,finite(b.depth)/2];
    const extent=axis=>half.reduce((sum,value,index)=>sum+value*Math.abs(dot(axes[index],axis)),0);
    return{u:extent(basis.u),v:extent(basis.v)};
  }

  function allowsFreeInstallOverhang(asset,surface){
    return asset?.metadata?.installFreely===true&&!['edge','center-line'].includes(surface?.surfaceType);
  }

  function allowsBrandingOverhang(asset,owner,surface){
    const source=(String(asset?.assetType||'')+' '+String(asset?.name||'')+' '+String(asset?.category||'')).toLowerCase(),target=String(owner?.assetType||'').toLowerCase();
    if(!/logo|โลโก้|brandcopy|graphic|branding|ป้าย/.test(source)||owner?.metadata?.system===true||/floor|wall|room|door/.test(target)||
      !['vertical-face','wall-inside','wall-outside'].includes(surface?.surfaceType))return false;
    return true;
  }

  function fitsSurface(asset,rotation,point,surface,owner=null){
    if(surface.surfaceType==='edge'||surface.surfaceType==='center-line')return true;
    const origin=surface.worldOrigin||surface.localOrigin,normal=surface.worldNormal||surface.localNormal,basis=surfaceBasis(normal),delta=subtract(point,origin),ext=projectedHalfExtents(asset,rotation,basis),padding=finite(surface.padding),
      rawMaxU=finite(surface.width)/2-ext.u-padding,rawMaxV=finite(surface.height)/2-ext.v-padding;
    if(allowsFreeInstallOverhang(asset,surface)||allowsBrandingOverhang(asset,owner,surface))return Math.abs(dot(delta,basis.u))<=finite(surface.width)/2-padding+.0001&&Math.abs(dot(delta,basis.v))<=finite(surface.height)/2-padding+.0001;
    if(rawMaxU<0||rawMaxV<0)return false;
    return Math.abs(dot(delta,basis.u))<=rawMaxU+.0001&&Math.abs(dot(delta,basis.v))<=rawMaxV+.0001;
  }

  function surfaceAcceptsAsset(surface,asset){
    if(!surface?.enabled||asset?.snapEnabled===false)return false;
    if(surface.allowedAssetTypes?.length&&!surface.allowedAssetTypes.includes(asset.assetType))return false;
    return true;
  }

  function anchorsForSurface(anchors,surface){
    const preferred=surface.surfaceType==='floor-top'||surface.surfaceType==='horizontal-top'?['bottom']:
      surface.surfaceType==='horizontal-bottom'?['top']:surface.surfaceType==='center-line'?['center']:['mount','back','front','left','right'];
    return anchors.filter(anchor=>anchor.compatibleSurfaceTypes.includes(surface.surfaceType)).sort((a,b)=>{
      const ai=preferred.indexOf(a.anchorType),bi=preferred.indexOf(b.anchorType);return(ai<0?99:ai)-(bi<0?99:bi);
    });
  }

  class SmartSnapEngine{
    constructor(registry,options={}){
      this.registry=registry;this.gridStep=finite(options.gridStep,GRID_STEP);this.detectionDistance=finite(options.detectionDistance,SURFACE_DETECTION_DISTANCE);
      this.screenThreshold=finite(options.screenThreshold,SCREEN_THRESHOLD);this.releaseDistance=Math.max(this.detectionDistance,finite(options.releaseDistance,SNAP_RELEASE_DISTANCE));
      this.releaseScreenThreshold=Math.max(this.screenThreshold,finite(options.releaseScreenThreshold,SNAP_RELEASE_SCREEN_THRESHOLD));
      this.anchors=new Map();this.surfaces=new Map();this.syncFromRegistry();
    }
    syncFromRegistry(){this.anchors.clear();this.surfaces.clear();(this.registry?.listAssets?.()||[]).forEach(asset=>{
      this.anchors.set(asset.id,createAnchorsForAsset(asset));this.surfaces.set(asset.id,createSurfacesForAsset(asset));
    });return this.validate();}
    getAnchors(assetId){return this.anchors.get(String(assetId||''))||[];}
    getSurfaces(assetId){return this.surfaces.get(String(assetId||''))||[];}
    listAnchors(){return[...this.anchors.values()].flat();}
    listSurfaces(){return[...this.surfaces.values()].flat();}
    getWorldSurfaces(assetId){const asset=this.registry?.getAssetById?.(assetId);return asset?this.getSurfaces(assetId).map(surface=>worldSurface(surface,asset)):[];}
    matchSurface(assetId,point,normalValue,maxDistance=this.detectionDistance){
      const normal=normalize(normalValue);let best=null;
      this.getWorldSurfaces(assetId).forEach(surface=>{const alignment=dot(surface.worldNormal,normal),distance=Math.abs(dot(subtract(point,surface.worldOrigin),surface.worldNormal));
        if(alignment<.64||distance>maxDistance||best&&distance>=best.distance)return;best={surface,distance,alignment};});
      return best?.surface||null;
    }
    solve({sourceAssetId,anchorId='',surface,targetAssetId='',surfacePoint,currentTransform=null}={}){
      const asset=this.registry?.getAssetById?.(sourceAssetId),owner=this.registry?.getAssetById?.(targetAssetId||surface?.ownerAssetId);
      if(!asset||!surface||!surfaceAcceptsAsset(surface,asset))return null;
      const world=worldSurface(surface,owner),available=anchorsForSurface(this.getAnchors(asset.id),world),anchors=anchorId?available.filter(anchor=>anchor.id===anchorId):available;
      if(!anchors.length)return null;
      const anchor=anchors[0],rotation=alignRotation(anchor,world,currentTransform?.rotation||asset.transform.rotation),scaledAnchor={x:anchor.localPosition.x*finite(asset.transform.scale?.x,1),y:anchor.localPosition.y*finite(asset.transform.scale?.y,1),z:anchor.localPosition.z*finite(asset.transform.scale?.z,1)},
        rotatedAnchor=rotateVector(scaledAnchor,rotation),keepFloorContact=asset.metadata?.installFreely!==true&&anchor.anchorType==='back'&&Math.abs(world.worldNormal.y)<.7&&(/counter|shelf|furniture|เคาน์เตอร์|ชั้น/.test((asset.assetType+' '+asset.name).toLowerCase())||asset.category==='furniture');
      let point=quantizeSurfacePoint(surfacePoint,world,this.gridStep);
      if(keepFloorContact)point={...point,y:finite(currentTransform?.position?.y,finite(asset.transform.position?.y))+rotatedAnchor.y};
      const desiredAnchor=add(point,scale(world.worldNormal,Math.max(.001,finite(world.padding)))),position=subtract(desiredAnchor,rotatedAnchor),valid=fitsSurface(asset,rotation,point,keepFloorContact?{...world,padding:0}:world,owner);
      return{valid,reason:valid?'':'out-of-surface-bounds',priority:SNAP_PRIORITIES['anchor-surface'],snapType:'anchor-surface',sourceAssetId:asset.id,anchor:clone(anchor),surface:clone(world),targetAssetId:targetAssetId||world.ownerAssetId,
        transform:{position,rotation,scale:clone(asset.transform.scale)},surfacePoint:point,requiredOffset:Math.max(.001,finite(world.padding))};
    }
    rankCandidates(candidates=[]){return candidates.filter(Boolean).sort((a,b)=>(a.priority||99)-(b.priority||99)||(a.distance||0)-(b.distance||0));}
    shouldRelease(distance,screenDistance){return finite(distance)>this.releaseDistance||finite(screenDistance)>this.releaseScreenThreshold;}
    validate(){const errors=[],anchorIds=new Set(),surfaceIds=new Set();this.listAnchors().forEach(anchor=>{
      if(!anchor.id||anchorIds.has(anchor.id))errors.push({code:'invalid-anchor-id',id:anchor.id});anchorIds.add(anchor.id);
      if(!this.registry?.getAssetById?.(anchor.ownerAssetId))errors.push({code:'anchor-owner-missing',id:anchor.id});
    });this.listSurfaces().forEach(surface=>{if(!surface.id||surfaceIds.has(surface.id))errors.push({code:'invalid-surface-id',id:surface.id});surfaceIds.add(surface.id);
      if(!this.registry?.getAssetById?.(surface.ownerAssetId))errors.push({code:'surface-owner-missing',id:surface.id});});
      let corners=0;(this.registry?.listAssets?.()||[]).filter(asset=>asset.snapEnabled!==false).forEach(asset=>{const count=this.getAnchors(asset.id).filter(anchor=>anchor.anchorType==='corner').length;
        corners+=count;if(count!==8)errors.push({code:'corner-anchor-count',id:asset.id,expected:8,actual:count});});
      return{valid:errors.length===0,errors,stats:{anchors:anchorIds.size,corners,surfaces:surfaceIds.size}};}
  }

  const createEngine=(registry,options)=>new SmartSnapEngine(registry,options);
  global.YPSmartSnap=Object.freeze({SMART_SNAP_VERSION,GRID_STEP,SURFACE_DETECTION_DISTANCE,SCREEN_THRESHOLD,SNAP_RELEASE_DISTANCE,SNAP_RELEASE_SCREEN_THRESHOLD,
    ANCHOR_TYPES,SURFACE_TYPES,ROTATION_POLICIES,SNAP_PRIORITIES,SmartSnapEngine,createEngine,normalizeSnapAnchor,normalizeSnapSurface,
    createAnchorsForAsset,createCornerAnchorsForAsset,createSurfacesForAsset,worldAnchor,worldSurface,quantizeSurfacePoint,rotateVector,anchorKindsCompatible});
})(typeof globalThis!=='undefined'?globalThis:window);
