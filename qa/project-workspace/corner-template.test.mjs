import test from 'node:test';
import assert from 'node:assert/strict';
import '../../public/yp-web-ai/js/corner-templates.js';
const lib=globalThis.YPCornerTemplates,t=lib.templates[0];
const initial={wallStickerFaces:['back','left'],wallStickers:{left:{data:'readable left'},right:{data:'right'},back:{data:'back'}},assetAttachmentGraph:{attachments:[]}};
const catalog=[...new Set(t.objects.map(o=>o.catalogId))].map(catalogId=>({catalogId,type:'panel',unitPrice:0}));
test('corner template fits 6x3 on both sides and has four bar stools',()=>{
  for(const side of ['left','right']){const {spec:s}=lib.build(t.id,initial,catalog,side);assert.equal(s.W,6);assert.equal(s.D,3);assert.equal(s.cornerSide,side);assert.equal(s.objects.filter(o=>o.catalogId==='bar-stool').length,4);
    for(const o of s.objects){assert.ok(o.position.x-o.size.w/2>=-1e-9);assert.ok(o.position.x+o.size.w/2<=6+1e-9);assert.ok(o.position.z-o.size.d/2>=-1e-9);assert.ok(o.position.z+o.size.d/2<=3+1e-9);assert.ok(o.position.y+o.size.h<=2.4+1e-9);}
  }
});
test('mirror preserves edits and readable graphics without mutating source',()=>{
  const s=lib.build(t.id,initial,catalog).spec;s.objects[0].position.x=1.85;s.objects[0].rotationY=27;s.objects[0].rotationZ=12;s.objects[0].appearance.color='#123456';const before=structuredClone(s),m=lib.mirror(s,'left');
  assert.deepEqual(s,before);assert.equal(m.objects[0].position.x,4.15);assert.equal(m.objects[0].rotationY,333);assert.equal(m.objects[0].rotationZ,348);assert.deepEqual(m.objects[0].size,s.objects[0].size);assert.deepEqual(m.objects[0].appearance,s.objects[0].appearance);assert.deepEqual(m.wallStickers.right,s.wallStickers.left);assert.equal(m.wallStickers.back.data,'back');assert.equal(m.logoWallU,1.7999999999999998);assert.deepEqual(m.wallStickerFaces,['back','right']);
  const again=lib.mirror(m,'right');s.objects.forEach((o,i)=>assert.ok(Math.abs(again.objects[i].position.x-o.position.x)<1e-9));assert.deepEqual(lib.mirror(m,'left'),m);
});
test('invalid side or attachment constraints cannot silently change the scene',()=>{
  const s=lib.build(t.id,initial,catalog).spec;s.assetAttachmentGraph.attachments.push({id:'anchor'});const before=structuredClone(s);assert.throws(()=>lib.mirror(s,'left'),/จุดยึด/);assert.throws(()=>lib.mirror(s,'invalid'));assert.deepEqual(s,before);
});
