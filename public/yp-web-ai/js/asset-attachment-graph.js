(function(global){
  'use strict';

  const ATTACHMENT_GRAPH_VERSION=1;
  const SNAP_MODES=Object.freeze(['surface','edge','center','grid']);
  const PARENT_REMOVED_WARNING='พื้นผิวที่ Asset เคยติดตั้งถูกลบ กรุณาจัดตำแหน่งใหม่';
  const OUT_OF_BOUNDS_WARNING='ตำแหน่ง Attachment อยู่นอกขอบพื้นผิว กรุณาย้าย Detach หรือลบ Asset';

  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const vector=(value={},fallback=0)=>({x:finite(value.x,fallback),y:finite(value.y,fallback),z:finite(value.z,fallback)});
  const add=(a,b)=>({x:finite(a?.x)+finite(b?.x),y:finite(a?.y)+finite(b?.y),z:finite(a?.z)+finite(b?.z)});
  const subtract=(a,b)=>({x:finite(a?.x)-finite(b?.x),y:finite(a?.y)-finite(b?.y),z:finite(a?.z)-finite(b?.z)});
  const scale=(value,amount)=>({x:finite(value?.x)*amount,y:finite(value?.y)*amount,z:finite(value?.z)*amount});
  const dot=(a,b)=>finite(a?.x)*finite(b?.x)+finite(a?.y)*finite(b?.y)+finite(a?.z)*finite(b?.z);
  const length=value=>Math.hypot(finite(value?.x),finite(value?.y),finite(value?.z));
  const normalize=value=>{const v=vector(value),l=length(v)||1;return{x:v.x/l,y:v.y/l,z:v.z/l};};
  const wrapAngle=value=>Math.atan2(Math.sin(finite(value)),Math.cos(finite(value)));

  function rotateVector(value,rotation={}){
    let {x,y,z}=vector(value),rx=finite(rotation.x),ry=finite(rotation.y),rz=finite(rotation.z);
    let c=Math.cos(rx),s=Math.sin(rx),ny=y*c-z*s,nz=y*s+z*c;y=ny;z=nz;
    c=Math.cos(ry);s=Math.sin(ry);let nx=x*c+z*s;nz=-x*s+z*c;x=nx;z=nz;
    c=Math.cos(rz);s=Math.sin(rz);nx=x*c-y*s;ny=x*s+y*c;return{x:nx,y:ny,z};
  }

  function surfaceBasis(normalValue){
    const normal=normalize(normalValue);
    if(Math.abs(normal.y)>.7)return{u:{x:1,y:0,z:0},v:{x:0,y:0,z:1},normal};
    const u=normalize({x:-normal.z,y:0,z:normal.x});return{u,v:{x:0,y:1,z:0},normal};
  }

  function normalizeAttachment(input={}){
    const local=input.localSurfacePosition||{},rotation=input.rotationOffset||{},warnings=Array.isArray(input.validationWarnings)?input.validationWarnings.map(String):[];
    return{
      targetAssetId:String(input.targetAssetId||''),
      targetSurfaceId:String(input.targetSurfaceId||''),
      sourceAnchorId:String(input.sourceAnchorId||''),
      localSurfacePosition:{u:finite(local.u),v:finite(local.v),normalOffset:finite(local.normalOffset,.001)},
      rotationOffset:vector(rotation),
      snapMode:SNAP_MODES.includes(input.snapMode)?input.snapMode:'surface',
      valid:input.valid!==false,
      validationWarnings:warnings,
      attached:input.attached!==false,
      detachedReason:String(input.detachedReason||'')
    };
  }

  function assetOriginMode(asset){
    const type=String(asset?.assetType||'').toLowerCase();
    return asset?.metadata?.system===true||/(floor|wall|room|door)/.test(type)?'center':'base';
  }

  function anchorWorldPosition(asset,anchor,transform=asset?.transform||{}){
    const local=anchor?.localPosition||{},scaleValue=transform.scale||asset?.transform?.scale||{x:1,y:1,z:1};
    const scaled={x:finite(local.x)*finite(scaleValue.x,1),y:finite(local.y)*finite(scaleValue.y,1),z:finite(local.z)*finite(scaleValue.z,1)};
    return add(transform.position||asset?.transform?.position||{},rotateVector(scaled,transform.rotation||asset?.transform?.rotation||{}));
  }

  function alignedRotation(anchor,surface,currentRotation={}){
    const next=vector(currentRotation),normal=surface.worldNormal||surface.localNormal;
    if(anchor.rotationPolicy==='preserve')return next;
    if(anchor.rotationPolicy==='align-horizontal'){next.x=0;next.z=0;return next;}
    if(Math.abs(normal.y)>.7)return next;
    const local=normalize(anchor.localNormal),target=scale(normal,-1),rawYaw=Math.atan2(target.x,target.z)-Math.atan2(local.x,local.z);
    next.y=wrapAngle(rawYaw);next.x=0;next.z=0;return next;
  }

  function projectedHalfExtents(asset,rotation,basis){
    const b=asset?.bounds||{},axes=[rotateVector({x:1,y:0,z:0},rotation),rotateVector({x:0,y:1,z:0},rotation),rotateVector({x:0,y:0,z:1},rotation)],half=[finite(b.width)/2,finite(b.height)/2,finite(b.depth)/2];
    const extent=axis=>half.reduce((sum,value,index)=>sum+value*Math.abs(dot(axes[index],axis)),0);
    return{u:extent(basis.u),v:extent(basis.v)};
  }

  class AssetAttachmentGraph{
    constructor(registry,snapEngine,options={}){
      this.registry=registry;this.snapEngine=snapEngine;this.attachments=new Map();this.children=new Map();
      this.applyTransform=typeof options.applyTransform==='function'?options.applyTransform:null;
      this.onChange=typeof options.onChange==='function'?options.onChange:null;
      this.onWarning=typeof options.onWarning==='function'?options.onWarning:null;
    }

    load(state={},options={}){
      this.attachments.clear();
      const rows=Array.isArray(state?.attachments)?state.attachments:[];
      rows.forEach(row=>{const childAssetId=String(row.childAssetId||row.assetId||'');if(childAssetId)this.attachments.set(childAssetId,normalizeAttachment(row.attachment||row));});
      this.rebuildGraph();this.syncRegistryFields();
      if(options.resolve===true)this.reconcile({apply:true,warn:options.warn===true});
      return this.serialize();
    }

    serialize(){return{version:ATTACHMENT_GRAPH_VERSION,attachments:[...this.attachments.entries()].map(([childAssetId,attachment])=>({childAssetId,attachment:clone(attachment)}))};}
    getAttachment(childAssetId){const value=this.attachments.get(String(childAssetId||''));return value?clone(value):null;}
    listAttachments(){return[...this.attachments.entries()].map(([childAssetId,attachment])=>({childAssetId,attachment:clone(attachment)}));}
    getChildren(parentAssetId){return[...(this.children.get(String(parentAssetId||''))||[])];}
    getParent(childAssetId){const attachment=this.attachments.get(String(childAssetId||''));return attachment?.attached?attachment.targetAssetId:null;}

    getSurface(targetAssetId,surfaceId){return(this.snapEngine?.getWorldSurfaces?.(targetAssetId)||[]).find(surface=>surface.id===surfaceId)||null;}
    getAnchor(childAssetId,anchorId){return(this.snapEngine?.getAnchors?.(childAssetId)||[]).find(anchor=>anchor.id===anchorId)||null;}

    attachFromCurrent(childAssetId,input={}){
      const child=this.registry?.getAssetById?.(childAssetId),targetId=String(input.targetAssetId||''),surface=this.getSurface(targetId,String(input.targetSurfaceId||'')),anchor=this.getAnchor(childAssetId,String(input.sourceAnchorId||''));
      if(!child||!surface||!anchor)return{ok:false,reason:'missing-asset-anchor-or-surface'};
      if(child.id===targetId||this.wouldCreateCycle(child.id,targetId))return{ok:false,reason:'attachment-cycle'};
      const transform=input.transform||child.transform,worldAnchor=anchorWorldPosition(child,anchor,transform),basis=surfaceBasis(surface.worldNormal||surface.localNormal),delta=subtract(worldAnchor,surface.worldOrigin||surface.localOrigin),baseRotation=alignedRotation(anchor,surface,transform.rotation||{}),currentRotation=vector(transform.rotation||{});
      const attachment=normalizeAttachment({targetAssetId:targetId,targetSurfaceId:surface.id,sourceAnchorId:anchor.id,
        localSurfacePosition:{u:dot(delta,basis.u),v:dot(delta,basis.v),normalOffset:dot(delta,basis.normal)},
        rotationOffset:{x:wrapAngle(currentRotation.x-baseRotation.x),y:wrapAngle(currentRotation.y-baseRotation.y),z:wrapAngle(currentRotation.z-baseRotation.z)},
        snapMode:input.snapMode||'surface',valid:true,validationWarnings:[],attached:true});
      this.attachments.set(child.id,attachment);this.rebuildGraph();const result=this.resolveChild(child.id,{apply:false});
      if(!result.valid){attachment.valid=false;attachment.validationWarnings=result.warnings;}
      this.syncRegistryFields();this.changed('attach',child.id);return{ok:true,attachment:clone(attachment),transform:result.transform||null,valid:attachment.valid,warnings:clone(attachment.validationWarnings)};
    }

    detach(childAssetId,options={}){
      const id=String(childAssetId||''),attachment=this.attachments.get(id);if(!attachment)return false;
      attachment.attached=false;attachment.detachedReason=String(options.reason||'manual');
      if(options.invalid===true)attachment.valid=false;
      if(options.warning){attachment.validationWarnings=[...new Set([...(attachment.validationWarnings||[]),String(options.warning)])];}
      this.rebuildGraph();this.syncRegistryFields();this.changed('detach',id);return true;
    }

    removeAttachment(childAssetId){const id=String(childAssetId||''),removed=this.attachments.delete(id);if(removed){this.rebuildGraph();this.syncRegistryFields();this.changed('remove',id);}return removed;}

    reattach(childAssetId,overrides={}){
      const id=String(childAssetId||''),previous=this.attachments.get(id);if(!previous)return{ok:false,reason:'attachment-missing'};
      const next={...clone(previous),...overrides,localSurfacePosition:{...previous.localSurfacePosition,...(overrides.localSurfacePosition||{})},rotationOffset:{...previous.rotationOffset,...(overrides.rotationOffset||{})},attached:true,valid:true,validationWarnings:[],detachedReason:''};
      this.attachments.set(id,normalizeAttachment(next));this.rebuildGraph();const resolved=this.resolveChild(id,{apply:true});
      if(!resolved.valid){const attachment=this.attachments.get(id);attachment.attached=false;attachment.valid=false;attachment.validationWarnings=resolved.warnings;this.rebuildGraph();}
      this.syncRegistryFields();this.changed('reattach',id);return{ok:resolved.valid,attachment:this.getAttachment(id),transform:resolved.transform||null,warnings:resolved.warnings||[]};
    }

    changeTargetSurface(childAssetId,targetAssetId,targetSurfaceId){
      const attachment=this.attachments.get(String(childAssetId||''));if(!attachment)return{ok:false,reason:'attachment-missing'};
      return this.attachFromCurrent(childAssetId,{targetAssetId,targetSurfaceId,sourceAnchorId:attachment.sourceAnchorId,snapMode:attachment.snapMode});
    }

    changeSnapAnchor(childAssetId,sourceAnchorId){
      const attachment=this.attachments.get(String(childAssetId||''));if(!attachment)return{ok:false,reason:'attachment-missing'};
      return this.attachFromCurrent(childAssetId,{targetAssetId:attachment.targetAssetId,targetSurfaceId:attachment.targetSurfaceId,sourceAnchorId,snapMode:attachment.snapMode});
    }

    resolveChild(childAssetId,options={}){
      const id=String(childAssetId||''),attachment=this.attachments.get(id),child=this.registry?.getAssetById?.(id);
      if(!attachment||!attachment.attached||!child)return{valid:false,warnings:['Attachment หรือ Child Asset ไม่พร้อม']};
      const parent=this.registry?.getAssetById?.(attachment.targetAssetId),surface=parent&&this.getSurface(parent.id,attachment.targetSurfaceId),anchor=this.getAnchor(id,attachment.sourceAnchorId);
      if(!parent||!surface||!anchor)return{valid:false,missingParentOrSurface:true,warnings:[PARENT_REMOVED_WARNING]};
      const basis=surfaceBasis(surface.worldNormal||surface.localNormal),local=attachment.localSurfacePosition,
        desiredAnchor=add(surface.worldOrigin||surface.localOrigin,add(scale(basis.u,local.u),add(scale(basis.v,local.v),scale(basis.normal,local.normalOffset)))),
        baseRotation=alignedRotation(anchor,surface,child.transform.rotation||{}),rotation={x:wrapAngle(baseRotation.x+attachment.rotationOffset.x),y:wrapAngle(baseRotation.y+attachment.rotationOffset.y),z:wrapAngle(baseRotation.z+attachment.rotationOffset.z)},
        extents=projectedHalfExtents(child,rotation,basis),padding=finite(surface.padding),freeInstall=child.metadata?.installFreely===true,
        maxU=freeInstall?finite(surface.width)/2-padding:finite(surface.width)/2-extents.u-padding,maxV=freeInstall?finite(surface.height)/2-padding:finite(surface.height)/2-extents.v-padding,
        bounded=surface.surfaceType==='edge'||surface.surfaceType==='center-line'||(Math.abs(local.u)<=maxU+.0001&&Math.abs(local.v)<=maxV+.0001);
      if(!bounded)return{valid:false,warnings:[OUT_OF_BOUNDS_WARNING]};
      const scaledAnchor={x:anchor.localPosition.x*finite(child.transform.scale?.x,1),y:anchor.localPosition.y*finite(child.transform.scale?.y,1),z:anchor.localPosition.z*finite(child.transform.scale?.z,1)},
        transform={position:subtract(desiredAnchor,rotateVector(scaledAnchor,rotation)),rotation,scale:clone(child.transform.scale)};
      if(options.apply!==false){this.registry.updateAssetTransform(id,transform,{applyToObject3D:true,notifyWorkflow:false,attachmentPropagation:true});if(this.applyTransform)this.applyTransform(id,clone(transform),{attachment:clone(attachment)});}
      return{valid:true,transform,warnings:[]};
    }

    propagateFrom(parentAssetId,options={}){
      const visited=options.visited||new Set(),parentId=String(parentAssetId||'');if(visited.has(parentId))return[];visited.add(parentId);
      const results=[];this.getChildren(parentId).forEach(childId=>{const resolved=this.resolveChild(childId,{apply:options.apply!==false});results.push({childAssetId:childId,...resolved});if(resolved.valid)results.push(...this.propagateFrom(childId,{...options,visited}));});
      this.syncRegistryFields();return results;
    }

    handleParentRemoved(parentAssetId){
      const parentId=String(parentAssetId||''),children=this.getChildren(parentId);children.forEach(childId=>this.detach(childId,{reason:'parent-removed',invalid:true,warning:PARENT_REMOVED_WARNING}));return children;
    }

    handleAssetRemoved(assetId){
      const id=String(assetId||'');this.handleParentRemoved(id);this.removeAttachment(id);return true;
    }

    reconcile(options={}){
      const results=[];
      [...this.attachments.entries()].forEach(([childId,attachment])=>{
        if(!this.registry?.getAssetById?.(childId)){this.attachments.delete(childId);return;}
        if(!attachment.attached)return;
        const resolved=this.resolveChild(childId,{apply:options.apply!==false});
        if(!resolved.valid){attachment.valid=false;attachment.validationWarnings=resolved.warnings||[];
          if(resolved.missingParentOrSurface){attachment.attached=false;attachment.detachedReason='parent-or-surface-missing';if(options.warn&&this.onWarning)this.onWarning(PARENT_REMOVED_WARNING,childId);}
          else if(options.warn&&this.onWarning)this.onWarning(attachment.validationWarnings[0]||OUT_OF_BOUNDS_WARNING,childId);
        }else{attachment.valid=true;attachment.validationWarnings=[];}
        results.push({childAssetId:childId,...resolved});
      });
      this.rebuildGraph();this.syncRegistryFields();return results;
    }

    validate(){
      const errors=[],warnings=[];
      this.attachments.forEach((attachment,childId)=>{
        if(!this.registry?.getAssetById?.(childId))errors.push({code:'attachment-child-missing',childAssetId:childId});
        if(attachment.attached&&!this.registry?.getAssetById?.(attachment.targetAssetId))errors.push({code:'attachment-parent-missing',childAssetId:childId,targetAssetId:attachment.targetAssetId});
        if(attachment.attached&&!this.getSurface(attachment.targetAssetId,attachment.targetSurfaceId))errors.push({code:'attachment-surface-missing',childAssetId:childId,targetSurfaceId:attachment.targetSurfaceId});
        if(attachment.attached&&!this.getAnchor(childId,attachment.sourceAnchorId))errors.push({code:'attachment-anchor-missing',childAssetId:childId,sourceAnchorId:attachment.sourceAnchorId});
        if(!attachment.valid)warnings.push({code:'attachment-invalid',childAssetId:childId,warnings:clone(attachment.validationWarnings)});
      });
      return{valid:errors.length===0,errors,warnings,stats:{attachments:this.attachments.size,attached:[...this.attachments.values()].filter(item=>item.attached).length,invalid:[...this.attachments.values()].filter(item=>!item.valid).length}};
    }

    wouldCreateCycle(childAssetId,targetAssetId){let current=String(targetAssetId||''),guard=0;while(current&&guard++<100){if(current===childAssetId)return true;current=this.getParent(current);}return false;}

    rebuildGraph(){
      this.children.clear();this.attachments.forEach((attachment,childId)=>{if(!attachment.attached||!attachment.targetAssetId)return;const set=this.children.get(attachment.targetAssetId)||new Set();set.add(childId);this.children.set(attachment.targetAssetId,set);});
    }

    syncRegistryFields(){
      (this.registry?.listAssets?.()||[]).forEach(asset=>{const attachment=this.attachments.get(asset.id);asset.attachment=attachment?clone(attachment):null;asset.parentAssetId=attachment?.attached?attachment.targetAssetId:null;asset.childAssetIds=this.getChildren(asset.id);});
    }

    changed(type,assetId){this.syncRegistryFields();if(this.onChange)this.onChange({type,assetId,state:this.serialize(),graph:this});}
  }

  const createGraph=(registry,snapEngine,options)=>new AssetAttachmentGraph(registry,snapEngine,options);
  global.YPAssetAttachmentGraph=Object.freeze({ATTACHMENT_GRAPH_VERSION,SNAP_MODES,PARENT_REMOVED_WARNING,OUT_OF_BOUNDS_WARNING,AssetAttachmentGraph,createGraph,normalizeAttachment,surfaceBasis,rotateVector});
})(typeof globalThis!=='undefined'?globalThis:window);
