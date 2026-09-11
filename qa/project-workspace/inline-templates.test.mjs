import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
await import('../../public/yp-web-ai/js/inline-templates.js');
await import('../../public/yp-web-ai/js/inline-soft-wave.js');
const api=globalThis.YPInlineTemplates;
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(item=>item);
const initial={version:3,W:6,D:3,H:2.4,cat:'food',wallStickers:{back:{data:null}},objects:[],sceneItemState:{}};
test('seven unique authored arrangements',()=>{
  assert.equal(api.templates.length,7);assert.equal(new Set(api.templates.map(t=>t.id)).size,7);
  assert.equal(new Set(api.templates.map(t=>JSON.stringify(t.objects.map(o=>[o.catalogId,o.x,o.z])))).size,7);
});
for(const t of api.templates)test(t.id+' is an independent inline 6x3 snapshot with editable parts within bounds',()=>{
  const copy=structuredClone(initial),s=api.build(t.id,initial,catalog).spec;
  assert.deepEqual(initial,copy);assert.equal(s.W,6);assert.equal(s.D,3);assert.equal(s.type,'inline');
  assert.equal(new Set(s.objects.map(o=>o.id)).size,s.objects.length);
  const boxes=s.objects.map(o=>{const rotated=o.rotationY%180!==0,w=rotated?o.size.d:o.size.w,d=rotated?o.size.w:o.size.d;assert.equal(o.locked,false);return {x0:o.position.x-w/2,x1:o.position.x+w/2,z0:o.position.z-d/2,z1:o.position.z+d/2};});
  const overlaps=(a,b)=>a.x0<b.x1-.001&&a.x1>b.x0+.001&&a.z0<b.z1-.001&&a.z1>b.z0+.001;
  boxes.forEach((b,i)=>{const margin=t.customShell?-.02:.1;assert.ok(b.x0>=margin&&b.x1<=6-margin&&b.z0>=margin&&b.z1<=3-margin,JSON.stringify(b));if(!t.reference)assert.ok(!boxes.slice(i+1).some(other=>overlaps(b,other)),'objects overlap');assert.ok(s.objects[i].position.y>=0&&s.objects[i].position.y+s.objects[i].size.h<=s.H+.001);if(t.storage)assert.ok(!overlaps(b,{x0:4.8,x1:6,z0:0,z1:1.2}),'storage overlap');});
  const second=api.build(t.id,initial,catalog);s.objects[0].size.w=100;assert.notEqual(second.spec.objects[0].size.w,100);
});
test('unknown template fails before any scene changes',()=>assert.throws(()=>api.build('invalid',initial,catalog)));
test('Soft Wave has the stepped frame, six chairs, two tables and protected Yuppie artwork slots',()=>{
 const s=api.build('soft-wave',initial,catalog).spec,t=api.templates.find(t=>t.id==='soft-wave');
 assert.equal(s.H,3.8);assert.equal(s.objects.length,50);assert.equal(s.objects.filter(o=>o.type==='chair').length,6);assert.equal(s.objects.filter(o=>o.type==='table').length,2);
 for(const part of ['fascia','crown','door','counter','slats','planter'])assert.ok(s.objects.some(o=>o.structure?.design==='soft-wave-'+part));
 assert.equal(t.objects.filter(o=>o.waveArtwork).length,10);assert.equal(s.logoScale,0);
 assert.equal(s.sceneItemState['structure.wall.back'].visible,false);assert.equal(s.floor,'tile');
 assert.equal(s.objects.filter(o=>o.structure?.illuminate).length,4);
});
test('Timber Ribbon keeps seven raised ribs, five chairs and recessed planter without hanging plants',()=>{
  const s=api.build('timber-ribbon',initial,catalog).spec;
  const count=type=>s.objects.filter(o=>o.type===type).length;
  assert.equal(count('ribbonPortal'),7);assert.equal(count('chair'),5);assert.equal(count('table'),1);
  assert.equal(count('grassPlanter'),1);assert.equal(count('trailingPlant'),0);assert.equal(count('glassCase'),1);
  assert.ok(s.objects.some(o=>o.structure?.design==='timber-folded-canopy'&&o.position.y===1.7));
  assert.equal(s.objects.filter(o=>o.structure?.design==='timber-shell-chair').length,5);
  assert.equal(s.objects.filter(o=>o.structure?.design==='timber-glass-table').length,1);
  assert.equal(s.objects.filter(o=>o.structure?.design==='timber-counter').length,1);
  assert.ok(s.objects.find(o=>o.type==='grassPlanter').position.y>0);
});
test('parametric chair back and screen use vertical Y dimensions',()=>{
  assert.ok(html.includes('bx([s.w,s.h-seatY,.08]'));
  assert.ok(html.includes('bx([s.w,panelH,.055]'));
});
