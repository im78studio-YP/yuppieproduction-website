import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const moduleSource=fs.readFileSync(path.join(root,'public/yp-web-ai/js/scene-asset-registry.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/yp-web-ai/index.html'),'utf8');
const context={globalThis:{}};vm.createContext(context);vm.runInContext(moduleSource,context);
const api=context.globalThis.YPSceneAssetRegistry;

const fakeNode=(name,{mesh=false,helper=false}={})=>({
  name,uuid:'uuid-'+name,isMesh:mesh,userData:helper?{systemHelper:true}:{},children:[],parent:null,
  position:{set(){}},rotation:{set(){}},scale:{set(){}},
  add(...children){children.forEach(child=>{child.parent=this;this.children.push(child);});},
  remove(child){this.children=this.children.filter(item=>item!==child);child.parent=null;},
  traverse(visitor){visitor(this);this.children.forEach(child=>child.traverse(visitor));}
});
const asset=(id='asset-1',category='furniture')=>({id,name:'Asset',assetType:'Furniture',category,object3DId:'scene.'+id,
  transform:{position:{x:1,y:0,z:2},rotation:{x:0,y:0,z:0},scale:{x:1,y:1,z:1}},bounds:{width:1,height:1,depth:1},
  locked:false,selectable:true,movable:true,snapEnabled:true,metadata:{status:'Approved'}});

test('SceneAsset schema มีข้อมูลบังคับและ category มาตรฐาน',()=>{
  const normalized=api.normalizeSceneAsset(asset());
  assert.deepEqual(Object.keys(normalized),['id','name','assetType','category','object3DId','transform','bounds','locked','selectable','movable','snapEnabled','metadata']);
  assert.deepEqual(Array.from(api.ASSET_CATEGORIES),['structure','surface','furniture','branding','display','lighting','equipment','custom']);
});

test('Registry API ลงทะเบียน ค้นจาก ID/Object3D แยก category และ update transform',()=>{
  const registry=api.createRegistry(),rootNode=fakeNode('counter'),mesh=fakeNode('counter-body',{mesh:true});rootNode.add(mesh);
  registry.registerAsset(asset(),rootNode);
  assert.equal(registry.getAssetById('asset-1').name,'Asset');
  assert.equal(registry.getAssetByObject3D(mesh).id,'asset-1');
  assert.equal(registry.getObject3DByAssetId('asset-1'),rootNode);
  assert.equal(registry.listAssets().length,1);assert.equal(registry.listAssetsByCategory('furniture').length,1);
  registry.updateAssetTransform('asset-1',{position:{x:2,y:3,z:4}});assert.equal(registry.getAssetById('asset-1').transform.position.y,3);
  assert.equal(registry.getAssetById('asset-1').object3DId,'scene.asset-1');
  assert.equal(mesh.userData.assetId,'asset-1');assert.equal(mesh.userData.assetType,'Furniture');
});

test('Duplicate ID ถูกปฏิเสธและรายงาน Validation',()=>{
  const registry=api.createRegistry(),node=fakeNode('one',{mesh:true});registry.registerAsset(asset(),node);
  assert.throws(()=>registry.registerAsset(asset(),fakeNode('two',{mesh:true})),/Duplicate SceneAsset id/);
  const report=registry.validateRegistry(node);assert.equal(report.valid,false);assert.ok(report.errors.some(error=>error.code==='duplicate-id'));
});

test('System Helper ไม่ถูกนับเป็น Physical Asset และ unregister cleanup Object3D',()=>{
  const registry=api.createRegistry(),scene=fakeNode('scene'),rootNode=fakeNode('asset-root'),mesh=fakeNode('physical',{mesh:true}),helper=fakeNode('grid-helper',{mesh:true,helper:true});
  rootNode.add(mesh,helper);scene.add(rootNode);registry.registerAsset(asset(),rootNode);
  assert.equal(helper.userData.assetId,undefined);assert.equal(registry.validateRegistry(scene).valid,true);
  assert.equal(registry.unregisterAsset('asset-1',{removeObject3D:true,notifyWorkflow:false}),true);assert.equal(scene.children.length,0);
  assert.equal(mesh.userData.assetId,undefined);assert.equal(mesh.userData.assetType,undefined);
});

test('หน้า Editor เชื่อม Stable Structure IDs, Project State, Object3D binding และ Asset List groups',()=>{
  for(const token of [
    'js/scene-asset-registry.js','sceneAssetRegistry:{version:1,assets:[]}','structure.floor.main','structure.wall.back','structure.wall.left','structure.wall.right',
    'structure.room.main','structure.door.main','bindSceneAssetRegistryObjects','syncSceneAssetRegistryState',
    "{key:'surface',label:'ผนังและพื้น'}","{key:'room-door',label:'ห้องและประตู'}","{key:'suggested',label:'Suggested'}","{key:'custom',label:'Custom'}",
    'window.SceneAssetRegistryAPI','window.validateSceneAssetRegistry'
  ])assert.ok(html.includes(token),token);
  assert.ok(moduleSource.includes('node.userData.assetId'));
  assert.ok(html.includes('dataset.sceneRegistryValid'));
});

test('Compatibility รักษา Existing Asset ID และ migrate sceneItemState เดิม',()=>{
  assert.match(html,/id:obj\.id[\s\S]*object3DId:'scene\.asset\.'\+obj\.id/);
  assert.match(html,/migrateLegacySceneAssetState[\s\S]*SCENE_ASSET_LEGACY_IDS/);
  assert.match(html,/sceneAssetRegistry:S\.sceneAssetRegistry\|\|null/);
  assert.match(html,/S\.sceneAssetRegistry=parsed\?\.sceneAssetRegistry/);
});

test('Registry ครอบ Booth Types และไม่แตะ Smart Snap behavior',()=>{
  for(const type of ['inline','corner','penin','island'])assert.ok(html.includes(`k:'${type}'`)||html.includes(`type==='${type}'`),type);
  assert.ok(html.includes("sourceAnchorId=String(hit.object.userData.snapAnchorId||'')"));
  assert.ok(html.includes('screenAnchorSnap(event,obj,drag)'));
});

test('Counter ถูกจัดเป็น Furniture ไม่ชนคำค้น Beam ภาษาไทย',()=>{
  const source=html.match(/function sceneObjectAssetSemantics\(obj,item=objectCatalogDef\(obj\?\.catalogId\)\)\{[\s\S]*?\n\}/)?.[0];
  assert.ok(source);
  const semantics=vm.runInNewContext('('+source+')',{});
  assert.deepEqual(JSON.parse(JSON.stringify(semantics({type:'counter'},{name:'เคาน์เตอร์',category:'reception'}))),{assetType:'Counter',category:'furniture',listGroup:'furniture',status:'Approved'});
});
