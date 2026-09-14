const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const near=(a,b)=>a.forEach((n,i)=>assert.ok(Math.abs(n-b[i])<1e-7,`${a} != ${b}`));
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPRotateSubmenu&&YPProjectWorkspace.state().ready);
 const id=await page.evaluate(async()=>{YPQuickSetupBridge.close();const o=makeCatalogObject('chair-standard',1,1);o.rotationY=45;mutateObjects(()=>S.objects.push(o),o.id);await loadThreeRenderer();closeDockPanel(false);return o.id;});
 const sample=()=>page.evaluate(id=>{const o=objectById(id),r=threeRenderer.objectMeshes.get(id),T=threeRenderer.THREE;r.updateWorldMatrix(true,true);return{position:{...o.position},rotation:o.rotationY,flags:{x:o.transform.flipX,y:o.transform.flipY,z:o.transform.flipZ},scale:r.scale.toArray(),front:r.localToWorld(new T.Vector3(0,.4,.2)).toArray(),back:r.localToWorld(new T.Vector3(0,.4,-.2)).toArray(),right:r.localToWorld(new T.Vector3(.2,.4,0)).toArray(),registry:SceneAssetRegistryAPI.getAssetById(id).transform.scale};},id);
 const before=await sample();await page.locator('#btnRotateMenu').click();await page.locator('#btnFlipObjectZ').click();const after=await sample();
 assert.equal(after.scale[2],-before.scale[2]);assert.equal(after.registry.z,-1);near(after.front,before.back);near(after.back,before.front);near(after.right,before.right);assert.deepEqual(after.position,before.position);assert.equal(after.rotation,before.rotation);
 await page.keyboard.press('Control+z');assert.deepEqual(await sample(),before);await page.keyboard.press('Control+Shift+z');assert.deepEqual(await sample(),after);
 // A second flip restores geometry; other mirror axes combine independently.
 await page.locator('#btnRotateMenu').click();await page.locator('#btnFlipObjectZ').click();assert.deepEqual(await sample(),before);
 await page.evaluate(()=>{flipSelectedObject('x');flipSelectedObject('y');flipSelectedObject('z');});assert.deepEqual((await sample()).scale,[-1,-1,-1]);
 const saved=await page.evaluate(async id=>{
  const snapshot=YPProjectBridge.capture(),file=YPProjectStore.fromText(await YPProjectStore.toText(YPProjectStore.create(snapshot,'Flip round trip')));
  const restored=file.variants.A;YPProjectBridge.restore(restored);selectObject(id);
  return{flip:objectById(id).transform.flipZ,prompt:objectLayoutPrompt(),manifest:JSON.stringify(buildGeometryManifest())};
 },id);assert.equal(saved.flip,true);assert.match(saved.prompt,/หน้า–หลัง/);assert.match(saved.manifest,/"frontBack":true/);assert.deepEqual((await sample()).scale,[-1,-1,-1]);
 await page.locator('#btnDuplicateObject').click();await page.locator('#copyArrayConfirm').click();assert.equal(await page.evaluate(()=>S.objects.at(-1).transform.flipZ),true);
 // Legacy projects with no flag keep their original front/back direction.
 await page.evaluate(id=>{const snapshot=YPProjectBridge.capture();delete snapshot.spec.objects.find(o=>o.id===id).transform.flipZ;YPProjectBridge.restore(snapshot);selectObject(id);},id);assert.equal((await sample()).scale[2],1);
 assert.deepEqual(errors,[]);console.log('PASS front/back rendered reflection at 45 degrees, unchanged heading/position, signed registry, combined mirrors, twice restore, Undo/Redo, project reload, prompt/manifest, duplicate, legacy default');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
