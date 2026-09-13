const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const axes={x:{world:'x',label:'X · ซ้าย–ขวา',directions:['ขวา','ซ้าย']},y:{world:'z',label:'Y · หน้า–หลัง',directions:['หน้า','หลัง']},z:{world:'y',label:'Z · ขึ้น–ลง',directions:['ขึ้น','ลง']}};
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-5,`${message}: ${a} != ${b}`);
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.YPCopyArrayUI&&YPProjectWorkspace.state().ready,null,{timeout:60000});
   const id=await page.evaluate(async()=>{
    YPQuickSetupBridge.close();const o=makeCatalogObject('panel-standard',1,1);o.size={w:.2,d:.4,h:.8};o.position={x:1,y:1,z:1};o.label='Axis regression';
    mutateObjects(()=>S.objects.push(o),o.id);await loadThreeRenderer();return o.id;
   });
   for(const [axis,definition] of Object.entries(axes))for(const direction of [1,-1]){
    await page.evaluate(async id=>{selectObject(id);await YPCopyArrayUI.open();},id);
    assert.equal(await page.locator(`#copyArrayAxis option[value="${axis}"]`).textContent(),definition.label);
    await page.locator('#copyArrayAxis').selectOption(axis);
    await page.locator('#copyArrayDirection').selectOption(String(direction));
    assert.match(await page.locator('#copyArrayDirection option:checked').textContent(),new RegExp(definition.directions[direction===1?0:1]));
    await page.locator('#copyArrayMode').selectOption('step');await page.locator('#copyArrayCount').fill('1');await page.locator('#copyArrayDistance').fill('25');
    const before=await page.evaluate(id=>{
     const renderer=threeRenderer,node=renderer.objectMeshes.get(id),ghost=renderer.scene.getObjectByName('copy-array-preview').children[0];
     const original=node.getWorldPosition(new renderer.THREE.Vector3());
     return {objects:JSON.stringify(S.objects),position:{...objectById(id).position},delta:{x:ghost.position.x-original.x,y:ghost.position.y-original.y,z:ghost.position.z-original.z}};
    },id);
    for(const world of ['x','y','z'])near(before.delta[world],world===definition.world?direction*.25:0,`${mobile?'mobile':'desktop'} ${axis} ${direction} preview ${world}`);
    assert.ok(await page.locator('#copyArrayDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
    await page.locator('#copyArrayConfirm').click();
    const after=await page.evaluate(()=>({...S.objects.at(-1).position}));
    for(const world of ['x','y','z'])near(after[world],before.position[world]+(world===definition.world?direction*.25:0),`${axis} ${direction} commit ${world}`);
    await page.evaluate(()=>undoObjectChange());
    assert.equal(await page.evaluate(()=>JSON.stringify(S.objects)),before.objects,'Undo restores original without migrating coordinates');
   }
   // Edge gaps must use the mapped world extent, not the UI axis name.
   for(const [axis,definition] of Object.entries(axes)){
    await page.evaluate(async id=>{selectObject(id);await YPCopyArrayUI.open();},id);
    await page.locator('#copyArrayAxis').selectOption(axis);await page.locator('#copyArrayDirection').selectOption('1');await page.locator('#copyArrayMode').selectOption('gap');await page.locator('#copyArrayDistance').fill('10');
    const values=await page.evaluate(({id,world})=>{
     const r=threeRenderer,node=r.objectMeshes.get(id),box=new r.THREE.Box3().setFromObject(node),origin=node.getWorldPosition(new r.THREE.Vector3()),ghost=r.scene.getObjectByName('copy-array-preview').children[0];
     return {extent:box.max[world]-box.min[world],delta:ghost.position[world]-origin[world]};
    },{id,world:definition.world});
    near(values.delta,values.extent+.1,`${axis} edge gap`);await page.locator('#copyArrayCancel').click();
   }
   assert.deepEqual(errors,[]);console.log(`PASS ${mobile?'mobile touch emulation':'desktop'}: six UI directions, actual 3D ghosts, committed coordinates, Undo, three mapped edge gaps, labels, no overflow`);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
