import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../../public/lightbox_maker/YP-Lightbox-Studio.html',import.meta.url),'utf8');
const script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
function fixture(){
  let pending;const frames=[];
  const c=vm.createContext({document:{readyState:'loading',addEventListener(){}},window:{},TextEncoder,console,
    setTimeout(fn){pending=fn;return 1;},clearTimeout(){},
    requestAnimationFrame(fn){frames.push(fn);return frames.length;}});
  vm.runInContext(script,c);
  vm.runInContext('globalThis.bounds={mn:[-110,-40,-60],mx:[110,40,60],c:[0,0,0]};',c);
  return {c,flush:()=>{const fn=pending;pending=undefined;return fn?.();},
    frame:()=>frames.shift()?.(),frameCount:()=>frames.length};
}
const run=(c,s)=>vm.runInContext(s,c);

test('Grid checkbox gates every 3D mode and retains 2D rendering',()=>{
  const {c}=fixture();
  for(const mode of ['assy','lit','exp','plate']){
    assert.equal(run(c,`previewGridSpec('${mode}',bounds,100,false)`),null);
    assert.ok(run(c,`previewGridSpec('${mode}',bounds,100,true)`));
  }
  assert.ok(html.includes('previewGridSpec(V3.mode,B,eye[1],S.ui.showGrid,layout)'));
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

test('Queued source, raster, and mesh edits survive later quote/backing/display changes',()=>{
  for(const [edits,expected] of [
    [[[false,''],[false,'q']], 'grid'],
    [[[true,'s'],[false,'q']], 'source,grid'],
    [[[false,'m'],[false,'q']], 'mesh'],
    [[[false,'q'],[false,'m']], 'mesh'],
    [[[false,'m'],[false,'b'],[false,'d']], 'mesh'],
    [[[false,''],[false,'n']], 'grid'],
    [[[false,'q'],[false,'d']], 'quote:true,badges,draw'],
    [[[false,'b'],[false,'q']], 'quote:true,badges,backing'],
    [[[false,'d'],[false,'b']], 'backing'],
    [[[false,'n']], ''],
  ]){
    const {c,flush}=fixture();
    run(c,`globalThis.calls=[];rebuildSource=()=>calls.push('source');
      recompute=reuse=>calls.push(reuse?'mesh':'grid');refreshQuote=reuse=>calls.push('quote:'+reuse);
      updateBadges=()=>calls.push('badges');draw=()=>calls.push('draw');refreshBackingPreview=()=>calls.push('backing');`);
    for(const edit of edits)run(c,`schedule(${edit[0]},${JSON.stringify(edit[1])})`);
    flush();assert.equal(run(c,'calls.join()'),expected,JSON.stringify(edits));
  }
});

test('Only edits that affect the raster request a new grid',()=>{
  const {c}=fixture();
  for(const id of ['bDepth','bColorT','bDiff','bBack','bedMargin','autoSplit','buildMode','jointType','expSmooth'])
    assert.equal(run(c,`BIND.find(b=>b[0]==='${id}')[5]`),'m',id);
  for(const id of ['bFrame','colN','colSmooth','ring0w','fillHoles'])
    assert.equal(run(c,`BIND.find(b=>b[0]==='${id}')[5]`),'',id);
  assert.equal(run(c,"BIND.find(b=>b[0]==='expFmt')[5]"),'n');
});

test('A shared plate layout preserves all transforms with one pack for 64 meshes',()=>{
  const {c}=fixture();
  const result=run(c,`(()=>{
    S=defaults();PB={w:1730,h:318,empty:false};G={px:.15};
    const parts=[];
    for(const tile of printPlan().tiles)for(const [module,kind,z0] of [['front','color',0],['front','diffuser',.6],['box','frame',1],['back','back',0]])
      parts.push({tile,module,kind,n:12,z0,z1:z0+2,x0:0,x1:100,y0:0,y1:100});
    V3.parts=parts;V3.buf=parts.map(M=>({M}));V3.bounds=null;
    const expected=parts.map(p=>Array.from(partMatrix(p,'plate')));
    let packs=0;const original=platePack;platePack=()=>{packs++;return original();};
    const layout=plateRenderLayout(),actual=parts.map(p=>Array.from(partMatrix(p,'plate',layout)));
    sceneBounds('plate',layout);previewGridSpec('plate',bounds,100,true,layout);
    return {expected,actual,packs,count:parts.length};
  })()`);
  assert.equal(result.count,64);assert.equal(result.packs,1);
  assert.deepEqual(result.actual,result.expected);
});

test('Camera events draw at most once per animation frame and stop in 2D mode',()=>{
  const {c,frame,frameCount}=fixture();
  run(c,"globalThis.draws=0;S.ui.view='3d';glRender=()=>draws++;for(let i=0;i<20;i++)glRequestRender();");
  assert.equal(frameCount(),1);assert.equal(run(c,'draws'),0);
  frame();assert.equal(run(c,'draws'),1);
  run(c,"glRequestRender();S.ui.view='design';");frame();
  assert.equal(run(c,'draws'),1);assert.equal(frameCount(),0);
});
