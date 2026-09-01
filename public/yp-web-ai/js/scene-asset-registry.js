(function(global){
  'use strict';

  const REGISTRY_VERSION=1;
  const ASSET_CATEGORIES=Object.freeze(['structure','surface','furniture','branding','display','lighting','equipment','custom']);
  const HELPER_NAME_PATTERN=/(^|[-_])(grid|dimension|bounding|selection|outline|transform|snap|raycast|light-helper|debug|anchor-guide|magnetic-snap-preview)([-_]|$)/i;

  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const vector=(value={},fallback=0)=>({x:finite(value.x,fallback),y:finite(value.y,fallback),z:finite(value.z,fallback)});
  const positive=(value)=>Math.max(0,finite(value,0));

  function isSystemHelper(object){
    if(!object)return true;
    const data=object.userData||{},name=String(object.name||''),type=String(object.type||'');
    return data.systemHelper===true||data.anchorGuide===true||data.dimensionHelper===true||data.selectionHelper===true||
      object.isCamera===true||object.isLight===true||object.isLightProbe===true||object.isHelper===true||
      /(?:Camera|Helper|Controls)$/.test(type)||HELPER_NAME_PATTERN.test(name);
  }

  function isPhysicalObject(object){
    return !!object&&object.isMesh===true&&!isSystemHelper(object);
  }

  function clearAssetTags(object,assetId){
    if(!object)return;
    const clear=node=>{
      if(node?.userData?.assetId!==assetId)return;
      delete node.userData.assetId;delete node.userData.assetType;
    };
    clear(object);if(typeof object.traverse==='function')object.traverse(clear);
  }

  function normalizeSceneAsset(input={}){
    const id=String(input.id||'').trim();
    if(!id)throw new Error('SceneAsset.id is required');
    const category=ASSET_CATEGORIES.includes(input.category)?input.category:'custom';
    const transform=input.transform||{},bounds=input.bounds||{};
    return{
      id,
      name:String(input.name||id),
      assetType:String(input.assetType||'Custom Asset'),
      category,
      object3DId:String(input.object3DId||''),
      transform:{
        position:vector(transform.position),
        rotation:vector(transform.rotation),
        scale:vector(transform.scale,1)
      },
      bounds:{width:positive(bounds.width),height:positive(bounds.height),depth:positive(bounds.depth)},
      locked:input.locked===true,
      selectable:input.selectable!==false,
      movable:input.movable!==false,
      snapEnabled:input.snapEnabled!==false,
      metadata:input.metadata&&typeof input.metadata==='object'&&!Array.isArray(input.metadata)?clone(input.metadata):{}
    };
  }

  class SceneAssetRegistry{
    constructor(options={}){
      this.version=REGISTRY_VERSION;
      this.assets=new Map();
      this.objects=new Map();
      this.objectToAsset=new WeakMap();
      this.duplicateIds=new Set();
      this.onChange=typeof options.onChange==='function'?options.onChange:null;
      this.onTransform=typeof options.onTransform==='function'?options.onTransform:null;
      this.onRemove=typeof options.onRemove==='function'?options.onRemove:null;
    }

    registerAsset(input,object3D=null,options={}){
      const asset=normalizeSceneAsset(input),existing=this.assets.get(asset.id);
      if(existing&&!options.replace){
        this.duplicateIds.add(asset.id);
        throw new Error('Duplicate SceneAsset id: '+asset.id);
      }
      if(existing&&existing.object3DId&&!asset.object3DId)asset.object3DId=existing.object3DId;
      this.assets.set(asset.id,asset);
      if(object3D)this.bindObject3D(asset.id,object3D,options.objects||[]);
      this.emit('register',asset);
      return asset;
    }

    bindObject3D(assetId,object3D,additionalObjects=[]){
      const asset=this.assets.get(assetId);
      if(!asset||!object3D)return null;
      const object3DId=String(object3D.uuid||object3D.name||assetId);
      if(!asset.object3DId)asset.object3DId=object3DId;
      this.objects.set(assetId,object3D);
      const roots=[object3D,...additionalObjects].filter(Boolean),tag=node=>{
        if(!node||isSystemHelper(node))return;
        node.userData=node.userData||{};
        node.userData.assetId=asset.id;
        node.userData.assetType=asset.assetType;
        this.objectToAsset.set(node,asset.id);
      };
      roots.forEach(root=>{
        tag(root);
        if(typeof root.traverse==='function')root.traverse(child=>{
          if(isPhysicalObject(child)||child===root)tag(child);
        });
      });
      return object3D;
    }

    unregisterAsset(assetId,options={}){
      const id=String(assetId||''),asset=this.assets.get(id),object=this.objects.get(id);
      if(!asset)return false;
      if(object)clearAssetTags(object,id);
      if(options.removeObject3D===true&&object?.parent&&typeof object.parent.remove==='function')object.parent.remove(object);
      this.assets.delete(id);this.objects.delete(id);
      if(options.notifyWorkflow!==false&&this.onRemove)this.onRemove(clone(asset),options);
      this.emit('unregister',asset);
      return true;
    }

    clearObjectBindings(){
      this.objects.forEach((object,id)=>clearAssetTags(object,id));
      this.objects.clear();this.objectToAsset=new WeakMap();
    }

    syncAssets(records=[]){
      const incoming=new Map(records.map(record=>{const asset=normalizeSceneAsset(record);return[asset.id,asset];}));
      [...this.assets.keys()].filter(id=>!incoming.has(id)).forEach(id=>this.unregisterAsset(id,{notifyWorkflow:false}));
      incoming.forEach(asset=>this.registerAsset(asset,this.objects.get(asset.id)||null,{replace:true}));
      return this.listAssets();
    }

    getAssetById(assetId){return this.assets.get(String(assetId||''))||null;}

    getAssetByObject3D(object3D){
      let node=object3D||null;
      while(node){
        const id=this.objectToAsset.get(node)||node.userData?.assetId;
        if(id&&this.assets.has(id))return this.assets.get(id);
        node=node.parent||null;
      }
      return null;
    }

    getObject3DByAssetId(assetId){return this.objects.get(String(assetId||''))||null;}

    updateAssetTransform(assetId,transform={},options={}){
      const asset=this.getAssetById(assetId);if(!asset)return null;
      const next={
        position:vector(transform.position??asset.transform.position),
        rotation:vector(transform.rotation??asset.transform.rotation),
        scale:vector(transform.scale??asset.transform.scale,1)
      };
      asset.transform=next;
      const object=this.getObject3DByAssetId(assetId);
      if(options.applyToObject3D!==false&&object){
        if(object.position?.set)object.position.set(next.position.x,next.position.y,next.position.z);
        if(object.rotation?.set)object.rotation.set(next.rotation.x,next.rotation.y,next.rotation.z);
        if(object.scale?.set)object.scale.set(next.scale.x,next.scale.y,next.scale.z);
      }
      if(options.notifyWorkflow!==false&&this.onTransform)this.onTransform(clone(asset),options);
      this.emit('transform',asset);return asset;
    }

    listAssets(){return [...this.assets.values()];}
    listAssetsByCategory(category){return this.listAssets().filter(asset=>asset.category===category);}

    validateRegistry(sceneRoot=null,options={}){
      const errors=[],warnings=[],physicalObjects=[];
      this.duplicateIds.forEach(id=>errors.push({code:'duplicate-id',assetId:id,message:'Asset ID ซ้ำ: '+id}));
      this.assets.forEach(asset=>{
        const object=this.objects.get(asset.id);
        if(options.requireObject3D!==false&&!object)errors.push({code:'missing-object3d',assetId:asset.id,message:'Registry Asset ไม่มี Object3D: '+asset.id});
        if(object&&isSystemHelper(object))errors.push({code:'helper-registered',assetId:asset.id,message:'System Helper ถูกลงทะเบียนเป็น Asset: '+asset.id});
      });
      if(sceneRoot&&typeof sceneRoot.traverse==='function')sceneRoot.traverse(object=>{
        if(!isPhysicalObject(object))return;physicalObjects.push(object);
        const assetId=object.userData?.assetId;
        if(!assetId)errors.push({code:'physical-mesh-missing-asset-id',object3DId:String(object.uuid||object.name||''),message:'Physical Mesh ไม่มี assetId: '+String(object.name||object.uuid||'unnamed')});
        else if(!this.assets.has(assetId))errors.push({code:'physical-mesh-unregistered',assetId,object3DId:String(object.uuid||object.name||''),message:'Physical Mesh อ้างถึง Asset ที่ไม่มีใน Registry: '+assetId});
      });
      return{valid:errors.length===0,errors,warnings,stats:{assets:this.assets.size,boundObjects:this.objects.size,physicalMeshes:physicalObjects.length}};
    }

    serialize(){return{version:this.version,assets:this.listAssets().map(asset=>clone(asset))};}

    emit(type,asset){if(this.onChange)this.onChange({type,asset:clone(asset),registry:this});}
  }

  function createRegistry(options){return new SceneAssetRegistry(options);}

  global.YPSceneAssetRegistry=Object.freeze({
    REGISTRY_VERSION,ASSET_CATEGORIES,SceneAssetRegistry,createRegistry,normalizeSceneAsset,isSystemHelper,isPhysicalObject
  });
})(typeof globalThis!=='undefined'?globalThis:window);
