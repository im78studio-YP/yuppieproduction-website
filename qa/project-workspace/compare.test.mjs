import test from 'node:test';
import assert from 'node:assert/strict';
await import('../../public/yp-web-ai/js/compare.js');
const api=globalThis.YPCompare;
const snapshot=(W=6)=>({spec:{W,D:3,H:2.4,type:'inline',objects:[]},assets:[]});
test('missing B is explicit and does not create a variant',()=>{const p={variants:{A:snapshot(),B:null}};assert.equal(api.compare(p).B,null);assert.equal(p.variants.B,null);assert.equal(api.compare(p).rows.length,0);});
test('counts match catalog objects and distinguish hidden objects',()=>{
  const a=snapshot(),b=snapshot(9);a.spec.objects=[{id:'one',catalogId:'chair',name:'Chair',visible:false},{id:'two',catalogId:'chair'}];b.spec.objects=[{id:'table',catalogId:'table'}];
  const p={variants:{A:a,B:b}},before=structuredClone(p),result=api.compare(p);
  assert.equal(result.A.count,2);assert.equal(result.A.hidden,1);assert.equal(result.rows.find(r=>r.id==='chair').a,'2');assert.equal(result.rows.find(r=>r.id==='chair').b,'0');assert.equal(result.rows.find(r=>r.id==='table').b,'1');assert.deepEqual(p,before);
});
test('same inputs produce same camera and comparison',()=>{const p={variants:{A:snapshot(),B:snapshot()}},c=api.cameras(p);assert.deepEqual(c.A,c.B);assert.ok(api.compare(p).rows.every(r=>!r.different));});
test('different booth sizes share orthographic frame and view direction',()=>{const p={variants:{A:snapshot(3),B:snapshot(12)}},c=api.cameras(p);assert.deepEqual(c.A.frustum,c.B.frustum);for(const k of ['x','y','z'])assert.ok(Math.abs((c.A.position[k]-c.A.target[k])-(c.B.position[k]-c.B.target[k]))<1e-9);assert.equal(c.A.projection,'orthographic');});
test('large rotated/scaled or out-of-bounds objects expand the shared frame',()=>{const p={variants:{A:snapshot(),B:snapshot()}},old=api.cameras(p).A.frustum.top;p.variants.B.spec.objects=[{id:'large',catalogId:'x',size:{w:5,d:5,h:5},position:{x:20,y:0,z:0},rotationY:45,transform:{uniformScale:3}}];const c=api.cameras(p);assert.ok(c.A.frustum.top>old);assert.deepEqual(c.A.frustum,c.B.frustum);});
test('camera resize is not a design edit but actual dimensions invalidate comparison',()=>{const p={variants:{A:snapshot(),B:snapshot()}},before=api.signature(p);p.variants.A.spec.aiRendering={camera:{aspect:2}};p.variants.A.spec.view='three';assert.equal(api.signature(p),before);p.variants.A.spec.W=9;assert.notEqual(api.signature(p),before);});
