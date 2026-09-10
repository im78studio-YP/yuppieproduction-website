const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
  await page.waitForFunction(()=>YPProjectWorkspace?.state().ready);
  await page.evaluate(async()=>{
   YPQuickSetupBridge.close();Object.assign(S,{W:6,D:3,H:2.4,stSize:'none',objects:[],magneticSnap:false,placementSnap:false});sync();
   const o=makeCatalogObject('panel-standard',2,2);o.id='free-placement';o.size={w:.5,h:.5,d:.5};o.placement.installFreely=false;
   S.objects=[o];sync();const r=await loadThreeRenderer();await r.waitForSceneAssets(15000);closeDockPanel(false);selectObject(o.id);
  });
  assert.equal(await page.evaluate(()=>objectById('free-placement').placement.installFreely),true,'legacy constraints migrate to user-directed placement');
  const setCoordinate=async(axis,value)=>page.evaluate(({axis,value})=>{selectObject('free-placement');const input=finePositionInput(axis);input.value=String(value);return commitFinePositionInput(axis);},{axis,value});
  assert.equal(await setCoordinate('x',-4),true);assert.equal(await setCoordinate('y',-3),true);assert.equal(await setCoordinate('z',12),true);
  const position=()=>page.evaluate(()=>({...objectById('free-placement').position}));
  assert.deepEqual(await position(),{x:-4,y:12,z:-3});
  await page.evaluate(()=>{sync();const saved=YPProjectBridge.capture();YPProjectBridge.restore(saved);sync();});
  assert.deepEqual(await position(),{x:-4,y:12,z:-3},'outside and above-wall position survives sync/save/restore');
  assert.equal(await setCoordinate('z',-2.5),true);assert.deepEqual(await position(),{x:-4,y:-2.5,z:-3});
  await page.evaluate(()=>undoObjectChange());assert.equal((await position()).y,12);
  await page.evaluate(()=>redoObjectChange());assert.equal((await position()).y,-2.5);
  await page.evaluate(()=>{selectObject('free-placement');fineMoveSelectedObjects('y',-.05);fineMoveSelectedObjects('x',-.05);sync();});
  assert.deepEqual(await position(),{x:-4.05,y:-2.55,z:-3},'fine movement has no booth or floor boundary');
  const checks=await page.evaluate(()=>{
   const o=objectById('free-placement'),r=threeRenderer,start={...o.position},drag={id:o.id,memberIds:[o.id],memberStarts:{[o.id]:start},startX:start.x,startY:start.y,startZ:start.z};
   const extreme=r.dragPlacementCheck(o,{x:25,y:30,z:-20},drag,null),invalid=r.dragPlacementCheck(o,{x:NaN,y:0,z:0},drag,null);
   const low=snapVerticalElevation(o,-12.34),high=snapVerticalElevation(o,32.17);
   const disabled=r.smartSurfacePlacement({},o,r.objectMeshes.get(o.id),{lastSmartSnap:{surface:'wall'}});
   const history=objectEditor.past.length;finePositionInput('x').value='Infinity';const badInput=commitFinePositionInput('x');
   return{extreme,invalid,low,high,disabled,badInput,historyUnchanged:history===objectEditor.past.length};
  });
  assert.equal(checks.extreme.valid,true);assert.equal(checks.invalid.valid,false);
  assert.equal(checks.low.y,-12.34);assert.equal(checks.high.y,32.17);assert.equal(checks.disabled,null);
  assert.equal(checks.badInput,false);assert.equal(checks.historyUnchanged,true);
  await page.evaluate(()=>{
   const o=objectById('free-placement'),other=makeCatalogObject('panel-standard',o.position.x,o.position.z);other.id='overlapping';other.position={...o.position};other.size={...o.size};S.objects.push(other);sync();
  });
  assert.deepEqual(await position(),{x:-4.05,y:-2.55,z:-3});
  assert.ok((await page.evaluate(()=>freePlacementWarning(objectById('free-placement')))).includes('ซ้อนกับ'));
  await page.evaluate(()=>{S.W=3;S.D=2;sync();const saved=YPProjectBridge.capture();YPProjectBridge.restore(saved);});
  assert.deepEqual(await position(),{x:-4.05,y:-2.55,z:-3},'shrinking booth and restore never relocates the object');
  await page.evaluate(()=>{selectObject('free-placement');objectById('free-placement').locked=true;});
  assert.equal(await setCoordinate('x',0),false,'intentional object lock remains respected');
  assert.deepEqual(errors,[]);
  console.log('PASS: legacy free placement, outside/negative/high coordinates, no auto relocation on sync/booth resize/save/restore, Undo/Redo, non-blocking overlap, Snap off, finite-number guard and lock');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
