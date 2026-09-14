import test from 'node:test';
import assert from 'node:assert/strict';
import '../../public/yp-web-ai/js/peninsular-blue-orbit-saved.js';
import '../../public/yp-web-ai/js/peninsular-blue-orbit.js';
import '../../public/yp-web-ai/js/peninsular-templates.js';
test('Saved Blue Orbit preserves all 36 pieces and independent copies',()=>{
 const initial={objects:[],logo:'user'},before=structuredClone(initial),id='penin-blue-orbit-6';
 const a=YPPeninsularTemplates.build(id,initial,[]),b=YPPeninsularTemplates.build(id,initial,[]);
 assert.deepEqual(initial,before);assert.deepEqual(a,YPBlueOrbitSavedSnapshot);assert.deepEqual([a.spec.W,a.spec.D,a.spec.H],[6,6,4]);
 assert.equal(a.spec.objects.length,36);assert.equal(a.spec.boothColorTheme.primary,'#87b51a');assert.equal(a.spec.boothTemplate.version,2);
 assert.equal(a.spec.objects.filter(o=>o.logoSlot?.kind==='logo').length,8);
 a.spec.objects[0].size.w=99;assert.equal(b.spec.objects[0].size.w,6);
});
test('Only side showcase loses its back; all three shelves and frame remain',()=>{
 const shelves=YPBlueOrbitSavedSnapshot.spec.objects.filter(o=>o.structure?.design==='orbit-showcase');
 assert.equal(shelves.length,3);assert.deepEqual(shelves.filter(o=>o.structure.openBack).map(o=>o.id),['penin-blue-orbit-6-10']);
 const boxes=o=>{const list=[];YPPeninsularBlueOrbit.build({T:{},obj:o,bx:(size,pos)=>list.push({size,pos}),mesh:()=>{throw Error('Unexpected geometry');}});return list;};
 for(const o of shelves){const list=boxes(o);assert.equal(list.length,o.structure.openBack?7:8);assert.equal(list.filter(x=>x.size[1]===.018).length,3);}
 const closed=structuredClone(shelves[0]);delete closed.structure.openBack;assert.equal(boxes(closed).length,8);
});
