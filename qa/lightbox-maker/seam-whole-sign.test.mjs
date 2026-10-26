import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const source=fs.readFileSync(new URL('../../public/lightbox_maker/YP-Lightbox-Studio.html',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const methods=['butt','lap','scarf','tongue','dowel','butterfly','dovetail','plate','nut','selftap','snap','magnet','weld'];
const run=(c,s)=>vm.runInContext(s,c),plain=v=>JSON.parse(JSON.stringify(v));
function fixture(method,axis,width=132,height=138,px=.6,withJoint=true){
  const c=vm.createContext({document:{readyState:'loading',addEventListener(){}},window:{},TextEncoder,Blob,console});
  vm.runInContext(source,c);c.config={method,axis,width,height,px,withJoint};
  run(c,`S=defaults();S.build.mode='service';S.box.W=config.width;S.box.H=config.height;S.box.depth=60;S.hw.hole='none';S.hw.hang=false;
    S.exp={...S.exp,res:.15,bed:config.width>1000?400:80,bedH:config.width>1000?400:80,margin:10,smooth:false,autoSplit:true};
    S.seam={...S.seam,enabled:true,production:true,method:config.method,length:48,width:20,selected:[],hardware:{...S.seam.hardware,clearance:.4}};
    if(config.method==='selftap')S.seam.hardware.hole=2.5;
    const px=config.px,gw=Math.round(config.width/px),gh=Math.round(config.height/px),panel=new Uint8Array(gw*gh),owner=new Uint8Array(gw*gh).fill(255);
    for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)if((x+.5)*px>=3&&(x+.5)*px<config.width-9&&(gh-y-.5)*px>=6&&(gh-y-.5)*px<config.height-12){panel[y*gw+x]=1;owner[y*gw+x]=x<gw/2?1:2;}
    G={gw,gh,px,panel,owner,K:2,empty:false,edtIn:edtToOutside(panel,gw,gh),comp:components(panel,gw,gh)};
    ensurePalette(2);S.pal[1].hex='#FF2D8F';S.pal[2].hex='#24B7CC';computeAreas();PB=panelBounds();screwPoints=snapPoints=hangPoints=()=>[];
    if(config.withJoint){
      const candidate=buildSeamPlan().candidates.find(p=>p.valid&&p.axis===config.axis);if(!candidate)throw new Error('No joint fixture site: '+buildSeamPlan().reason);
      S.seam.selected=[(({axis,seamIndex,tileIndex,along})=>({axis,seamIndex,tileIndex,along}))(candidate)];production=seamProductionPlan();
    }else production={joints:[]};`);
  return c;
}
function near(a,b){assert.ok(Math.abs(a-b)<2e-4,`${a} != ${b}`);}
function validateNormals(part){
  for(let i=0;i<part.n;i+=12){
    const a=part.a.subarray(i+3,i+6),b=part.a.subarray(i+6,i+9),c=part.a.subarray(i+9,i+12);
    const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n);
    if(length>1e-8)assert.ok(n.reduce((s,v,k)=>s+v*part.a[i+k],0)/length>.999,part.name+': incorrect normal');
  }
}
for(const method of methods)for(const axis of ['x','y'])test(`Whole-sign ${method} preview keeps exact ${axis} joint on the real artwork`,()=>{
  const c=fixture(method,axis),before=run(c,'JSON.stringify(S)'),local=run(c,'seamPreviewGeometry(production,production.joints[0].id)');
  const result=run(c,`(()=>{const grid=G,bounds=PB,saved=ACTIVE_PRINT_PLAN;buildParts=buildPartMeshes=()=>{throw new Error('Whole export builder called');};
    const scene=seamPreviewGeometry(production,production.joints[0].id,true);
    if(G!==grid||PB!==bounds||ACTIVE_PRINT_PLAN!==saved)throw new Error('Preview mutated live geometry');return scene;})()`);
  assert.equal(run(c,'JSON.stringify(S)'),before);assert.equal(result.wholeSign,true);assert.equal(result.cutaway,false);
  const print=plain(run(c,'printPlan()'));
  assert.deepEqual(plain(result.printTiles),print.tiles);assert.equal(result.printColumns,print.nx);assert.equal(result.printRows,print.ny);
  const originalTiles=new Map(print.tiles.map(t=>[t.id,t]));
  for(const part of result.parts.filter(p=>p.role!=='connector'))assert.ok(originalTiles.has(part.tile),`${part.name}: preview must retain an original print tile`);
  assert.ok(result.parts.filter(p=>p.detail&&p.role.startsWith('body-')).every(p=>{
    const tile=originalTiles.get(p.tile),roi=result.roi;
    return tile.x0<roi.x0||tile.x1>roi.x1||tile.y0<roi.y0||tile.y1>roi.y1;
  }),'support ROI boundaries must not replace original print boundaries');
  assert.ok(result.parts.some(p=>p.role==='front'));assert.ok(result.parts.some(p=>p.role==='back'));
  assert.ok(result.parts.some(p=>p.context&&(p.role==='body-context'||p.role==='body-a'||p.role==='body-b')));
  assert.deepEqual(new Set(result.parts.filter(p=>p.role==='front').map(p=>p.hex)),new Set(['#FF2D8F','#24B7CC']));
  assert.ok(result.bounds.max[0]-result.bounds.min[0]>100);assert.ok(result.bounds.max[1]-result.bounds.min[1]>100);
  for(let p=0;p<local.parts.length;p++){
    const a=local.parts[p],b=result.parts[p];assert.equal(a.n,b.n);assert.equal(b.detail,true);
    for(let i=0;i<a.n;i+=12){for(let k=0;k<3;k++)near(a.a[i+k],b.a[i+k]);
      for(let k=0;k<3;k++)for(let d=0;d<3;d++)near(a.a[i+3+k*3+d]+(d<2?result.anchor[d]:0),b.a[i+3+k*3+d]);}
  }
  for(const part of result.parts){assert.equal(part.n,part.a.length);assert.ok(part.a.every(Number.isFinite));validateNormals(part);}
  near(result.anchorZ,run(c,'production.joints[0].baseTop'));assert.equal(result.supportRois.length,2);
  const connectors=result.parts.filter(p=>p.role==='connector');assert.ok(connectors.every(p=>p.componentId));
  assert.deepEqual(plain(result.focusBounds.min),plain(local.bounds.min.map((v,k)=>v+(k<2?result.anchor[k]:0))));
});

test('Whole-sign preview transfers actual palette geometry through the worker',()=>{
  const c=fixture('lap','x');let response,transfer;
  c.self={postMessage:(data,list)=>{response=data;transfer=list;}};
  run(c,'workerState=projectSnapshot();workerGrid=G;workerBounds=PB;workerProduction=production;seamPreviewWorkerMain();');
  run(c,'self.onmessage({data:{state:workerState,grid:workerGrid,bounds:workerBounds,production:workerProduction}})');
  assert.equal(response.type,'done',response.message);assert.equal(response.scene.wholeSign,true);
  assert.equal(transfer.length,response.scene.parts.length);assert.ok(response.scene.parts.some(p=>p.hex==='#FF2D8F'));
  assert.deepEqual(plain(response.scene.printTiles),plain(run(c,'printPlan().tiles')));
  assert.equal(response.scene.printColumns,run(c,'printPlan().nx'));assert.equal(response.scene.printRows,run(c,'printPlan().ny'));
});

test('A 173 cm whole-sign context remains a preview, without full export tessellation',()=>{
  const c=fixture('plate','x',1730,320,.6);
  run(c,'S.exp.bed=S.exp.bedH=400;S.seam.selected=[];const p=buildSeamPlan().candidates.find(p=>p.valid&&p.axis===\'x\');S.seam.selected=[(({axis,seamIndex,tileIndex,along})=>({axis,seamIndex,tileIndex,along}))(p)];production=seamProductionPlan();EXPORT_MESH_BUDGET={used:0,limit:32*1024*1024};buildParts=buildPartMeshes=()=>{throw new Error(\'Whole export builder called\');};');
  const result=run(c,'seamPreviewGeometry(production,production.joints[0].id,true)');
  assert.ok(result.size.width>1700);assert.ok(result.contextCells<2e6);assert.ok(result.roiCells<result.contextCells*.02);
  assert.ok(run(c,'EXPORT_MESH_BUDGET.used')<32*1024*1024);assert.ok(result.parts.reduce((n,p)=>n+p.n/12,0)<300000);
  assert.equal(result.printColumns,5);assert.equal(result.printRows,1);
  assert.deepEqual(plain(result.printTiles),plain(run(c,'printPlan().tiles')));
});

for(const mode of ['single tile','split without valid sites','splitting disabled','invalid print margin'])test(`Whole artwork stays visible with no joint: ${mode}`,()=>{
  const c=fixture('plate','x',132,138,.6,false);
  if(mode==='single tile')run(c,'S.exp.bed=S.exp.bedH=400;');
  if(mode==='split without valid sites'){
    run(c,'S.box.depth=1;');
    assert.ok(run(c,'buildSeamPlan().candidates.length>0'));
    assert.equal(run(c,'buildSeamPlan().candidates.some(p=>p.valid)'),false);
  }
  if(mode==='splitting disabled')run(c,'S.exp.autoSplit=false;');
  if(mode==='invalid print margin')run(c,'S.exp.margin=S.exp.bed;');
  const before=run(c,'JSON.stringify(S)'),print=plain(run(c,'printPlan()'));
  const result=run(c,`(()=>{const grid=G,bounds=PB,panel=G.panel,owner=G.owner,edt=G.edtIn;
    ACTIVE_PRINT_PLAN={sentinel:true};const saved=ACTIVE_PRINT_PLAN;
    buildParts=buildPartMeshes=seamConnectorParts=seamJointVolumeOps=()=>{throw new Error('Joint/export builder called without a joint');};
    const scene=seamPreviewGeometry(production,null,true);
    if(G!==grid||PB!==bounds||G.panel!==panel||G.owner!==owner||G.edtIn!==edt||ACTIVE_PRINT_PLAN!==saved)throw new Error('Preview mutated live geometry');return scene;})()`);
  assert.equal(run(c,'JSON.stringify(S)'),before);assert.equal(result.wholeSign,true);assert.equal(result.cutaway,false);
  for(const role of ['front','back','body-context'])assert.ok(result.parts.some(p=>p.role===role),role);
  assert.ok(result.parts.every(p=>['front','back','body-context'].includes(p.role)&&p.context&&!p.detail));
  assert.equal(result.jointId,undefined);assert.equal(result.method,undefined);
  assert.equal(result.anchor,null);assert.equal(result.anchorZ,null);assert.equal(result.focusBounds,null);assert.equal(result.roi,null);
  assert.deepEqual(plain(result.supportRois),[]);assert.equal(result.insideDirection,undefined);
  assert.deepEqual(plain(result.printTiles),print.tiles);assert.equal(result.printColumns,print.nx);assert.equal(result.printRows,print.ny);
  if(mode==='invalid print margin'){
    assert.ok(print.error);assert.equal(result.printTiles.length,0);
    assert.ok(result.parts.every(p=>p.tile==='preview'));
  }else{
    assert.ok(result.parts.every(p=>print.tiles.some(t=>t.id===p.tile)));
    assert.equal(result.printTiles.length,mode==='split without valid sites'?4:1);
  }
  near(result.bounds.min[0],0);near(result.bounds.min[1],0);
  near(result.bounds.max[0],run(c,'PB.w'));near(result.bounds.max[1],run(c,'PB.h'));
  for(const part of result.parts){assert.equal(part.n,part.a.length);assert.ok(part.a.every(Number.isFinite));validateNormals(part);}
  assert.throws(()=>run(c,'seamPreviewGeometry(production,null)'),/ไม่พบจุดตัวต่อ/,'local preview still requires a real joint');
});

test('Whole-sign worker creates the real artwork without a joint or production spec',()=>{
  const c=fixture('plate','x',132,138,.6,false);let response,transfer;
  c.self={postMessage:(data,list)=>{response=data;transfer=list;}};
  run(c,`S.exp.autoSplit=false;buildParts=buildPartMeshes=seamMethodDesign=()=>{throw new Error('Production builder called');};
    seamPreviewWorkerMain();self.onmessage({data:{state:projectSnapshot(),grid:G,bounds:PB,production:{joints:[]}}});`);
  assert.equal(response.type,'done',response.message);assert.equal(response.scene.wholeSign,true);
  assert.equal(response.scene.jointId,undefined);assert.equal(response.scene.anchor,null);
  assert.equal(response.scene.printTiles.length,1);assert.equal(transfer.length,response.scene.parts.length);
  assert.ok(response.scene.parts.every(p=>p.role!=='connector'));assert.ok(response.scene.parts.some(p=>p.hex==='#FF2D8F'));
});

test('A 24-tile preview stays within 32 MB by growing small mesh buffers without changing triangles',()=>{
  const setup=()=>{
    const c=fixture('plate','x',1730,650,.76,false);
    run(c,`S.exp.bed=S.exp.bedH=256;S.box.bandN=3;S.box.bandColors=['#1a1a1a','#1a1a1a','#1a1a1a'];
      for(let i=0;i<G.owner.length;i++)if(G.panel[i])G.owner[i]=i%G.gw%300<150?1:2;
      for(const p of buildSeamPlan().candidates.filter(p=>p.valid)){
        S.seam.selected=[(({axis,seamIndex,tileIndex,along})=>({axis,seamIndex,tileIndex,along}))(p)];
        try{production=seamProductionPlan();break;}catch(e){if(!(e instanceof SeamProductionError))throw e;}
      }
      if(!production.joints.length)throw new Error('Missing real joint fixture');
      buildParts=buildPartMeshes=()=>{throw new Error('Whole export builder called');};`);
    return c;
  };
  const hash=scene=>{const h=createHash('sha256');for(const p of scene.parts)h.update(new Uint8Array(p.a.buffer,p.a.byteOffset,p.a.byteLength));return h.digest('hex');};
  const before=setup();run(before,'EXPORT_MESH_BUDGET={used:0,limit:256*1024*1024};');
  const original=run(before,'seamPreviewGeometry(production,production.joints[0].id,true)');
  assert.ok(run(before,'EXPORT_MESH_BUDGET.used')>32*1024*1024,'large initial buffers reproduce the preview limit');
  assert.equal(run(before,"Mesh('unchanged export default','#000').a.length"),12*4096);
  run(before,'EXPORT_MESH_BUDGET={used:0,limit:32*1024*1024};');
  assert.throws(()=>run(before,'seamPreviewGeometry(production,production.joints[0].id,true)'),/หน่วยความจำ/);
  const current=setup();let response;
  current.self={postMessage:data=>{response=data;}};
  run(current,'seamPreviewWorkerMain();self.onmessage({data:{state:projectSnapshot(),grid:G,bounds:PB,production}});');
  assert.equal(response.type,'done',response.message);assert.equal(response.scene.printTiles.length,24);
  assert.equal(run(current,'EXPORT_MESH_BUDGET.initialTriangles'),256);
  assert.ok(run(current,'EXPORT_MESH_BUDGET.used')<32*1024*1024);
  assert.equal(hash(response.scene),hash(original),'all exact triangles and normals must remain unchanged');
  assert.equal(response.scene.parts.length,original.parts.length);
  assert.ok(response.scene.parts.some(p=>p.role==='connector'));
});
