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
test('measured geometry removes excess padding without changing relative scale',()=>{
  const p={variants:{A:snapshot(),B:snapshot()}};
  p.variants.A.spec.objects=[{size:{w:6,d:.1,h:.1},position:{x:3,y:2.3,z:.3}}];
  const old=api.cameras(p),bounds={A:{min:[0,0,0],max:[6,2.4,3]},B:{min:[0,0,0],max:[6,2.4,3]}};
  const fitted=api.cameras(p,bounds);assert.ok(fitted.A.frustum.top<old.A.frustum.top/2);
  assert.deepEqual(fitted.A,fitted.B);assert.equal(fitted.A.zoom,1);
  // The entire world-space bounding box must fit within the shared frame.
  const len=Math.hypot(1,.7,1),right=[Math.SQRT1_2,0,-Math.SQRT1_2],up=[-.7*Math.SQRT1_2/len,Math.SQRT2/len,-.7*Math.SQRT1_2/len];
  for(const x of [0,6])for(const y of [0,2.4])for(const z of [0,3]){
    const v=[x-3,y-1.2,z-1.5],dot=axis=>v.reduce((sum,n,i)=>sum+n*axis[i],0);
    assert.ok(Math.abs(dot(right))<fitted.A.frustum.right);assert.ok(Math.abs(dot(up))<fitted.A.frustum.top);
  }
});
test('invalid measured bounds fail instead of clipping silently',()=>{
  const p={variants:{A:snapshot(),B:snapshot()}};
  assert.throws(()=>api.cameras(p,{A:{min:[0,0,0],max:[NaN,3,3]}}));
});
