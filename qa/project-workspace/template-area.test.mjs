import test from 'node:test';
import assert from 'node:assert/strict';
await import('../../public/yp-web-ai/js/template-area.js');
const api=globalThis.YPTemplateArea;
const source={spec:{W:6,D:3,H:2.4,type:'penin',objects:[{position:{x:2,y:1,z:2.5},size:{w:1,d:.5,h:1},groupId:'tv',locked:true}],wallStickers:{back:{mode:'cover',data:'image'}},boothTemplate:{id:'test'}},assets:[{id:'logo'}]};
test('larger current area is preferred; source area stays available',()=>{
  const options=api.options(source.spec,{W:6,D:6,H:2.4});
  assert.equal(options.preferred,'current');assert.equal(options.original.D,3);assert.equal(options.current.D,6);
});
test('area adaptation preserves parts, coordinates, groups, artwork and input',()=>{
  const before=structuredClone(source),out=api.apply(source,{W:6,D:6,H:2.4});
  assert.deepEqual(source,before);assert.equal(out.spec.D,6);
  for(const key of ['objects','wallStickers','boothTemplate'])assert.deepEqual(out.spec[key],source.spec[key]);
  assert.deepEqual(out.assets,source.assets);out.spec.objects[0].size.w=9;assert.equal(source.spec.objects[0].size.w,1);
});
test('smaller area is explicit, invalid sizes are rejected, fixed/same areas omit choice',()=>{
  assert.equal(api.options(source.spec,{W:3,D:3,H:2.4}).preferred,'original');
  assert.equal(api.apply(source,{W:3,D:3,H:2.4}).spec.W,3);
  assert.equal(api.options(source.spec,source.spec),null);
  assert.equal(api.options({...source.spec,type:'photo360'},{W:6,D:6,H:2.4}),null);
  for(const area of [{W:NaN,D:6,H:2.4},{W:6,D:0,H:2.4},{W:6,D:6,H:5},{W:31,D:6,H:2.4}])assert.throws(()=>api.apply(source,area));
});
