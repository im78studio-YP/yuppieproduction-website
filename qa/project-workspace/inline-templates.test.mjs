import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
await import('../../public/yp-web-ai/js/inline-templates.js');
const api=globalThis.YPInlineTemplates;
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(item=>item);
const initial={version:3,W:6,D:3,H:2.4,cat:'food',wallStickers:{back:{data:null}},objects:[],sceneItemState:{}};
test('five unique authored arrangements',()=>{
  assert.equal(api.templates.length,5);assert.equal(new Set(api.templates.map(t=>t.id)).size,5);
  assert.equal(new Set(api.templates.map(t=>JSON.stringify(t.objects.map(o=>[o.catalogId,o.x,o.z])))).size,5);
});
for(const t of api.templates)test(t.id+' is an independent inline 6x3 snapshot with editable non-overlapping objects',()=>{
  const copy=structuredClone(initial),s=api.build(t.id,initial,catalog).spec;
  assert.deepEqual(initial,copy);assert.equal(s.W,6);assert.equal(s.D,3);assert.equal(s.type,'inline');
  assert.equal(new Set(s.objects.map(o=>o.id)).size,s.objects.length);
  const boxes=s.objects.map(o=>{const rotated=o.rotationY%180!==0,w=rotated?o.size.d:o.size.w,d=rotated?o.size.w:o.size.d;assert.equal(o.locked,false);return {x0:o.position.x-w/2,x1:o.position.x+w/2,z0:o.position.z-d/2,z1:o.position.z+d/2};});
  const overlaps=(a,b)=>a.x0<b.x1-.001&&a.x1>b.x0+.001&&a.z0<b.z1-.001&&a.z1>b.z0+.001;
  boxes.forEach((b,i)=>{assert.ok(b.x0>=.1&&b.x1<=5.9&&b.z0>=.1&&b.z1<=2.9,JSON.stringify(b));assert.ok(!boxes.slice(i+1).some(other=>overlaps(b,other)),'objects overlap');if(t.storage)assert.ok(!overlaps(b,{x0:4.8,x1:6,z0:0,z1:1.2}),'storage overlap');});
  const second=api.build(t.id,initial,catalog);s.objects[0].size.w=100;assert.notEqual(second.spec.objects[0].size.w,100);
});
test('unknown template fails before any scene changes',()=>assert.throws(()=>api.build('invalid',initial,catalog)));
test('parametric chair back and screen use vertical Y dimensions',()=>{
  assert.ok(html.includes('bx([s.w,s.h-seatY,.08]'));
  assert.ok(html.includes('bx([s.w,panelH,.055]'));
});
