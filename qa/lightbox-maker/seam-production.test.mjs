import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const html=fs.readFileSync(new URL('../../public/lightbox_maker/YP-Lightbox-Studio.html',import.meta.url),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const run=(c,s)=>vm.runInContext(s,c),plain=v=>JSON.parse(JSON.stringify(v));
const near=(a,b,eps=1e-5)=>assert.ok(Math.abs(a-b)<=eps,`${a} != ${b}`);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const methods=['butt','lap','scarf','tongue','dowel','butterfly','dovetail','plate','nut','selftap','snap','magnet','weld'];

function fixture({width=144,height=100,px=.5,depth=60,smooth=false,joint='lip',stubHardware=true,
  padding={left:8,right:18,bottom:14,top:22},inside=(x,y)=>x>=0&&x<width&&y>=0&&y<height}={}){
  const c=vm.createContext({document:{readyState:'loading',addEventListener(){},querySelector(){return {textContent:'',classList:{toggle(){},add(){},remove(){}}};}},
    window:{},TextEncoder,TextDecoder,Blob,console,performance,setTimeout,clearTimeout,structuredClone});
  vm.runInContext(source,c);
  const gw=Math.ceil((width+padding.left+padding.right)/px),gh=Math.ceil((height+padding.top+padding.bottom)/px);
  const panel=new Uint8Array(gw*gh);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)panel[y*gw+x]=+inside((x+.5)*px-padding.left,(gh-y-.5)*px-padding.bottom);
  c.input={gw,gh,px,panel,depth,joint,smooth,stubHardware};
  run(c,`S=defaults();S.build.mode='service';S.box.W=input.gw*input.px;S.box.H=input.gh*input.px;
    S.box.depth=input.depth;S.box.bandN=1;S.hw.joint=input.joint;S.hw.hole='none';S.hw.hang=false;
    S.exp={...S.exp,res:input.px,bed:80,bedH:80,margin:10,smooth:input.smooth,autoSplit:true};
    S.seam={...S.seam,enabled:true,method:'plate',production:false,length:32,width:12,selected:[]};
    globalThis.rebuildProductionGrid=()=>{
      const {gw,gh,px}=input,panel=Uint8Array.from(input.panel),owner=new Uint8Array(panel.length).fill(255);
      for(let i=0;i<panel.length;i++)if(panel[i])owner[i]=1;
      G={gw,gh,px,panel,owner,K:1,empty:!panel.some(Boolean),edtIn:edtToOutside(panel,gw,gh),comp:components(panel,gw,gh)};
      computeAreas();PB=panelBounds();
    };
    if(input.stubHardware)screwPoints=snapPoints=hangPoints=()=>[];
    rebuildProductionGrid();`);
  return {
    c,
    build:nt=>run(c,`buildParts(${!!nt})`),
    plan:()=>run(c,'seamProductionPlan()'),
    select(axes=['x']){
      c.axes=axes;
      run(c,`(()=>{
        const plan=buildSeamPlan(),chosen=[];
        for(const axis of axes){
          const p=plan.candidates.find(p=>p.axis===axis&&p.valid&&!chosen.some(q=>seamOverlap(p.footprint,q.footprint)));
          if(!p)throw new Error('Fixture has no valid '+axis+' joint');
          chosen.push(p);
        }
        S.seam.selected=chosen.map(({axis,seamIndex,tileIndex,along})=>({axis,seamIndex,tileIndex,along}));
        S.seam.production=true;
      })()`);
      return this.plan();
    },
    async export(fmt){
      c.testFormat=fmt;run(c,'S.exp.fmt=testFormat;buildGrid=()=>G;');
      return await run(c,'generateExportFiles()');
    }
  };
}

function meshDigest(parts){
  return Array.from(parts,p=>({name:p.name,kind:p.kind,module:p.module,tile:p.tile?plain(p.tile):null,n:p.n,vol:p.vol,
    hash:hash(new Uint8Array(p.a.buffer,p.a.byteOffset,p.n*4))}));
}

function assertClosedConnected(mesh){
  assert.ok(mesh.n>0&&mesh.n%12===0);
  const edges=new Map(),adjacent=new Map();let signedVolume=0;
  const key=p=>p.map(v=>Math.round(v*1e5)).join(',');
  for(let i=0;i<mesh.n;i+=12){
    const p=[0,1,2].map(k=>Array.from(mesh.a.subarray(i+3+k*3,i+6+k*3))),keys=p.map(key);
    const u=p[1].map((v,k)=>v-p[0][k]),v=p[2].map((n,k)=>n-p[0][k]);
    const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],area=Math.hypot(...cross);
    assert.ok(area>1e-10,`${mesh.name}: degenerate triangle`);
    const normal=Array.from(mesh.a.subarray(i,i+3));
    near(Math.hypot(...normal),1,1e-4);
    assert.ok(cross.reduce((n,x,k)=>n+x*normal[k],0)/area>.9999,`${mesh.name}: normal disagrees with winding`);
    signedVolume+=(p[0][0]*(p[1][1]*p[2][2]-p[1][2]*p[2][1])+p[0][1]*(p[1][2]*p[2][0]-p[1][0]*p[2][2])+p[0][2]*(p[1][0]*p[2][1]-p[1][1]*p[2][0]))/6;
    for(let k=0;k<3;k++){
      const a=keys[k],b=keys[(k+1)%3],edge=a<b?`${a}|${b}`:`${b}|${a}`,count=edges.get(edge)||[0,0];
      count[0]++;count[1]+=a<b?1:-1;edges.set(edge,count);
      if(!adjacent.has(a))adjacent.set(a,new Set());if(!adjacent.has(b))adjacent.set(b,new Set());
      adjacent.get(a).add(b);adjacent.get(b).add(a);
    }
  }
  for(const [edge,[count,balance]] of edges){assert.equal(count,2,`${mesh.name}: non-manifold ${edge}`);assert.equal(balance,0,`${mesh.name}: inconsistent ${edge}`);}
  const seen=new Set(),todo=[adjacent.keys().next().value];
  while(todo.length){const p=todo.pop();if(seen.has(p))continue;seen.add(p);for(const q of adjacent.get(p))if(!seen.has(q))todo.push(q);}
  assert.equal(seen.size,adjacent.size,`${mesh.name}: disconnected overlapping solids do not form a union`);
  assert.ok(signedVolume>0,`${mesh.name}: inward or zero-volume boundary`);
  near(signedVolume,mesh.vol,Math.max(1e-3,mesh.vol*1e-5));
}

function zHits(mesh,x,y){
  const hits=[];
  for(let i=0;i<mesh.n;i+=12){
    const p=[0,1,2].map(k=>Array.from(mesh.a.subarray(i+3+k*3,i+6+k*3)));
    const d=(p[1][1]-p[2][1])*(p[0][0]-p[2][0])+(p[2][0]-p[1][0])*(p[0][1]-p[2][1]);
    if(Math.abs(d)<1e-10)continue;
    const a=((p[1][1]-p[2][1])*(x-p[2][0])+(p[2][0]-p[1][0])*(y-p[2][1]))/d;
    const b=((p[2][1]-p[0][1])*(x-p[2][0])+(p[0][0]-p[2][0])*(y-p[2][1]))/d,cc=1-a-b;
    if(Math.min(a,b,cc)<-1e-7)continue;
    hits.push(a*p[0][2]+b*p[1][2]+cc*p[2][2]);
  }
  return hits.sort((a,b)=>a-b).filter((z,i,list)=>i===0||Math.abs(z-list[i-1])>1e-5);
}

function frameLocal(part,x,y,bounds){return {x:bounds.w-x-(part.offset?.x||0),y:y-(part.offset?.y||0)};}
function unzipStored(buffer){
  const bytes=Buffer.from(buffer),files=new Map();let at=0;
  while(at+30<=bytes.length&&bytes.readUInt32LE(at)===0x04034b50){
    assert.equal(bytes.readUInt16LE(at+8),0);
    const n=bytes.readUInt32LE(at+18),len=bytes.readUInt16LE(at+26),extra=bytes.readUInt16LE(at+28);
    const name=bytes.subarray(at+30,at+30+len).toString('utf8'),start=at+30+len+extra;
    files.set(name,bytes.subarray(start,start+n));at=start+n;
  }return files;
}

function unionMesh(app,boxes){
  app.c.unionBoxes=boxes;
  return run(app.c,`(()=>{
    const ops=unionBoxes.map(b=>{const runs=[];for(let y=PB.gy0+b.y0;y<PB.gy0+b.y1;y++)runs.push(y,PB.gx0+b.x0,PB.gx0+b.x1);return {runs,z0:b.z0,z1:b.z1};});
    const M=Mesh('reference union','#123456'),saved=ACTIVE_PRINT_PLAN;ACTIVE_PRINT_PLAN=null;
    try{seamFrameUnion(M,ops);return M;}finally{ACTIVE_PRINT_PLAN=saved;}
  })()`);
}

test('Production is opt-in and all preview methods preserve legacy meshes while it is off',()=>{
  const app=fixture(),{c}=app;
  assert.equal(run(c,'defaults().seam.production'),false);
  assert.equal(app.plan(),null);
  const baseline=meshDigest(app.build(false));
  for(const method of methods){c.testMethod=method;run(c,'S.seam.method=testMethod;');assert.equal(app.plan(),null);assert.deepEqual(meshDigest(app.build(false)),baseline);}
});

test('Frame union removes overlapping internal faces and conserves the analytic union volume across a print cut',()=>{
  const {c}=fixture({width:100,height:40,px:1});
  const parts=run(c,`(()=>{
    const rect=(x0,x1,y0,y1)=>{const out=[];for(let y=PB.gy0+y0;y<PB.gy0+y1;y++)out.push(y,PB.gx0+x0,PB.gx0+x1);return out;};
    const M=Mesh('reference union','#123456');M.kind='frame';M.module='box';
    const plan=printPlan();ACTIVE_PRINT_PLAN=plan;
    try{seamFrameUnion(M,[{runs:rect(46,52,4,9),z0:0,z1:4},{runs:rect(50,56,6,11),z0:2,z1:6}]);return finishPrintParts([M],plan);}
    finally{ACTIVE_PRINT_PLAN=null;}
  })()`);
  assert.equal(parts.length,2);
  for(const part of parts)assertClosedConnected(part);
  // Two 6×5×4 boxes overlap by 2×3×2; the seam cuts the first box at x=50.
  near(parts.reduce((n,p)=>n+p.vol,0),6*5*4*2-2*3*2);
  near(parts.find(p=>p.tile.id==='R1C1').vol,4*5*4);
  near(parts.find(p=>p.tile.id==='R1C2').vol,2*5*4+6*5*4-2*3*2);
});

test('Constant rectangular frame caps grow with their boundary instead of their raster area',()=>{
  const app=fixture({width:100,height:100,px:1}),caps=[];
  for(const size of [20,80]){
    const mesh=unionMesh(app,[{x0:10,x1:10+size,y0:10,y1:10+size,z0:0,z1:4}]);
    assertClosedConnected(mesh);near(mesh.vol,size*size*4);
    let count=0;for(let i=0;i<mesh.n;i+=12)if(Math.abs(mesh.a[i+2])>.99)count++;
    assert.ok(count>0);assert.ok(count<=8*(size+size),'flat caps should use boundary-sized strips');caps.push(count);
  }
  assert.ok(caps[1]<=caps[0]*5,'16× more cap area must not produce 16× more triangles');
});

test('Unrelated Z events do not multiply triangles on an unchanged connected frame boundary',()=>{
  const app=fixture({width:100,height:100,px:1});
  const body={x0:8,x1:40,y0:8,y1:40,z0:0,z1:50},link={x0:40,x1:70,y0:20,y1:24,z0:0,z1:1},
    remote={x0:70,x1:74,y0:20,y1:24,z0:0,z1:50};
  const baseline=unionMesh(app,[body,link,remote]),segmented=unionMesh(app,[body,link,
    ...Array.from({length:50},(_,z)=>({...remote,z0:z,z1:z+1}))]);
  assertClosedConnected(baseline);assertClosedConnected(segmented);
  const volume=32*32*50+30*4+4*4*50;
  near(baseline.vol,volume);near(segmented.vol,volume);
  assert.equal(segmented.n,baseline.n,'partitioning a remote operation must not split every wall at every Z event');
});

for(const axis of ['x','y'])test(`${axis}-axis J08 production creates united frame bases and one separate closed bridge`,()=>{
  const app=fixture(),baseline=app.build(false),plan=app.select([axis]),parts=app.build(false);
  assert.equal(plan.joints.length,1);const joint=plan.joints[0],bridge=parts.find(p=>p.module==='joint');
  assert.ok(bridge);assert.equal(parts.filter(p=>p.module==='joint').length,1);
  assert.equal(bridge.kind,'connector');assert.equal(bridge.noMirrorX,true);assert.equal(bridge.tile,undefined);
  assert.equal(bridge.jointId,joint.id);assert.equal(bridge.printBase,0);
  near(bridge.x0,0);near(bridge.y0,0);near(bridge.z0,0);
  assertClosedConnected(bridge);
  const frames=parts.filter(p=>p.module==='box');assert.ok(frames.length>0);
  for(const frame of frames)assertClosedConnected(frame);
  const bounds=plain(run(app.c,'PB')),stack=run(app.c,'geomStack()');
  for(const pad of joint.pads){
    const frame=frames.find(p=>p.tile.id===pad.tile),point=frameLocal(frame,pad.wallX+.017,pad.wallY+.031,bounds);
    const hits=zHits(frame,point.x,point.y);
    assert.equal(hits.length,2,'the wall/base union must not retain internal prism caps');
    near(hits[0],stack.frameZ0);near(hits[1],stack.frameZ0+60);
  }
  assert.deepEqual(meshDigest(parts.filter(p=>p.module==='front'||p.module==='back')),
    meshDigest(baseline.filter(p=>p.module==='front'||p.module==='back')));
  assert.ok(frames.reduce((n,p)=>n+p.vol,0)>baseline.filter(p=>p.module==='box').reduce((n,p)=>n+p.vol,0));
});

for(const axis of ['x','y'])test(`${axis}-axis insert pockets open at the rear and bridge bolt holes remain uncapped`,()=>{
  const app=fixture(),plan=app.select([axis]),parts=app.build(false),bounds=plain(run(app.c,'PB'));
  const joint=plan.joints[0],bridge=parts.find(p=>p.jointId===joint.id),frames=parts.filter(p=>p.module==='box');
  assert.equal(joint.holes.length,2);assert.equal(bridge.joint.holes.length,2);
  for(const hole of joint.holes){
    assert.ok(hole.diameter>0&&hole.baseZ1>hole.baseZ0);
    near(hole.baseZ1,joint.baseTop);
    const x=hole.x+.017,y=hole.y+.031,local={x:x-bridge.assemblyAnchor.x,y:y-bridge.assemblyAnchor.y};
    assert.equal(zHits(bridge,local.x,local.y).length,0,'bolt hole must pass through the complete bridge');
    const frame=frames.find(p=>joint.tiles.includes(p.tile.id)&&(()=>{const q=frameLocal(p,x,y,bounds);return q.x>=p.x0&&q.x<=p.x1&&q.y>=p.y0&&q.y<=p.y1;})());
    assert.ok(frame,'each blind pocket must belong to its correct body tile');
    const point=frameLocal(frame,x,y,bounds),hits=zHits(frame,point.x,point.y);
    assert.ok(hits.some(z=>Math.abs(z-hole.baseZ0)<1e-4),'blind insert seat needs a material floor');
    assert.ok(!hits.some(z=>z>hole.baseZ0+1e-4&&z<=hole.baseZ1+1e-4),'no cap may close the insert opening');
  }
});

test('Production union remains closed with existing snap/screw hardware and multiple frame color bands',()=>{
  const app=fixture({joint:'snap',stubHardware:false});
  run(app.c,'S.box.bandN=3;S.box.bandRules=[{pos:35,width:5},{pos:65,width:4}];');
  app.select();const parts=app.build(false),frames=parts.filter(p=>p.module==='box');
  assert.ok(frames.some(p=>p.bossCount>0));assert.ok(frames.some(p=>p.snapCount>0));
  assert.ok(new Set(frames.map(p=>p.hex)).size>1);
  for(const frame of frames)assertClosedConnected(frame);
  assert.equal(run(app.c,'exportMeshIssues(buildParts(false)).length'),0);
});

test('Two-axis joints retain PB-local hole positions and assembly placement under an asymmetric crop',()=>{
  const app=fixture(),plan=app.select(['x','y']),parts=app.build(false),{c}=app,bounds=plain(run(c,'PB'));
  assert.equal(plan.joints.length,2);
  for(const joint of plan.joints){
    const bridge=parts.find(p=>p.jointId===joint.id);assert.ok(bridge);
    near(bridge.assemblyAnchor.x,joint.footprint.x0);near(bridge.assemblyAnchor.y,joint.footprint.y0);near(bridge.assemblyAnchor.z,joint.baseTop);
    c.testBridge=bridge;const matrix=run(c,'partMatrix(testBridge,"asm")');
    for(const hole of joint.holes){
      const local={x:hole.x-bridge.assemblyAnchor.x,y:hole.y-bridge.assemblyAnchor.y};
      const worldX=matrix[0]*local.x+matrix[4]*local.y+matrix[12],worldY=matrix[1]*local.x+matrix[5]*local.y+matrix[13];
      near(worldX,hole.x-bounds.w/2);near(worldY,hole.y-bounds.h/2);
      assert.equal(zHits(bridge,local.x+.017,local.y+.031).length,0);
    }
  }
});

test('Production with an unknown method or missing/stale/invalid selections is rejected explicitly',()=>{
  for(const method of ['future-connector']){
    const app=fixture();app.select();app.c.testMethod=method;run(app.c,'S.seam.method=testMethod;');
    assert.throws(()=>app.build(false),undefined,`${method} must not silently export butt joints`);
  }
  for(const setup of ['S.seam.selected=[];','S.seam.selected[0].seamIndex=99;','S.seam.selected[0].along=0;','S.build.mode="shell";','S.exp.autoSplit=false;','S.seam.enabled=false;']){
    const app=fixture();app.select();run(app.c,setup);assert.throws(()=>app.build(false),undefined,setup);
  }
});

test('Invalid custom hardware, a thin blind-pocket floor and inadequate production space are rejected',()=>{
  for(const setup of [
    'S.seam.hardware.hole=NaN;',
    'S.seam.hardware.plateT=100;',
    'S.seam.hardware.baseT=6;S.seam.hardware.depth=5;',
    'S.seam.hardware.bolt=S.seam.hardware.hole;',
    'S.seam.length=24;S.seam.width=8;',
    'S.box.depth=12;'
  ]){
    const app=fixture();app.select();run(app.c,setup);assert.throws(()=>app.build(false),undefined,setup);
  }
});

test('No-triangle quote builds preserve added production volume without allocating triangle buffers',()=>{
  const app=fixture(),baseline=app.build(false),baselineQuote=app.build(true);app.select();const full=app.build(false),quoted=app.build(true);
  assert.ok(quoted.some(p=>p.module==='joint'&&p.n===0&&p.vol>0));
  assert.ok(quoted.filter(p=>p.module==='joint').every(p=>p.noTri&&p.a.length===0));
  const sum=parts=>parts.reduce((n,p)=>n+p.vol,0);
  near(sum(quoted)-sum(baselineQuote),sum(full)-sum(baseline),1e-3);
  for(const module of ['box','joint'])near(sum(quoted.filter(p=>p.module===module)),sum(full.filter(p=>p.module===module)),1e-3);
});

test('Cropping empty raster margins preserves physical production meshes and assembly coordinates',()=>{
  const full=fixture(),plan=full.select(['x','y']),selection=plain(run(full.c,'S.seam.selected'));
  const cropped=fixture({padding:{left:2,right:3,bottom:4,top:5}});cropped.c.savedSelection=selection;
  run(cropped.c,'S.seam.selected=savedSelection;S.seam.production=true;');
  const next=cropped.plan();
  assert.deepEqual(plain(next.joints.map(j=>({id:j.id,holes:j.holes,footprint:j.footprint,baseTop:j.baseTop}))),
    plain(plan.joints.map(j=>({id:j.id,holes:j.holes,footprint:j.footprint,baseTop:j.baseTop}))));
  assert.deepEqual(meshDigest(cropped.build(false)),meshDigest(full.build(false)));
});

test('Full-resolution production reuses assembly selections and rejects a newly resolved void',async()=>{
  const preview=fixture(),plan=preview.select(),selection=plain(run(preview.c,'S.seam.selected')),hole=plan.joints[0].holes[0];
  const full=fixture({px:.25});full.c.savedSelection=selection;run(full.c,'S.seam.selected=savedSelection;S.seam.production=true;');
  const finalPlan=full.plan();
  assert.equal(finalPlan.resolution,.25);
  assert.deepEqual(plain(finalPlan.joints[0].holes),plain(plan.joints[0].holes));
  const bridge=full.build(false).find(p=>p.module==='joint');assertClosedConnected(bridge);
  const invalid=fixture({px:.25,inside:(x,y)=>x>=0&&x<144&&y>=0&&y<100&&(x-hole.x)**2+(y-hole.y)**2>1});
  invalid.c.savedSelection=selection;run(invalid.c,'S.seam.selected=savedSelection;S.seam.production=true;');
  await assert.rejects(invalid.export('stl'),undefined,'full-resolution changes must not silently drop the requested joint');
});

for(const axis of ['x','y'])for(const px of [.5,.15])test(`40 mm depth supports an actual ${axis} joint at ${px} mm resolution with the preview selection retained`,()=>{
  const preview=fixture({width:100,height:100,depth:40}),previewPlan=preview.select([axis]);
  const app=px===.5?preview:fixture({width:100,height:100,depth:40,px});
  if(app!==preview){app.c.savedSelection=plain(run(preview.c,'S.seam.selected'));run(app.c,'S.seam.selected=savedSelection;S.seam.production=true;');}
  const plan=app.plan(),parts=app.build(false),joint=plan.joints[0],bridge=parts.find(p=>p.module==='joint');
  assert.equal(plan.joints.length,1);assert.equal(joint.axis,axis);assert.equal(joint.id,previewPlan.joints[0].id);
  near(plan.resolution,px);assert.ok(joint.pads.length===2&&bridge.n>0);assertClosedConnected(bridge);
  const stack=run(app.c,'geomStack()'),lip=run(app.c,'jointSpec()');
  assert.ok(stack.frameZ0+40-lip.lipH-(joint.baseTop+joint.spec.plateT)>=.5-1e-8,'bridge must clear the rear lip');
  for(const hole of joint.holes)assert.ok(hole.baseZ0-joint.baseBottom>=1.5,'the blind pocket must retain its material floor');
  for(const tile of joint.tiles)assertClosedConnected(parts.find(p=>p.module==='box'&&p.tile.id===tile));
});

test('Actual OBJ exports retain joint metadata and place each connector on its own grounded cleared plate',async()=>{
  const app=fixture({width:100,height:100,depth:40});app.select(['x','y']);const parts=app.build(false),{c}=app;
  c.testParts=parts;const layout=run(c,'V3.parts=testParts;plateRenderLayout()'),pack=layout.pack;
  const joints=parts.filter(p=>p.module==='joint');assert.equal(joints.length,2);
  assert.equal(pack.plates.filter(p=>p.module==='joint').length,2);assert.equal(pack.fits,true);
  const names=new Map();
  for(const joint of joints){
    c.testJoint=joint;const key=run(c,'"joint:"+fileToken(testJoint.jointId)'),name=run(c,'fileToken(testJoint.name)');
    const place=pack.items[key];assert.ok(place);near(place.x-place.bx,10);near(place.y-place.by,10);
    const matrix=run(c,'partMatrix(testJoint,"plate",{pack:platePack(testParts),bases:new Map([["joint",0]])})');
    let floor=Infinity;
    for(const x of [joint.x0,joint.x1])for(const y of [joint.y0,joint.y1])for(const z of [joint.z0,joint.z1]){
      const wx=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],height=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],
        wz=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14];
      const bedX=wx+pack.bed/2-place.bx,bedY=pack.bed/2-wz-place.by;
      assert.ok(bedX>=10-1e-5&&bedX<=pack.bed-10+1e-5&&bedY>=10-1e-5&&bedY<=pack.bedH-10+1e-5);
      assert.ok(height>=-1e-5);floor=Math.min(floor,height);
    }
    near(floor,0);names.set(name,{joint,place,vertices:[],faces:0});
  }
  const result=await app.export('obj');assert.equal(result.files.length,1);
  const files=unzipStored(await result.files[0].blob.arrayBuffer()),manifest=JSON.parse(files.get('assembly.json').toString('utf8'));
  assert.equal(manifest.schemaVersion,2);assert.equal(manifest.joints.length,2);
  const obj=[...files].find(([name])=>name.endsWith('.obj'))?.[1].toString('utf8');
  assert.ok(obj);assert.ok([...files.keys()].some(name=>name.endsWith('.mtl')));
  let active=null;
  for(const line of obj.split('\n')){
    if(line.startsWith('o '))active=names.get(line.slice(2))||null;
    else if(active&&line.startsWith('v '))active.vertices.push(line.slice(2).trim().split(/\s+/).map(Number));
    else if(active&&line.startsWith('f '))active.faces++;
  }
  for(const {joint,place,vertices,faces} of names.values()){
    assert.ok(vertices.length>0&&faces>0);near(Math.min(...vertices.map(v=>v[2])),0,1e-4);
    assert.ok(vertices.every(v=>v.every(Number.isFinite)&&v[0]>=place.bx+10-1e-4&&v[0]<=place.bx+pack.bed-10+1e-4&&
      v[1]>=place.by+10-1e-4&&v[1]<=place.by+pack.bedH-10+1e-4&&v[2]>=-1e-4));
    const record=manifest.joints.find(p=>p.jointId===joint.jointId);assert.ok(record);
    assert.deepEqual(record.assemblyAnchor,plain(joint.assemblyAnchor));assert.equal(record.hardware.reduce((n,h)=>n+h.quantity,0),4);
  }
});

for(const fmt of ['3mf','stl'])test(`${fmt} exports separate grounded joint files, matching assembly metadata and real BOM`,async()=>{
  const app=fixture();app.select(['x','y']);const parts=app.build(false),joints=parts.filter(p=>p.module==='joint');
  run(app.c,'S.price.qty=3;');
  const result=await app.export(fmt);assert.equal(result.files.length,1);
  const files=unzipStored(await result.files[0].blob.arrayBuffer()),manifest=JSON.parse(files.get('assembly.json').toString('utf8'));
  assert.equal(manifest.schemaVersion,2);assert.equal(manifest.joints.length,joints.length);
  assert.equal(manifest.bom.printedConnectorsPerSign,joints.length);
  assert.equal(manifest.bom.hardwarePerSign.reduce((n,h)=>n+h.quantity,0),joints.length*4);
  assert.equal(manifest.bom.hardwareTotal.reduce((n,h)=>n+h.quantity,0),joints.length*4*3);
  for(const joint of joints){
    const record=manifest.joints.find(j=>j.id===joint.jointId||j.jointId===joint.jointId);assert.ok(record);
    assert.ok(record.file);const filename=record.file.endsWith('.'+fmt)?record.file:record.file+'.'+fmt;
    assert.ok(files.has(filename),`missing ${filename}`);
    if(fmt==='3mf'){
      const xml=unzipStored(files.get(filename)).get('3D/3dmodel.model').toString('utf8');
      assert.ok([...xml.matchAll(/<item /g)].length>0);assert.ok([...xml.matchAll(/<triangle /g)].length>0);
      const vertices=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map(m=>m.slice(1).map(Number));
      assert.ok(vertices.length>0);near(Math.min(...vertices.map(v=>v[2])),0,.001);
      assert.ok(vertices.every(v=>v[0]>=-.001&&v[1]>=-.001&&v[2]>=-.001&&v[0]<=60.001&&v[1]<=60.001));
      assert.match(xml,/transform="1 0 0 0 1 0 0 0 1 10 10 0"/);
    }else{
      const bytes=files.get(filename),triangles=bytes.readUInt32LE(80);assert.ok(triangles>0);assert.equal(bytes.length,84+triangles*50);
      const z=[];for(let t=0;t<triangles;t++)for(let k=0;k<3;k++)z.push(bytes.readFloatLE(84+t*50+12+k*12+8));
      near(Math.min(...z),0,1e-5);assert.ok(z.every(v=>v>=-1e-5));
    }
    assert.equal(joint.joint.hardware.reduce((n,h)=>n+h.quantity,0),4);
  }
});

test('Every joint preview uses distinct closed manufacturing geometry and leaves production state unchanged',()=>{
  const signatures=new Set();
  for(const method of methods){
    const app=fixture({width:120,height:120,px:.2}),{c}=app;c.chosenMethod=method;
    run(c,`S.seam.method=chosenMethod;S.seam.production=true;S.seam.length=48;S.seam.width=20;S.seam.hardware.clearance=.4;
      if(chosenMethod==='selftap')S.seam.hardware.hole=2.5;`);
    const production=app.select(),before=meshDigest(app.build(false));c.previewProduction=production;
    const result=run(c,`(()=>{
      const grid=G,bounds=PB,state=JSON.stringify(S),saved={marker:'existing plan'};ACTIVE_PRINT_PLAN=saved;
      const preview=seamPreviewGeometry(previewProduction,previewProduction.joints[0].id);
      if(G!==grid||PB!==bounds||JSON.stringify(S)!==state||ACTIVE_PRINT_PLAN!==saved)throw new Error('preview mutated production state');
      ACTIVE_PRINT_PLAN=null;return preview;
    })()`);
    assert.equal(result.method,method);assert.equal(result.cutaway,true);assert.ok(result.roiCells<100000);
    assert.ok(result.parts.some(p=>p.role==='body-a')&&result.parts.some(p=>p.role==='body-b'));
    assert.ok(result.parts.some(p=>p.role==='connector'));
    for(const part of result.parts){assert.equal(part.a.length,part.n);assertClosedConnected(part);assert.ok(part.a.every(Number.isFinite));}
    const signature=hash(Buffer.concat(result.parts.map(p=>Buffer.from(p.a.buffer,p.a.byteOffset,p.n*4))));
    assert.ok(!signatures.has(signature),method+': preview aliases another manufacturing design');signatures.add(signature);
    assert.deepEqual(meshDigest(app.build(false)),before,method+': preview changed printable output');
  }
});

test('All 13 physical previews work with export disabled and leave printable meshes unchanged',()=>{
  for(const method of methods){
    const app=fixture({width:120,height:120,px:.2}),{c}=app;c.previewMethod=method;
    run(c,`S.seam.method=previewMethod;S.seam.production=false;S.seam.length=48;S.seam.width=20;
      S.seam.hardware.clearance=.4;if(previewMethod==='selftap')S.seam.hardware.hole=2.5;`);
    const before=meshDigest(app.build(false));
    const preview=run(c,`(()=>{
      const before=JSON.stringify(S),grid=G,bounds=PB,settings=seamPreviewSettings(),plan=buildSeamPlan(settings);
      if(!settings.production||S.seam.production)throw new Error('preview and export settings are not independent');
      const candidate=plan.candidates.find(p=>p.valid&&p.axis==='x');
      if(!candidate)throw new Error(previewMethod+': no physical preview site');
      const production=seamProductionPlan({...plan,candidates:[{...candidate,selected:true}]},settings);
      const result=seamPreviewGeometry(production,production.joints[0].id);
      if(JSON.stringify(S)!==before||G!==grid||PB!==bounds)throw new Error('preview changed live artwork or export settings');
      if(seamProductionPlan()!==null)throw new Error('preview enabled printable joints');
      return result;
    })()`);
    assert.equal(preview.method,method);assert.ok(preview.parts.some(p=>p.role==='connector'));
    assert.ok(preview.parts.every(p=>p.n>0&&p.n===p.a.length&&p.a.every(Number.isFinite)));
    assert.equal(run(c,'S.seam.production'),false);assert.deepEqual(plain(run(c,'S.seam.selected')),[]);
    assert.deepEqual(meshDigest(app.build(false)),before,method+': preview altered export-disabled meshes');
  }
});

test('Preview preparation normalizes only a copy of export-disabled settings and preserves active custom profiles',()=>{
  const {c}=fixture();
  const result=run(c,`(()=>{
    S.seam.method='selftap';S.seam.length=20;S.seam.width=8;S.seam.hardware.hole=4.2;S.seam.hardware.clearance=.2;
    const before=JSON.stringify(S),off=seamPreviewSettings();
    if(JSON.stringify(S)!==before)throw new Error('preview preparation changed saved settings');
    S.seam.production=true;const active=seamSettings(),on=seamPreviewSettings();
    return {off,on,active,hardwareCopied:off.hardware!==S.seam.hardware&&on.hardware!==S.seam.hardware};
  })()`);
  assert.equal(result.off.production,true);assert.equal(result.off.length,32);assert.equal(result.off.width,12);
  assert.equal(result.off.hardware.hole,2.5);assert.equal(result.off.hardware.clearance,.35);
  assert.deepEqual(plain(result.on),plain(result.active),'active custom profile was silently replaced');
  assert.equal(result.on.length,20);assert.equal(result.on.hardware.hole,4.2);assert.equal(result.hardwareCopied,true);
});

test('Local frame and connector previews align with both physical seam axes',()=>{
  for(const axis of ['x','y']){
    const app=fixture({width:120,height:120,px:.2}),{c}=app;
    run(c,`S.seam.method='lap';S.seam.length=48;S.seam.width=20;S.seam.hardware.clearance=.4;`);
    const production=app.select([axis]),joint=production.joints[0],full=app.build(false),bounds=plain(run(c,'PB'));
    c.previewProduction=production;const preview=run(c,'seamPreviewGeometry(previewProduction,previewProduction.joints[0].id)');
    for(const pad of joint.pads){
      const body=preview.parts.find(p=>p.role===(joint.tiles.indexOf(pad.tile)===0?'body-a':'body-b'));
      const actual=full.find(p=>p.module==='box'&&p.tile.id===pad.tile);
      const x=pad.cx+.037,y=pad.cy+.053,local=frameLocal(actual,x,y,bounds);
      const expected=zHits(actual,local.x,local.y),observed=zHits(body,x-joint.anchorMm.x,y-joint.anchorMm.y);
      assert.equal(observed.length,expected.length);observed.forEach((z,i)=>near(z,expected[i],1e-4));
    }
    const connectors=full.filter(p=>p.module==='joint'),visible=preview.parts.filter(p=>p.role==='connector');
    assert.equal(connectors.length,visible.length);
    for(let p=0;p<connectors.length;p++){
      const actual=connectors[p],shown=visible[p],B=actual.assemblyBasis,A=actual.assemblyAnchor;
      assert.equal(shown.n,actual.n);
      for(let i=0;i<actual.n;i+=12)for(let k=0;k<3;k++)for(let d=0;d<3;d++){
        const at=i+3+k*3,x=actual.a[at],y=actual.a[at+1],z=actual.a[at+2];
        const expected=A[['x','y','z'][d]]+B[d]*x+B[3+d]*y+B[6+d]*z-(d<2?joint.anchorMm[['x','y'][d]]:0);
        near(shown.a[at+d],expected,1e-4);
      }
    }
  }
});

test('A 173 cm preview is bounded to its local raster and does not invoke whole-job builders',()=>{
  const app=fixture({width:1730,height:318,px:.72}),{c}=app;
  run(c,'S.exp.bed=S.exp.bedH=400;');const production=app.select();c.previewProduction=production;
  const result=run(c,`(()=>{
    buildParts=buildPartMeshes=panelBounds=()=>{throw new Error('whole-job builder called');};
    const {gw,gh,px,panel,edtIn}=G;G={gw,gh,px,panel,edtIn};
    return {gridCells:gw*gh,preview:seamPreviewGeometry(previewProduction,previewProduction.joints[0].id)};
  })()`);
  assert.ok(result.preview.roiCells<result.gridCells*.02);assert.ok(result.preview.parts.every(p=>p.n>0));
});

test('Preview failures restore outer print state and connector-local grid mutations',()=>{
  const app=fixture({px:.2}),{c}=app;
  run(c,"S.seam.method='lap';S.seam.hardware.clearance=.4;");const production=app.select();c.previewProduction=production;
  run(c,`globalThis.priorGrid=G;globalThis.priorBounds=PB;globalThis.priorSettings=JSON.stringify(S);globalThis.priorPrint={marker:true};
    ACTIVE_PRINT_PLAN=priorPrint;const originalUnion=seamFrameUnion;
    seamFrameUnion=(...args)=>{if(G!==priorGrid)throw new Error('connector CSG failed');return originalUnion(...args);};`);
  assert.throws(()=>run(c,'seamPreviewGeometry(previewProduction,previewProduction.joints[0].id)'),/connector CSG failed/);
  assert.equal(run(c,'G===priorGrid&&PB===priorBounds&&JSON.stringify(S)===priorSettings&&ACTIVE_PRINT_PLAN===priorPrint'),true);
});

test('Joint cutaways hide neighboring hardware and the complete cable notch while visible walls match production',()=>{
  const app=fixture(),{c}=app;
  run(c,`S.box.frame=8;S.hw.hole='frame';S.hw.dia=3;S.seam.length=36;S.seam.production=true;
    const candidate=buildSeamPlan().candidates.find(p=>p.valid&&p.axis==='x'&&p.anchorMm.y<30);
    if(!candidate)throw new Error('No lower-wall fixture site');
    S.seam.selected=[{axis:candidate.axis,seamIndex:candidate.seamIndex,tileIndex:candidate.tileIndex,along:candidate.along}];`);
  const production=app.plan(),joint=production.joints[0],full=app.build(false),bounds=plain(run(c,'PB'));
  c.previewProduction=production;
  run(c,'previewProduction.contextKeepouts=buildSeamPlan().keepouts;');
  const preview=run(c,'seamPreviewGeometry(previewProduction,previewProduction.joints[0].id)');
  assert.equal(preview.contextHardwareHidden,true);
  const side=joint.tiles.indexOf(production.joints[0].pads.find(p=>p.cx>joint.anchorMm.x).tile);
  const body=preview.parts.find(p=>p.role===(side===0?'body-a':'body-b'));
  const actual=full.find(p=>p.module==='box'&&p.tile.id===joint.tiles[side]);
  const probe=(x,y)=>({shown:zHits(body,x-joint.anchorMm.x,y-joint.anchorMm.y),
    printed:zHits(actual,frameLocal(actual,x,y,bounds).x,frameLocal(actual,x,y,bounds).y)});
  const window=probe(69.25,2.25);assert.ok(window.printed.length>0);assert.deepEqual(window.shown,[],'neighboring hardware window must be explicitly cut away');
  const notch=probe(71.25,7.25);assert.ok(notch.printed.length>0);assert.deepEqual(notch.shown,[],'thick-wall cable band extends beyond the ordinary hardware keepout');
  assert.ok(notch.printed.at(-1)<run(c,'geomStack().frameZ0+S.box.depth'),'the probe must cross the actual cable cut');
  for(const [x,y]of [[50.25,1.25],[54.25,3.25],[62.25,6.25]]){
    const p=probe(x,y);assert.equal(p.shown.length,p.printed.length);p.shown.forEach((z,i)=>near(z,p.printed[i],1e-4));
  }
  for(const part of preview.parts)assertClosedConnected(part);
});
