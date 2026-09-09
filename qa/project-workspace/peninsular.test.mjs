import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
await import('../../public/yp-web-ai/js/peninsular-templates.js');
const api=globalThis.YPPeninsularTemplates;
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(item=>item);
test('thirteen distinct reference-derived layouts',()=>{assert.equal(api.templates.length,13);assert.equal(new Set(api.templates.map(t=>t.id)).size,13);assert.equal(new Set(api.templates.map(t=>JSON.stringify(t.objects))).size,13);});
for(const t of api.templates)test(t.id+' preserves source and logo, fits a 6x3x2.4 booth, and has editable parts',()=>{
  const initial={W:6,D:6,H:2.4,type:'inline',logo:'data:image/png;base64,YQ==',logoColor:'#ee3c96',objects:[],sceneItemState:{}};
  const before=structuredClone(initial),snapshot=api.build(t.id,initial,catalog),s=snapshot.spec;
  assert.deepEqual(initial,before);assert.equal(s.W,6);assert.equal(s.D,3);assert.equal(s.type,'penin');assert.equal(s.stSize,'none');assert.equal(s.logo,initial.logo);assert.equal(s.logoColor,initial.logoColor);
  assert.equal(new Set(s.objects.map(o=>o.id)).size,s.objects.length);
  for(const o of s.objects){assert.equal(o.locked,false);assert.ok(catalog.some(c=>c.catalogId===o.catalogId));assert.ok(o.position.x-o.size.w/2>=-.001);assert.ok(o.position.x+o.size.w/2<=6.001);assert.ok(o.position.z-o.size.d/2>=-.001);assert.ok(o.position.z+o.size.d/2<=3.001);assert.ok(o.position.y>=0&&o.position.y+o.size.h<=2.401);}
  s.objects[0].size.w=900;assert.notEqual(api.build(t.id,initial,catalog).spec.objects[0].size.w,900);
});
test('latest three references have shaped 30cm rear walls and paired TV parts',()=>{
  for(const [id,seats,glass] of [['penin-crimson-flow',8,3],['penin-sage-ribbon',8,0],['penin-blush-gallery',4,2]]){
    const s=api.build(id,{logo:'data:yp'},catalog).spec,wall=s.objects[0];
    assert.equal(wall.type,'swoopPanel');assert.equal(wall.size.d,.3);assert.equal(wall.size.w,6);
    assert.equal(s.sceneItemState['structure.wall.back'].visible,false);
    assert.equal(s.objects.filter(o=>o.type==='chair').length,seats);
    assert.equal(s.objects.filter(o=>o.type==='glassCase').length,glass);
    const groups=Object.groupBy(s.objects.filter(o=>o.groupId),o=>o.groupId);
    assert.equal(Object.keys(groups).length,1);assert.equal(Object.values(groups)[0].length,2);
    assert.ok(s.objects.filter(o=>o.type==='brandCopy').some(o=>o.appearance.textureData==='data:yp'));
    assert.equal(s.logoScale,0);
    assert.ok(s.objects.some(o=>o.transform?.flipX===true));
  }
});
test('unknown template rejects explicitly',()=>assert.throws(()=>api.build('invalid',{},catalog)));
test('Blue Pavilion keeps fascia branding, curved signs and four inward-facing chairs',()=>{
  const logo='data:image/png;base64,YQ==',s=api.build('penin-blue-pavilion',{logo},catalog).spec;
  assert.equal(s.objects.filter(o=>o.type==='chair').length,4);
  assert.deepEqual(s.objects.filter(o=>o.type==='chair').map(o=>o.rotationY),[90,-90,90,-90]);
  assert.equal(s.objects.find(o=>o.type==='brandCopy').appearance.textureData,logo);
  assert.ok(s.objects.filter(o=>o.type==='roundedPanel').length>=4);
  assert.equal(s.objects.filter(o=>o.type==='table').length,2);
});
test('Peninsular still has only the back wall',()=>assert.match(html,/k:'penin'[^\n]+walls:\['back'\]/));
test('new references retain their distinct structural features',()=>{
  const make=id=>api.build(id,{logo:'data:image/png;base64,YQ=='},catalog).spec;
  assert.equal(make('penin-aqua-curve').objects.filter(o=>o.type==='fasciaCurve').length,2);
  assert.equal(make('penin-timber-noir').objects.filter(o=>o.type==='ringPendant').length,2);
  assert.equal(make('penin-blue-axis').objects.filter(o=>o.type==='crossPier').length,1);
  for(const id of ['penin-aqua-curve','penin-timber-noir','penin-blue-axis'])assert.ok(make(id).objects.find(o=>o.type==='brandCopy').appearance.textureData);
});
test('Orchard has editable organic structures, merchandising and side entry gaps',()=>{
  const s=api.build('penin-orchard',{logo:'data:image/png;base64,YQ=='},catalog).spec;
  for(const [type,count] of [['organicCanopy',2],['treePier',2],['organicDisplay',1],['flutedCounter',1],['table',2]])assert.equal(s.objects.filter(o=>o.type===type).length,count);
  const counter=s.objects.find(o=>o.type==='flutedCounter');assert.ok(counter.position.x-counter.size.w/2>=.6);assert.ok(6-counter.position.x-counter.size.w/2>=.6);
  assert.equal(counter.appearance.mode,'original');assert.equal(s.objects.find(o=>o.type==='organicDisplay').appearance.mode,'original');
});

test('Noir Lounge and Aqua Wave keep their requested features and grouped screens',()=>{
  const lounge=api.build('penin-noir-lounge',{logo:'data:yp'},catalog).spec,wave=api.build('penin-aqua-wave',{logo:'data:yp'},catalog).spec;
  assert.equal(lounge.objects.filter(o=>o.type==='glassPanel').length,1);
  assert.equal(lounge.objects.filter(o=>o.type==='loungeSofa').length,2);
  assert.equal(wave.objects.filter(o=>o.type==='waveHeader').length,2);
  assert.equal(wave.objects.filter(o=>o.type==='glassCase').length,3);
  assert.equal(wave.objects.filter(o=>o.type==='roundedCornerCounter').length,1);
  for(const [s,count] of [[lounge,1],[wave,2]]){
    assert.equal(s.objects.filter(o=>o.type==='chair').length,4);
    assert.equal(s.logoScale,0);
    const groups=Object.groupBy(s.objects.filter(o=>o.groupId),o=>o.groupId);
    assert.equal(Object.keys(groups).length,count);
    Object.values(groups).forEach(pair=>assert.equal(pair.length,2));
    s.objects.filter(o=>o.type==='glassPanel'||o.type==='glassCase').forEach(o=>assert.equal(o.appearance.mode,'original'));
  }
});
