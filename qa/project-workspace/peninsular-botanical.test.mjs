import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
await import('../../public/yp-web-ai/js/peninsular-six-templates.js');
await import('../../public/yp-web-ai/js/peninsular-botanical.js');
await import('../../public/yp-web-ai/js/peninsular-templates.js');
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(item=>item);
test('adds one 6x3 Peninsular booth from two references, preserving 17 existing entries',()=>{
 assert.equal(YPPeninsularTemplates.templates.length,18);const t=YPPeninsularBotanicalTemplates[0],before=JSON.stringify(t),initial={objects:[],sceneItemState:{}},s=YPPeninsularTemplates.build(t.id,initial,catalog).spec;
 assert.equal(s.W*s.D,18);assert.equal(s.type,'penin');assert.equal(s.H,3.5);assert.equal(s.logoScale,0);assert.equal(s.sceneItemState['structure.wall.back'].visible,false);assert.equal(JSON.stringify(t),before);assert.deepEqual(initial,{objects:[],sceneItemState:{}});
 assert.equal(new Set(s.objects.map(o=>o.id)).size,s.objects.length);for(const o of s.objects){assert.equal(o.locked,false);assert.ok(Object.values(o.position).every(Number.isFinite));assert.ok(Object.values(o.size).every(v=>v>0&&Number.isFinite(v)));assert.ok(o.position.y+o.size.h<=3.51);}
 for(const design of ['mirror-panel','foliage','helix-display','reception','side-frame'])assert.equal(s.objects.filter(o=>o.structure?.design==='botanical-'+design).length,1);
 assert.equal(t.objects.filter(o=>o.brandLogo).length,4);assert.equal(t.objects.filter(o=>o.graphic?.startsWith('botanical-')).length,2);
});
