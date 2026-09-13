(function(root){
  'use strict';
  const steps=['business','layout','template','customize','review'];
  function designSignature(spec){
    const design=structuredClone(spec);
    // Renderer-derived data can settle after the Wizard opens (notably SVG
    // alpha bounds). Their authored sources remain in objects/sceneItemState,
    // logo controls and attachmentGraph, so real edits still invalidate the draft.
    for(const key of ['logoVisibleBounds','sceneAssetRegistry','sceneSnapData','view'])delete design[key];
    if(design.aiRendering){
      // Keep user choices (quality, style, enhancement settings, etc.). Exclude
      // only the active viewport and generated request/result caches.
      for(const key of ['camera','cameraViewType','preview','renderPackage'])delete design.aiRendering[key];
    }
    // A serialization/property insertion order change is not an authored edit.
    return JSON.stringify(design,(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)
      ?Object.fromEntries(Object.keys(value).sort().map(key=>[key,value[key]])):value);
  }
  function validate(d){
    if(!d.businessCategoryId)return 'กรุณาเลือกหมวดธุรกิจ';
    if(d.businessCategoryId==='other'&&!String(d.customBusinessCategory||'').trim())return 'กรุณาระบุประเภทธุรกิจ';
    if(!['inline','corner','penin','island'].includes(d.boothType))return 'กรุณาเลือกรูปแบบบูธ';
    if(d.boothType==='corner'&&!['left','right'].includes(d.cornerSide))return 'กรุณาเลือกด้านหัวมุม';
    if(!Number.isFinite(d.width)||d.width<1||d.width>30||!Number.isFinite(d.depth)||d.depth<1||d.depth>30)return 'กว้างและลึกต้องอยู่ระหว่าง 1–30 เมตร';
    if(!Number.isFinite(d.height)||d.height<2.4||d.height>4.9)return 'สูงต้องอยู่ระหว่าง 2.4–4.9 เมตร';
    return '';
  }
  // Work only on a detached snapshot. Geometry, graphics, files and attachments
  // stay untouched; changing area is explicitly not a furniture scale operation.
  function build(base,d,normalizeBrief){
    const error=validate(d);if(error)throw Error(error);
    const out=structuredClone(base),s=out.spec;
    Object.assign(s,{cat:d.businessCategoryId,customBusinessCategory:d.businessCategoryId==='other'?String(d.customBusinessCategory||'').trim():'',businessBrief:normalizeBrief(d.businessBrief),
      W:d.width,D:d.depth,H:d.height,type:d.boothType,cornerSide:d.cornerSide||'right',view:'three'});
    if(d.theme){s.boothColorTheme=structuredClone(d.theme);s.primary=d.theme.primary;s.colTouched=true;}
    if(d.floorChanged)Object.assign(s,{floor:d.floor,tile:d.tile,carpet:d.carpet,raise:Number(d.raise)});
    if(d.roomMode==='add')Object.assign(s,{stSize:'a',stW:1.2,stD:1.2,stHmode:2.4,stHv:2.4,stPos:'right',stDoor:'left',doorTouched:true});
    if(d.roomMode==='remove-standard')s.stSize='none';
    return out;
  }
  root.YPWizardModel={steps,validate,build,designSignature};
})(globalThis);
