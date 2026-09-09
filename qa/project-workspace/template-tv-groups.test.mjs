import test from 'node:test';
import assert from 'node:assert/strict';
import '../../public/yp-web-ai/js/template-tv-groups.js';
import '../../public/yp-web-ai/js/peninsular-templates.js';
import '../../public/yp-web-ai/js/corner-templates.js';
const G=globalThis.YPTemplateTVGroups;
function build(id){const lib=id.startsWith('corner')?YPCornerTemplates:YPPeninsularTemplates,t=lib.templates.find(t=>t.id===id),catalog=[...new Set(t.objects.map(o=>o.catalogId))].map(catalogId=>({catalogId,type:'panel',unitPrice:0}));return lib.build(id,{},catalog).spec;}
for(const [id,pairs] of Object.entries(G.pairs))test(id+' creates independent TV groups',()=>{const s=build(id),groups=new Set();for(const [a,b] of pairs){const first=s.objects.find(o=>o.id===id+'-'+a),second=s.objects.find(o=>o.id===id+'-'+b);assert.ok(first.groupId);assert.equal(first.groupId,second.groupId);assert.equal(s.objects.filter(o=>o.groupId===first.groupId).length,2);groups.add(first.groupId);}assert.equal(groups.size,pairs.length);});
test('legacy migration preserves appearance and edited positions',()=>{const s=build('penin-timber-noir');delete s.templateTVGroupsVersion;s.objects.forEach(o=>delete o.groupId);s.objects[17].position.x=2.5;s.objects[18].position.x=2.5;s.objects[18].appearance.color='#abcdef';const before=structuredClone(s.objects);G.apply(s);for(const [i,o] of s.objects.entries()){const {groupId,...rest}=o;assert.deepEqual(rest,before[i]);}});
test('explicit ungroup persists through JSON round trip',()=>{const s=build('penin-timber-noir');s.objects.forEach(o=>delete o.groupId);const loaded=JSON.parse(JSON.stringify(s));G.apply(loaded);assert.equal(loaded.objects.some(o=>o.groupId),false);});
test('existing custom groups are not overwritten; missing members are safe',()=>{const s=build('penin-timber-noir');delete s.templateTVGroupsVersion;s.objects[17].groupId='user-wall-group';delete s.objects[18].groupId;G.apply(s);assert.equal(s.objects[17].groupId,'user-wall-group');assert.equal(s.objects[18].groupId,undefined);delete s.templateTVGroupsVersion;s.objects=s.objects.filter(o=>!o.id.endsWith('-17'));assert.doesNotThrow(()=>G.apply(s));});
