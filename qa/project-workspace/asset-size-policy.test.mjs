import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const code=html.slice(html.indexOf('function defaultAssetTransformPolicy('),html.indexOf('function normalizeSceneObjectModel('));
const context=vm.createContext({ASSET_TRANSFORM_POLICY_VERSION:5,TRANSFORM_MODES:['move','resize','scale'],isEntranceFrameObject:()=>false,isDownlightBeamObject:()=>false,clampNumber:(v,l,h)=>Math.max(l,Math.min(h,v))});vm.runInContext(code,context);
const policy=(obj,item)=>context.normalizeAssetTransformPolicy(obj,item);
const procedural=['panel','roundedPanel','slantRibbon','glassCase','loungeSofa','ringPendant','ringDisplay','trailingPlant','grassPlanter','organicDisplay','barStool','plant'];
for(const type of procedural)test(type+' dimensions supported and legacy inferred policy migrates without altering design',()=>{
 const obj={type,locked:true,size:{w:6,d:.1,h:3},position:{x:2,y:0,z:1},appearance:{textureData:'customer-logo'},transform:{flipX:true,uniformScale:1.5},transformPolicy:{version:4,family:'generic',canResize:false,canScale:false,canMove:true,defaultMode:'move'}};
 const before=JSON.stringify({...obj,transformPolicy:null}),p=policy(obj,{type,category:'display',modelUrl:null});
 assert.equal(p.canResize,true);assert.equal(p.canScale,true);assert.equal(p.family,'parametric');assert.equal(p.version,5);assert.equal(p.defaultMode,'resize');assert.equal(JSON.stringify({...obj,transformPolicy:null}),before);
 const again=JSON.stringify(p);policy(obj,{type,category:'display',modelUrl:null});assert.equal(JSON.stringify(obj.transformPolicy),again);
});
test('catalogue prohibitions and current explicit object restrictions are preserved',()=>{
 const item={type:'panel',category:'display',transformPolicy:{canResize:false,canScale:false}};
 assert.equal(policy({type:'panel',transformPolicy:{version:4,canResize:true,canScale:true}},item).canResize,false);
 assert.equal(policy({type:'panel',transformPolicy:{version:5,canResize:false,canScale:false}},{type:'panel',category:'display'}).canResize,false);
 const set=policy({type:'table'},{type:'table',modelUrl:'set.glb',transformPolicy:{canResize:false,canScale:true,defaultMode:'scale'}});assert.equal(set.canResize,false);assert.equal(set.canScale,true);
});
test('ready-made unknown GLB stays restricted, declared GLB and My Asset remain resizable',()=>{
 assert.equal(policy({type:'unknown'},{type:'unknown',modelUrl:'unknown.glb'}).canResize,false);
 assert.equal(policy({type:'unknown'},{type:'unknown',modelUrl:'declared.glb',capabilities:['resizable']}).canResize,true);
 assert.equal(policy({type:'unknown',catalogId:'my-asset-example'},{customAsset:true,modelUrl:'user.glb'}).canResize,true);
});
test('all dimension editors and drag share the central 30 m bound',()=>{
 assert.match(html,/MAX_ASSET_DIMENSION=30/);assert.match(html,/MAX_ASSET_DIMENSION\/drag.initialSize.w/);
 for(const file of ['resize-submenu.js','asset-editor/asset-editor.js']){const src=readFileSync(new URL('../../public/yp-web-ai/js/'+file,import.meta.url),'utf8');assert.ok(src.includes('MAX_ASSET_DIMENSION'));assert.ok(!src.includes('max="5"'));}
});
