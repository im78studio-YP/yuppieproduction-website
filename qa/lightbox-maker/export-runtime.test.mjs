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
      if(!nodes.has(id))nodes.set(id,{inert:false,hidden:true,textContent:'',dataset:{},classList:{toggle(){},add(){},remove(){}},closest(){return this;},setAttribute(name,value){this[name]=String(value);},removeAttribute(){}});
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

test('Export readiness uses the existing raster budget without changing project resolution or geometry',()=>{
  const {c}=fixture();
  run(c,`S.box.W=1730;S.box.H=630;S.exp.res=.15;
    PB={ux0:0,my0:0,w:1730,h:630,empty:false};globalThis.beforeCheck=JSON.stringify(S);
    globalThis.previewGrid=G;globalThis.beforePanel=G.panel;globalThis.tooFine=exportWorkspaceCheck();`);
  const tooFine=plain(run(c,'tooFine'));
  assert.equal(tooFine.fits,false);assert.equal(tooFine.res,.15);assert.match(tooFine.error,/32 ล้านช่อง/);
  assert.equal(run(c,'JSON.stringify(S)===beforeCheck&&G===previewGrid&&G.panel===beforePanel'),true);
  run(c,'S.exp.res=.25;beforeCheck=JSON.stringify(S);globalThis.supported=exportWorkspaceCheck();');
  assert.deepEqual(plain(run(c,'supported')),{before:17438400,cells:17438400,res:.25,fits:true,error:''});
  assert.equal(run(c,'JSON.stringify(S)===beforeCheck&&G===previewGrid&&G.panel===beforePanel'),true);
});

test('Export readiness allows a bounded crop while preserving live transforms, bounds and source',()=>{
  const {c}=fixture();
  run(c,`S.box.W=2400;S.box.H=1400;S.exp.res=.25;
    S.tr={...S.tr,dx:17,dy:-10,scale:190,uniform:false,scaleY:85};
    PB={ux0:100,my0:150,w:1730,h:630,empty:false};
    globalThis.beforeCheck=JSON.stringify({S,PB,source:SRC_CACHE});
    globalThis.originals={box:S.box,tr:S.tr,exp:S.exp,bounds:PB,source:SRC_CACHE.cv};
    globalThis.result=exportWorkspaceCheck();`);
  const result=plain(run(c,'result'));
  assert.equal(result.fits,true);assert.equal(result.error,'');assert.equal(result.before,53760000);
  assert.ok(result.cells<32000000&&result.cells>17438400);
  assert.equal(run(c,`JSON.stringify({S,PB,source:SRC_CACHE})===beforeCheck&&
    S.box===originals.box&&S.tr===originals.tr&&S.exp===originals.exp&&PB===originals.bounds&&SRC_CACHE.cv===originals.source`),true);
});

test('Connector readiness cannot advertise export while its full-resolution raster exceeds the limit',()=>{
  const {c,nodes}=fixture();
  run(c,`S.seam.enabled=S.seam.production=true;S.box.W=1730;S.box.H=630;S.exp.res=.15;
    PB={ux0:0,my0:0,w:1730,h:630,empty:false};globalThis.planned=0;
    seamProductionPlan=()=>{planned++;return {joints:[{},{}]};};syncSeamProductionUI();`);
  assert.equal(nodes.get('#btnSeamExport').disabled,true);
  assert.match(nodes.get('#seamQuickStatus').textContent,/32 ล้านช่อง/);
  assert.doesNotMatch(nodes.get('#seamQuickStatus').textContent,/พร้อมส่งออก/);assert.equal(run(c,'planned'),0);
  run(c,'S.exp.res=.25;syncSeamProductionUI();');
  assert.equal(nodes.get('#btnSeamExport').disabled,false);
  assert.match(nodes.get('#seamQuickStatus').textContent,/พร้อมส่งออก/);assert.equal(run(c,'planned'),1);
});

test('Every fit joint shares the same pure full-resolution limits while plate keeps its existing exception',()=>{
  const {c}=fixture();
  for(const method of ['butt','lap','scarf','tongue','dowel','butterfly','dovetail','plate','nut','selftap','snap','magnet','weld']){
    for(const [res,clearance,compliant] of [[.15,.3,true],[.25,.5,true],[.25,.35,false],[.4,.6,false]]){
      c.checkSettings={method,hardware:{clearance}};c.checkResolution=res;
      const before=JSON.stringify(c.checkSettings),error=run(c,'seamProductionResolutionError(checkSettings,checkResolution)');
      assert.equal(error==='',method==='plate'||compliant,`${method}: ${res}/${clearance}`);
      if(error)assert.match(error,/กริดไม่เกิน 0\.25 มม.*2 เท่าของกริด/);
      assert.equal(JSON.stringify(c.checkSettings),before);
    }
  }
});

test('Readiness enforces fit clearance and resolution before the full-resolution worker runs',()=>{
  const {c,nodes}=fixture();
  run(c,`S.seam.enabled=S.seam.production=true;S.seam.method='lap';S.exp.res=.25;G.px=.75;
    S.seam.hardware.clearance=.35;globalThis.planned=0;
    seamProductionPlan=()=>{planned++;return {joints:[{}]};};syncSeamProductionUI();`);
  assert.equal(nodes.get('#btnSeamExport').disabled,true);assert.equal(run(c,'planned'),0);
  assert.match(nodes.get('#seamQuickStatus').textContent,/กริดไม่เกิน 0\.25/);
  run(c,'S.seam.hardware.clearance=.5;syncSeamProductionUI();');
  assert.equal(nodes.get('#btnSeamExport').disabled,false);assert.equal(run(c,'planned'),1);
  run(c,'S.exp.res=.4;S.seam.hardware.clearance=.6;syncSeamProductionUI();');
  assert.equal(nodes.get('#btnSeamExport').disabled,true);assert.equal(run(c,'planned'),1);
});

test('Production preserves its bounded coarse-preview exception while enforcing exact-grid fit limits',()=>{
  const {c}=fixture();
  run(c,`S.seam.enabled=S.seam.production=true;S.seam.method='lap';S.exp.res=.25;
    S.seam.hardware.clearance=.35;buildSeamPlan=()=>({applicable:true,candidates:[]});G.px=.75;`);
  assert.throws(()=>run(c,'seamProductionPlan()'),/เลือกตำแหน่งตัวต่อ/);
  run(c,'G.px=.25;');assert.throws(()=>run(c,'seamProductionPlan()'),/กริดไม่เกิน 0\.25/);
});

function prepareRepairFixture({width=1730,height=630,res=.15}={}){
  const app=fixture(),{c}=app;c.repairCase={width,height,res};
  run(c,`S.box.W=repairCase.width;S.box.H=repairCase.height;S.exp.res=repairCase.res;S.exp.fmt='all';
    S.tr={...S.tr,dx:17,dy:-10,scale:190,scaleY:85,uniform:false};
    PB={ux0:0,my0:0,w:repairCase.width,h:repairCase.height,empty:false};
    G.px=gridSpec(true).px;
    globalThis.repairEvents=[];globalThis.repairReferences={box:S.box,tr:S.tr,grid:G,bounds:PB,panel:G.panel};
    globalThis.repairPhysicalBefore=JSON.stringify({box:S.box,tr:S.tr,PB,panel:Array.from(G.panel)});
    pushToUI=()=>repairEvents.push('ui');schedule=(source,mode)=>repairEvents.push(['schedule',source,mode]);
    buildGrid=preview=>{repairEvents.push(['refresh',preview]);G={...G,px:gridSpec(preview).px};return G;};
    autoSelectSeamPoints=()=>{globalThis.repairAutoClearance=S.seam.hardware.clearance;globalThis.repairAutoPx=G.px;repairEvents.push({production:S.seam.production,enabled:S.seam.enabled,length:S.seam.length,width:S.seam.width,res:S.exp.res});
      S.seam.selected=[{axis:'x',seamIndex:1,tileIndex:1,along:20}];};
    seamProductionPlan=()=>{repairEvents.push('validate');return {joints:[{}]};};`);
  return app;
}

test('Explicit print preparation selects the finest fitting offered resolution without changing physical artwork',()=>{
  const {c,nodes}=prepareRepairFixture();
  run(c,'preparePrintableProject();');
  assert.equal(run(c,'S.exp.res'),.25);assert.equal(run(c,'S.exp.fmt'),'all');
  assert.equal(run(c,`S.box===repairReferences.box&&S.tr===repairReferences.tr&&G===repairReferences.grid&&
    PB===repairReferences.bounds&&G.panel===repairReferences.panel&&
    JSON.stringify({box:S.box,tr:S.tr,PB,panel:Array.from(G.panel)})===repairPhysicalBefore`),true);
  const events=plain(run(c,'repairEvents'));
  assert.deepEqual(events,[{production:true,enabled:true,length:32,width:12,res:.25},'ui',['schedule',false,'m'],'validate']);
  assert.match(nodes.get('#toast').textContent,/0\.25 มม.*คงขนาดงานเดิม/);
  assert.match(nodes.get('#toast').textContent,/จัดตัวต่อใหม่ 1 จุดแล้ว/);
});

test('Explicit preparation keeps a configured fitting resolution and only enables connectors for divided service work',()=>{
  for(const res of [.25,.4]){
    const {c}=prepareRepairFixture({res});run(c,'preparePrintableProject();');
    assert.equal(run(c,'S.exp.res'),res);assert.equal(run(c,'S.seam.production'),true);
  }
  const {c}=prepareRepairFixture({width:100,height:60,res:.15});
  run(c,'globalThis.beforeSeam=JSON.stringify(S.seam);preparePrintableProject();');
  assert.equal(run(c,'S.exp.res'),.15);assert.equal(run(c,'JSON.stringify(S.seam)===beforeSeam'),true);
  assert.deepEqual(plain(run(c,'repairEvents')),['ui',['schedule',false,'m']]);
});

test('Explicit preparation reserves the required fit clearance before auto-placement at the chosen resolution',()=>{
  const {c}=prepareRepairFixture();run(c,"S.seam.method='lap';S.seam.hardware.clearance=.2;preparePrintableProject();");
  assert.equal(run(c,'S.exp.res'),.25);assert.equal(run(c,'S.seam.hardware.clearance'),.5);
  assert.equal(run(c,'repairAutoClearance'),.5,'auto-placement must see the actual intended production clearance');
  assert.equal(run(c,'seamProductionResolutionError(seamSettings(),S.exp.res)'),'');
  assert.equal(run(c,'JSON.stringify({box:S.box,tr:S.tr,PB,panel:Array.from(G.panel)})===repairPhysicalBefore'),true);
});

test('Fit-joint preparation cannot claim success when only a resolution above its production limit fits',()=>{
  for(const res of [.15,.4]){
    const {c,nodes}=prepareRepairFixture({width:2500,height:1800,res});
    run(c,"S.seam.method='lap';globalThis.beforeRepair=JSON.stringify(S);");
    assert.equal(run(c,'exportWorkspaceCheck({...S,exp:{...S.exp,res:.4}}).fits'),true);
    assert.equal(run(c,'exportWorkspaceCheck({...S,exp:{...S.exp,res:.25}}).fits'),false);
    run(c,'preparePrintableProject();');
    assert.equal(run(c,'JSON.stringify(S)===beforeRepair'),true);assert.deepEqual(plain(run(c,'repairEvents')),[]);
    assert.doesNotMatch(nodes.get('#toast').textContent,/จัดตัวต่อใหม่.*แล้ว|เตรียมขนาดไฟล์แล้ว/);
  }
});

test('Fit-joint preparation restores a legal finer resolution when an old project configured .4 mm',()=>{
  const {c}=prepareRepairFixture({res:.4});run(c,"S.seam.method='lap';preparePrintableProject();");
  assert.equal(run(c,'S.exp.res'),.25);assert.equal(run(c,'S.seam.hardware.clearance'),.5);
  assert.equal(run(c,'seamProductionResolutionError(seamSettings(),S.exp.res)'),'');
});

test('Repair refreshes a changed preview lattice before placing fit joints on a small split artwork',()=>{
  const {c}=prepareRepairFixture({width:200,height:100,res:.4});
  run(c,"S.seam.method='lap';S.exp.bed=S.exp.bedH=80;preparePrintableProject();");
  assert.equal(run(c,'S.exp.res'),.25);assert.equal(run(c,'G.px'),.25);assert.equal(run(c,'repairAutoPx'),.25);
  assert.equal(run(c,'G!==repairReferences.grid'),true,'the preview lattice identity changes before the new plan is selected');
  assert.equal(run(c,`S.box===repairReferences.box&&S.tr===repairReferences.tr&&
    JSON.stringify({box:S.box,tr:S.tr,PB,panel:Array.from(G.panel)})===repairPhysicalBefore`),true);
  assert.deepEqual(plain(run(c,'repairEvents')),[['refresh',true],
    {production:true,enabled:true,length:32,width:12,res:.25},'ui',['schedule',false,'m'],'validate']);
});

test('Print preparation makes no changes when none of the offered resolutions can fit the raster budget',()=>{
  const {c,nodes}=prepareRepairFixture({width:10000,height:10000});
  run(c,'globalThis.beforeRepair=JSON.stringify(S);preparePrintableProject();');
  assert.equal(run(c,'JSON.stringify(S)===beforeRepair'),true);
  assert.deepEqual(plain(run(c,'repairEvents')),[]);assert.equal(run(c,'S.exp.res'),.15);
  assert.match(nodes.get('#toast').textContent,/32 ล้านช่อง/);
});

test('Print preparation respects in-flight work and never announces success for an invalid repaired plan',()=>{
  for(const flag of ['EXPORT_JOB','PROJECT_LOADING','_sizing']){
    const {c,nodes}=prepareRepairFixture();
    run(c,`globalThis.beforeRepair=JSON.stringify(S);${flag}=true;preparePrintableProject();`);
    assert.equal(run(c,'JSON.stringify(S)===beforeRepair'),true);assert.deepEqual(plain(run(c,'repairEvents')),[]);
    assert.match(nodes.get('#toast').textContent,/รอให้งานปัจจุบันเสร็จ/);
  }
  const {c,nodes}=prepareRepairFixture();
  run(c,`seamProductionPlan=()=>{throw new SeamProductionError('ไม่มีผนังรับฐาน');};preparePrintableProject();`);
  assert.match(nodes.get('#toast').textContent,/ไม่มีผนังรับฐาน/);
  assert.doesNotMatch(nodes.get('#toast').textContent,/จัดตัวต่อใหม่.*แล้ว|เตรียมขนาดไฟล์แล้ว/);
});

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
  run(c,`globalThis.opened=false;printPlan=()=>({enabled:true,tiles:[{}]});refreshSeamPlan=()=>{};
    document.querySelector('#seamDialog').showModal=()=>opened=true;openSeamPicker();`);
  assert.equal(run(c,'opened'),true);assert.equal(run(c,'S.seam.enabled'),false);assert.equal(run(c,'S.seam.production'),false);
});

test('Opening a new divided-work picker enables preview without opting into connector export',()=>{
  const {c}=fixture();
  run(c,`globalThis.previewPlaced=0;globalThis.originalHardware=JSON.stringify(S.seam.hardware);
    printPlan=()=>({enabled:true,tiles:[{},{}]});refreshSeamPlan=()=>{};autoSelectSeamPoints=()=>previewPlaced++;
    document.querySelector('#seamDialog').showModal=()=>{};openSeamPicker();`);
  assert.equal(run(c,'S.seam.enabled'),true);assert.equal(run(c,'S.seam.production'),false);
  assert.equal(run(c,'previewPlaced'),1);assert.equal(run(c,'JSON.stringify(S.seam.hardware)===originalHardware'),true);
});

test('Joint preview works with export disabled, ignores stale workers, and preserves live settings',()=>{
  const {c,nodes,timers}=fixture();
  run(c,`globalThis.previewWorkers=[];globalThis.previewAccepted=[];S.seam.enabled=true;S.seam.production=false;
    document.querySelector('#seamDialog').open=true;document.querySelector('#seamPreviewViewport').dataset={};
    document.querySelector('#btnSeamExport').disabled=true;
    globalThis.pointA={id:'a',valid:true},globalThis.pointB={id:'b',valid:true};SEAM_FOCUS=pointA;SEAM_PLAN={candidates:[pointA,pointB]};
    Object.assign(G,{gw:2,gh:2,K:2,panel:new Uint8Array([1,1,0,1]),owner:new Uint8Array([0,1,255,1]),edtIn:new Float32Array([.15,.3,0,.15])});
    globalThis.originalGrid=G;globalThis.originalState=JSON.stringify(S);
    globalThis.originalArrays={panel:G.panel,owner:G.owner,edtIn:G.edtIn};
    globalThis.originalPixels=JSON.stringify(Object.fromEntries(Object.entries(originalArrays).map(([k,a])=>[k,Array.from(a)])));
    seamPreviewClear=()=>{};seamPreviewRequestRender=()=>{};
    globalThis.previewMaps=[];drawSeamDialog=()=>previewMaps.push(document.querySelector('#seamPreviewViewport').dataset.point);
    buildSeamPlan=()=>SEAM_PLAN;
    seamPreviewSetScene=scene=>{previewAccepted.push(scene.tag);return {parts:1,triangles:1};};
    seamProductionPlan=p=>({spec:{},joints:[{id:p.candidates[0].id,method:'plate',design:{contains(){}}}]});
    createExportWorker=()=>{const worker={stopped:0,postMessage(data,...transfer){this.sent=structuredClone(data,{transfer:transfer[0]||[]});this.transfer=transfer;},terminate(){this.stopped++;}};
      previewWorkers.push(worker);return {worker,url:'blob:preview'};};requestSeamPreview();`);
  const flush=()=>{const queued=[...timers.values()];timers.clear();for(const fn of queued)fn();};
  flush();assert.equal(run(c,'previewWorkers.length'),1);assert.equal(run(c,'previewWorkers[0].transfer.length'),0);
  assert.doesNotThrow(()=>run(c,'structuredClone(previewWorkers[0].sent)'));
  assert.deepEqual(plain(run(c,'Array.from(previewWorkers[0].sent.grid.owner)')),[0,1,255,1]);
  assert.equal(run(c,"['panel','owner','edtIn'].every(k=>previewWorkers[0].sent.grid[k].buffer!==G[k].buffer)"),true);
  run(c,'SEAM_FOCUS=pointB;requestSeamPreview();');flush();assert.equal(run(c,'previewWorkers[0].stopped'),1);
  run(c,"previewWorkers[0].onmessage({data:{type:'done',scene:{tag:'stale'}}});previewWorkers[1].onmessage({data:{type:'done',scene:{tag:'current',resolution:.15}}});");
  assert.deepEqual(plain(run(c,'previewAccepted')),['current']);assert.equal(nodes.get('#seamPreviewViewport').dataset.point,'b');
  assert.deepEqual(plain(run(c,'previewMaps')),['b'],'the map redraw uses the newly accepted point');
  assert.equal(run(c,`G===originalGrid&&JSON.stringify(S)===originalState&&
    Object.entries(originalArrays).every(([k,a])=>G[k]===a&&a.byteLength>0)&&
    JSON.stringify(Object.fromEntries(Object.entries(originalArrays).map(([k,a])=>[k,Array.from(a)])))===originalPixels`),true);
  assert.equal(run(c,'S.seam.production'),false);assert.equal(nodes.get('#btnSeamExport').disabled,true);
  run(c,'SEAM_FOCUS=pointA;requestSeamPreview();');flush();run(c,"stopSeamPreview();previewWorkers[2].onmessage({data:{type:'done',scene:{tag:'closed'}}});");
  assert.deepEqual(plain(run(c,'previewAccepted')),['current']);assert.equal(run(c,'previewWorkers[2].stopped'),1);
  run(c,'SEAM_FOCUS=pointB;requestSeamPreview();');flush();
  run(c,"previewWorkers[3].onerror({preventDefault(){},message:'preview failed'});requestSeamPreview();");flush();
  assert.equal(run(c,'previewWorkers.length'),5,'the same placement can retry after failure');run(c,'stopSeamPreview();');
});

test('All 13 whole-sign preview methods use the same worker pipeline without enabling connector export',()=>{
  const methods=['butt','lap','scarf','tongue','dowel','butterfly','dovetail','plate','nut','selftap','snap','magnet','weld'];
  for(const method of methods){
    const {c,timers}=fixture();c.chosenMethod=method;
    run(c,`S.seam.enabled=true;S.seam.production=false;S.seam.method=chosenMethod;
      document.querySelector('#seamDialog').open=true;
      G.owner=new Uint8Array([1]);G.edtIn=new Float32Array([.15]);G.K=1;
      SEAM_FOCUS={id:'point-'+chosenMethod,valid:true};SEAM_PLAN={candidates:[SEAM_FOCUS]};
      globalThis.beforePreview=JSON.stringify(S);globalThis.previewMessages=[];globalThis.previewEntries=[];
      seamPreviewClear=()=>{};seamPreviewRequestRender=()=>{};
      seamProductionPlan=(plan,settings)=>({method:settings.method,spec:{},joints:[{id:plan.candidates[0].id,method:settings.method,design:{contains(){}}}]});
      createExportWorker=entry=>{previewEntries.push(entry===seamPreviewWorkerMain);return {url:'blob:preview',worker:{
        postMessage(data){previewMessages.push(structuredClone(data));},terminate(){}}};};
      requestSeamPreview();`);
    const queued=[...timers.values()];timers.clear();for(const fn of queued)fn();
    assert.deepEqual(plain(run(c,'previewEntries')),[true],method);
    assert.equal(run(c,'previewMessages.length'),1,method);
    assert.deepEqual(plain(run(c,`({stateMethod:previewMessages[0].state.seam.method,
      productionMethod:previewMessages[0].production.method,jointMethod:previewMessages[0].production.joints[0].method,
      owner:Array.from(previewMessages[0].grid.owner),production:S.seam.production,unchanged:JSON.stringify(S)===beforePreview})`)),
      {stateMethod:method,productionMethod:method,jointMethod:method,owner:[1],production:false,unchanged:true},method);
    run(c,'stopSeamPreview();');
  }
});

test('Opening the rear hides only the back cover and retains the actual front, body and connectors',()=>{
  const {c}=fixture();
  for(const inside of [false,true]){
    c.inside=inside;
    for(const role of ['front','box','connector','body-a','body-b']){
      c.role=role;assert.equal(run(c,'seamPreviewPartVisible(role,inside)'),true,`${role}, inside=${inside}`);
    }
    assert.equal(run(c,"seamPreviewPartVisible('back',inside)"),!inside);
  }
});

test('Whole-sign, focused, inside and exploded controls change only the preview view',()=>{
  const {c}=fixture();
  run(c,`S.seam.enabled=S.seam.production=true;S.seam.selected=[{axis:'x',seamIndex:1,tileIndex:1,along:24}];
    globalThis.beforeViewState=JSON.stringify(S);globalThis.beforeViewGrid=G;globalThis.beforeViewBounds=PB;
    globalThis.previewDraws=0;globalThis.previewSyncs=0;
    seamPreviewRequestRender=()=>previewDraws++;syncSeamPreviewControls=()=>previewSyncs++;
    buildParts=generateExportFiles=doExport=()=>{throw new Error('view controls must not rebuild or export');};
    SEAM_PREVIEW_RENDERER.home={yaw:Math.PI+.13,pitch:.48};`);
  for(const [action,expected] of [
    ['seamPreviewSetScope("whole",false)',{scope:'whole',inside:false,exploded:false}],
    ['seamPreviewSetScope("focus",true)',{scope:'focus',inside:true,exploded:false}],
    ['seamPreviewSetExploded(true)',{scope:'focus',inside:true,exploded:true}],
    ['seamPreviewSetInside(false)',{scope:'focus',inside:false,exploded:false}],
    ['seamPreviewSetExploded(true)',{scope:'focus',inside:true,exploded:true}],
    ['seamPreviewSetScope("whole")',{scope:'whole',inside:true,exploded:false}],
    ['SEAM_PREVIEW_RENDERER.cam.zoom=4;seamPreviewReset()',{scope:'whole',inside:true,exploded:false}],
  ]){
    run(c,action);
    assert.deepEqual(plain(run(c,'(({scope,inside,exploded})=>({scope,inside,exploded}))(SEAM_PREVIEW_RENDERER)')),expected,action);
    assert.equal(run(c,'JSON.stringify(S)===beforeViewState&&G===beforeViewGrid&&PB===beforeViewBounds'),true,action);
    assert.equal(run(c,'SEAM_PREVIEW_RENDERER.cam.zoom'),1,action);
  }
  assert.ok(run(c,'previewDraws>0&&previewSyncs>0'));
});

test('Inspecting a valid point opens its inside exploded view without changing printable selections',()=>{
  const {c,nodes}=fixture();let scrolled=0;
  run(c,`S.seam.enabled=S.seam.production=true;S.seam.selected=[{axis:'x',seamIndex:1,tileIndex:0,along:24}];
    SEAM_PLAN={candidates:[{id:'selected',valid:true,selected:true,tiles:['R1C1','R1C2']},
      {id:'available',valid:true,selected:false,tiles:['R2C1','R2C2']},{id:'invalid',valid:false,tiles:['R3C1','R3C2']}]};
    globalThis.beforeFocusState=JSON.stringify(S);globalThis.beforeFocusGrid=G;globalThis.beforeFocusBounds=PB;
    globalThis.focusDraws=0;drawSeamDialog=()=>focusDraws++;seamPreviewRequestRender=()=>{};
    updateSeamSelection=buildParts=doExport=()=>{throw new Error('inspection must not change production');};`);
  nodes.set('#seamPreviewViewport',{classList:{toggle(){}},scrollIntoView(){scrolled++;}});
  for(const id of ['selected','available']){
    c.pointId=id;run(c,'seamPreviewSetScope("whole",false);SEAM_PREVIEW_RENDERER.cam.zoom=4;focusSeamPreviewPoint(pointId);');
    assert.deepEqual(plain(run(c,'({id:SEAM_FOCUS.id,scope:SEAM_PREVIEW_RENDERER.scope,inside:SEAM_PREVIEW_RENDERER.inside,exploded:SEAM_PREVIEW_RENDERER.exploded,zoom:SEAM_PREVIEW_RENDERER.cam.zoom})')),
      {id,scope:'focus',inside:true,exploded:true,zoom:1});
    assert.equal(nodes.get('#btnSeamExploded')['aria-pressed'],'true');
    assert.equal(nodes.get('#seamPreviewSide').textContent,'ด้านในกล่อง · เปิดฝาหลังแล้ว');
    assert.equal(run(c,'JSON.stringify(S)===beforeFocusState&&G===beforeFocusGrid&&PB===beforeFocusBounds'),true);
  }
  run(c,'focusSeamPreviewPoint("invalid")');
  assert.deepEqual(plain(run(c,'({scope:SEAM_PREVIEW_RENDERER.scope,exploded:SEAM_PREVIEW_RENDERER.exploded,disabled:document.querySelector("#btnSeamFocus").disabled})')),
    {scope:'whole',exploded:false,disabled:true});
  assert.equal(run(c,'SEAM_FOCUS.id'),'invalid');
  run(c,'focusSeamPreviewPoint("missing")');assert.equal(run(c,'SEAM_FOCUS.id'),'invalid');
  assert.equal(run(c,'focusDraws'),3);assert.equal(scrolled,3);
  assert.equal(run(c,'JSON.stringify(S)===beforeFocusState&&G===beforeFocusGrid&&PB===beforeFocusBounds'),true);
});

test('Numbered choices, next/previous controls and the manual point list open the focused joint view',()=>{
  const {c,nodes}=fixture();
  c.makePreviewElement=()=>({children:[],listeners:{},setAttribute(name,value){this[name]=String(value);},
    append(...children){this.children.push(...children);},addEventListener(type,fn){this.listeners[type]=fn;}});
  nodes.set('#seamPointChoices',{children:[],replaceChildren(){this.children=[];},append(child){this.children.push(child);}});
  run(c,`document.createElement=()=>makePreviewElement();
    SEAM_PLAN={candidates:[{id:'a',valid:true,selected:true,tiles:['R1C1','R1C2']},
      {id:'b',valid:true,selected:true,tiles:['R2C1','R2C2']},{id:'bad',valid:false,selected:true,tiles:[]}]};
    S.seam.selected=[{axis:'x',seamIndex:1,tileIndex:1,along:24}];globalThis.beforePointButtons=JSON.stringify(S);
    SEAM_FOCUS=SEAM_PLAN.candidates[0];globalThis.drawPickerDialog=drawSeamDialog;drawSeamDialog=()=>{};seamPreviewRequestRender=()=>{};
    updateSeamSelection=()=>{throw new Error('inspection changed selections');};renderSeamPointChoices();`);
  const choices=nodes.get('#seamPointChoices').children;
  assert.equal(choices.length,2);assert.equal(choices[0]['aria-pressed'],'true');
  choices[1].listeners.click();
  assert.equal(run(c,'SEAM_FOCUS.id'),'b');
  for(const [action,id] of [['cycleSeamPreview(1)','a'],['cycleSeamPreview(-1)','b']]){
    run(c,`seamPreviewSetScope('whole',false);${action}`);
    assert.deepEqual(plain(run(c,'({id:SEAM_FOCUS.id,scope:SEAM_PREVIEW_RENDERER.scope,inside:SEAM_PREVIEW_RENDERER.inside,exploded:SEAM_PREVIEW_RENDERER.exploded})')),
      {id,scope:'focus',inside:true,exploded:true});
  }
  nodes.set('#seamDialog',{open:true});
  nodes.set('#seamList',{children:[],replaceChildren(){this.children=[];},append(child){this.children.push(child);}});
  nodes.set('#seamScroll',{clientWidth:300,clientHeight:100});
  nodes.set('#seamView',{getContext:()=>new Proxy({},{get:()=>()=>{}})});
  run(c,`SEAM_PLAN.candidates.forEach(p=>p.anchorMm={x:20,y:20});
    gridImage=()=>({});seamCanvasFrame=()=>({x0:0,y0:0,width:100,height:60});
    drawSeamOverlay=requestSeamPreview=()=>{};drawSeamDialog=drawPickerDialog;drawSeamDialog();
    seamPreviewSetScope('whole',false);`);
  nodes.get('#seamList').children[2].listeners.click();
  assert.deepEqual(plain(run(c,'({id:SEAM_FOCUS.id,scope:SEAM_PREVIEW_RENDERER.scope,inside:SEAM_PREVIEW_RENDERER.inside,exploded:SEAM_PREVIEW_RENDERER.exploded})')),
    {id:'b',scope:'focus',inside:true,exploded:true});
  assert.equal(run(c,'JSON.stringify(S)===beforePointButtons'),true);
});

test('Changing a method in the open picker focuses the refreshed placement and keeps unavailable joints in overview',()=>{
  for(const valid of [true,false,null]){
    const {c}=fixture();c.refreshedValid=valid;
    run(c,`document.querySelector('#seamDialog').open=true;S.seam.production=false;
      S.seam.selected=[{axis:'x',seamIndex:1,tileIndex:1,along:24}];
      globalThis.beforeMethodSelection=JSON.stringify(S.seam.selected);globalThis.beforeMethodHardware=JSON.stringify(S.seam.hardware);
      SEAM_FOCUS={id:'stale',valid:true};SEAM_PREVIEW_RENDERER.exploded=true;
      autoSelectSeamPoints=()=>{};refreshSeamPlan=()=>{
        SEAM_PLAN={candidates:refreshedValid===null?[]:[{id:'fresh',valid:refreshedValid,tiles:['R1C1','R1C2']}]};
        SEAM_FOCUS=SEAM_PLAN.candidates[0]||null;
      };
      drawSeamDialog=queueDraftSave=draw=seamPreviewRequestRender=()=>{};
      doExport=buildParts=()=>{throw new Error('changing a preview method must not export');};changeSeamMethod('dowel');`);
    assert.equal(run(c,'S.seam.method'),'dowel');assert.equal(run(c,'S.seam.production'),false);
    assert.equal(run(c,'JSON.stringify(S.seam.selected)===beforeMethodSelection&&JSON.stringify(S.seam.hardware)===beforeMethodHardware'),true);
    assert.deepEqual(plain(run(c,'({scope:SEAM_PREVIEW_RENDERER.scope,inside:SEAM_PREVIEW_RENDERER.inside,exploded:SEAM_PREVIEW_RENDERER.exploded})')),
      {scope:valid?'focus':'whole',inside:true,exploded:!!valid});
    assert.equal(run(c,'SEAM_FOCUS?.id||null'),valid===null?null:'fresh');
  }
});

test('Focused joint framing follows its local geometry rather than the overall sign height',()=>{
  const {c}=fixture();
  for(const [roi,span] of [[null,70],[{x0:20,x1:52,y0:3,y1:15},70],
    [{x0:20,x1:80,y0:3,y1:15},90],[{x0:20,x1:52,y0:3,y1:83},120]]){
    c.focusRoi=roi;
    for(const height of [60,630,1730]){
      c.signHeight=height;run(c,'PB.h=signHeight');assert.equal(run(c,'seamPreviewFocusSpan(focusRoi)'),span);
    }
  }
});

test('Base inspection shows only the existing body detail, preserves the project, and follows point changes',()=>{
  const {c,nodes}=fixture();
  run(c,`SEAM_PLAN={candidates:[{id:'a',valid:true,selected:true,tiles:[]},{id:'b',valid:true,selected:true,tiles:[]}]};
    globalThis.beforeBase=JSON.stringify(S);globalThis.baseGrid=G;
    drawSeamDialog=seamPreviewRequestRender=()=>{};focusSeamPreviewPoint('a',true);`);
  assert.equal(run(c,'SEAM_PREVIEW_RENDERER.baseOnly&&SEAM_PREVIEW_RENDERER.inside&&!SEAM_PREVIEW_RENDERER.exploded'),true);
  assert.equal(nodes.get('#btnSeamFocus')['aria-pressed'],'true');
  for(const role of ['body-a','body-b','body-context','connector','front','back'])for(const detail of [true,false]){
    c.partCase={role,detail};assert.equal(run(c,'seamPreviewPartVisible(partCase.role,true,true,partCase.detail)'),detail&&['body-a','body-b'].includes(role));
  }
  run(c,"cycleSeamPreview(1);seamPreviewZoom(.01)");
  assert.equal(run(c,'SEAM_FOCUS.id'),'b');assert.equal(run(c,'SEAM_PREVIEW_RENDERER.baseOnly'),true);
  assert.equal(run(c,'SEAM_PREVIEW_RENDERER.cam.zoom'),.5);
  run(c,'seamPreviewSetExploded(true)');assert.equal(run(c,'SEAM_PREVIEW_RENDERER.baseOnly'),false);
  assert.equal(run(c,'JSON.stringify(S)===beforeBase&&G===baseGrid'),true);
});

test('Base camera fits both real supports independently of sign size and connector lift',()=>{
  const {c}=fixture();
  c.baseScene={supportRois:[{x0:840,x1:854,y0:320,y1:334},{x0:872,x1:886,y0:320,y1:334}],supportZ:{bottom:18,top:26}};
  const bounds=plain(run(c,'seamPreviewBaseBounds(baseScene)'));
  assert.deepEqual(bounds,{mn:[836,316,-28],mx:[890,338,-16],offset:[0,0,0]});
  for(const aspect of [.8,3]){
    c.baseAspect=aspect;
    const projected=plain(run(c,`(()=>{const b=seamPreviewBaseBounds(baseScene),target=b.mn.map((v,i)=>(v+b.mx[i])/2),cam={yaw:Math.PI+.25,pitch:.3,zoom:1};
      const fit=seamPreviewCameraFit([b],target,cam,baseAspect,.6,false),eye=target.map((v,i)=>v+fit.direction[i]*fit.distance);
      const pv=m4mul(m4persp(.6,baseAspect,.1,1000),m4look(eye,target,[0,1,0]));
      return Array.from({length:8},(_,k)=>{const p=target.map((v,d)=>(k&(1<<d))?b.mx[d]:b.mn[d]);
        const q=[0,1,2,3].map(d=>pv[d]*p[0]+pv[4+d]*p[1]+pv[8+d]*p[2]+pv[12+d]);return [q[0]/q[3],q[1]/q[3]];});})()`));
    assert.ok(projected.every(p=>p.every(v=>Math.abs(v)<=1)));
    assert.ok(Math.max(...projected.flat().map(Math.abs))>.6,'supports remain large enough to inspect');
  }
  assert.equal(run(c,'seamPreviewBaseBounds({supportRois:[]})'),null);
  for(const direction of [[1,0],[-1,0],[0,1],[0,-1]]){
    c.openDirection=direction;
    const eye=plain(run(c,`(()=>{const cam=seamPreviewBaseCamera({insideDirection:openDirection});
      return [Math.sin(cam.yaw)*Math.cos(cam.pitch),Math.sin(cam.pitch),Math.cos(cam.yaw)*Math.cos(cam.pitch)];})()`));
    assert.ok(eye[0]*direction[0]+eye[1]*direction[1]>0,'camera approaches from the cavity rather than behind the supporting wall');assert.ok(eye[2]<0);
  }
});

test('Explicit connector preparation gives blind holes their required floor without shrinking valid bases',()=>{
  const {c}=fixture();
  for(const method of ['plate','selftap'])for(const thickness of [4,7,12]){
    c.baseCase={method,thickness};run(c,`S.seam.method=baseCase.method;S.seam.hardware.depth=5;S.seam.hardware.baseT=baseCase.thickness;
      globalThis.beforeBox=JSON.stringify(S.box);prepareSeamProduction();`);
    assert.equal(run(c,'S.seam.hardware.baseT'),Math.max(6.5,thickness));
    assert.equal(run(c,'JSON.stringify(S.box)===beforeBox'),true);
  }
});

test('A rejected physical base keeps the real artwork visible and reports the reason without permitting export',()=>{
  const {c,nodes,timers}=fixture();
  run(c,`document.querySelector('#seamDialog').open=true;
    SEAM_FOCUS={id:'rejected',valid:true,selected:true,tiles:['R1C1','R1C2']};SEAM_PLAN={candidates:[SEAM_FOCUS]};
    globalThis.beforeRejected=JSON.stringify(S);globalThis.previewMessages=[];
    drawSeamDialog=seamPreviewClear=seamPreviewRequestRender=()=>{};
    seamProductionPlan=()=>{throw new SeamProductionError('ฐานต้องมีเนื้อใต้รูตันอย่างน้อย 1.5 มม.');};
    createExportWorker=()=>({url:'blob:preview',worker:globalThis.testPreviewWorker={postMessage(m){previewMessages.push(m);},terminate(){}}});
    seamPreviewSetScene=()=>({parts:3,triangles:12});requestSeamPreview();`);
  let callbacks=[...timers.values()];timers.clear();callbacks.forEach(fn=>fn());
  assert.equal(run(c,'previewMessages[0].production.joints.length'),0);
  assert.equal(nodes.get('#seamPreviewIssue').hidden,false);assert.match(nodes.get('#seamPreviewIssue').textContent,/1.5/);
  run(c,"testPreviewWorker.onmessage({data:{type:'done',scene:{resolution:.75}}})");
  assert.equal(nodes.get('#seamPreviewViewport').dataset.state,'ready');
  assert.match(nodes.get('#seamPreviewCaption').textContent,/ยังไม่มีตัวต่อในภาพ/);
  assert.equal(nodes.get('#btnSeamFocus').disabled,true);
  assert.throws(()=>run(c,'seamProductionPlan()'),/1.5/);
  assert.equal(run(c,'JSON.stringify(S)===beforeRejected'),true);
});

test('Preview cut planes match adjacent print tiles on both axes and never mark outer edges',()=>{
  const {c}=fixture();
  for(const [bed,bedH] of [[80,100],[256,256],[400,400],[1200,800]]){
    c.printer={bed,bedH};
    const result=plain(run(c,`(()=>{
      S.build.mode='service';S.exp={...S.exp,bed:printer.bed,bedH:printer.bedH,margin:10,autoSplit:true,smooth:true};
      PB={...PB,w:1730.25,h:618.45};G.px=.15;
      const plan=printPlan(),before=JSON.stringify({S,PB});
      return {plan,cuts:plan.tiles.map(t=>({id:t.id,planes:seamPreviewCutBounds(t,plan)})),unchanged:before===JSON.stringify({S,PB})};
    })()`));
    const {plan,cuts}=result,byPosition=new Map(plan.tiles.map(t=>[`${t.row},${t.col}`,t]));
    assert.equal(result.unchanged,true);assert.ok(plan.nx>1);assert.equal(cuts.length,plan.tiles.length);
    for(const tile of plan.tiles){
      const {planes}=cuts.find(c=>c.id===tile.id);assert.equal(planes.length,4);
      const expected=[
        [byPosition.get(`${tile.row},${tile.col-1}`),'x1'],[byPosition.get(`${tile.row},${tile.col+1}`),'x0'],
        [byPosition.get(`${tile.row+1},${tile.col}`),'y1'],[byPosition.get(`${tile.row-1},${tile.col}`),'y0']
      ];
      expected.forEach(([neighbor,key],edge)=>{
        if(neighbor)assert.ok(Math.abs(planes[edge]-neighbor[key])<1e-7,`${bed}x${bedH} ${tile.id} edge ${edge}`);
        else assert.equal(planes[edge],1e9,`${tile.id}: outside contour is not a print seam`);
      });
    }
    assert.ok(Math.abs(plan.tiles[0].x0+.15)<1e-7,'smoothing allowance is part of the original tile plan');
    if(bed===400){assert.equal(plan.nx,5);assert.equal(plan.ny,2);}
  }
});

test('Showing print seams changes only preview visibility and preserves the manufacturing state',()=>{
  const {c}=fixture();
  run(c,`globalThis.beforeCutsState=JSON.stringify(S);globalThis.beforeCutsGrid=G;globalThis.beforeCutsBounds=PB;
    globalThis.cutDraws=0;globalThis.cutSyncs=0;globalThis.cutMaps=0;
    seamPreviewRequestRender=()=>cutDraws++;syncSeamPreviewControls=()=>cutSyncs++;drawSeamDialog=()=>cutMaps++;
    buildParts=generateExportFiles=doExport=()=>{throw new Error('seam visibility must not rebuild or export');};`);
  assert.equal(run(c,'SEAM_PREVIEW_RENDERER.cuts'),true);
  for(const show of [false,true,false]){
    c.showCuts=show;run(c,'seamPreviewSetCuts(showCuts)');assert.equal(run(c,'SEAM_PREVIEW_RENDERER.cuts'),show);
    assert.equal(run(c,'JSON.stringify(S)===beforeCutsState&&G===beforeCutsGrid&&PB===beforeCutsBounds'),true);
  }
  run(c,'seamPreviewReset()');assert.equal(run(c,'SEAM_PREVIEW_RENDERER.cuts'),false,'resetting the camera does not reset a view preference');
  assert.ok(run(c,'cutDraws>0&&cutSyncs>0&&cutMaps>0'));
});

test('Assembly guidance covers every physical method and names the real extra joining work',()=>{
  const {c}=fixture(),before=run(c,'JSON.stringify(S)');
  const guides=plain(run(c,'Object.fromEntries(SEAM_METHODS.map(m=>[m.id,seamAssemblyGuide(m.id)]))'));
  assert.equal(Object.keys(guides).length,13);
  for(const [id,guide] of Object.entries(guides)){
    for(const key of ['requires','parts','supplies'])assert.ok(typeof guide[key]==='string'&&guide[key].trim(),`${id}: ${key}`);
    assert.equal(guide.steps.length,3,id);assert.ok(guide.steps.every(s=>typeof s==='string'&&s.trim()),id);
  }
  for(const id of ['butt','lap','scarf','tongue','dowel','butterfly','dovetail'])assert.match(guides[id].requires,/กาว/,`${id}: printed parts still need adhesive`);
  for(const id of ['lap','scarf','tongue','dovetail']){assert.match(guides[id].parts,/A/);assert.match(guides[id].parts,/B/);}
  assert.match(guides.dowel.parts,/ชิ้นเดียว/);assert.match(guides.dowel.parts,/เดือย\s*2/);
  assert.ok(guides.dowel.steps.some(s=>/พลิก/.test(s)),'printed-up dowels must be turned into their blind pockets');
  assert.match(guides.butt.requires,/ชั่วคราว/);assert.ok(guides.butt.steps.some(s=>/ถอด.*จิ๊ก/.test(s)));
  assert.match(guides.weld.requires,/ถอด.*ก่อน.*ร้อน/);
  assert.ok(guides.weld.steps.findIndex(s=>/ถอด.*จิ๊ก/.test(s))<guides.weld.steps.findIndex(s=>/^เชื่อม/.test(s)),'the heat process must follow jig removal');
  assert.match(guides.plate.requires,/อินเสิร์ต/);assert.match(guides.plate.requires,/สกรู/);
  assert.match(guides.nut.requires,/น็อต/);assert.match(guides.nut.requires,/สกรู/);assert.match(guides.selftap.requires,/พลาสติก/);
  for(const id of ['snap','magnet'])assert.match(guides[id].requires,/รับแรงถาวร.*แยก/,`${id}: temporary or service closure is not a permanent body joint`);
  assert.match(guides.magnet.supplies,/แม่เหล็ก.*4/);
  assert.equal(run(c,'seamAssemblyGuide("future-connector")'),null);assert.equal(run(c,'JSON.stringify(S)'),before);
});

test('Missing and invalid joint placements still preview the artwork without manufacturing a connector',()=>{
  for(const focus of [null,{id:'invalid',valid:false,reason:'พื้นที่ไม่พอ'}]){
    const {c,nodes,timers}=fixture();c.testFocus=focus;
    run(c,`S.seam.production=false;document.querySelector('#seamDialog').open=true;
      SEAM_FOCUS=testFocus;SEAM_PLAN={reason:'งานนี้พิมพ์ชิ้นเดียวได้',candidates:[]};
      SEAM_PREVIEW_RENDERER.scope='focus';SEAM_PREVIEW_RENDERER.exploded=true;
      globalThis.beforePreview=JSON.stringify(S);globalThis.accepted=0;
      seamPreviewClear=()=>{};seamPreviewRequestRender=()=>{};drawSeamDialog=()=>{};
      seamProductionPlan=buildParts=()=>{throw new Error('Invalid joint reached manufacturing');};
      seamPreviewSetScene=()=>{accepted++;return {parts:3,triangles:12};};requestSeamPreview();`);
    const queued=[...timers.values()];timers.clear();for(const fn of queued)fn();
    assert.equal(run(c,'sent.length'),1);assert.deepEqual(plain(run(c,'sent[0].production.joints')),[]);
    assert.deepEqual(plain(run(c,'sent[0].production.contextKeepouts')),[]);
    assert.equal(run(c,'JSON.stringify(S)===beforePreview'),true);assert.equal(run(c,'SEAM_FOCUS'),focus===null?null:run(c,'testFocus'));
    assert.equal(run(c,'SEAM_PREVIEW_RENDERER.scope'),'whole');assert.equal(run(c,'SEAM_PREVIEW_RENDERER.exploded'),false);
    assert.equal(nodes.get('#btnSeamFocus').disabled,true);assert.equal(nodes.get('#btnSeamExploded').disabled,true);
    run(c,"SEAM_DETAIL_JOB.worker.onmessage({data:{type:'done',scene:{resolution:.15}}});");
    assert.equal(run(c,'accepted'),1);assert.equal(nodes.get('#seamPreviewViewport').dataset.state,'ready');
    assert.equal(nodes.get('#seamPreviewCanvas').hidden,false);assert.equal(nodes.get('#seamPreviewViewport').dataset.point,'');
    assert.match(nodes.get('#seamPreviewCaption').textContent,/ยังไม่มีตัวต่อในภาพ/);
  }
});

test('An empty artwork clears the previous preview without starting a worker',()=>{
  const {c,nodes,timers}=fixture();
  run(c,`document.querySelector('#seamDialog').open=true;G.empty=true;
    globalThis.cleared=0;seamPreviewClear=()=>cleared++;requestSeamPreview();`);
  assert.equal(timers.size,0);assert.equal(run(c,'cleared'),1);assert.equal(run(c,'sent.length'),0);
  assert.equal(nodes.get('#seamPreviewCanvas').hidden,true);
  assert.equal(nodes.get('#seamPreviewStatus').textContent,'ยังไม่มีชิ้นงานสำหรับแสดงภาพ');
});

test('The detail and 173 cm whole-sign cameras fit assembled and exploded bounds in narrow and wide viewports',()=>{
  const {c}=fixture();
  for(const whole of [false,true])for(const aspect of [.6,1,2.5])for(const pitch of [-.55,.4])for(const exploded of [false,true]){
    c.cameraCase={aspect,pitch,exploded,whole};
    const projected=run(c,`(()=>{
      const {aspect,pitch,exploded,whole}=cameraCase,fov=.6,cam={yaw:-.35,pitch,zoom:1};
      const items=whole?[{mn:[-865.5,-159.3,0],mx:[865.5,159.3,63],offset:[0,0,0]},
        {mn:[-12,45,40],mx:[12,65,43],offset:[0,0,50]}]:
        [{mn:[-25,-12,2],mx:[0,16,63],offset:[-8,0,0]},
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
