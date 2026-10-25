import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../../public/lightbox_maker/YP-Lightbox-Studio.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const run=(c,s)=>vm.runInContext(s,c),plain=v=>JSON.parse(JSON.stringify(v));
function fixture(){
  const nodes=new Map(),timers=new Map();let timerId=0;
  const c=vm.createContext({console:{...console,error(){}},TextEncoder,Blob,performance,Promise,structuredClone,
    setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);},
    document:{readyState:'loading',currentScript:{textContent:script},addEventListener(){},querySelector(id){
      if(!nodes.has(id))nodes.set(id,{inert:false,hidden:true,textContent:'',classList:{toggle(){},add(){},remove(){}},setAttribute(name,value){this[name]=String(value);},removeAttribute(){}});
      return nodes.get(id);
    }},window:{},URL:{createObjectURL(){return 'blob:test';},revokeObjectURL(){}},
    createImageBitmap:async cv=>({width:cv.width,height:cv.height,close(){}})});
  vm.runInContext(script,c);
  run(c,`globalThis.sent=[];globalThis.downloads=[];globalThis.stopped=0;globalThis.revoked=0;
    S=defaults();G={panel:new Uint8Array(1),empty:false,px:.15};PB={ux0:5,my0:5,w:100,h:60,empty:false};
    SRC_CACHE={kind:'text',cv:{width:800,height:500}};
    createExportWorker=()=>({url:'blob:test',worker:{postMessage(data){sent.push(data);},terminate(){stopped++;}}});
    URL.revokeObjectURL=()=>revoked++;download=(blob,name)=>downloads.push(name);`);
  return {c,nodes,timers};
}
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};

test('The seam picker keeps invalid production in the dialog and never starts an export',async()=>{
  const {c,nodes}=fixture();
  run(c,`globalThis.events=[];S.seam.enabled=S.seam.production=true;
    document.querySelector('#seamDialog').close=()=>events.push('close');
    doExport=()=>events.push('export');syncSeamProductionUI=()=>events.push('status');
    seamProductionPlan=()=>{throw new SeamProductionError('เลือกตำแหน่งตัวต่อก่อนเปิดสร้างจริง');};`);
  await run(c,'exportSeamSelection()');
  assert.deepEqual(plain(run(c,'events')),['status']);assert.match(nodes.get('#toast').textContent,/วางตัวต่ออัตโนมัติ/);
  run(c,'events=[];S.seam.production=false;');await run(c,'exportSeamSelection()');
  assert.deepEqual(plain(run(c,'events')),['status']);assert.match(nodes.get('#toast').textContent,/รวมตัวต่อ/);
});

test('The seam picker closes before exporting through the existing worker flow',async()=>{
  const {c}=fixture();
  run(c,`globalThis.events=[];S.seam.enabled=S.seam.production=true;
    document.querySelector('#seamDialog').close=()=>events.push('close');
    seamProductionPlan=()=>({joints:[{}]});doExport=async()=>events.push('export');`);
  await run(c,'exportSeamSelection()');assert.deepEqual(plain(run(c,'events')),['close','export']);
  run(c,'events=[];PROJECT_LOADING=true;');await run(c,'exportSeamSelection()');assert.deepEqual(plain(run(c,'events')),[]);
});

test('Opening the seam picker for a single plate leaves normal export settings unchanged',()=>{
  const {c}=fixture();
  run(c,`globalThis.opened=false;printPlan=()=>({enabled:true,tiles:[{}]});drawSeamDialog=()=>{};
    document.querySelector('#seamDialog').showModal=()=>opened=true;openSeamPicker();`);
  assert.equal(run(c,'opened'),true);assert.equal(run(c,'S.seam.enabled'),false);assert.equal(run(c,'S.seam.production'),false);
});

test('Joint preview ignores stale worker results and never transfers the live artwork grid',()=>{
  const {c,nodes,timers}=fixture();
  run(c,`globalThis.previewWorkers=[];globalThis.previewAccepted=[];S.seam.enabled=S.seam.production=true;
    document.querySelector('#seamDialog').open=true;document.querySelector('#seamPreviewViewport').dataset={};
    globalThis.pointA={id:'a',valid:true},globalThis.pointB={id:'b',valid:true};SEAM_FOCUS=pointA;SEAM_PLAN={candidates:[pointA,pointB]};
    G.edtIn=new Float32Array(1);globalThis.originalGrid=G;globalThis.originalState=JSON.stringify(S);
    seamPreviewClear=()=>{};seamPreviewRequestRender=()=>{};
    seamPreviewSetScene=scene=>{previewAccepted.push(scene.tag);return {parts:1,triangles:1};};
    seamProductionPlan=p=>({spec:{},joints:[{id:p.candidates[0].id,method:'plate',design:{contains(){}}}]});
    createExportWorker=()=>{const worker={stopped:0,postMessage(data,...transfer){this.sent=data;this.transfer=transfer;},terminate(){this.stopped++;}};
      previewWorkers.push(worker);return {worker,url:'blob:preview'};};requestSeamPreview();`);
  const flush=()=>{const queued=[...timers.values()];timers.clear();for(const fn of queued)fn();};
  flush();assert.equal(run(c,'previewWorkers.length'),1);assert.equal(run(c,'previewWorkers[0].transfer.length'),0);
  assert.doesNotThrow(()=>run(c,'structuredClone(previewWorkers[0].sent)'));
  run(c,'SEAM_FOCUS=pointB;requestSeamPreview();');flush();assert.equal(run(c,'previewWorkers[0].stopped'),1);
  run(c,"previewWorkers[0].onmessage({data:{type:'done',scene:{tag:'stale'}}});previewWorkers[1].onmessage({data:{type:'done',scene:{tag:'current',resolution:.15}}});");
  assert.deepEqual(plain(run(c,'previewAccepted')),['current']);assert.equal(nodes.get('#seamPreviewViewport').dataset.point,'b');
  assert.equal(run(c,'G===originalGrid&&G.panel.byteLength===1&&JSON.stringify(S)===originalState'),true);
  run(c,'SEAM_FOCUS=pointA;requestSeamPreview();');flush();run(c,"stopSeamPreview();previewWorkers[2].onmessage({data:{type:'done',scene:{tag:'closed'}}});");
  assert.deepEqual(plain(run(c,'previewAccepted')),['current']);assert.equal(run(c,'previewWorkers[2].stopped'),1);
  run(c,'SEAM_FOCUS=pointB;requestSeamPreview();');flush();
  run(c,"previewWorkers[3].onerror({preventDefault(){},message:'preview failed'});requestSeamPreview();");flush();
  assert.equal(run(c,'previewWorkers.length'),5,'the same placement can retry after failure');run(c,'stopSeamPreview();');
});

test('An invalid joint preview clears the old scene without substituting another placement',()=>{
  const {c,nodes,timers}=fixture();
  run(c,`S.seam.production=true;document.querySelector('#seamDialog').open=true;document.querySelector('#seamPreviewViewport').dataset={};
    globalThis.cleared=0;seamPreviewClear=()=>cleared++;SEAM_FOCUS={id:'invalid',valid:false,reason:'พื้นที่ไม่พอ'};
    requestSeamPreview();`);
  assert.equal(timers.size,0);assert.equal(run(c,'cleared'),1);assert.equal(nodes.get('#seamPreviewStatus').textContent,'พื้นที่ไม่พอ');
  assert.equal(nodes.get('#seamPreviewCanvas').hidden,true);
});

test('The detail camera keeps assembled and exploded bounds inside narrow and wide viewports',()=>{
  const {c}=fixture();
  for(const aspect of [.6,1,2.5])for(const pitch of [-.55,.4])for(const exploded of [false,true]){
    c.cameraCase={aspect,pitch,exploded};
    const projected=run(c,`(()=>{
      const {aspect,pitch,exploded}=cameraCase,fov=.6,cam={yaw:-.35,pitch,zoom:1};
      const items=[{mn:[-25,-12,2],mx:[0,16,63],offset:[-8,0,0]},
        {mn:[0,-12,2],mx:[25,16,63],offset:[8,0,0]},{mn:[-14,-5,40],mx:[14,5,43],offset:[0,0,14]}];
      const min=[0,1,2].map(d=>Math.min(...items.map(p=>p.mn[d]+(exploded?p.offset[d]:0))));
      const max=[0,1,2].map(d=>Math.max(...items.map(p=>p.mx[d]+(exploded?p.offset[d]:0)))),target=min.map((v,d)=>(v+max[d])/2);
      const fit=seamPreviewCameraFit(items,target,cam,aspect,fov,exploded),eye=target.map((v,d)=>v+fit.direction[d]*fit.distance);
      const matrix=m4mul(m4persp(fov,aspect,.1,fit.distance*10),m4look(eye,target,[0,1,0])),points=[];
      for(const item of items)for(let n=0;n<8;n++){
        const p=[0,1,2].map(d=>((n&(1<<d))?item.mx[d]:item.mn[d])+(exploded?item.offset[d]:0));
        const clip=[0,1,2,3].map(d=>matrix[d]*p[0]+matrix[4+d]*p[1]+matrix[8+d]*p[2]+matrix[12+d]);
        points.push([clip[0]/clip[3],clip[1]/clip[3],clip[3]]);
      }return points;
    })()`);
    assert.ok(projected.every(([x,y,w])=>w>0&&Math.abs(x)<1&&Math.abs(y)<1));
  }
});

test('Export is single-flight, snapshots settings, and leaves preview objects unchanged',async()=>{
  const {c,nodes}=fixture();
  run(c,"globalThis.preview=G;globalThis.palette=S.pal;globalThis.first=doExport();globalThis.second=doExport();");
  await settle();assert.equal(run(c,'sent.length'),1);
  assert.equal(nodes.get('#left').inert,true);
  run(c,"S.box.depth=75;S.exp.fmt='all';");
  assert.equal(run(c,'sent[0].state.box.depth'),40);assert.equal(run(c,'sent[0].state.exp.fmt'),'3mf');
  run(c,"EXPORT_JOB.worker.onmessage({data:{type:'done',files:[{name:'job.zip',blob:new Blob(['ok'])}],report:{totalMs:100}}});");
  await run(c,'first');
  assert.equal(run(c,'G===preview&&S.pal===palette'),true);
  assert.equal(nodes.get('#left').inert,false);assert.equal(nodes.get('#btnCancelExport').hidden,true);
  assert.equal(run(c,'stopped'),1);assert.equal(run(c,'revoked'),1);
  assert.deepEqual(plain(run(c,'downloads')),['job.zip']);assert.equal(run(c,'EXPORT_JOB'),null);
});

test('Cancel stops the worker, produces no files, unlocks inputs, and permits retry',async()=>{
  const {c,nodes}=fixture();run(c,'globalThis.pending=doExport();');await settle();
  run(c,'cancelExport();');await run(c,'pending');
  assert.equal(run(c,'stopped'),1);assert.equal(run(c,'downloads.length'),0);assert.equal(nodes.get('#right').inert,false);
  run(c,'globalThis.retry=doExport();');await settle();assert.equal(run(c,'sent.length'),2);
  run(c,"EXPORT_JOB.worker.onmessage({data:{type:'error',message:'bad mesh'}});");await run(c,'retry');
  assert.equal(run(c,'EXPORT_JOB'),null);assert.equal(run(c,'downloads.length'),0);assert.equal(run(c,'stopped'),2);
});

test('Worker crashes and construction failures cannot leave export locked',async()=>{
  const {c,nodes}=fixture();run(c,'globalThis.pending=doExport();');await settle();
  run(c,"EXPORT_JOB.worker.onerror({preventDefault(){},message:'worker failed'});");await run(c,'pending');
  assert.equal(nodes.get('header').inert,false);assert.equal(run(c,'EXPORT_JOB'),null);
  run(c,"createExportWorker=()=>{throw new Error('blocked worker');};globalThis.retry=doExport();");await run(c,'retry');
  assert.equal(nodes.get('header').inert,false);assert.equal(run(c,'EXPORT_JOB'),null);
});

test('Project loading and bitmap preparation cannot start an overlapping export worker',async()=>{
  const {c}=fixture();
  run(c,'PROJECT_LOADING=true;');await run(c,'doExport()');assert.equal(run(c,'sent.length'),0);
  run(c,"PROJECT_LOADING=false;globalThis.finishBitmap=null;createImageBitmap=()=>new Promise(resolve=>finishBitmap=resolve);globalThis.pending=doExport();");
  await settle();run(c,'cancelExport();finishBitmap({close(){}});');await run(c,'pending');
  assert.equal(run(c,'sent.length'),0);assert.equal(run(c,'EXPORT_JOB'),null);
});

test('Pending source edits rebuild artwork and never crop using stale preview bounds',async()=>{
  const {c}=fixture();
  run(c,"_needSrc=true;_geometryPending=true;globalThis.rebuilt=0;rebuildSource=()=>rebuilt++;globalThis.pending=doExport();");
  await settle();assert.equal(run(c,'rebuilt'),1);assert.equal(run(c,'sent[0].bounds'),null);
  run(c,'cancelExport();');await run(c,'pending');
});

test('Crop preserves pixel transforms, rotation, resolution, and both scale modes',()=>{
  const {c}=fixture();
  for(const uniform of [true,false]){
    const r=run(c,`(()=>{
      const state=defaults();state.box.W=1800.03;state.box.H=900.02;
      Object.assign(state.tr,{uniform:${uniform},scale:123,scaleY:74,dx:8,dy:-6,rot:19});
      const old=structuredClone(state),cv={width:800,height:500};
      const transform=s=>{S=s;const g=gridSpec();return {x:g.gw*(.5+s.tr.dx/200),y:g.gh*(.5+s.tr.dy/200),
        kx:baseFit(g.gw,g.gh,cv)*s.tr.scale/100,ky:baseFit(g.gw,g.gh,cv)*(s.tr.uniform?s.tr.scale:s.tr.scaleY)/100};};
      const a=transform(old),plan=exportWorkspace(state,cv,{ux0:50,my0:200,w:1730,h:318,empty:false},.72),b=transform(state);
      return {a,b,plan,angle:state.tr.rot,res:state.exp.res};
    })()`);
    assert.ok(r.plan.cells<r.plan.before*.5);
    for(const k of ['kx','ky'])assert.ok(Math.abs(r.a[k]-r.b[k])<1e-10);
    for(const k of ['x','y'])assert.ok(Math.abs((r.a[k]-r.b[k])-Math.round(r.a[k]-r.b[k]))<1e-8);
    assert.equal(r.angle,19);assert.equal(r.res,.15);
  }
});

test('Oversized raster and mesh buffers fail before allocation without changing output resolution',async()=>{
  const {c}=fixture();
  assert.throws(()=>run(c,"S.box.W=20000;S.box.H=20000;exportWorkspace(S,null,null);"),/32 ล้าน/);
  assert.equal(run(c,'S.exp.res'),.15);
  run(c,'EXPORT_MESH_BUDGET={used:0,limit:12};');assert.throws(()=>run(c,"Mesh('big','#ffffff');"),/หน่วยความจำ/);
  assert.equal(run(c,'EXPORT_MESH_BUDGET.used'),0);
  run(c,'EXPORT_MESH_BUDGET=null;S=defaults();S.box.W=20000;S.box.H=20000;_geometryPending=true;');
  await run(c,'doExport()');assert.equal(run(c,'sent.length'),0);assert.equal(run(c,'EXPORT_JOB'),null);
});

test('Cropped raster retains screw, snap, notch and hanger positions on the original sampling lattice',()=>{
  const {c}=fixture();
  const r=run(c,`(()=>{
    S=defaults();S.exp.res=.15;S.box.W=180;S.box.H=180;S.hw.hang=true;
    const make=(gw,gh,ox,oy)=>{
      const panel=new Uint8Array(gw*gh),owner=new Uint8Array(gw*gh).fill(255);
      for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)if(x+ox>=200&&x+ox<1000&&y+oy>=300&&y+oy<900){panel[y*gw+x]=1;owner[y*gw+x]=1;}
      G={gw,gh,px:.15,panel,owner,K:1,edtIn:edtToOutside(panel,gw,gh),comp:components(panel,gw,gh)};
      computeAreas();PB=panelBounds();
    };
    const positions=()=>({screws:screwPoints().map(p=>[p[0]-PB.gx0,p[1]-PB.gy0]),
      snaps:snapPoints().map(p=>[p[0]-PB.gx0,p[1]-PB.gy0]),
      hang:hangPoints().map(p=>[p[0]-PB.gx0,p[1]-PB.gy0]),notch:bottomInfo().cx-PB.gx0});
    make(1200,1200,0,0);const before=positions(),bounds={...PB},old=structuredClone(S);
    exportWorkspace(S,{width:800,height:500},bounds,.15);
    const next=gridSpec(),ox=Math.round(1200*(.5+old.tr.dx/200)-next.gw*(.5+S.tr.dx/200)),oy=Math.round(1200*(.5+old.tr.dy/200)-next.gh*(.5+S.tr.dy/200));
    make(next.gw,next.gh,ox,oy);return {before,after:positions()};
  })()`);
  assert.deepEqual(plain(r.after),plain(r.before));
});

test('ZIP accepts Blob entries and releases consumed inputs only when requested',async()=>{
  const {c}=fixture();
  const r=await run(c,`(async()=>{
    const normal=[{name:'x.txt',data:new TextEncoder().encode('hello')}];
    const released=[{name:'x.txt',data:new Blob(['hello'])}];
    const a=await zipFiles(normal),b=await zipFiles(released,true);
    return {a:Array.from(new Uint8Array(await a.arrayBuffer())),b:Array.from(new Uint8Array(await b.arrayBuffer())),retained:!!normal[0],released:released[0]};
  })()`);
  assert.deepEqual(r.a,r.b);assert.equal(r.retained,true);assert.equal(r.released,null);
});

test('Project snapshots retain images and custom fonts but exclude DOM image objects',()=>{
  const {c}=fixture();
  const r=run(c,`(()=>{
    S.src.imgData={circular:null};S.src.imgData.circular=S.src.imgData;
    S.src.imgSrc='data:image/png;base64,AAAA';S.src.fontData='data:font/ttf;base64,BBBB';
    const snap=projectSnapshot();snap.box.depth=70;
    const next=projectState(snap);return {image:next.src.imgData,src:next.src.imgSrc,font:next.src.fontData,original:S.box.depth,face:next.face.edgeR};
  })()`);
  assert.equal(r.image,null);assert.match(r.src,/AAAA/);assert.match(r.font,/BBBB/);assert.equal(r.original,40);assert.equal(r.face,2);
});

test('Multiple output formats are delivered atomically as one archive with every file',async()=>{
  const {c}=fixture();
  const r=await run(c,`(async()=>{
    const result=await bundleExportFiles({files:[{name:'print.3mf',blob:new Blob(['3mf'])},{name:'cuts.zip',blob:new Blob(['cuts'])},{name:'backing.zip',blob:new Blob(['backing'])}],report:{totalMs:0,writeMs:0}},()=>{});
    return {count:result.files.length,name:result.files[0].name,bytes:Array.from(new Uint8Array(await result.files[0].blob.arrayBuffer()))};
  })()`);
  assert.equal(r.count,1);assert.match(r.name,/_ชุดไฟล์ผลิต.zip$/);
  const data=Buffer.from(r.bytes);for(const name of ['print.3mf','cuts.zip','backing.zip'])assert.ok(data.includes(Buffer.from(name)));
});

test('Draft remains dirty until commit and newer edits survive an older write',async()=>{
  const {c}=fixture();
  run(c,"DRAFT_READY=true;DRAFT_ID='tab-a';globalThis.commits=[];draftTransaction=(mode,action)=>new Promise(resolve=>commits.push(resolve));queueDraftSave();globalThis.write=saveDraftNow();");
  await settle();assert.equal(run(c,'DRAFT_DIRTY'),true);
  run(c,"S.name='newer';queueDraftSave();commits.shift()();");await run(c,'write');
  assert.equal(run(c,'DRAFT_DIRTY'),true);
  run(c,'globalThis.latest=saveDraftNow();');await settle();run(c,'commits.shift()();');await run(c,'latest');
  assert.equal(run(c,'DRAFT_DIRTY'),false);
});

test('Storage failure never claims success and can recover on the next save',async()=>{
  const {c,nodes}=fixture();
  run(c,"DRAFT_READY=true;DRAFT_ID='tab-a';draftTransaction=async()=>{throw new Error('quota');};queueDraftSave();");
  await run(c,'saveDraftNow()');assert.equal(run(c,'DRAFT_DIRTY'),true);assert.equal(nodes.get('#draftStatus').textContent,'บันทึกร่างไม่ได้');
  run(c,'draftTransaction=async()=>{};');await run(c,'saveDraftNow()');assert.equal(run(c,'DRAFT_DIRTY'),false);
});

test('Multiple flush events coalesce the same unsaved revision',async()=>{
  const {c}=fixture();
  run(c,"DRAFT_READY=true;DRAFT_ID='tab-a';globalThis.writes=0;globalThis.commit=null;draftTransaction=()=>{writes++;return new Promise(resolve=>commit=resolve);};queueDraftSave();globalThis.a=saveDraftNow();globalThis.b=saveDraftNow();");
  await settle();assert.equal(run(c,'writes'),1);run(c,'commit();');await run(c,'Promise.all([a,b])');
  assert.equal(run(c,'DRAFT_DIRTY'),false);
});

test('Recovery prefers this tab, offers the latest draft to a new tab, and never auto-restores',async()=>{
  for(const own of [true,false]){
    const {c,nodes}=fixture();
    run(c,`globalThis.reads=0;sessionStorage={getItem(){return 'tab-${own?'a':'b'}';},setItem(){}};
      const record={id:'tab-a',savedAt:100,state:{name:'saved'}};
      draftTransaction=async()=>{reads++;return reads===1?(${own}?record:null):{value:record};};`);
    await run(c,'initDrafts()');
    assert.equal(run(c,'reads'),own?1:2);assert.equal(run(c,'S.name'),'YP Lightbox Studio');
    assert.equal(nodes.get('#draftRecovery').hidden,false);assert.equal(run(c,'DRAFT_ID'),own?'tab-a':'tab-b');
  }
});

test('Opening storage cannot overwrite edits made before the recovery lookup finishes',async()=>{
  const {c,nodes}=fixture();
  run(c,"sessionStorage={getItem(){return 'tab-a';}};globalThis.lookup=null;draftTransaction=()=>new Promise(resolve=>lookup=resolve);globalThis.opening=initDrafts();");
  await settle();
  run(c,"S.name='new edit';queueDraftSave();lookup({savedAt:100,state:{name:'old'}});");await run(c,'opening');
  assert.equal(run(c,'S.name'),'new edit');assert.equal(run(c,'DRAFT_DIRTY'),true);
  assert.equal(nodes.get('#draftRecovery').hidden,true);assert.equal(run(c,'DRAFT_CANDIDATE'),null);
});

test('Draft transaction resolves on commit rather than request success',async()=>{
  const {c}=fixture();
  run(c,`globalThis.request={};globalThis.tx={objectStore(){return {};}};
    openDraftDB=async()=>({transaction(){return tx;}});globalThis.finished=false;
    globalThis.waiting=draftTransaction('readwrite',()=>request).then(()=>finished=true);`);
  await settle();run(c,'request.onsuccess();');await settle();assert.equal(run(c,'finished'),false);
  run(c,'tx.oncomplete();');await run(c,'waiting');assert.equal(run(c,'finished'),true);
});
