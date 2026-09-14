import test from 'node:test';
import assert from 'node:assert/strict';
import '../../public/yp-web-ai/js/resize-anchor.js';
test('default reference is base center and invalid saved values safely fall back',()=>{
 assert.deepEqual(YPResizeAnchor.get({}),{x:.5,y:0,z:.5});assert.deepEqual(YPResizeAnchor.get({transform:{resizeAnchor:{x:Infinity,y:-1,z:'front'}}}),{x:.5,y:0,z:.5});
});
test('all 27 reference points are stored without changing other transforms',()=>{
 for(const x of [0,.5,1])for(const y of [0,.5,1])for(const z of [0,.5,1]){const o={size:{w:3,d:2,h:1},position:{x:1,y:2,z:3},transform:{flipX:true,uniformScale:2}},before=JSON.stringify([o.size,o.position]);assert.ok(YPResizeAnchor.set(o,{x,y,z}));assert.deepEqual(YPResizeAnchor.get(o),{x,y,z});assert.ok(o.transform.flipX);assert.equal(o.transform.uniformScale,2);assert.equal(JSON.stringify([o.size,o.position]),before);}
});
test('invalid anchor selection is rejected without mutation',()=>{const o={transform:{flipY:true}},before=JSON.stringify(o);assert.equal(YPResizeAnchor.set(o,{x:2,y:0,z:.5}),false);assert.equal(JSON.stringify(o),before);});
