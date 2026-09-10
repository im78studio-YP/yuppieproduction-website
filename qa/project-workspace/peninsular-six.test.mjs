import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
await import('../../public/yp-web-ai/js/peninsular-six-templates.js');
await import('../../public/yp-web-ai/js/peninsular-templates.js');
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(item=>item);
test('collection includes fifteen original layouts and two native 6x6 layouts',()=>{
 assert.equal(YPPeninsularTemplates.templates.length,17);
 for(const t of YPPeninsularTemplates.templates){const initial={objects:[],sceneItemState:{}},s=YPPeninsularTemplates.build(t.id,initial,catalog).spec;
  assert.equal(s.W,6);assert.equal(s.D,t.depth||3);assert.equal(s.H,t.height||2.4);assert.deepEqual(initial,{objects:[],sceneItemState:{}});
 }
});
for(const t of YPPeninsularSixTemplates)test(t.id+' uses finite editable geometry, 36 sqm and stable unique IDs',()=>{
 const s=YPPeninsularTemplates.build(t.id,{objects:[],sceneItemState:{}},catalog).spec;
 assert.equal(s.W*s.D,36);assert.equal(s.type,'penin');assert.equal(new Set(s.objects.map(o=>o.id)).size,s.objects.length);
 assert.equal(s.sceneItemState['structure.wall.back'].visible,false);
 for(const o of s.objects){assert.equal(o.locked,false);assert.ok(Object.values(o.position).every(Number.isFinite));assert.ok(Object.values(o.size).every(v=>Number.isFinite(v)&&v>0));assert.ok(o.position.y+o.size.h<=3.601);}
 if(t.id.includes('blue')){assert.equal(s.objects.filter(o=>o.structure?.design==='timber-shell-chair').length,9);assert.equal(s.objects.filter(o=>o.structure?.design==='timber-glass-table').length,2);}
 else{assert.equal(s.objects.filter(o=>o.structure?.design==='six-noir-portal').length,2);assert.ok(s.objects.some(o=>o.type==='loungeSofa'));}
});
