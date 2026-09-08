import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
await import('../../public/yp-web-ai/js/starter-layouts.js');
const api=globalThis.YPStarterLayouts;
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(item=>item);
function context(width=6,depth=3,type='inline',extra={}){return {width,depth,type,walls:type==='inline'?['back','left','right']:type==='corner'?['back','left']:type==='penin'?['back']:[],wallThickness:.1,catalog,obstacles:[],sourceKey:'scene',...extra};}
function validate(c,p){
  assert.ok(p.ok,p.message);assert.ok(p.placements.length);
  const boxes=p.placements.map(item=>api.rect(item.x,item.z,item.w,item.d));
  boxes.forEach((box,index)=>{
    assert.ok(box.x0>=0&&box.z0>=0&&box.x1<=c.width+.001&&box.z1<=c.depth+.001);
    assert.ok(!c.obstacles.some(o=>api.overlaps(box,o)));
    assert.ok(!p.lanes.some(l=>api.overlaps(box,l)));
    assert.ok(!boxes.slice(index+1).some(other=>api.overlaps(box,other)));
  });
}
for(const type of ['inline','corner','penin','island'])for(const purpose of api.PURPOSES)test(`${type} 6x6 ${purpose.id} fits without overlaps or blocked reserved lanes`,()=>{const c=context(6,6,type);validate(c,api.plan(c,purpose.id));});
for(const purpose of api.PURPOSES)test(`inline 6x3 ${purpose.id}`,()=>{const c=context();validate(c,api.plan(c,purpose.id));});
test('room and preserved objects are never overwritten',()=>{const c=context(6,6,'corner',{room:{x0:4.6,x1:5.9,z0:.1,z1:1.4},obstacles:[{x0:3.75,x1:6,z0:0,z1:2.25},{x0:.3,x1:1.3,z0:4.6,z1:5.3}]});validate(c,api.plan(c,'display'));});
test('tiny and obstructed booths fail with no partial required group',()=>{for(const c of [context(1,1),context(6,3,'inline',{obstacles:[{x0:0,x1:6,z0:0,z1:3}]})]){const p=api.plan(c,'meeting');assert.equal(p.ok,false);assert.deepEqual(p.placements,[]);}});
test('missing catalog and unsupported special booth are explained',()=>{assert.equal(api.plan(context(6,3,'photo360'),'sales').ok,false);assert.equal(api.plan(context(6,3,'inline',{catalog:[]}),'display').ok,false);});
test('island uses freestanding displays instead of high shelves',()=>{const p=api.plan(context(6,6,'island'),'display');assert.ok(p.ok);assert.ok(!p.placements.some(item=>item.catalogId==='shelf-standard'));});
test('placement validator veto cannot be bypassed',()=>{const p=api.plan(context(6,3,'inline',{accept:()=>false}),'sales');assert.equal(p.ok,false);});
test('plans are deterministic and do not mutate the input',()=>{const c=context(),before=JSON.stringify(c);assert.deepEqual(api.plan(c,'sales'),api.plan(c,'sales'));assert.equal(JSON.stringify(c),before);});
test('meeting table and seats remain a functional cluster',()=>{const p=api.plan(context(6,6),'meeting'),table=p.placements.find(item=>item.catalogId==='table-standard'),chairs=p.placements.filter(item=>item.catalogId==='chair-standard');assert.equal(chairs.length,2);assert.ok(chairs.every(chair=>Math.abs(chair.x-table.x)<.001&&Math.abs(Math.abs(chair.z-table.z)-.85)<.001));});
test('meeting chairs face toward the table',()=>{const p=api.plan(context(),'meeting'),table=p.placements.find(item=>item.catalogId==='table-standard');for(const chair of p.placements.filter(item=>item.catalogId==='chair-standard'))assert.equal(chair.rotationY,chair.z<table.z?0:180);});
