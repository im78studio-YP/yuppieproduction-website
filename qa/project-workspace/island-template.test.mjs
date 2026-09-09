import test from 'node:test';
import assert from 'node:assert/strict';
import '../../public/yp-web-ai/js/island-templates.js';
const lib=globalThis.YPIslandTemplates;
for(const t of lib.templates){const catalog=[...new Set(t.objects.map(o=>o.catalogId))].map(catalogId=>({catalogId,type:catalogId,unitPrice:0}));
test('Island is 6x6, no perimeter walls, all authored pieces fit the footprint',()=>{const initial={logo:'data:yp-logo',wallStickerFaces:['back']},before=structuredClone(initial),s=lib.build(t.id,initial,catalog).spec;assert.deepEqual(initial,before);assert.equal(s.type,'island');assert.equal(s.W,6);assert.equal(s.D,6);assert.equal(s.H,3);assert.deepEqual(s.wallStickerFaces,[]);assert.equal(s.stSize,'none');for(const o of s.objects){assert.ok(o.position.x-o.size.w/2>=0,o.id);assert.ok(o.position.x+o.size.w/2<=6,o.id);assert.ok(o.position.z-o.size.d/2>=0,o.id);assert.ok(o.position.z+o.size.d/2<=6,o.id);assert.ok(o.position.y+o.size.h<=3,o.id);}});
test('TV is a separate two-piece group and YP logos retain artwork',()=>{const s=lib.build(t.id,{logo:'data:yp-logo'},catalog).spec,group=s.objects.filter(o=>o.groupId);assert.equal(group.length,t.id==='island-blue-ribbon'?4:2);assert.equal(group[0].groupId,group[1].groupId);assert.ok(s.objects.filter((o,i)=>t.objects[i].brandLogo).every(o=>o.appearance.textureData==='data:yp-logo'));});
}
