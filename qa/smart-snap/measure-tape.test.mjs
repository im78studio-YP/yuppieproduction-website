import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../public/yp-web-ai/js/measure-tape.js',import.meta.url),'utf8');
const context={};vm.runInNewContext(source,context);const api=context.YPMeasureTape;
test('Axis colour follows real direction in both signs, mapping world Y to UI Z; diagonals and zero length stay neutral',()=>{
 const a={x:1,y:2,z:3};
 for(const sign of [-1,1]){
  assert.equal(api.alignedAxis(a,{...a,x:a.x+sign}),'x');
  assert.equal(api.alignedAxis(a,{...a,z:a.z+sign}),'y');
  assert.equal(api.alignedAxis(a,{...a,y:a.y+sign}),'z');
 }
 assert.equal(api.alignedAxis(a,{x:2,y:2,z:4}),'free');
 assert.equal(api.alignedAxis(a,{x:2,y:2.002,z:3}),'free');
 assert.equal(api.alignedAxis(a,{x:2,y:2+1e-12,z:3}),'x');
 assert.equal(api.alignedAxis(a,{x:1.0001,y:2,z:3.0001}),'free');
 assert.equal(api.alignedAxis(a,a),'free');assert.equal(api.alignedAxis(null,a),'free');
});
test('Visible floor grid rounds both coordinates at the raised-floor datum; hidden grid and non-floor points remain free',()=>{
 const grid={enabled:true,step:.1,width:6,depth:6,y:.15};
 const p=api.snapFloorGrid({x:1.23,y:.152,z:2.37},grid);
 assert.equal(p.x,1.2);assert.equal(p.z,2.4);assert.equal(p.y,.15);
 assert.equal(api.snapFloorGrid({x:1.23,y:.15,z:2.37},{...grid,enabled:false}),null);
 assert.equal(api.snapFloorGrid({x:1.23,y:2,z:2.37},grid),null);
 assert.equal(api.snapFloorGrid({x:-.02,y:.15,z:2.37},grid),null);
 assert.equal(api.snapFloorGrid({x:6.02,y:.15,z:2.37},grid),null);
 assert.equal(api.snapFloorGrid({x:6.04,y:.15,z:2.37},{...grid,width:6.04}).x,6);
});
test('Measures metres, diagonal and booth axes independently (Three Y is height)',()=>{
 const d=api.metrics({x:3,y:1,z:7},{x:0,y:5,z:7});assert.equal(d.distance,5);assert.equal(d.width,3);assert.equal(d.height,4);assert.equal(d.depth,0);
 assert.equal(api.metrics({x:0,y:0,z:0},{x:0,y:0,z:2.4}).depth,2.4);
 assert.equal(api.metrics({x:1,y:1,z:1},{x:1,y:1,z:1}).distance,0);
});
test('Each rotated bounding box yields only 12 edges, never cross-asset diagonals',()=>{
 const anchors=[];for(const targetId of ['a','b'])for(const x of [0,1])for(const y of [0,1])for(const z of [0,1])anchors.push({id:`${targetId}.anchor.corner.${x}.${y}.${z}`,kind:'corner',targetId});
 const edges=api.edges(anchors);assert.equal(edges.length,24);assert.ok(edges.every(([a,b])=>a.targetId===b.targetId));
});
test('Tape is an ephemeral DOM overlay, not an exported mesh or project mutation',()=>{
 assert.match(source,/host.append\(overlay,panel\)/);assert.doesNotMatch(source,/\.scene\.add|\.boothGroup\.add|recordObjectHistory|localStorage|S\.objects\s*=/);
 assert.match(source,/host.addEventListener\('pointerdown',down,true\)/);assert.match(source,/event.stopImmediatePropagation/);
});
test('Axis constraints preserve the other two world coordinates, UI Z is vertical',()=>{
 const a={x:1,y:2.233,z:3},b={x:1.297,y:0,z:3.392};
 const z=api.metrics(a,api.constrain(a,b,'z'));assert.equal(z.distance,2.233);assert.equal(z.width,0);assert.equal(z.depth,0);
 const x=api.metrics(a,api.constrain(a,b,'x'));assert.equal(x.distance,x.width);assert.equal(x.depth,0);assert.equal(x.height,0);
 const y=api.metrics(a,api.constrain(a,b,'y'));assert.equal(y.distance,y.depth);assert.equal(y.width,0);assert.equal(y.height,0);
});
test('Closest-ray axis solving works for parallel projection and rejects an end-on view',()=>{
 const a={x:1,y:2,z:3};
 assert.equal(api.axisParameter(a,{x:5,y:2,z:20},{x:0,y:0,z:-1},'x'),4);
 assert.equal(api.axisParameter(a,{x:1,y:0,z:20},{x:0,y:0,z:-1},'z'),-2);
 assert.equal(api.axisParameter(a,{x:1,y:10,z:8},{x:0,y:-1,z:0},'y'),5);
 assert.equal(api.axisParameter(a,{x:1,y:10,z:3},{x:0,y:-1,z:0},'z'),null);
});
