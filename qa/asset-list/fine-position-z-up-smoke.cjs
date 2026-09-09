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
   const snap=YPIslandTemplateBridge.snapshot('island-canopy-garden');
   YPProjectBridge.restore(snap);
   const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);
   const obj=S.objects.find(o=>o.type==='brandCopy'),id=obj.id;
   obj.position={x:1.2,y:2.23,z:4.86};sync();selectObject(id);
   const position=()=>({...objectById(id).position});
   const fields=()=>Object.fromEntries(['X','Y','Z'].map(a=>[a,document.getElementById('finePosition'+a).value]));
   const step=(axis,positive=true)=>document.querySelector('[data-fine-axis="'+axis+'"][data-fine-delta="'+(positive?'0.05':'-0.05')+'"]').click();
   const enter=(axis,value,key='Enter')=>{const input=finePositionInput(axis);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));};
   const before=position(),initialFields=fields();
   step('z');const up=position(),worldUp=r.objectMeshes.get(id).position.y;
   step('z',false);const down=position();
   step('y');const front=position();step('y',false);
   step('x');const right=position();step('x',false);
   enter('z','2.50');const absolute=position();
   undoObjectChange();const undone=position();redoObjectChange();const redone=position();
   enter('y','4.50');const absoluteDepth=position();
   enter('z','9.0','Escape');const escaped={position:position(),fields:fields()};
   enter('z','8.0'); // height must not be incorrectly limited by booth depth
   const high=position();enter('z','2.50');
   enter('z','-1');const belowFloor=position(),invalidZ=finePositionInput('z').getAttribute('aria-invalid');cancelFinePositionDraft('z');
   enter('y','9');const outsideDepth=position(),invalidY=finePositionInput('y').getAttribute('aria-invalid');cancelFinePositionDraft('y');
   const text=await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture(),'Z-up regression'));
   const stored=YPProjectStore.fromText(text).variants.A;YPProjectBridge.restore(stored);selectObject(id);
   const reopened={position:position(),fields:fields()};
   objectById(id).locked=true;sync();step('z');const locked=position();objectById(id).locked=false;sync();
   const tv=S.objects.filter(o=>o.groupId);selectObject(tv[0].id);
   const groupBefore=selectedObjects().map(o=>({...o.position}));step('z');const groupAfter=selectedObjects().map(o=>({...o.position}));
   const groupInputsDisabled=['x','y','z'].every(a=>finePositionInput(a).disabled);
   undoObjectChange();const groupUndo=tv.map(o=>({...objectById(o.id).position}));
   return{before,initialFields,up,worldUp,down,front,right,absolute,undone,redone,absoluteDepth,escaped,high,belowFloor,invalidZ,outsideDepth,invalidY,reopened,locked,groupBefore,groupAfter,groupInputsDisabled,groupUndo};
  });
  assert.deepEqual(result.initialFields,{X:'1.20',Y:'4.86',Z:'2.23'});
  assert.deepEqual(result.up,{x:1.2,y:2.28,z:4.86});assert.ok(Math.abs(result.worldUp-2.28)<1e-8);
  assert.deepEqual(result.down,result.before);
  assert.deepEqual(result.front,{x:1.2,y:2.23,z:4.91});
  assert.deepEqual(result.right,{x:1.25,y:2.23,z:4.86});
  assert.deepEqual(result.absolute,{x:1.2,y:2.5,z:4.86});
  assert.deepEqual(result.undone,result.before);assert.deepEqual(result.redone,result.absolute);
  assert.deepEqual(result.absoluteDepth,{x:1.2,y:2.5,z:4.5});
  assert.deepEqual(result.escaped.position,result.absoluteDepth);assert.equal(result.escaped.fields.Z,'2.50');
  assert.equal(result.high.y,8);assert.equal(result.invalidZ,'true');assert.equal(result.invalidY,'true');
  assert.deepEqual(result.belowFloor,result.absoluteDepth);assert.deepEqual(result.outsideDepth,result.absoluteDepth);
  assert.deepEqual(result.reopened.position,result.absoluteDepth);assert.deepEqual(result.reopened.fields,{X:'1.20',Y:'4.50',Z:'2.50'});
  assert.deepEqual(result.locked,result.absoluteDepth);assert.equal(result.groupBefore.length,2);
  for(let i=0;i<2;i++){assert.equal(result.groupAfter[i].x,result.groupBefore[i].x);assert.equal(result.groupAfter[i].z,result.groupBefore[i].z);assert.ok(Math.abs(result.groupAfter[i].y-result.groupBefore[i].y-.05)<1e-8);}
  assert.ok(result.groupInputsDisabled);assert.deepEqual(result.groupUndo,result.groupBefore);assert.deepEqual(errors,[]);
  console.log('PASS: Z-up UI/world rendering, XYZ buttons, absolute inputs, Escape, bounds, lock, Undo/Redo, TV groups and legacy Y-up save/reopen');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
