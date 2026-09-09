const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html?comparePreview=1');
  await page.waitForFunction(()=>window.YPIslandTemplateBridge);
  const result=await page.evaluate(async()=>{
   await YPProjectBridge.ready;YPQuickSetupBridge.close();
   const snap=YPIslandTemplateBridge.snapshot('island-canopy-garden'),source=snap.spec.objects.find(o=>o.catalogId==='panel-standard');
   const make=(id,x,z,angle=0)=>({...structuredClone(source),id,position:{x,y:1,z},size:{w:.3,d:.3,h:.3},rotationY:angle,placement:{mode:'free',surface:'free',allowOutsideBooth:false,installFreely:false}});
   snap.spec.objects=[make('a',2,3),make('b',4,3,30)];YPProjectBridge.restore(snap);
   const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);
   const click=id=>document.getElementById(id).click();
   const state=()=>S.objects.map(o=>({id:o.id,position:{...o.position},rotationY:o.rotationY,groupId:o.groupId||null}));
   const assert=(value,message)=>{if(!value)throw new Error(message);};
   setObjectSelection(['a','b'],'a');sync();
   const before=state();click('btnGroupObjects');const grouped=state(),gid=objectById('a').groupId;
   assert(gid&&gid===objectById('b').groupId,'Popup Group failed');
   const historyBefore=objectEditor.past.length;click('btnRotateObject');const rotated=state(),selected=selectedObjectIds(),historyDelta=objectEditor.past.length-historyBefore;
   const rendered=S.objects.map(o=>{const mesh=r.objectMeshes.get(o.id);return {id:o.id,x:mesh.position.x,y:mesh.position.y,z:mesh.position.z,ry:mesh.rotation.y};});
   undoObjectChange();const undone=state();redoObjectChange();const redone=state();
   for(let i=0;i<7;i++)click('btnRotateObject');const fullTurn=state();
   click('btnRotateObject');const beforeMove=state();
   document.querySelector('[data-fine-axis="z"][data-fine-delta="0.05"]').click();const afterMove=state(),afterMoveSelection=selectedObjectIds();
   const saved=await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture(),'Group pivot'));
   YPProjectBridge.restore(YPProjectStore.fromText(saved).variants.A);selectObject('b');const reopened=state(),reopenedSelection=selectedObjectIds();
   const lockBefore=state();objectById('a').locked=true;sync();const disabledWhenSecondaryLocked=document.getElementById('btnRotateObject').disabled;
   const blockedLocked=rotateSelectedObject();const lockAfter=state();objectById('a').locked=false;sync();
   click('btnUngroupObjects');const ungrouped=state(),ungroupDisabled=document.getElementById('btnUngroupObjects').disabled;
   // Selection collapsed by legacy actions must still resolve the complete group.
   setObjectSelection(['a','b'],'a');sync();click('btnGroupObjects');setObjectSelection(['a'],'a');sync();const partialBefore=state();rotateSelectedObject();const partialAfter=state(),partialSelection=selectedObjectIds();
   // Boundary validation is all-or-nothing; no member or history entry may change.
   const boundary=structuredClone(snap);boundary.spec.objects=[make('a',.35,.35),make('b',3.8,.35)];boundary.spec.objects.forEach(o=>o.groupId='edge');
   YPProjectBridge.restore(boundary);selectObject('a');const edgeBefore=state(),edgeHistory=objectEditor.past.length;
   const edgeResult=rotateSelectedObject(),edgeAfter=state(),edgeHistoryDelta=objectEditor.past.length-edgeHistory;
   // Actual template TV keeps bezel/screen spacing and both orientations.
   YPProjectBridge.restore(YPIslandTemplateBridge.snapshot('island-canopy-garden'));
   const tv=S.objects.filter(o=>o.groupId);S.objects=tv;tv.forEach((o,i)=>{o.position.x=3;o.position.z=3+i*.052;o.placement={mode:'free',surface:'free',allowOutsideBooth:false};});sync();selectObject(tv[1].id);
   const tvBefore=state();click('btnRotateObject');const tvAfter=state();click('btnGroupObjects');
   return {before,grouped,rotated,selected,rendered,historyDelta,undone,redone,fullTurn,beforeMove,afterMove,afterMoveSelection,reopened,reopenedSelection,lockBefore,lockAfter,blockedLocked,disabledWhenSecondaryLocked,ungrouped,ungroupDisabled,partialBefore,partialAfter,partialSelection,edgeBefore,edgeAfter,edgeResult,edgeHistoryDelta,tvBefore,tvAfter};
  });
  const close=(a,b)=>assert.ok(Math.abs(a-b)<.00001,a+' != '+b);
  const distance=items=>Math.hypot(items[0].position.x-items[1].position.x,items[0].position.z-items[1].position.z);
  assert.equal(result.selected.length,2);assert.equal(result.historyDelta,1);
  close(result.rotated[0].position.x,3-Math.SQRT1_2);close(result.rotated[0].position.z,3+Math.SQRT1_2);
  close(result.rotated[1].position.x,3+Math.SQRT1_2);close(result.rotated[1].position.z,3-Math.SQRT1_2);
  assert.deepEqual(result.rotated.map(o=>o.rotationY),[45,75]);close(distance(result.rotated),2);
  for(let i=0;i<2;i++){close(result.rendered[i].x,result.rotated[i].position.x);close(result.rendered[i].z,result.rotated[i].position.z);}
  assert.deepEqual(result.undone,result.grouped);assert.deepEqual(result.redone,result.rotated);
  for(let i=0;i<2;i++){close(result.fullTurn[i].position.x,result.before[i].position.x);close(result.fullTurn[i].position.z,result.before[i].position.z);assert.equal(result.fullTurn[i].rotationY,result.before[i].rotationY);
   close(result.afterMove[i].position.y-result.beforeMove[i].position.y,.05);close(result.afterMove[i].position.x,result.beforeMove[i].position.x);close(result.afterMove[i].position.z,result.beforeMove[i].position.z);}
  assert.equal(result.afterMoveSelection.length,2);assert.deepEqual(result.reopened,result.afterMove);assert.equal(result.reopenedSelection.length,2);
  assert.ok(result.disabledWhenSecondaryLocked);assert.equal(result.blockedLocked,false);assert.deepEqual(result.lockBefore,result.lockAfter);
  assert.ok(result.ungrouped.every(o=>o.groupId===null));assert.ok(result.ungroupDisabled);
  result.ungrouped.forEach((o,i)=>assert.deepEqual(o.position,result.reopened[i].position));
  assert.equal(result.partialSelection.length,2);result.partialAfter.forEach((o,i)=>assert.equal(o.rotationY,(result.partialBefore[i].rotationY+45)%360));
  assert.equal(result.edgeResult,false);assert.deepEqual(result.edgeBefore,result.edgeAfter);assert.equal(result.edgeHistoryDelta,0);
  close(distance(result.tvAfter),distance(result.tvBefore));assert.ok(result.tvAfter.every(o=>o.rotationY===45));
  await page.locator('#btnGroupObjects').waitFor({state:'visible'});assert.ok(await page.locator('#btnUngroupObjects').isVisible());
  await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#btnGroupObjects').isVisible());assert.ok(await page.locator('#btnUngroupObjects').isVisible());
  await page.waitForFunction(()=>{const b=document.getElementById('objectToolbar').getBoundingClientRect();return b.x>=-1&&b.right<=innerWidth+1;});
  assert.deepEqual(errors,[]);
  console.log('PASS shared-pivot rotation, 360-degree stability, renderer, rotate-then-move, selection, lock, atomic boundary, Undo/Redo, save/reopen, TV and popup Group/Ungroup desktop/mobile');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
