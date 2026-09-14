import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import '../../public/yp-web-ai/js/tv-asset.js';
import '../../public/yp-web-ai/js/peninsular-blue-orbit.js';
import '../../public/yp-web-ai/js/peninsular-templates.js';
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(x=>x);
test('Blue Orbit is an independent 6x6x3 Peninsular template with editable geometry',()=>{
 const initial={objects:[],sceneItemState:{},logo:'user'},before=structuredClone(initial),t=YPPeninsularBlueOrbitTemplates[0],source=JSON.stringify(t),s=YPPeninsularTemplates.build(t.id,initial,catalog).spec;
 assert.deepEqual(initial,before);assert.equal(JSON.stringify(t),source);assert.deepEqual([s.W,s.D,s.H,s.type],[6,6,3,'penin']);assert.equal(s.sceneItemState['structure.wall.back'].visible,false);assert.equal(new Set(s.objects.map(o=>o.id)).size,s.objects.length);
 for(const o of s.objects){const a=o.rotationY*Math.PI/180,hw=(Math.abs(Math.cos(a))*o.size.w+Math.abs(Math.sin(a))*o.size.d)/2,hd=(Math.abs(Math.sin(a))*o.size.w+Math.abs(Math.cos(a))*o.size.d)/2;assert.ok(o.position.x-hw>=-.01&&o.position.x+hw<=6.01,o.id+' x');assert.ok(o.position.z-hd>=-.01&&o.position.z+hd<=6.01,o.id+' z');assert.ok(o.position.y>=0&&o.position.y+o.size.h<=3.001,o.id+' height');assert.equal(o.locked,false);}
});
test('Blue Orbit retains reference structure but uses replaceable Yuppie branding',()=>{
 const t=YPPeninsularBlueOrbitTemplates[0],count=key=>t.objects.filter(o=>o.structure?.design==='orbit-'+key).length;
 assert.equal(count('portal'),4);assert.equal(count('circle-shelf'),3);assert.equal(count('showcase'),3);assert.equal(count('plinth'),4);assert.equal(count('ribbon'),4);
 assert.equal(t.objects.filter(o=>o.brandLogo).length,9);assert.equal(t.objects.filter(o=>o.catalogId==='tv-65').length,1);assert.ok(!/Aria|AST|Trading|Windows/.test(JSON.stringify(t)));
 assert.ok(html.indexOf('js/peninsular-blue-orbit.js')<html.indexOf('js/peninsular-templates.js'));
});
