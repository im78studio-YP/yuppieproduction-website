import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const html=fs.readFileSync(new URL('../../public/lightbox_maker/YP-Lightbox-Studio.html',import.meta.url),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const run=(c,s)=>vm.runInContext(s,c),plain=v=>JSON.parse(JSON.stringify(v));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const methodIds=['butt','lap','scarf','tongue','dowel','butterfly','dovetail','plate','nut','selftap','snap','magnet','weld'];
const bodyIds=methodIds.slice(1,10);
const hardwareDefaults={hole:4.2,depth:5,bolt:3.4,plateT:3,baseT:7,clearance:.2,pin:3,nutFlat:5.5,nutT:2.4,magnetD:6,magnetT:3};

function setMethod(app,id){
  app.c.testMethodId=id;
  run(app.c,`(()=>{
    const method=SEAM_METHODS.find(m=>m.id===testMethodId);
    S.seam={...S.seam,method:testMethodId,...(method?{length:method.length,width:method.width}:{})};
  })()`);
}

function fixture({width=144,height=100,px=.5,inside=(x,y)=>x>=0&&x<width&&y>=0&&y<height}={}){
  const c=vm.createContext({document:{readyState:'loading',addEventListener(){}},window:{},TextEncoder,console,performance,structuredClone});
  vm.runInContext(source,c);
  const padding=4,gw=Math.ceil((width+2*padding)/px),gh=Math.ceil((height+2*padding)/px);
  const panel=new Uint8Array(gw*gh);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)panel[y*gw+x]=+inside((x+.5)*px-padding,(gh-y-.5)*px-padding);
  c.inputPanel=panel;c.inputSpec={gw,gh,px};
  run(c,`S=defaults();S.build.mode='service';S.box.W=inputSpec.gw*inputSpec.px;S.box.H=inputSpec.gh*inputSpec.px;
    S.exp={...S.exp,res:inputSpec.px,bed:80,bedH:80,margin:10,smooth:false,autoSplit:true};
    S.hw.hole='none';S.hw.hang=false;
    S.seam={...S.seam,enabled:true,length:24,width:8,selected:[]};
    globalThis.rebuildTestGrid=()=>{
      const {gw,gh,px}=inputSpec,panel=Uint8Array.from(inputPanel),owner=new Uint8Array(panel.length).fill(255);
      for(let i=0;i<panel.length;i++)if(panel[i])owner[i]=1;
      G={gw,gh,px,panel,owner,K:1,empty:!panel.some(Boolean),edtIn:edtToOutside(panel,gw,gh),comp:components(panel,gw,gh)};
      computeAreas();PB=panelBounds();
    };
    screwPoints=snapPoints=hangPoints=()=>[];rebuildTestGrid();`);
  return {
    c,
    plan:()=>run(c,'buildSeamPlan()'),
    probe(plan,seam,along){c.probePlan=plan;c.probeArgs=[seam.axis,seam.seamIndex,seam.tileIndex,along];return run(c,'seamCandidateAt(probePlan,...probeArgs)');},
    cut(cx,cy,radius){
      c.cutSpec={cx,cy,radius};
      run(c,`for(let y=0;y<G.gh;y++)for(let x=0;x<G.gw;x++){
        const xx=(x+.5)*G.px-PB.ux0,yy=S.box.H-(y+.5)*G.px-PB.my0;
        if((xx-cutSpec.cx)**2+(yy-cutSpec.cy)**2<cutSpec.radius**2)inputPanel[y*G.gw+x]=0;
      }rebuildTestGrid();`);
    }
  };
}

function seamFor(plan,candidate){
  return plan.seams.find(s=>s.axis===candidate.axis&&s.seamIndex===candidate.seamIndex&&s.tileIndex===candidate.tileIndex);
}
function validCandidate(app,axis){
  const plan=app.plan(),candidate=plan.candidates.find(c=>c.valid&&(!axis||c.axis===axis));
  assert.ok(candidate,`rectangle should provide a feasible ${axis||''} wall attachment`);
  return {plan,candidate,seam:seamFor(plan,candidate)};
}
function assertFiniteCandidate(candidate){
  assert.ok(candidate.id);
  assert.ok(['x','y'].includes(candidate.axis));
  assert.equal(candidate.tiles.length,2);
  for(const n of [candidate.anchorMm.x,candidate.anchorMm.y,...Object.values(candidate.footprint)])assert.ok(Number.isFinite(n));
  assert.ok(candidate.footprint.x1>candidate.footprint.x0);
  assert.ok(candidate.footprint.y1>candidate.footprint.y0);
  if(!candidate.valid){assert.ok(candidate.code);assert.ok(candidate.reason);}
}
function assertValidFootprintsOnPanel(app,plan){
  const {c}=app;
  for(const candidate of plan.candidates.filter(c=>c.valid)){
    assertFiniteCandidate(candidate);c.testFootprint=candidate.footprint;
    const result=run(c,`(()=>{
      const f=testFootprint,labels=new Set();let sampled=0,missing=0;
      for(let y=0;y<G.gh;y++)for(let x=0;x<G.gw;x++){
        const xx=(x+.5)*G.px-PB.ux0,yy=S.box.H-(y+.5)*G.px-PB.my0;
        if(xx<f.x0||xx>f.x1||yy<f.y0||yy>f.y1)continue;
        sampled++;if(!G.panel[y*G.gw+x])missing++;else labels.add(G.comp.lab[y*G.gw+x]);
      }
      return {sampled,missing,components:labels.size,inBounds:f.x0>=0&&f.y0>=0&&f.x1<=PB.w&&f.y1<=PB.h};
    })()`);
    assert.ok(result.sampled>0);assert.equal(result.missing,0,'the entire support footprint must stay on material');
    assert.equal(result.components,1,'a connector must not bridge disconnected islands');assert.equal(result.inBounds,true);
  }
}

test('Seam planning defaults off and produces no manufacturing changes implicitly',()=>{
  const {c}=fixture();
  assert.deepEqual(plain(run(c,'defaults().seam')),{enabled:false,method:'plate',length:24,width:8,selected:[],production:false,hardware:hardwareDefaults});
  run(c,'S.seam.enabled=false;');const plan=run(c,'buildSeamPlan()');
  assert.equal(plan.requested,false);assert.equal(plan.applicable,false);assert.equal(plan.candidates.length,0);assert.ok(plan.reason);
});

test('Old projects receive disabled defaults and partial seam settings preserve selected placements',()=>{
  const {c}=fixture();
  assert.deepEqual(plain(run(c,'projectState({src:{mode:"text"},box:{W:144,H:100}}).seam')),
    {enabled:false,method:'plate',length:24,width:8,selected:[],production:false,hardware:hardwareDefaults});
  const selection={axis:'x',seamIndex:1,tileIndex:1,along:12};
  c.savedProject={src:{mode:'text'},box:{W:144,H:100},seam:{enabled:true,width:10,selected:[selection]}};
  const before=JSON.stringify(c.savedProject),state=run(c,'projectState(savedProject)');
  assert.deepEqual(plain(state.seam),{enabled:true,method:'plate',length:24,width:10,selected:[selection],production:false,hardware:hardwareDefaults});
  assert.equal(JSON.stringify(c.savedProject),before,'loading must not mutate the saved project');
  c.reloadedProject=plain(state);
  assert.deepEqual(plain(run(c,'projectState(reloadedProject).seam')),plain(state.seam));
});

test('All 13 joint methods have explicit identities, scope, dimensions and access guidance',()=>{
  const {c}=fixture(),methods=plain(run(c,'SEAM_METHODS'));
  assert.deepEqual(methods.map(m=>m.id),methodIds);
  assert.deepEqual(methods.map(m=>m.code),methodIds.map((_,i)=>'J'+String(i+1).padStart(2,'0')));
  for(const method of methods){
    assert.equal(method.kind,bodyIds.includes(method.id)?'body':['butt','weld'].includes(method.id)?'process':'cover');
    for(const field of ['name','access','notice'])assert.ok(typeof method[field]==='string'&&method[field].trim(),`${method.id}.${field}`);
    for(const field of ['length','width','minDepth'])assert.ok(Number.isFinite(method[field])&&method[field]>=0,`${method.id}.${field}`);
    if(method.kind==='body')assert.ok(method.length>0&&method.width>0);
  }
  const bodies=methods.filter(m=>m.kind==='body');
  assert.ok(new Set(bodies.map(m=>`${m.length},${m.width}`)).size>1,'body methods need different support footprints');
  assert.ok(new Set(bodies.map(m=>m.minDepth)).size>1,'body methods need explicit depth constraints');
  assert.ok(new Set(bodies.map(m=>m.access)).size>1,'assembly access differs between methods');
});

test('Missing methods retain the plate default while unknown methods remain visibly unsupported',()=>{
  const app=fixture();
  assert.equal(run(app.c,'seamSettings({enabled:true}).method'),'plate');
  run(app.c,"S.seam.method='future-connector';");
  assert.equal(run(app.c,'seamSettings().method'),'future-connector');
  const plan=app.plan();
  assert.equal(plan.applicable,false);assert.equal(plan.candidates.length,0);assert.ok(plan.reason);
  assert.equal(run(app.c,'S.seam.method'),'future-connector');
  assert.equal(run(app.c,'projectState({...defaults(),seam:{enabled:true,method:"future-connector"}}).seam.method'),'future-connector');
});

test('Changing each method applies its dimensions and preserves selections for revalidation',()=>{
  const app=fixture(),{c}=app,{candidate}=validCandidate(app);
  c.savedSelection={axis:candidate.axis,seamIndex:candidate.seamIndex,tileIndex:candidate.tileIndex,along:candidate.along};
  run(c,'S.seam.selected=[savedSelection];refreshSeamPlan=queueDraftSave=draw=()=>{};');
  const selected=plain(run(c,'S.seam.selected'));
  for(const id of methodIds){
    c.testMethodId=id;run(c,'changeSeamMethod(testMethodId);');
    const method=run(c,'SEAM_METHODS.find(m=>m.id===testMethodId)');
    assert.equal(run(c,'S.seam.method'),id);
    assert.equal(run(c,'S.seam.length'),method.length);assert.equal(run(c,'S.seam.width'),method.width);
    assert.deepEqual(plain(run(c,'S.seam.selected')),selected);
  }
});

for(const id of ['butt','weld'])test(`${id} process previews retain actual print seams without attachment markers`,()=>{
  const app=fixture(),seams=plain(app.plan().seams);setMethod(app,id);const plan=app.plan();
  assert.equal(plan.requested,true);assert.equal(plan.applicable,false);assert.ok(plan.reason);
  assert.equal(plan.method,id);assert.equal(plan.kind,'process');
  assert.equal(plan.candidates.length,0);assert.deepEqual(plain(plan.seams),seams);
});

for(const id of ['butt','weld'])test(`${id} process lines follow actual wall cuts and stop before a hole`,()=>{
  const app=fixture(),seam=app.plan().seams.find(s=>s.axis==='x'&&s.start===0),{c}=app;
  app.cut(seam.coord,25,9);setMethod(app,id);const plan=app.plan();
  assert.ok(plan.processSegments.length>0);assert.ok(plan.processSegments.length<=2048);
  const target=plan.processSegments.filter(s=>s.axis===seam.axis&&s.coord===seam.coord&&s.tiles.join()===seam.tiles.join());
  assert.ok(target.some(s=>s.start>5&&s.end<45),'the hole creates additional real wall cuts inside the panel');
  assert.ok(target.every(s=>25<s.start||25>s.end),'a process line must not cross the hole centre');
  for(const segment of plan.processSegments){
    assert.ok(['x','y'].includes(segment.axis));
    for(const value of [segment.coord,segment.start,segment.end])assert.ok(Number.isFinite(value));
    assert.ok(segment.end>segment.start);assert.equal(segment.tiles.length,2);
    const edge=plan.seams.find(s=>s.axis===segment.axis&&s.coord===segment.coord&&s.tiles.join()===segment.tiles.join());
    assert.ok(edge);assert.ok(segment.start>=edge.start&&segment.end<=edge.end);
    c.testSegment=segment;
    const onWall=run(c,`(()=>{
      const s=testSegment;
      for(let v=s.start+G.px/2;v<s.end;v+=G.px){
        const x=s.axis==='x'?s.coord:v,y=s.axis==='y'?s.coord:v;
        const i=seamCell(x,y),a=seamCell(x-(s.axis==='x'?G.px:0),y-(s.axis==='y'?G.px:0)),
          b=seamCell(x+(s.axis==='x'?G.px:0),y+(s.axis==='y'?G.px:0));
        if(i<0||a<0||b<0||!G.panel[i]||!G.panel[a]||!G.panel[b]||G.comp.lab[a]!==G.comp.lab[b]||G.edtIn[i]*G.px>S.box.frame+G.px)return false;
      }return true;
    })()`);
    assert.equal(onWall,true,'process segments need continuous material and a real frame wall');
  }
});

for(const id of ['snap','magnet'])test(`${id} cover closures are not advertised as permanent body joints`,()=>{
  const app=fixture();setMethod(app,id);const plan=app.plan();
  assert.equal(plan.method,id);assert.equal(plan.kind,'cover');
  assert.equal(plan.requested,true);assert.equal(plan.applicable,false);assert.equal(plan.candidates.length,0);assert.ok(plan.reason);
});

for(const id of bodyIds)test(`${id} body preview keeps its complete footprint on one component without source mutation`,()=>{
  const app=fixture();setMethod(app,id);
  const settings=run(app.c,'JSON.stringify({S,PB})'),panel=run(app.c,'G.panel'),before=hash(new Uint8Array(panel.buffer));
  const plan=app.plan(),method=run(app.c,'SEAM_METHODS.find(m=>m.id===S.seam.method)');
  assert.equal(plan.applicable,true);assert.equal(plan.spec.length,method.length);assert.equal(plan.spec.width,method.width);
  assert.equal(plan.method,id);assert.equal(plan.kind,'body');assert.equal(plan.spec.minDepth,method.minDepth);
  assert.ok(plan.candidates.length>0);assert.ok(plan.candidates.some(c=>c.valid),`${id} should offer a feasible wall attachment`);
  for(const candidate of plan.candidates)assertFiniteCandidate(candidate);
  assertValidFootprintsOnPanel(app,plan);
  assert.equal(run(app.c,'JSON.stringify({S,PB})'),settings);assert.equal(run(app.c,'G.panel'),panel);
  assert.equal(hash(new Uint8Array(panel.buffer)),before);
  if(method.minDepth>0){
    app.c.tooShallow=method.minDepth-.1;run(app.c,'S.box.depth=jointSpec().lipH+tooShallow;');
    assert.equal(app.plan().candidates.filter(c=>c.valid).length,0,`${id} must respect its minimum depth`);
  }
});

for(const [name,setup]of[
  ['automatic splitting disabled','S.exp.autoSplit=false;'],
  ['one print tile','S.exp.bed=400;S.exp.bedH=400;'],
  ['shell build mode',"S.build.mode='shell';"],
  ['rounded 5D build mode',"S.build.mode='face5d';"],
  ['chamfer 5D build mode',"S.build.mode='face5dChamfer';"]
])test(`Planner remains inactive for ${name}`,()=>{
  const app=fixture();run(app.c,setup);const plan=app.plan();
  assert.equal(plan.requested,true);assert.equal(plan.applicable,false);assert.equal(plan.candidates.length,0);assert.ok(plan.reason);
});

test('Rectangular two-axis splits retain adjacent tile identities and PB-local assembly anchors',()=>{
  const app=fixture(),plan=app.plan();
  assert.equal(plan.applicable,true);assert.equal(plan.resolution,.5);assert.equal(plan.truncated,false);
  assert.ok(plan.seams.some(s=>s.axis==='x'));assert.ok(plan.seams.some(s=>s.axis==='y'));
  assert.ok(plan.candidates.some(c=>c.valid&&c.axis==='x'));assert.ok(plan.candidates.some(c=>c.valid&&c.axis==='y'));
  for(const seam of plan.seams){
    assert.equal(seam.tiles.length,2);assert.ok(seam.end>seam.start);
    const a=seam.tiles[0].match(/^R(\d+)C(\d+)$/),b=seam.tiles[1].match(/^R(\d+)C(\d+)$/);
    assert.ok(a&&b);
    if(seam.axis==='x'){assert.equal(+a[1],+b[1]);assert.equal(Math.abs(+a[2]-+b[2]),1);}
    else{assert.equal(+a[2],+b[2]);assert.equal(Math.abs(+a[1]-+b[1]),1);}
  }
  for(const candidate of plan.candidates){
    assertFiniteCandidate(candidate);const seam=seamFor(plan,candidate);assert.ok(seam);
    assert.deepEqual(plain(candidate.tiles),plain(seam.tiles));
    assert.equal(candidate.anchorMm[seam.axis],seam.coord);
  }
  assertValidFootprintsOnPanel(app,plan);
});

test('Main and cropped dialog canvas coordinates are inverse pairs on an asymmetric padded panel',()=>{
  const app=fixture({width:180,height:140,inside:(x,y)=>x>=30&&x<110&&y>=12&&y<68}),{c}=app;
  const bounds=plain(run(c,'PB')),plan=app.plan();
  const points=[{x:0,y:0},{x:bounds.w,y:0},{x:0,y:bounds.h},{x:bounds.w,y:bounds.h},
    {x:bounds.w*.373,y:bounds.h*.614},...plan.candidates.map(p=>plain(p.anchorMm))];
  assert.ok(plan.candidates.length>0);
  const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
  for(const id of ['view','seamView']){
    c.testCanvas={id,width:700,height:240};
    for(const point of points){
      c.testPoint=point;
      const result=run(c,'(()=>{const uv=seamCanvasPoint(testCanvas,testPoint.x,testPoint.y);return seamCanvasPosition(testCanvas,...uv);})()');
      close(result.x,point.x);close(result.y,point.y);
    }
    for(const uv of [[0,0],[700,0],[0,240],[700,240],[245,113.76]]){
      c.testUv=uv;
      const result=run(c,'(()=>{const p=seamCanvasPosition(testCanvas,...testUv);return seamCanvasPoint(testCanvas,p.x,p.y);})()');
      close(result[0],uv[0]);close(result[1],uv[1]);
    }
  }
});

test('Dialog crop covers PB with a 10 mm border clamped inside the grid without mutating source data',()=>{
  for(const inside of [
    (x,y)=>x>=30&&x<110&&y>=12&&y<68,
    (x,y)=>x>=1&&x<120&&y>=2&&y<90
  ]){
    const {c}=fixture({width:180,height:140,inside}),before=run(c,'JSON.stringify({PB,G})');
    const {bounds,grid}=plain(run(c,'({bounds:PB,grid:{width:G.gw,height:G.gh,px:G.px}})'));
    c.testCanvas={id:'view',width:700,height:240};
    assert.deepEqual(plain(run(c,'seamCanvasFrame(testCanvas)')),{x0:0,y0:0,width:grid.width,height:grid.height});
    c.testCanvas.id='seamView';const frame=run(c,'seamCanvasFrame(testCanvas)'),pad=Math.ceil(10/grid.px);
    assert.equal(frame.x0,Math.max(0,bounds.gx0-pad));assert.equal(frame.y0,Math.max(0,bounds.gy0-pad));
    assert.equal(frame.x0+frame.width,Math.min(grid.width,bounds.gx1+pad+1));
    assert.equal(frame.y0+frame.height,Math.min(grid.height,bounds.gy1+pad+1));
    assert.ok(frame.x0>=0&&frame.y0>=0&&frame.x0+frame.width<=grid.width&&frame.y0+frame.height<=grid.height);
    assert.ok(frame.x0<=bounds.gx0&&frame.y0<=bounds.gy0&&frame.x0+frame.width>=bounds.gx1+1&&frame.y0+frame.height>=bounds.gy1+1);
    assert.ok(frame.width<grid.width&&frame.height<grid.height,'dialog should crop the asymmetric padded source');
    assert.equal(run(c,'JSON.stringify({PB,G})'),before);
  }
});

test('Repeated planning is deterministic and never mutates source settings, grid or panel bounds',()=>{
  const app=fixture(),{c}=app;
  const before=run(c,'JSON.stringify({S,PB})');
  const panel=run(c,'G.panel'),owner=run(c,'G.owner'),dist=run(c,'G.edtIn'),labels=run(c,'G.comp.lab');
  const bytes=hash(new Uint8Array(panel.buffer));
  const first=plain(app.plan()),second=plain(app.plan());
  assert.deepEqual(second,first);assert.equal(run(c,'JSON.stringify({S,PB})'),before);
  assert.equal(run(c,'G.panel'),panel);assert.equal(run(c,'G.owner'),owner);assert.equal(run(c,'G.edtIn'),dist);assert.equal(run(c,'G.comp.lab'),labels);
  assert.equal(hash(new Uint8Array(panel.buffer)),bytes);
});

test('Footprints near an outer edge are rejected even when their centre lies on the panel',()=>{
  const app=fixture(),plan=app.plan(),seam=plan.seams.find(s=>s.axis==='x'&&s.start===0);
  assert.ok(seam);const candidate=app.probe(plan,seam,plan.spec.width/2+.1);
  assert.equal(candidate.valid,false);assert.ok(candidate.reason);assertFiniteCandidate(candidate);
});

test('A footprint cannot cross another tile boundary at a grid intersection',()=>{
  const app=fixture(),plan=app.plan(),seam=plan.seams.find(s=>s.axis==='x'&&s.start===0);
  const candidate=app.probe(plan,seam,seam.end-.1);
  assert.equal(candidate.valid,false);assert.ok(candidate.reason);
});

test('An interior point without nearby frame support cannot become an attachment site',()=>{
  const app=fixture(),plan=app.plan(),seam=plan.seams.find(s=>s.axis==='x'&&s.start===0);
  const candidate=app.probe(plan,seam,(seam.start+seam.end)/2);
  assert.equal(candidate.valid,false);assert.equal(candidate.code,'support');
});

test('A hole inside a proposed wing invalidates that same site instead of connecting over air',()=>{
  const app=fixture(),{candidate,seam}=validCandidate(app,'x'),f=candidate.footprint;
  app.cut(f.x0+2,candidate.anchorMm.y,1.25);
  const plan=app.plan(),after=app.probe(plan,seam,candidate.along);
  assert.equal(after.valid,false);assert.ok(after.reason);assertValidFootprintsOnPanel(app,plan);
});

test('A nearby void outside the footprint still invalidates its required clearance',()=>{
  const app=fixture(),{plan,candidate,seam}=validCandidate(app,'x');
  assert.ok(plan.spec.setback>0);
  app.cut(candidate.footprint.x0-plan.spec.setback/2,candidate.anchorMm.y,.75);
  const after=app.probe(app.plan(),seam,candidate.along);
  assert.equal(after.valid,false);assert.ok(after.reason);
});

test('Disconnected islands on opposite sides of the seam never receive a valid bridge',()=>{
  const width=100,height=40;
  const app=fixture({width,height,inside:(x,y)=>x>=0&&x<width&&y>=0&&y<height&&(x<45||x>55)});
  const plan=app.plan();assert.equal(run(app.c,'G.comp.n'),2);
  assert.equal(plan.candidates.filter(c=>c.valid).length,0);
  const seam=plan.seams.find(s=>s.axis==='x');assert.ok(seam);
  const candidate=app.probe(plan,seam,20);assert.equal(candidate.valid,false);assert.ok(candidate.reason);
});

test('Thin strokes that cannot contain the complete support footprint are rejected',()=>{
  const app=fixture({width:144,height:4}),plan=app.plan();
  assert.equal(plan.applicable,true);assert.equal(plan.candidates.filter(c=>c.valid).length,0);
  for(const c of plan.candidates){assert.equal(c.valid,false);assert.ok(c.reason);}
});

for(const kind of ['screw','snap','hang'])test(`Existing ${kind} hardware blocks a colliding proposed attachment`,()=>{
  const app=fixture(),{candidate,seam}=validCandidate(app,'x'),{c}=app;
  c.blockPoint=candidate.anchorMm;
  run(c,`globalThis.blockPixel=[(blockPoint.x+PB.ux0)/G.px,(S.box.H-PB.my0-blockPoint.y)/G.px];
    ${kind}Points=()=>[blockPixel];S.hw.hang=true;`);
  const after=app.probe(app.plan(),seam,candidate.along);
  assert.equal(after.valid,false);assert.equal(after.code,'hardware');
});

test('The existing cable opening blocks a colliding proposed attachment',()=>{
  const app=fixture(),{candidate,seam}=validCandidate(app,'x'),{c}=app;
  c.blockPoint=candidate.anchorMm;
  run(c,`S.hw.hole='frame';bottomInfo=()=>({
    cx:(blockPoint.x+PB.ux0)/G.px-.5,y1:(S.box.H-PB.my0-blockPoint.y)/G.px-.5
  });`);
  const after=app.probe(app.plan(),seam,candidate.along);
  assert.equal(after.valid,false);assert.equal(after.code,'hardware');
});

test('Selected placements cannot silently overlap one another',()=>{
  const app=fixture(),{candidate}=validCandidate(app,'x');
  app.c.selected={axis:candidate.axis,seamIndex:candidate.seamIndex,tileIndex:candidate.tileIndex,along:candidate.along};
  run(app.c,'S.seam.selected=[{...selected},{...selected,along:selected.along+.5}];');
  const plan=app.plan(),picked=plan.candidates.filter(c=>c.selected);
  assert.equal(picked.length,2);assert.equal(picked[0].valid,true);assert.equal(picked[1].valid,false);assert.equal(picked[1].code,'overlap');
});

test('A selected seam removed by a smaller split count stays removable and its detail renders safely',()=>{
  const app=fixture(),plan=app.plan(),candidate=plan.candidates.find(c=>c.axis==='x'&&c.seamIndex===2&&c.valid);
  assert.ok(candidate);app.c.oldSelection={axis:'x',seamIndex:2,tileIndex:candidate.tileIndex,along:candidate.along};
  run(app.c,'S.seam.selected=[oldSelection];S.exp.bed=100;');
  const next=app.plan(),stale=next.candidates.find(c=>c.selected);
  assert.equal(next.applicable,true);assert.equal(stale.valid,false);assert.equal(stale.code,'inactive');
  assert.deepEqual(plain(run(app.c,'S.seam.selected')),[plain(app.c.oldSelection)]);
  app.c.detailPlan=next;app.c.detailFocus=stale;
  run(app.c,`globalThis.testNodes=new Map();
    const noop=()=>{},drawContext=new Proxy({},{get:()=>noop,set:()=>true});
    const node=()=>({open:true,clientWidth:600,value:1,textContent:'',replaceChildren:noop,append:noop,
      setAttribute:noop,addEventListener:noop,getContext:()=>drawContext});
    document.querySelector=id=>{if(!testNodes.has(id))testNodes.set(id,node());return testNodes.get(id);};
    document.createElement=node;SEAM_PLAN=detailPlan;SEAM_FOCUS=detailFocus;SEAM_IMAGE={};requestSeamPreview=()=>{};`);
  assert.doesNotThrow(()=>run(app.c,'drawSeamDialog()'));
  const detail=run(app.c,'testNodes.get("#seamDetail").textContent');
  assert.ok(detail.includes(stale.reason));assert.doesNotMatch(detail,/undefined|NaN/);
});

test('A shallow box cannot advertise a valid rear-access bridge',()=>{
  const app=fixture(),{candidate,seam}=validCandidate(app,'x');run(app.c,'S.box.depth=12;');
  const plan=app.plan(),after=app.probe(plan,seam,candidate.along);
  assert.equal(after.valid,false);assert.ok(after.reason);
  assert.equal(plan.candidates.filter(c=>c.valid).length,0);
});

test('Marker generation has an explicit bounded result for dense valid print grids',()=>{
  const app=fixture({width:1880,height:920,px:4}),plan=app.plan();
  assert.equal(plan.applicable,true);assert.ok(plan.seams.length>512);
  assert.ok(plan.candidates.length<=512);assert.equal(plan.truncated,true);
  for(const candidate of plan.candidates)assertFiniteCandidate(candidate);
});

test('Process line generation reports truncation when many thin wall cuts exceed its limit',()=>{
  const app=fixture({width:600,height:800,px:1,inside:(x,y)=>x>=0&&x<600&&y>=0&&y<800&&Math.floor(y)%3<2});
  setMethod(app,'butt');const plan=app.plan();
  assert.equal(plan.applicable,false);assert.equal(plan.candidates.length,0);
  assert.equal(plan.processSegments.length,2048);assert.equal(plan.truncated,true);
});

test('All 13 enabled preview methods with retained selections leave exported module meshes byte-for-byte unchanged',()=>{
  const app=fixture(),{c}=app;
  run(c,'S.seam.enabled=false;');
  const digest=()=>run(c,'buildParts(false)').map(m=>({name:m.name,tile:plain(m.tile),n:m.n,vol:m.vol,hash:hash(new Uint8Array(m.a.buffer,0,m.n*4))}));
  const before=digest();app.plan();const after=digest();
  assert.deepEqual(after,before);
  run(c,'S.seam.enabled=true;');
  const {candidate}=validCandidate(app);
  c.previewSelection={axis:candidate.axis,seamIndex:candidate.seamIndex,tileIndex:candidate.tileIndex,along:candidate.along};
  run(c,'S.seam.selected=[previewSelection];');
  for(const id of methodIds){
    setMethod(app,id);const enabledPlan=app.plan();
    if(bodyIds.includes(id)){
      assert.equal(enabledPlan.applicable,true);
      const valid=enabledPlan.candidates.find(p=>p.valid);assert.ok(valid,`${id} should have a valid preview`);
      c.previewSelection={axis:valid.axis,seamIndex:valid.seamIndex,tileIndex:valid.tileIndex,along:valid.along};
      run(c,'S.seam.selected=[previewSelection];');
      assert.ok(app.plan().candidates.some(p=>p.selected&&p.valid));
    }
    assert.ok(run(c,'S.seam.selected.length')>0,'changing method must retain the stored selection');
    assert.deepEqual(digest(),before,`${id} preview selections must never add production geometry`);
  }
});
