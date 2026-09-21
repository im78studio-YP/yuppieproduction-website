import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import '../../public/yp-web-ai/js/design-history.js';
const {create,signature}=globalThis.YPDesignHistory;
const snap=(extra={})=>({spec:{W:6,D:3,H:2.4,floor:'carpet',objects:[],...extra},assets:[]});
test('undo/redo restores the entire design, not just objects',()=>{
 const h=create(),a=snap(),b=snap({W:8,floor:'sticker',wallStickers:{back:{data:'original-image'}},logo:'logo-image',lights:false,stSize:'small',wallRadius:4,objects:[{id:'counter',position:{x:2}}]});h.reset('A',a);h.record(b);
 let restored;h.move('undo',s=>restored=s);assert.deepEqual(restored,a);h.move('redo',s=>restored=s);assert.deepEqual(restored,b);
});
test('A and B have independent histories and switching does not add a step',()=>{
 const h=create(),a=snap(),aa=snap({W:8}),b=snap({D:6}),bb=snap({D:7});h.reset('A',a);h.record(aa);h.activate('B',b);h.record(bb);h.activate('A',aa);
 assert.deepEqual(h.state(),{active:'A',undo:1,redo:0});h.move('undo',s=>assert.equal(s.spec.W,6));h.activate('B',bb);h.move('undo',s=>assert.equal(s.spec.D,6));
});
test('reset/template replacement can be undone and a new edit clears redo',()=>{
 const h=create(),initial=snap(),custom=snap({logo:'upload',objects:[{id:'x'}]});h.reset('A',custom);h.record(initial);h.move('undo',s=>assert.equal(s.spec.logo,'upload'));h.record(snap({floor:'wood'}));assert.equal(h.state().redo,0);
});
test('uploads remain available across deletion, including binary model bytes',async()=>{
 const h=create(),withFile=snap({objects:[{catalogId:'custom'}]});withFile.assets=[{id:'custom',file:new Blob(['GLB original'])}];h.reset('A',withFile);h.record(snap());let restored;h.move('undo',s=>restored=s);assert.equal(await restored.assets[0].file.text(),'GLB original');
});
test('camera/view/derived registry changes are not edits; real settings are',()=>{
 const a=snap({view:'three',aiRendering:{quality:'high',camera:{x:1}}}),b=snap({view:'plan',sceneAssetRegistry:{time:123},logoVisibleBounds:{x:4},aiRendering:{quality:'high',camera:{x:20}}});assert.equal(signature(a),signature(b));
 b.spec.aiRendering.quality='low';assert.notEqual(signature(a),signature(b));
});
test('bounded history, detached snapshots, and restoration failure safety',()=>{
 const h=create(3),a=snap();h.reset('A',a);a.spec.W=100;for(let i=0;i<5;i++)h.record(snap({W:7+i}));assert.equal(h.state().undo,3);
 assert.throws(()=>h.move('undo',()=>{throw Error('blocked drag');}));assert.equal(h.state().undo,3);assert.equal(h.state().redo,0);
 h.reset('B',snap());assert.deepEqual(h.state(),{active:'B',undo:0,redo:0});
});
test('main controls, shortcuts and workspace replacement use shared history',()=>{
 const html=fs.readFileSync('public/yp-web-ai/index.html','utf8'),workspace=fs.readFileSync('public/yp-web-ai/js/project-workspace.js','utf8');
 assert.ok(html.indexOf('js/design-history.js')<html.indexOf('js/project-workspace.js'));assert.match(html,/YPDesignHistoryController.undo\(\)/);assert.match(html,/YPDesignHistoryController.redo\(\)/);
 assert.match(workspace,/history.observe\(\)/);assert.match(workspace,/apply\(next,'switch'\)/);assert.match(workspace,/apply\(next,'edit'\)/);assert.match(workspace,/history.applied\(resetKind/);
 new vm.Script(workspace);new vm.Script(fs.readFileSync('public/yp-web-ai/js/design-history.js','utf8'));
});
