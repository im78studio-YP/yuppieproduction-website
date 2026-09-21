import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import '../../public/yp-web-ai/js/selection-editor.js';
const resolve=globalThis.YPSelectionEditor.resolve;
test('explicit scene roles route to their editors, not their visible names',()=>{
 for(const [id,page,tab]of [['branding.logo.main','signage'],['structure.wall.left','finish','wall'],['branding.graphic.wall.back','finish','wall'],['structure.floor.main','finish','floor'],['branding.graphic.floor','finish','floor'],['structure.room.main','storage'],['structure.door.main','storage'],['lighting.fixture.manual','lighting'],['equipment.platform.photo360','booth']]){
  const r=resolve([{id}]);assert.equal(r.page,page);assert.equal(r.tab,tab);
 }
 assert.equal(resolve([{id:'obj-1',name:'Logo Wall',object:{}}]).kind,'asset');
 assert.equal(resolve([{id:'obj-2',object:{logoSlot:true}}],{isLogo:o=>o?.logoSlot}).kind,'logo');
 assert.equal(resolve([{id:'lighting-a',lightingFixtureId:'a'}]).fixtureId,'a');
});
test('multi-selection has one common editor regardless of primary type; no selection has no route',()=>{
 assert.equal(resolve([]),null);
 for(const items of [[{id:'branding.logo.main'},{id:'obj-1',object:{}}],[{id:'structure.wall.back'},{id:'structure.floor.main'}]])assert.deepEqual(resolve(items),{page:'catalog',tab:'editor',kind:'multi'});
});
const html=readFileSync(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
test('all inline application scripts parse',()=>{
 for(const [,attrs,body]of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!attrs.includes('src=')&&!attrs.includes('type='))new vm.Script(body);
});
test('completed 3D click opens editor only after finishing drag, never on drag or cancel',()=>{
 const source=html.match(/this\.onObjectPointerUp=e=>\{([\s\S]*?)\n    \};/)[1];
 const events=[],context={Math,openSelectionEditor:()=>events.push('editor'),selectObject:()=>events.push('clear'),selectSceneItem:()=>events.push('scene')};
 const up=vm.runInNewContext('(function(e){'+source+'})',context);
 const run=(type,x=12,moved=false,clear=false,scene=false)=>{events.length=0;const renderer={assetEditorClick:{id:'x',pointerId:1,x:12,y:14,clear,scene},pointerDrag:{moved},finishObjectDrag:()=>events.push('finish')};up.call(renderer,{type,pointerId:1,clientX:x,clientY:14});return [...events];};
 assert.deepEqual(run('pointerup'),['finish','editor']);
 assert.deepEqual(run('pointerup',30),['finish']);
 assert.deepEqual(run('pointerup',12,true),['finish']);
 assert.deepEqual(run('pointercancel'),['finish']);
 assert.deepEqual(run('pointerup',12,false,true),['finish','clear']);
 assert.deepEqual(run('pointerup',12,false,false,true),['finish','scene']);
 assert.deepEqual(run('pointerup',30,false,false,true),['finish']);
});
test('shared router directs the selected face and fixture; modal/tool mode suppresses routing',()=>{
 const source=html.match(/function openSelectionEditor\(\)\{[\s\S]*?\n\}/)[0],calls=[];
 let blocked=false,items=[];
 const c={YPSelectionEditor:globalThis.YPSelectionEditor,selectionInteractionBlocked:()=>blocked,selectedSceneItemIds:()=>items.map(i=>i.id),sceneItemById:id=>items.find(i=>i.id===id),
  YPLogoReplacement:{isLogo:o=>o?.logoSlot,onSelect:id=>calls.push(['logo',id])},YPWallFinishUI:{openFace:face=>calls.push(['wall',face])},
  document:{querySelector:()=>null},setAssetTab:tab=>calls.push(['asset',tab]),showDockPage:page=>calls.push(['page',page]),selectFinishTab:tab=>calls.push(['finish',tab]),
  syncSelectionEditorContext:()=>{},syncAutoLightingFixtureEditor:()=>calls.push(['fixture',c.selectedAutoLightingFixtureId]),selectedAutoLightingFixtureId:null};
 vm.createContext(c);vm.runInContext(source,c);
 items=[{id:'branding.graphic.wall.right'}];c.openSelectionEditor();assert.deepEqual(calls.splice(0),[['wall','right']]);
 items=[{id:'lighting-a',lightingFixtureId:'a'}];c.openSelectionEditor();assert.deepEqual(calls.splice(0),[['page','lighting'],['fixture','a']]);
 items=[{id:'structure.floor.main'}];c.openSelectionEditor();assert.deepEqual(calls.splice(0),[['page','finish'],['finish','floor']]);
 blocked=true;assert.equal(c.openSelectionEditor(),false);assert.deepEqual(calls,[]);
});
