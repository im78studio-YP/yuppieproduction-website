import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../../public/lightbox_maker/YP-Lightbox-Studio.html',import.meta.url),'utf8');
const script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
function fixture(){
  let pending;
  const c=vm.createContext({document:{readyState:'loading',addEventListener(){}},window:{},TextEncoder,console,
    setTimeout(fn){pending=fn;return 1;},clearTimeout(){}});
  vm.runInContext(script,c);
  vm.runInContext('globalThis.bounds={mn:[-110,-40,-60],mx:[110,40,60],c:[0,0,0]};',c);
  return {c,flush:()=>pending()};
}
const run=(c,s)=>vm.runInContext(s,c);

test('Grid checkbox gates every 3D mode and retains 2D rendering',()=>{
  const {c}=fixture();
  for(const mode of ['assy','lit','exp','plate']){
    assert.equal(run(c,`previewGridSpec('${mode}',bounds,100,false)`),null);
    assert.ok(run(c,`previewGridSpec('${mode}',bounds,100,true)`));
  }
  assert.ok(html.includes('previewGridSpec(V3.mode,B,eye[1],S.ui.showGrid)'));
  assert.ok(html.includes("['showGrid','ui.showGrid','bool',null,null,'d']"));
  assert.ok(html.includes('if(S.ui.showGrid){'));
  assert.doesNotMatch(html,/if\(V3.mode==='plate' && V3.grid\)/);
});

test('Grid sits just above the correct floor and disappears when viewed from below',()=>{
  const {c}=fixture();
  assert.equal(run(c,"previewGridSpec('assy',bounds,100,true).y"),-40.36);
  assert.equal(run(c,"previewGridSpec('plate',bounds,100,true).y"),.04);
  assert.equal(run(c,"previewGridSpec('exp',bounds,-41,true)"),null);
  assert.equal(run(c,"previewGridSpec('plate',bounds,-1,true)"),null);
  assert.notDeepEqual(run(c,"previewGridSpec('lit',bounds,100,true).color"),run(c,"previewGridSpec('assy',bounds,100,true).color"));
});

test('Grid density remains bounded for large scenes and vertices do not enter exported meshes',()=>{
  const {c}=fixture();
  for(const size of [10,200,1200,100000]){
    const vertices=run(c,`previewGridVertices(previewGridSpec('exp',{mn:[-${size},-1,-${size}],mx:[${size},1,${size}],c:[0,0,0]},10,true))`);
    assert.ok(vertices.length/6<=204);assert.ok(vertices.every(Number.isFinite));
    assert.ok(vertices.every((v,i)=>i%3!==1||v===0));
  }
  const build=html.match(/function glBuild\(\)\{[\s\S]*?\n\}/)[0];
  assert.doesNotMatch(build,/V3.grid|previewGrid|createBuffer/);
});

test('Grid buffer is reused for toggles, lighting and floor-height changes',()=>{
  const {c}=fixture();let creates=0,uploads=0;
  c.fakeGL={ARRAY_BUFFER:1,STATIC_DRAW:2,createBuffer(){creates++;return {};},bindBuffer(){},bufferData(){uploads++;}};
  run(c,"globalThis.spec=previewGridSpec('assy',bounds,100,true);previewGridBuffer(fakeGL,spec)");
  run(c,'previewGridBuffer(fakeGL,{...spec,y:50,color:[0,0,0]})');
  assert.equal(creates,1);assert.equal(uploads,1);
  run(c,'previewGridBuffer(fakeGL,{...spec,x1:spec.x1+10})');
  assert.equal(creates,1);assert.equal(uploads,2);
});

test('Grid toggle only redraws and does not discard an already-pending geometry edit',()=>{
  const {c,flush}=fixture();
  run(c,"globalThis.calls=[];draw=()=>calls.push('draw');recompute=()=>calls.push('recompute');schedule(false,'d')");flush();
  assert.equal(run(c,'calls.join()'),'draw');
  run(c,"calls=[];schedule(false,'');schedule(false,'d')");flush();
  assert.equal(run(c,'calls.join()'),'recompute');
});
