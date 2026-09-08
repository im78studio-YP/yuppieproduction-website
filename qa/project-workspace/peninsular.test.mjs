import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
await import('../../public/yp-web-ai/js/peninsular-templates.js');
const api=globalThis.YPPeninsularTemplates;
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(item=>item);
test('eight distinct reference-derived layouts',()=>{assert.equal(api.templates.length,8);assert.equal(new Set(api.templates.map(t=>t.id)).size,8);assert.equal(new Set(api.templates.map(t=>JSON.stringify(t.objects))).size,8);});
for(const t of api.templates)test(t.id+' preserves source and logo, fits a 6x3x2.4 booth, and has editable parts',()=>{
  const initial={W:6,D:6,H:2.4,type:'inline',logo:'data:image/png;base64,YQ==',logoColor:'#ee3c96',objects:[],sceneItemState:{}};
  const before=structuredClone(initial),snapshot=api.build(t.id,initial,catalog),s=snapshot.spec;
  assert.deepEqual(initial,before);assert.equal(s.W,6);assert.equal(s.D,3);assert.equal(s.type,'penin');assert.equal(s.stSize,'none');assert.equal(s.logo,initial.logo);assert.equal(s.logoColor,initial.logoColor);
  assert.equal(new Set(s.objects.map(o=>o.id)).size,s.objects.length);
  for(const o of s.objects){assert.equal(o.locked,false);assert.ok(catalog.some(c=>c.catalogId===o.catalogId));assert.ok(o.position.x-o.size.w/2>=-.001);assert.ok(o.position.x+o.size.w/2<=6.001);assert.ok(o.position.z-o.size.d/2>=-.001);assert.ok(o.position.z+o.size.d/2<=3.001);assert.ok(o.position.y>=0&&o.position.y+o.size.h<=2.401);}
  s.objects[0].size.w=900;assert.notEqual(api.build(t.id,initial,catalog).spec.objects[0].size.w,900);
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
