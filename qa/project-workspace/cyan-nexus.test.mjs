import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import '../../public/yp-web-ai/js/tv-asset.js';
import '../../public/yp-web-ai/js/peninsular-cyan-nexus.js';
import '../../public/yp-web-ai/js/peninsular-templates.js';
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(item=>item);
test('Cyan Nexus is one new 6x3 Peninsular with isolated editable source parts',()=>{
 const initial={objects:[],logo:'customer-logo',sceneItemState:{}};const before=structuredClone(initial),source=JSON.stringify(YPPeninsularCyanNexusTemplates);
 const s=YPPeninsularTemplates.build('penin-cyan-nexus',initial,catalog).spec;
 assert.deepEqual(initial,before);assert.equal(JSON.stringify(YPPeninsularCyanNexusTemplates),source);
 assert.deepEqual([s.W,s.D,s.H,s.type],[6,3,3.5,'penin']);assert.equal(s.sceneItemState['structure.wall.back'].visible,false);
 assert.equal(s.objects.filter(o=>o.structure?.design==='nexus-side-portal').length,2);assert.equal(s.objects.filter(o=>o.catalogId==='bar-stool').length,4);
 assert.equal(new Set(s.objects.map(o=>o.id)).size,s.objects.length);
 for(const o of s.objects){const r=o.rotationY*Math.PI/180,halfW=(Math.abs(Math.cos(r))*o.size.w+Math.abs(Math.sin(r))*o.size.d)/2,halfD=(Math.abs(Math.sin(r))*o.size.w+Math.abs(Math.cos(r))*o.size.d)/2;assert.ok(o.position.x-halfW>=-.001&&o.position.x+halfW<=6.001,o.id+' X');assert.ok(o.position.z-halfD>=-.001&&o.position.z+halfD<=3.001,o.id+' Z');assert.ok(o.position.y>=0&&o.position.y+o.size.h<=3.501,o.id+' height');assert.equal(o.locked,false);}
});
test('reference lettering is replaced with Yuppie slots and dedicated artwork',()=>{
 const t=YPPeninsularCyanNexusTemplates[0];assert.equal(t.objects.filter(o=>o.brandLogo).length,2);assert.equal(t.objects.filter(o=>o.graphic).length,3);
 assert.ok(!JSON.stringify(t).includes('Exhibit'));assert.ok(!JSON.stringify(t).includes('TECH FAIR'));
 assert.ok(html.indexOf('js/peninsular-cyan-nexus.js')<html.indexOf('js/peninsular-templates.js'));
});
test('halo finish only changes the new template header',()=>{
 const s=YPPeninsularTemplates.build('penin-cyan-nexus',{sceneItemState:{}},catalog).spec;YPPeninsularCyanNexus.finish(s);
 assert.equal(s.objects.find(o=>o.label==='โลโก้ Yuppie · ป้ายบน').logoFinish.logoType,'backlit');
 assert.equal(s.objects.find(o=>o.label==='โลโก้ Yuppie · เคาน์เตอร์').logoFinish,undefined);
 const unrelated={boothTemplate:{id:'customer-draft'},objects:[{label:'โลโก้ Yuppie · ป้ายบน'}]},original=structuredClone(unrelated);YPPeninsularCyanNexus.finish(unrelated);assert.deepEqual(unrelated,original);
});
